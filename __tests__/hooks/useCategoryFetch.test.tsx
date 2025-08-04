import React from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import useCategoryFetch from "../../hooks/useCategoryFetch";
import Category from "../../model/Category";

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

describe("useCategoryFetch", () => {
  it("should fetch categories successfully", async () => {
    const queryClient = createTestQueryClient();

    const mockCategories: Category[] = [
      {
        categoryId: 1,
        categoryName: "groceries",
        activeStatus: true,
        categoryCount: 10,
      },
      {
        categoryId: 2,
        categoryName: "utilities",
        activeStatus: true,
        categoryCount: 5,
      },
      {
        categoryId: 3,
        categoryName: "entertainment",
        activeStatus: true,
        categoryCount: 3,
      },
    ];

    server.use(
      http.get(
        "https://finance.bhenning.com/api/category/select/active",
        () => {
          return HttpResponse.json(mockCategories, { status: 200 });
        },
      ),
    );

    const { result } = renderHook(() => useCategoryFetch(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockCategories);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isError).toBe(false);
  });

  it("should handle 404 errors and return dummy data", async () => {
    const queryClient = createTestQueryClient();

    server.use(
      http.get(
        "https://finance.bhenning.com/api/category/select/active",
        () => {
          return HttpResponse.json({ message: "Not found" }, { status: 404 });
        },
      ),
    );

    const consoleSpy = jest.spyOn(console, "log");

    const { result } = renderHook(() => useCategoryFetch(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Should return dummy data when 404
    expect(result.current.data).toBeDefined();
    expect(consoleSpy).toHaveBeenCalledWith("Resource not found (404).");
    expect(consoleSpy).toHaveBeenCalledWith(
      "Error fetching category data:",
      expect.anything(),
    );

    consoleSpy.mockRestore();
  });

  it("should handle 500 server errors and return dummy data", async () => {
    const queryClient = createTestQueryClient();

    server.use(
      http.get(
        "https://finance.bhenning.com/api/category/select/active",
        () => {
          return HttpResponse.json(
            { message: "Internal server error" },
            { status: 500 },
          );
        },
      ),
    );

    const consoleSpy = jest.spyOn(console, "log");

    const { result } = renderHook(() => useCategoryFetch(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Should return dummy data on error
    expect(result.current.data).toBeDefined();
    expect(consoleSpy).toHaveBeenCalledWith(
      "Error fetching category data:",
      expect.anything(),
    );

    consoleSpy.mockRestore();
  });

  it("should handle network errors and return dummy data", async () => {
    const queryClient = createTestQueryClient();

    server.use(
      http.get(
        "https://finance.bhenning.com/api/category/select/active",
        () => {
          throw new Error("Network failure");
        },
      ),
    );

    const consoleSpy = jest.spyOn(console, "log");

    const { result } = renderHook(() => useCategoryFetch(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Should return dummy data on network error
    expect(result.current.data).toBeDefined();
    expect(consoleSpy).toHaveBeenCalledWith(
      "Error fetching category data:",
      expect.anything(),
    );

    consoleSpy.mockRestore();
  });

  it("should log errors when query has error state", async () => {
    const queryClient = createTestQueryClient();

    server.use(
      http.get(
        "https://finance.bhenning.com/api/category/select/active",
        () => {
          throw new Error("Persistent network error");
        },
      ),
    );

    const consoleSpy = jest.spyOn(console, "log");

    const { result } = renderHook(() => useCategoryFetch(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Should have logged the fetch error
    expect(consoleSpy).toHaveBeenCalledWith(
      "Error fetching category data:",
      expect.anything(),
    );

    consoleSpy.mockRestore();
  });

  it("should include correct headers in request", async () => {
    const queryClient = createTestQueryClient();

    const mockCategories: Category[] = [
      {
        categoryId: 1,
        categoryName: "test",
        activeStatus: true,
        categoryCount: 1,
      },
    ];

    let capturedHeaders: any;

    server.use(
      http.get(
        "https://finance.bhenning.com/api/category/select/active",
        ({ request }) => {
          capturedHeaders = Object.fromEntries(request.headers.entries());
          return HttpResponse.json(mockCategories, { status: 200 });
        },
      ),
    );

    const { result } = renderHook(() => useCategoryFetch(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Verify correct headers were sent
    expect(capturedHeaders["content-type"]).toBe("application/json");
    expect(capturedHeaders["accept"]).toBe("application/json");
  });

  it("should return empty array structure from dummy data on error", async () => {
    const queryClient = createTestQueryClient();

    server.use(
      http.get(
        "https://finance.bhenning.com/api/category/select/active",
        () => {
          return HttpResponse.json(
            { message: "Unauthorized" },
            { status: 401 },
          );
        },
      ),
    );

    const { result } = renderHook(() => useCategoryFetch(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Should return dummy categories (array format)
    expect(Array.isArray(result.current.data)).toBe(true);
    expect(result.current.data).toBeDefined();
  });
});
