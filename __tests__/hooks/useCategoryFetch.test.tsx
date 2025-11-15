import React from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import useCategoryFetch from "../../hooks/useCategoryFetch";
import Category from "../../model/Category";

// Mock the useAuth hook
jest.mock("../../components/AuthProvider", () => ({
  useAuth: () => ({
    isAuthenticated: true,
    loading: false,
    user: null,
    login: jest.fn(),
    logout: jest.fn(),
  }),
}));

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

    // Mock the global fetch function
    const originalFetch = global.fetch;
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify(mockCategories), { status: 200 }),
      );

    const { result } = renderHook(() => useCategoryFetch(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockCategories);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isError).toBe(false);

    // Restore original fetch
    global.fetch = originalFetch;
  });

  it("should handle 404 errors properly", async () => {
    const queryClient = createTestQueryClient();

    // Mock the global fetch function to return 404
    const originalFetch = global.fetch;
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ error: "Not found" }), { status: 404 }),
      );

    const { result} = renderHook(() => useCategoryFetch(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    // Modern error handling - 404 is an error, not empty success
    expect(result.current.data).toBeUndefined();
    expect(result.current.isSuccess).toBe(false);
    expect(result.current.error).toBeDefined();
    expect(result.current.error?.message).toContain("HTTP 404");
    // Logging tested in logger.test.ts

    global.fetch = originalFetch;
  });

  it("should handle 500 server errors properly", async () => {
    const queryClient = createTestQueryClient();

    // Mock the global fetch function to return 500 error
    const originalFetch = global.fetch;
    global.fetch = jest.fn().mockResolvedValueOnce(
      new Response(JSON.stringify({ message: "Internal server error" }), {
        status: 500,
      }),
    );

    const consoleSpy = jest.spyOn(console, "error");

    const { result } = renderHook(() => useCategoryFetch(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    // Should be in error state
    expect(result.current.data).toBeUndefined();
    expect(result.current.isSuccess).toBe(false);
    expect(result.current.error).toBeDefined();
    expect(result.current.error?.message).toContain("HTTP 500");
    // Logging tested in logger.test.ts

    global.fetch = originalFetch;
  });

  it("should handle network errors properly", async () => {
    const queryClient = createTestQueryClient();

    // Mock the global fetch function to throw network error
    const originalFetch = global.fetch;
    global.fetch = jest
      .fn()
      .mockRejectedValueOnce(new Error("Network failure"));

    const { result } = renderHook(() => useCategoryFetch(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    // Should be in error state
    expect(result.current.data).toBeUndefined();
    expect(result.current.isSuccess).toBe(false);
    expect(result.current.error).toBeDefined();
    expect(result.current.error?.message).toContain("Network failure");
    // Logging tested in logger.test.ts

    global.fetch = originalFetch;
  });

  it("should handle persistent errors properly", async () => {
    const queryClient = createTestQueryClient();

    // Mock the global fetch function to throw persistent error
    const originalFetch = global.fetch;
    global.fetch = jest
      .fn()
      .mockRejectedValueOnce(new Error("Persistent network error"));

    const { result } = renderHook(() => useCategoryFetch(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    // Should be in error state
    expect(result.current.data).toBeUndefined();
    expect(result.current.isSuccess).toBe(false);
    expect(result.current.error).toBeDefined();
    expect(result.current.error?.message).toContain("Persistent network error");
    // Logging tested in logger.test.ts

    global.fetch = originalFetch;
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

    // Mock the global fetch function and capture headers
    const originalFetch = global.fetch;
    global.fetch = jest.fn().mockImplementation((url, options) => {
      capturedHeaders = options?.headers || {};
      return Promise.resolve(
        new Response(JSON.stringify(mockCategories), { status: 200 }),
      );
    });

    const { result } = renderHook(() => useCategoryFetch(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Verify correct headers were sent (case-sensitive)
    expect(capturedHeaders["Content-Type"]).toBe("application/json");
    expect(capturedHeaders["Accept"]).toBe("application/json");

    global.fetch = originalFetch;
  });

  it("should handle 401 unauthorized errors properly", async () => {
    const queryClient = createTestQueryClient();

    // Mock the global fetch function to return 401 error
    const originalFetch = global.fetch;
    global.fetch = jest.fn().mockResolvedValueOnce(
      new Response(JSON.stringify({ message: "Unauthorized" }), {
        status: 401,
      }),
    );

    const { result } = renderHook(() => useCategoryFetch(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    // Should be in error state
    expect(result.current.data).toBeUndefined();
    expect(result.current.isSuccess).toBe(false);
    expect(result.current.error).toBeDefined();
    expect(result.current.error?.message).toContain("HTTP 401");
    // Logging tested in logger.test.ts

    global.fetch = originalFetch;
  });

  it("should provide refetch capability", async () => {
    const queryClient = createTestQueryClient();

    const mockCategories: Category[] = [
      {
        categoryId: 1,
        categoryName: "test",
        activeStatus: true,
        categoryCount: 1,
      },
    ];

    const originalFetch = global.fetch;
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify(mockCategories), { status: 200 }),
      );

    const { result } = renderHook(() => useCategoryFetch(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.refetch).toBeDefined();
    expect(typeof result.current.refetch).toBe("function");

    global.fetch = originalFetch;
  });
});
