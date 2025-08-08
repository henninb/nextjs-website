import React from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import useCategoryDelete from "../../hooks/useCategoryDelete";
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

// Mock jose package
jest.mock("jose", () => ({
  jwtVerify: jest.fn().mockResolvedValue(true),
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

describe("useCategoryDelete", () => {
  it("should delete a category successfully", async () => {
    const queryClient = createTestQueryClient();

    const mockCategory: Category = {
      categoryId: 1,
      categoryName: "electronics",
      activeStatus: true,
      categoryCount: 10,
      dateAdded: new Date(),
      dateUpdated: new Date(),
    };

    // Mock the fetch call directly for this test
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 204 }));

    // Set initial cache data
    queryClient.setQueryData(["category"], [mockCategory]);

    // Render the hook
    const { result } = renderHook(() => useCategoryDelete(), {
      wrapper: createWrapper(queryClient),
    });

    // Execute the mutation
    result.current.mutate(mockCategory);

    // Wait for the mutation to complete
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Verify that the category was removed from the cache
    const updatedCategories = queryClient.getQueryData<Category[]>([
      "category",
    ]);
    expect(updatedCategories).toEqual([]);
  });

  it("should handle API errors correctly", async () => {
    const queryClient = createTestQueryClient();

    const mockCategory: Category = {
      categoryId: 1,
      categoryName: "Electronics",
      activeStatus: true,
      categoryCount: 10,
      dateAdded: new Date(),
      dateUpdated: new Date(),
    };

    // Mock the fetch call to return an error response
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ response: "Cannot delete this category" }),
          { status: 400 },
        ),
      );

    // Render the hook
    const { result } = renderHook(() => useCategoryDelete(), {
      wrapper: createWrapper(queryClient),
    });

    // Spy on console.log
    const consoleSpy = jest.spyOn(console, "log");

    // Execute the mutation
    result.current.mutate(mockCategory);

    // Wait for the mutation to fail
    await waitFor(() => expect(result.current.isError).toBe(true));

    // Verify error was logged
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("Cannot delete this category"),
    );

    consoleSpy.mockRestore();
  });

  it("should handle network errors correctly", async () => {
    const queryClient = createTestQueryClient();

    const mockCategory: Category = {
      categoryId: 1,
      categoryName: "Electronics",
      activeStatus: true,
      categoryCount: 10,
      dateAdded: new Date(),
      dateUpdated: new Date(),
    };

    // Mock the fetch call to return a network error
    global.fetch = jest.fn().mockResolvedValueOnce(
      new Response(JSON.stringify({ message: "Network error" }), {
        status: 500,
      }),
    );

    // Render the hook
    const { result } = renderHook(() => useCategoryDelete(), {
      wrapper: createWrapper(queryClient),
    });

    // Spy on console.log
    const consoleSpy = jest.spyOn(console, "log");

    // Execute the mutation
    result.current.mutate(mockCategory);

    // Wait for the mutation to fail
    await waitFor(() => expect(result.current.isError).toBe(true));

    // Verify error was logged
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });
});
