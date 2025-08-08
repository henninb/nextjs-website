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

  it("should handle 404 errors and return dummy data", async () => {
    const queryClient = createTestQueryClient();

    // Mock the global fetch function to return 404
    const originalFetch = global.fetch;
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ message: "Not found" }), { status: 404 }),
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
    global.fetch = originalFetch;
  });

  it("should handle 500 server errors and return dummy data", async () => {
    const queryClient = createTestQueryClient();

    // Mock the global fetch function to return 500 error
    const originalFetch = global.fetch;
    global.fetch = jest.fn().mockResolvedValueOnce(
      new Response(JSON.stringify({ message: "Internal server error" }), {
        status: 500,
      }),
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
    global.fetch = originalFetch;
  });

  it("should handle network errors and return dummy data", async () => {
    const queryClient = createTestQueryClient();

    // Mock the global fetch function to throw network error
    const originalFetch = global.fetch;
    global.fetch = jest
      .fn()
      .mockRejectedValueOnce(new Error("Network failure"));

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
    global.fetch = originalFetch;
  });

  it("should log errors when query has error state", async () => {
    const queryClient = createTestQueryClient();

    // Mock the global fetch function to throw persistent error
    const originalFetch = global.fetch;
    global.fetch = jest
      .fn()
      .mockRejectedValueOnce(new Error("Persistent network error"))
      .mockRejectedValueOnce(new Error("Persistent network error"))
      .mockRejectedValueOnce(new Error("Persistent network error"));

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

  it("should return empty array structure from dummy data on error", async () => {
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

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Should return dummy categories (array format)
    expect(Array.isArray(result.current.data)).toBe(true);
    expect(result.current.data).toBeDefined();

    global.fetch = originalFetch;
  });
});
