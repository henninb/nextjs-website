import React from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import useTotalsFetch from "../../hooks/useTotalsFetch";
import Totals from "../../model/Totals";

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

describe("useTotalsFetch", () => {
  it("should fetch totals successfully", async () => {
    const queryClient = createTestQueryClient();

    const mockTotals: Totals = {
      totals: 1500.5,
      totalsFuture: 2000.75,
      totalsCleared: 1200.25,
      totalsOutstanding: 300.25,
    };

    // Mock the fetch call directly for this test
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify(mockTotals), { status: 200 }),
      );

    const { result } = renderHook(() => useTotalsFetch(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockTotals);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isError).toBe(false);
  });

  it("should handle 404 errors properly", async () => {
    const queryClient = createTestQueryClient();

    // Mock the fetch call to return a 404 error
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ message: "Not found" }), { status: 404 }),
      );

    const consoleSpy = jest.spyOn(console, "error");

    const { result } = renderHook(() => useTotalsFetch(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    // Should be in error state
    expect(result.current.data).toBeUndefined();
    expect(result.current.isSuccess).toBe(false);
    expect(result.current.error).toBeDefined();
    expect(result.current.error?.message).toContain("Failed to fetch");
    expect(consoleSpy).toHaveBeenCalledWith(
      "Error fetching totals data:",
      expect.anything(),
    );

    consoleSpy.mockRestore();
  });

  it("should handle 500 server errors properly", async () => {
    const queryClient = createTestQueryClient();

    // Mock the fetch call to return a 500 error
    global.fetch = jest.fn().mockResolvedValueOnce(
      new Response(JSON.stringify({ message: "Internal server error" }), {
        status: 500,
      }),
    );

    const consoleSpy = jest.spyOn(console, "error");

    const { result } = renderHook(() => useTotalsFetch(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    // Should be in error state
    expect(result.current.data).toBeUndefined();
    expect(result.current.isSuccess).toBe(false);
    expect(result.current.error).toBeDefined();
    expect(result.current.error?.message).toContain("Failed to fetch");
    expect(consoleSpy).toHaveBeenCalledWith(
      "Error fetching totals data:",
      expect.anything(),
    );

    consoleSpy.mockRestore();
  });

  it("should handle network errors properly", async () => {
    const queryClient = createTestQueryClient();

    // Mock the fetch call to throw a network error
    global.fetch = jest
      .fn()
      .mockRejectedValueOnce(new Error("Network failure"));

    const consoleSpy = jest.spyOn(console, "error");

    const { result } = renderHook(() => useTotalsFetch(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    // Should be in error state
    expect(result.current.data).toBeUndefined();
    expect(result.current.isSuccess).toBe(false);
    expect(result.current.error).toBeDefined();
    expect(consoleSpy).toHaveBeenCalledWith(
      "Error fetching totals data:",
      expect.anything(),
    );

    consoleSpy.mockRestore();
  });

  it("should handle persistent errors properly", async () => {
    const queryClient = createTestQueryClient();

    // Mock the fetch call to throw a persistent error
    global.fetch = jest
      .fn()
      .mockRejectedValueOnce(new Error("Persistent error"));

    const consoleSpy = jest.spyOn(console, "error");

    const { result } = renderHook(() => useTotalsFetch(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    // Should be in error state
    expect(result.current.data).toBeUndefined();
    expect(result.current.isSuccess).toBe(false);
    expect(result.current.error).toBeDefined();
    expect(consoleSpy).toHaveBeenCalledWith(
      "Error fetching totals data:",
      expect.anything(),
    );

    consoleSpy.mockRestore();
  });

  it("should include correct headers in request", async () => {
    const queryClient = createTestQueryClient();

    const mockTotals: Totals = {
      totals: 100.0,
      totalsFuture: 200.0,
      totalsCleared: 150.0,
      totalsOutstanding: 50.0,
    };

    let capturedHeaders: any;

    // Mock the fetch call and capture headers - note: with direct fetch mock we can't capture headers the same way
    global.fetch = jest.fn().mockImplementation((url, options) => {
      capturedHeaders = options?.headers || {};
      return Promise.resolve(
        new Response(JSON.stringify(mockTotals), { status: 200 }),
      );
    });

    const { result } = renderHook(() => useTotalsFetch(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Verify correct headers were sent (note: headers are case-sensitive)
    expect(capturedHeaders["Content-Type"]).toBe("application/json");
    expect(capturedHeaders["Accept"]).toBe("application/json");
  });

  it("should use payment_required as query key", async () => {
    const queryClient = createTestQueryClient();

    const mockTotals: Totals = {
      totals: 100.0,
      totalsFuture: 200.0,
      totalsCleared: 150.0,
      totalsOutstanding: 50.0,
    };

    // Mock the fetch call directly for this test
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify(mockTotals), { status: 200 }),
      );

    const { result } = renderHook(() => useTotalsFetch(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Verify data was cached with the correct key
    const cachedData = queryClient.getQueryData(["payment_required"]);
    expect(cachedData).toEqual(mockTotals);
  });

  it("should handle 401 unauthorized errors properly", async () => {
    const queryClient = createTestQueryClient();

    // Mock the fetch call to return a 401 error
    global.fetch = jest.fn().mockResolvedValueOnce(
      new Response(JSON.stringify({ message: "Unauthorized" }), {
        status: 401,
      }),
    );

    const consoleSpy = jest.spyOn(console, "error");

    const { result } = renderHook(() => useTotalsFetch(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    // Should be in error state
    expect(result.current.data).toBeUndefined();
    expect(result.current.isSuccess).toBe(false);
    expect(result.current.error).toBeDefined();
    expect(result.current.error?.message).toContain("Failed to fetch");

    consoleSpy.mockRestore();
  });

  it("should provide refetch capability", async () => {
    const queryClient = createTestQueryClient();

    const mockTotals: Totals = {
      totals: 100.0,
      totalsFuture: 200.0,
      totalsCleared: 150.0,
      totalsOutstanding: 50.0,
    };

    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify(mockTotals), { status: 200 }),
      );

    const { result } = renderHook(() => useTotalsFetch(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.refetch).toBeDefined();
    expect(typeof result.current.refetch).toBe("function");
  });
});
