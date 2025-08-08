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

    const { result } = renderHook(() => useAccountFetch(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Should return dummy data when 404
    expect(result.current.data).toBeDefined();
    expect(consoleSpy).toHaveBeenCalledWith(
      "Error fetching account data:",
      expect.anything(),
    );

    consoleSpy.mockRestore();
    global.fetch = originalFetch;
  });

  it("should handle network errors and return dummy data", async () => {
    const queryClient = createTestQueryClient();

    // Mock the global fetch function to return 500 error
    const originalFetch = global.fetch;
    global.fetch = jest.fn().mockResolvedValueOnce(
      new Response(JSON.stringify({ message: "Internal server error" }), {
        status: 500,
      }),
    );

    const consoleSpy = jest.spyOn(console, "log");

    const { result } = renderHook(() => useAccountFetch(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Should return dummy data on error
    expect(result.current.data).toBeDefined();
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

  it("should log errors when query fails", async () => {
    const queryClient = createTestQueryClient();

    // Mock the global fetch function to throw an error
    const originalFetch = global.fetch;
    global.fetch = jest
      .fn()
      .mockRejectedValueOnce(new Error("Network failure"));

    const consoleSpy = jest.spyOn(console, "log");

    const { result } = renderHook(() => useAccountFetch(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(consoleSpy).toHaveBeenCalledWith(
      "Error fetching account data:",
      expect.anything(),
    );

    consoleSpy.mockRestore();
    global.fetch = originalFetch;
  });
});
