import React from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import useTransactionStateUpdate from "../../hooks/useTransactionStateUpdate";
import { TransactionState } from "../../model/TransactionState";

jest.mock("../../utils/fetchUtils", () => ({
  fetchWithErrorHandling: jest.fn(),
  parseResponse: jest.fn(),
  FetchError: class FetchError extends Error {
    constructor(
      message: string,
      public status?: number,
    ) {
      super(message);
      this.name = "FetchError";
    }
  },
}));

jest.mock("../../utils/validation/sanitization", () => ({
  InputSanitizer: {
    sanitizeGuid: jest.fn((value: string) => value),
  },
}));

jest.mock("../../utils/cacheUtils", () => ({
  getAccountKey: jest.fn((account: string) => ["account", account]),
  getTotalsKey: jest.fn((account: string) => ["totals", account]),
}));

jest.mock("../../utils/logger", () => ({
  createHookLogger: jest.fn(() => ({
    debug: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
  })),
}));

import { fetchWithErrorHandling, parseResponse } from "../../utils/fetchUtils";
import { InputSanitizer } from "../../utils/validation/sanitization";

const mockFetchWithErrorHandling = fetchWithErrorHandling as jest.MockedFunction<
  typeof fetchWithErrorHandling
>;
const mockParseResponse = parseResponse as jest.MockedFunction<
  typeof parseResponse
>;
const mockSanitizeGuid = InputSanitizer.sanitizeGuid as jest.MockedFunction<
  typeof InputSanitizer.sanitizeGuid
>;

const createTestTransaction = (overrides = {}) => ({
  guid: "test-guid-123",
  transactionDate: new Date("2024-01-01"),
  accountNameOwner: "checking_john",
  accountType: "debit",
  description: "Test transaction",
  category: "groceries",
  amount: 100.0,
  cleared: 1,
  reoccurringType: "onetime",
  notes: "",
  transactionState: "outstanding" as TransactionState,
  activeStatus: true,
  ...overrides,
});

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

const createWrapper = (queryClient: QueryClient) =>
  function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(
      QueryClientProvider,
      { client: queryClient },
      children as React.ReactNode,
    );
  };

describe("useTransactionStateUpdate hook", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSanitizeGuid.mockImplementation((v: string) => v);
  });

  describe("state transitions", () => {
    it("should update transaction state to cleared", async () => {
      const queryClient = createTestQueryClient();
      const transaction = createTestTransaction({ transactionState: "cleared" });
      mockFetchWithErrorHandling.mockResolvedValue({ status: 200 } as Response);
      mockParseResponse.mockResolvedValue(transaction);

      const { result } = renderHook(
        () => useTransactionStateUpdate("checking_john"),
        { wrapper: createWrapper(queryClient) },
      );

      await result.current.mutateAsync({
        guid: "test-guid-123",
        transactionState: "cleared" as TransactionState,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockFetchWithErrorHandling).toHaveBeenCalledWith(
        "/api/transaction/state/update/test-guid-123/cleared",
        expect.objectContaining({ method: "PUT" }),
      );
    });

    it("should update transaction state to outstanding", async () => {
      const queryClient = createTestQueryClient();
      const transaction = createTestTransaction({
        transactionState: "outstanding",
      });
      mockFetchWithErrorHandling.mockResolvedValue({ status: 200 } as Response);
      mockParseResponse.mockResolvedValue(transaction);

      const { result } = renderHook(
        () => useTransactionStateUpdate("checking_john"),
        { wrapper: createWrapper(queryClient) },
      );

      await result.current.mutateAsync({
        guid: "test-guid-456",
        transactionState: "outstanding" as TransactionState,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockFetchWithErrorHandling).toHaveBeenCalledWith(
        "/api/transaction/state/update/test-guid-456/outstanding",
        expect.any(Object),
      );
    });

    it("should update transaction state to future", async () => {
      const queryClient = createTestQueryClient();
      const transaction = createTestTransaction({ transactionState: "future" });
      mockFetchWithErrorHandling.mockResolvedValue({ status: 200 } as Response);
      mockParseResponse.mockResolvedValue(transaction);

      const { result } = renderHook(
        () => useTransactionStateUpdate("checking_john"),
        { wrapper: createWrapper(queryClient) },
      );

      await result.current.mutateAsync({
        guid: "test-guid-789",
        transactionState: "future" as TransactionState,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
    });

    it("should update transaction state to pending", async () => {
      const queryClient = createTestQueryClient();
      const transaction = createTestTransaction({ transactionState: "pending" });
      mockFetchWithErrorHandling.mockResolvedValue({ status: 200 } as Response);
      mockParseResponse.mockResolvedValue(transaction);

      const { result } = renderHook(
        () => useTransactionStateUpdate("savings_john"),
        { wrapper: createWrapper(queryClient) },
      );

      await result.current.mutateAsync({
        guid: "test-guid-abc",
        transactionState: "pending" as TransactionState,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
    });
  });

  describe("cache updates", () => {
    it("should update the transaction in cache after success", async () => {
      const queryClient = createTestQueryClient();
      const accountKey = ["account", "checking_john"];

      const existingTransactions = [
        createTestTransaction({ guid: "test-guid-123", transactionState: "outstanding" }),
        createTestTransaction({ guid: "other-guid", transactionState: "cleared" }),
      ];
      queryClient.setQueryData(accountKey, existingTransactions);

      const updatedTransaction = createTestTransaction({
        guid: "test-guid-123",
        transactionState: "cleared",
      });
      mockFetchWithErrorHandling.mockResolvedValue({ status: 200 } as Response);
      mockParseResponse.mockResolvedValue(updatedTransaction);

      const { result } = renderHook(
        () => useTransactionStateUpdate("checking_john"),
        { wrapper: createWrapper(queryClient) },
      );

      await result.current.mutateAsync({
        guid: "test-guid-123",
        transactionState: "cleared" as TransactionState,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      const cachedData = queryClient.getQueryData<typeof existingTransactions>(accountKey);
      const updatedInCache = cachedData?.find((t) => t.guid === "test-guid-123");
      expect(updatedInCache?.transactionState).toBe("cleared");
    });

    it("should not affect other transactions in cache", async () => {
      const queryClient = createTestQueryClient();
      const accountKey = ["account", "checking_john"];

      const existingTransactions = [
        createTestTransaction({ guid: "target-guid", transactionState: "outstanding" }),
        createTestTransaction({ guid: "other-guid", transactionState: "cleared" }),
      ];
      queryClient.setQueryData(accountKey, existingTransactions);

      const updatedTransaction = createTestTransaction({
        guid: "target-guid",
        transactionState: "future",
      });
      mockFetchWithErrorHandling.mockResolvedValue({ status: 200 } as Response);
      mockParseResponse.mockResolvedValue(updatedTransaction);

      const { result } = renderHook(
        () => useTransactionStateUpdate("checking_john"),
        { wrapper: createWrapper(queryClient) },
      );

      await result.current.mutateAsync({
        guid: "target-guid",
        transactionState: "future" as TransactionState,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      const cachedData = queryClient.getQueryData<typeof existingTransactions>(accountKey);
      const otherTx = cachedData?.find((t) => t.guid === "other-guid");
      expect(otherTx?.transactionState).toBe("cleared");
    });
  });

  describe("GUID sanitization", () => {
    it("should sanitize the GUID before building endpoint", async () => {
      const queryClient = createTestQueryClient();
      const transaction = createTestTransaction();
      mockFetchWithErrorHandling.mockResolvedValue({ status: 200 } as Response);
      mockParseResponse.mockResolvedValue(transaction);

      const { result } = renderHook(
        () => useTransactionStateUpdate("checking_john"),
        { wrapper: createWrapper(queryClient) },
      );

      await result.current.mutateAsync({
        guid: "some-guid",
        transactionState: "cleared" as TransactionState,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockSanitizeGuid).toHaveBeenCalledWith("some-guid");
    });
  });

  describe("error handling", () => {
    it("should handle fetch errors", async () => {
      const queryClient = createTestQueryClient();
      const { FetchError } = jest.requireMock("../../utils/fetchUtils");
      mockFetchWithErrorHandling.mockRejectedValue(
        new FetchError("Transaction not found", 404),
      );

      const { result } = renderHook(
        () => useTransactionStateUpdate("checking_john"),
        { wrapper: createWrapper(queryClient) },
      );

      await expect(
        result.current.mutateAsync({
          guid: "nonexistent-guid",
          transactionState: "cleared" as TransactionState,
        }),
      ).rejects.toThrow("Transaction not found");

      await waitFor(() => expect(result.current.isError).toBe(true));
    });

    it("should handle network errors", async () => {
      const queryClient = createTestQueryClient();
      mockFetchWithErrorHandling.mockRejectedValue(new Error("Network request failed"));

      const { result } = renderHook(
        () => useTransactionStateUpdate("checking_john"),
        { wrapper: createWrapper(queryClient) },
      );

      await expect(
        result.current.mutateAsync({
          guid: "test-guid",
          transactionState: "cleared" as TransactionState,
        }),
      ).rejects.toThrow("Network request failed");

      await waitFor(() => expect(result.current.isError).toBe(true));
    });
  });

  describe("request format", () => {
    it("should send PUT request with empty body", async () => {
      const queryClient = createTestQueryClient();
      const transaction = createTestTransaction();
      mockFetchWithErrorHandling.mockResolvedValue({ status: 200 } as Response);
      mockParseResponse.mockResolvedValue(transaction);

      const { result } = renderHook(
        () => useTransactionStateUpdate("checking_john"),
        { wrapper: createWrapper(queryClient) },
      );

      await result.current.mutateAsync({
        guid: "test-guid-123",
        transactionState: "cleared" as TransactionState,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      const [, options] = mockFetchWithErrorHandling.mock.calls[0];
      expect(options?.method).toBe("PUT");
      expect(options?.body).toBe(JSON.stringify({}));
    });
  });
});
