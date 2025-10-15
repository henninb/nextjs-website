import React from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import useAccountFetch from "../../hooks/useAccountFetch";
import Account from "../../model/Account";

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
        retryOnMount: false,
        refetchOnMount: false,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
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

describe("useAccountFetch", () => {
  it("should fetch accounts successfully", async () => {
    const queryClient = createTestQueryClient();

    const mockAccounts: Account[] = [
      {
        accountId: 1,
        accountNameOwner: "account_owner_1",
        accountType: "debit",
        activeStatus: true,
        moniker: "1111",
        outstanding: 100,
        future: 300,
        cleared: 200,
      },
      {
        accountId: 2,
        accountNameOwner: "account_owner_2",
        accountType: "credit",
        activeStatus: true,
        moniker: "2222",
        outstanding: 50,
        future: 150,
        cleared: 100,
      },
    ];

    // Mock the global fetch function
    const originalFetch = global.fetch;
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify(mockAccounts), { status: 200 }),
      );

    const { result } = renderHook(() => useAccountFetch(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockAccounts);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isError).toBe(false);

    // Restore original fetch
    global.fetch = originalFetch;
  });

  it("should handle empty array when no accounts found (modern endpoint)", async () => {
    const queryClient = createTestQueryClient();

    // Mock the global fetch function to return 200 with empty array (modern behavior)
    const originalFetch = global.fetch;
    global.fetch = jest
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify([]), { status: 200 }),
      );

    const { result } = renderHook(() => useAccountFetch(), {
      wrapper: createWrapper(queryClient),
    });

    // Wait for the success state with empty data
    await waitFor(() => expect(result.current.isSuccess).toBe(true), {
      timeout: 5000,
    });

    // Modern endpoint returns 200 OK with empty array (not 404)
    expect(result.current.data).toEqual([]);
    expect(result.current.isSuccess).toBe(true);
    expect(result.current.isError).toBe(false);

    global.fetch = originalFetch;
  });

  it("should handle network errors properly", async () => {
    const queryClient = createTestQueryClient();

    // Mock the global fetch function to return 500 error for all calls
    const originalFetch = global.fetch;
    global.fetch = jest.fn().mockResolvedValue(
      new Response(JSON.stringify({ message: "Internal server error" }), {
        status: 500,
      }),
    );

    const consoleSpy = jest.spyOn(console, "error");

    const { result } = renderHook(() => useAccountFetch(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.isError).toBe(true), {
      timeout: 5000,
    });

    // Should be in error state
    expect(result.current.data).toBeUndefined();
    expect(result.current.isSuccess).toBe(false);
    expect(result.current.error).toBeDefined();
    expect(result.current.error?.message).toContain("Failed to fetch");
    expect(consoleSpy).toHaveBeenCalledWith(
      "Error fetching account data:",
      expect.anything(),
    );

    consoleSpy.mockRestore();
    global.fetch = originalFetch;
  });

  it("should handle 204 no content response", async () => {
    const queryClient = createTestQueryClient();

    // Mock the global fetch function to return 204
    const originalFetch = global.fetch;
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 204 }));

    const { result } = renderHook(() => useAccountFetch(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toBeNull();
    expect(result.current.isLoading).toBe(false);

    global.fetch = originalFetch;
  });

  it("should handle fetch rejection errors properly", async () => {
    const queryClient = createTestQueryClient();

    // Mock the global fetch function to throw an error for all calls
    const originalFetch = global.fetch;
    global.fetch = jest.fn().mockRejectedValue(new Error("Network failure"));

    const consoleSpy = jest.spyOn(console, "error");

    const { result } = renderHook(() => useAccountFetch(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.isError).toBe(true), {
      timeout: 5000,
    });

    // Should be in error state
    expect(result.current.data).toBeUndefined();
    expect(result.current.isSuccess).toBe(false);
    expect(result.current.error).toBeDefined();
    expect(consoleSpy).toHaveBeenCalledWith(
      "Error fetching account data:",
      expect.anything(),
    );

    consoleSpy.mockRestore();
    global.fetch = originalFetch;
  });

  it("should provide refetch capability", async () => {
    const queryClient = createTestQueryClient();

    const mockAccounts: Account[] = [
      {
        accountId: 1,
        accountNameOwner: "test_account",
        accountType: "debit",
        activeStatus: true,
        moniker: "1111",
        outstanding: 100,
        future: 300,
        cleared: 200,
      },
    ];

    const originalFetch = global.fetch;
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify(mockAccounts), { status: 200 }),
      );

    const { result } = renderHook(() => useAccountFetch(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.refetch).toBeDefined();
    expect(typeof result.current.refetch).toBe("function");

    global.fetch = originalFetch;
  });
});
