import React from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import useCategoryUpdate from "../../hooks/useCategoryUpdate";
import Category from "../../model/Category";

// Mock next/router
jest.mock("next/router", () => ({
  useRouter: () => ({
    push: jest.fn(),
    pathname: "/",
    route: "/",
    asPath: "/",
    query: {},
  }),
}));

// Setup MSW server for Node environment
const server = setupServer();

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// Create a fresh QueryClient for each test
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });

const createWrapper =
  (queryClient: QueryClient) =>
  ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

describe("useCategoryUpdate", () => {
  it("should update a category successfully", async () => {
    const queryClient = createTestQueryClient();

    const oldCategory: Category = {
      categoryId: 123,
      categoryName: "old_category",
      activeStatus: true,
      categoryCount: 5,
    };

    const newCategory: Category = {
      ...oldCategory,
      categoryName: "updated_category",
      activeStatus: false,
      categoryCount: 10,
    };

    const responseCategory: Category = {
      ...newCategory,
      dateUpdated: new Date().toISOString(),
    };

    // Mock the fetch call directly for this test
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify(responseCategory), { status: 200 }),
      );

    // Set existing categories in cache
    const existingCategories: Category[] = [
      oldCategory,
      {
        categoryId: 456,
        categoryName: "other_category",
        activeStatus: true,
        categoryCount: 3,
      },
    ];
    queryClient.setQueryData(["category"], existingCategories);

    const { result } = renderHook(() => useCategoryUpdate(), {
      wrapper: createWrapper(queryClient),
    });

    result.current.mutate({ oldCategory, newCategory });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Verify the cache was updated correctly using categoryId
    const updatedCategories = queryClient.getQueryData<Category[]>([
      "category",
    ]);
    expect(updatedCategories).toHaveLength(2);
    expect(updatedCategories?.[0]).toEqual({
      ...oldCategory,
      ...responseCategory,
    });
    expect(updatedCategories?.[1].categoryId).toBe(456); // Other category unchanged
  });

  it("should handle 404 errors", async () => {
    const queryClient = createTestQueryClient();

    const oldCategory: Category = {
      categoryId: 999,
      categoryName: "nonexistent_category",
      activeStatus: true,
      categoryCount: 0,
    };

    const newCategory: Category = {
      ...oldCategory,
      categoryName: "updated_category",
    };

    // Mock the fetch call to return a 404 error
    global.fetch = jest.fn().mockResolvedValueOnce(
      new Response(JSON.stringify({ message: "Category not found" }), {
        status: 404,
      }),
    );

    const consoleSpy = jest.spyOn(console, "log");

    const { result } = renderHook(() => useCategoryUpdate(), {
      wrapper: createWrapper(queryClient),
    });

    result.current.mutate({ oldCategory, newCategory });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(consoleSpy).toHaveBeenCalledWith("Resource not found (404).");
    expect(result.current.error?.message).toContain(
      "Failed to update transaction state",
    );

    consoleSpy.mockRestore();
  });

  it("should handle other HTTP errors", async () => {
    const queryClient = createTestQueryClient();

    const oldCategory: Category = {
      categoryId: 123,
      categoryName: "test_category",
      activeStatus: true,
      categoryCount: 5,
    };

    const newCategory: Category = {
      ...oldCategory,
      categoryName: "", // Invalid empty name
    };

    // Mock the fetch call to return a 400 error
    global.fetch = jest.fn().mockResolvedValueOnce(
      new Response(JSON.stringify({ message: "Bad Request" }), {
        status: 400,
      }),
    );

    const { result } = renderHook(() => useCategoryUpdate(), {
      wrapper: createWrapper(queryClient),
    });

    const consoleSpy = jest.spyOn(console, "error");

    result.current.mutate({ oldCategory, newCategory });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error?.message).toContain(
      "Failed to update transaction state",
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("Error occurred during mutation:"),
    );

    consoleSpy.mockRestore();
  });

  it("should handle network errors", async () => {
    const queryClient = createTestQueryClient();

    const oldCategory: Category = {
      categoryId: 123,
      categoryName: "test_category",
      activeStatus: true,
      categoryCount: 5,
    };

    const newCategory: Category = {
      ...oldCategory,
      categoryName: "updated_category",
    };

    // Mock the fetch call to throw a network error
    global.fetch = jest
      .fn()
      .mockRejectedValueOnce(new Error("Network failure"));

    const { result } = renderHook(() => useCategoryUpdate(), {
      wrapper: createWrapper(queryClient),
    });

    const consoleSpy = jest.spyOn(console, "error");

    result.current.mutate({ oldCategory, newCategory });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error?.message).toBe("Network failure");
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining(
        "Error occurred during mutation: Network failure",
      ),
    );

    consoleSpy.mockRestore();
  });

  it("should handle case when cache is empty", async () => {
    const queryClient = createTestQueryClient();

    const oldCategory: Category = {
      categoryId: 123,
      categoryName: "test_category",
      activeStatus: true,
      categoryCount: 5,
    };

    const newCategory: Category = {
      ...oldCategory,
      categoryName: "updated_category",
    };

    const responseCategory: Category = {
      ...newCategory,
      dateUpdated: new Date().toISOString(),
    };

    // Mock the fetch call directly for this test
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify(responseCategory), { status: 200 }),
      );

    // Don't set any initial cache data

    const { result } = renderHook(() => useCategoryUpdate(), {
      wrapper: createWrapper(queryClient),
    });

    result.current.mutate({ oldCategory, newCategory });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Cache should remain empty since onSuccess only updates if oldData exists
    const updatedCategories = queryClient.getQueryData<Category[]>([
      "category",
    ]);
    expect(updatedCategories).toBeUndefined();
  });

  it("should update category based on categoryId match", async () => {
    const queryClient = createTestQueryClient();

    const oldCategory: Category = {
      categoryId: 123,
      categoryName: "test_category",
      activeStatus: true,
      categoryCount: 5,
    };

    const newCategory: Category = {
      ...oldCategory,
      categoryName: "updated_category",
    };

    const responseCategory: Category = {
      ...newCategory,
      dateUpdated: new Date().toISOString(),
    };

    // Mock the fetch call directly for this test
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify(responseCategory), { status: 200 }),
      );

    // Set cache with categories having same categoryId but different names
    const existingCategories: Category[] = [
      {
        categoryId: 123, // Same ID as oldCategory
        categoryName: "different_name",
        activeStatus: true,
        categoryCount: 2,
      },
      {
        categoryId: 456,
        categoryName: "other_category",
        activeStatus: true,
        categoryCount: 3,
      },
    ];
    queryClient.setQueryData(["category"], existingCategories);

    const { result } = renderHook(() => useCategoryUpdate(), {
      wrapper: createWrapper(queryClient),
    });

    result.current.mutate({ oldCategory, newCategory });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Verify the cache was updated based on categoryId (123), not categoryName
    const updatedCategories = queryClient.getQueryData<Category[]>([
      "category",
    ]);
    expect(updatedCategories).toHaveLength(2);
    expect(updatedCategories?.[0]).toEqual({
      ...existingCategories[0],
      ...responseCategory,
    });
    expect(updatedCategories?.[1].categoryId).toBe(456); // Other category unchanged
  });
});
