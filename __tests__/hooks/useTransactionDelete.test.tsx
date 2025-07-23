import React from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import useTransactionDelete from "../../hooks/useTransactionDelete";
import Transaction from "../../model/Transaction";
// import { AuthProvider } from "../../components/AuthProvider";
// import Layout from "../../components/Layout";

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
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

// Create a wrapper component with all providers
const createWrapper =
  (queryClient: QueryClient) =>
  ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

describe("useTransactionDelete", () => {
  it("should delete a transaction successfully", async () => {
    const queryClient = createTestQueryClient();

    const mockTransaction: Transaction = {
      transactionId: 1,
      guid: "dummy-guid",
      accountId: 100,
      accountType: "credit",
      accountNameOwner: "ownerTest",
      transactionDate: new Date(),
      description: "Test description",
      category: "Test category",
      amount: 100,
      transactionState: "outstanding",
      transactionType: "undefined",
      activeStatus: true,
      reoccurringType: "onetime",
      notes: "Test notes",
      dueDate: "2025-03-05",
    };

    server.use(
      http.delete(
        `https://finance.bhenning.com/api/transaction/delete/${mockTransaction.guid}`,
        () => new HttpResponse(null, { status: 204 }),
      ),
    );

    // Set initial cache data
    queryClient.setQueryData(
      ["accounts", mockTransaction.accountNameOwner],
      [mockTransaction],
    );

    // Render the hook
    const { result } = renderHook(() => useTransactionDelete(), {
      wrapper: createWrapper(queryClient),
    });

    // Execute the mutation
    result.current.mutate({ oldRow: mockTransaction });

    // Wait for the mutation to complete
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Verify that the transaction was removed from the cache
    const updatedTransactions = queryClient.getQueryData<Transaction[]>([
      "accounts",
      mockTransaction.accountNameOwner,
    ]);
    expect(updatedTransactions).toEqual([]);
  });

  it("should handle API errors correctly", async () => {
    const queryClient = createTestQueryClient();

    const mockTransaction: Transaction = {
      transactionId: 1,
      guid: "dummy-guid",
      accountId: 100,
      accountType: "credit",
      accountNameOwner: "ownerTest",
      transactionDate: new Date(),
      description: "Test description",
      category: "Test category",
      amount: 100,
      transactionState: "outstanding",
      transactionType: "expense",
      activeStatus: true,
      reoccurringType: "onetime",
      notes: "Test notes",
      dueDate: "2025-03-05",
    };

    // Mock an API error
    server.use(
      http.delete(
        `https://finance.bhenning.com/api/transaction/delete/${mockTransaction.guid}`,
        () =>
          HttpResponse.json(
            { response: "Cannot delete this transaction" },
            { status: 400 },
          ),
      ),
    );

    // Render the hook
    const { result } = renderHook(() => useTransactionDelete(), {
      wrapper: createWrapper(queryClient),
    });

    // Spy on console.log
    const consoleSpy = jest.spyOn(console, "log");

    // Execute the mutation
    result.current.mutate({ oldRow: mockTransaction });

    // Wait for the mutation to fail
    await waitFor(() => expect(result.current.isError).toBe(true));

    // Verify error was logged
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("Cannot delete this transaction"),
    );

    consoleSpy.mockRestore();
  });

  it("should handle network errors correctly", async () => {
    const queryClient = createTestQueryClient();

    const mockTransaction: Transaction = {
      transactionId: 1,
      guid: "dummy-guid",
      accountId: 100,
      accountType: "credit",
      accountNameOwner: "ownerTest",
      transactionDate: new Date(),
      description: "Test description",
      category: "Test category",
      amount: 100,
      transactionState: "outstanding",
      transactionType: "expense",
      activeStatus: true,
      reoccurringType: "onetime",
      notes: "Test notes",
      dueDate: "2025-03-05",
    };

    // Mock a network error
    server.use(
      http.delete(
        `https://finance.bhenning.com/api/transaction/delete/${mockTransaction.guid}`,
        () => HttpResponse.json({ message: "Network error" }, { status: 500 }),
      ),
    );

    // Render the hook
    const { result } = renderHook(() => useTransactionDelete(), {
      wrapper: createWrapper(queryClient),
    });

    // Spy on console.log
    const consoleSpy = jest.spyOn(console, "log");

    // Execute the mutation
    result.current.mutate({ oldRow: mockTransaction });

    // Wait for the mutation to fail
    await waitFor(() => expect(result.current.isError).toBe(true));

    // Verify error was logged
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });
});
