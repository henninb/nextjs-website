import React from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { rest } from "msw";
import { setupServer } from "msw/node";
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

    server.use(
      rest.delete(
        `https://finance.bhenning.com/api/transfer/delete/${mockTransfer.transferId}`,
        (req, res, ctx) => res(ctx.status(204)),
      ),
    );

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

    // Mock an API error
    server.use(
      rest.delete(
        `https://finance.bhenning.com/api/transfer/delete/${mockTransfer.transferId}`,
        (req, res, ctx) =>
          res(
            ctx.status(400),
            ctx.json({ response: "Cannot delete this transfer" }),
          ),
      ),
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
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("Cannot delete this transfer"),
    );

    consoleSpy.mockRestore();
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

    // Mock a network error
    server.use(
      rest.delete(
        `https://finance.bhenning.com/api/transfer/delete/${mockTransfer.transferId}`,
        (req, res, ctx) =>
          res(ctx.status(500), ctx.json({ message: "Network error" })),
      ),
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
  });
});
