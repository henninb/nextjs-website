import React from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import useTransferDelete from "../../hooks/useTransferDelete";
import Transfer from "../../model/Transfer";

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

// Create a wrapper component with all providers
const createWrapper =
  (queryClient: QueryClient) =>
  ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

describe("useDeleteTransfer", () => {
  it("should delete a transfer successfully", async () => {
    const queryClient = createTestQueryClient();

    const mockTransfer: Transfer = {
      transferId: 1,
      sourceAccount: "accountA",
      destinationAccount: "accountB",
      transactionDate: new Date(),
      amount: 1000,
      activeStatus: true,
      dateAdded: new Date(),
      dateUpdated: new Date(),
    };

    // Mock the global fetch function to return 204 success
    const originalFetch = global.fetch;
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 204 }));

    // Set initial cache data
    queryClient.setQueryData(["transfer"], [mockTransfer]);

    // Render the hook
    const { result } = renderHook(() => useTransferDelete(), {
      wrapper: createWrapper(queryClient),
    });

    // Execute the mutation
    result.current.mutate({ oldRow: mockTransfer });

    // Wait for the mutation to complete
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Verify that the transfer was removed from the cache
    const updatedTransfers = queryClient.getQueryData<Transfer[]>(["transfer"]);
    expect(updatedTransfers).toEqual([]);

    // Restore original fetch
    global.fetch = originalFetch;
  });

  it("should handle API errors correctly", async () => {
    const queryClient = createTestQueryClient();

    const mockTransfer: Transfer = {
      transferId: 1,
      sourceAccount: "accountA",
      destinationAccount: "accountB",
      transactionDate: new Date(),
      amount: 1000,
      activeStatus: true,
      dateAdded: new Date(),
      dateUpdated: new Date(),
    };

    // Mock the global fetch function to return 400 with empty response
    const originalFetch = global.fetch;
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({}), { status: 400 }));

    // Render the hook
    const { result } = renderHook(() => useTransferDelete(), {
      wrapper: createWrapper(queryClient),
    });

    // Spy on console.log
    const consoleSpy = jest.spyOn(console, "log");

    // Execute the mutation
    result.current.mutate({ oldRow: mockTransfer });

    // Wait for the mutation to fail
    await waitFor(() => expect(result.current.isError).toBe(true));

    // Verify error was logged
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("No error message returned"),
    );

    consoleSpy.mockRestore();
    global.fetch = originalFetch;
  });

  it("should handle network errors correctly", async () => {
    const queryClient = createTestQueryClient();

    const mockTransfer: Transfer = {
      transferId: 1,
      sourceAccount: "accountA",
      destinationAccount: "accountB",
      transactionDate: new Date(),
      amount: 1000,
      activeStatus: true,
      dateAdded: new Date(),
      dateUpdated: new Date(),
    };

    // Mock the global fetch function to return 500 error
    const originalFetch = global.fetch;
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ message: "Network error" }), {
          status: 500,
        }),
      );

    // Render the hook
    const { result } = renderHook(() => useTransferDelete(), {
      wrapper: createWrapper(queryClient),
    });

    // Spy on console.log
    const consoleSpy = jest.spyOn(console, "log");

    // Execute the mutation
    result.current.mutate({ oldRow: mockTransfer });

    // Wait for the mutation to fail
    await waitFor(() => expect(result.current.isError).toBe(true));

    // Verify error was logged
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
    global.fetch = originalFetch;
  });
});
