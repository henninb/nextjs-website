import React from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import useTotalsPerAccountFetch from "../../hooks/useTotalsPerAccountFetch";
import Totals from "../../model/Totals";

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

// Setup MSW server
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
        retryOnMount: false,
        refetchOnMount: false,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
      },
      mutations: { retry: false },
    },
  });

const createWrapper =
  (queryClient: QueryClient) =>
  ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

describe("useTotalsPerAccountFetch", () => {
  it("should fetch totals per account successfully", async () => {
    const queryClient = createTestQueryClient();
    const mockTotals: Totals = {
      totalsOutstanding: 100.0,
      totalsFuture: 200.0,
      totalsCleared: 300.0,
      totals: 600.0,
    };

    // Mock the global fetch function
    const originalFetch = global.fetch;
    global.fetch = jest
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify(mockTotals), { status: 200 }),
      );

    const { result } = renderHook(
      () => useTotalsPerAccountFetch("test-account"),
      {
        wrapper: createWrapper(queryClient),
      },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockTotals);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isError).toBe(false);

    global.fetch = originalFetch;
  });

  it("should handle server errors properly", async () => {
    const queryClient = createTestQueryClient();

    // Mock the global fetch function to return 500 error
    const originalFetch = global.fetch;
    global.fetch = jest
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ message: "Error" }), { status: 500 }),
      );

    const consoleSpy = jest.spyOn(console, "error");

    const { result } = renderHook(
      () => useTotalsPerAccountFetch("test-account"),
      {
        wrapper: createWrapper(queryClient),
      },
    );

    await waitFor(() => expect(result.current.isError).toBe(true), {
      timeout: 5000,
    });

    // Should be in error state
    expect(result.current.data).toBeUndefined();
    expect(result.current.isSuccess).toBe(false);
    expect(result.current.error).toBeDefined();
    expect(result.current.error?.message).toContain("Failed to fetch");
    expect(consoleSpy).toHaveBeenCalledWith(
      "Error fetching totals per account data:",
      expect.anything(),
    );

    consoleSpy.mockRestore();
    global.fetch = originalFetch;
  });

  it("should handle network errors properly", async () => {
    const queryClient = createTestQueryClient();

    // Mock fetch to throw network error
    const originalFetch = global.fetch;
    global.fetch = jest.fn().mockRejectedValue(new Error("Network failure"));

    const consoleSpy = jest.spyOn(console, "error");

    const { result } = renderHook(
      () => useTotalsPerAccountFetch("test-account"),
      {
        wrapper: createWrapper(queryClient),
      },
    );

    await waitFor(() => expect(result.current.isError).toBe(true), {
      timeout: 5000,
    });

    // Should be in error state
    expect(result.current.data).toBeUndefined();
    expect(result.current.isSuccess).toBe(false);
    expect(result.current.error).toBeDefined();
    expect(consoleSpy).toHaveBeenCalledWith(
      "Error fetching totals per account data:",
      expect.anything(),
    );

    consoleSpy.mockRestore();
    global.fetch = originalFetch;
  });

  it("should provide refetch capability", async () => {
    const queryClient = createTestQueryClient();
    const mockTotals: Totals = {
      totalsOutstanding: 100.0,
      totalsFuture: 200.0,
      totalsCleared: 300.0,
      totals: 600.0,
    };

    // Mock the global fetch function
    const originalFetch = global.fetch;
    global.fetch = jest
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify(mockTotals), { status: 200 }),
      );

    const { result } = renderHook(
      () => useTotalsPerAccountFetch("test-account"),
      {
        wrapper: createWrapper(queryClient),
      },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.refetch).toBeDefined();
    expect(typeof result.current.refetch).toBe("function");

    global.fetch = originalFetch;
  });

  it("should not fetch when not authenticated", () => {
    const queryClient = createTestQueryClient();
    const { result } = renderHook(
      () => useTotalsPerAccountFetch("test-account"),
      {
        wrapper: createWrapper(queryClient),
      },
    );

    expect(result.current.isPending).toBe(true);
    expect(result.current.data).toBeUndefined();
  });
});
