import React from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import useTransactionInsert from "../../hooks/useTransactionInsert";
import Transaction from "../../model/Transaction";
import * as secureUUID from "../../utils/security/secureUUID";

// Mock dependencies
jest.mock("../../utils/security/secureUUID", () => ({
  generateSecureUUID: jest.fn(),
}));

jest.mock("../../utils/validation", () => ({
  DataValidator: {
    validateTransaction: jest.fn(),
  },
  hookValidators: {
    validateApiPayload: jest.fn(),
  },
  ValidationError: class ValidationError extends Error {},
}));

const mockGenerateSecureUUID = secureUUID.generateSecureUUID as jest.MockedFunction<
  typeof secureUUID.generateSecureUUID
>;

// Mock fetch globally
global.fetch = jest.fn();

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
    logger: {
      log: console.log,
      warn: console.warn,
      error: () => {}, // Suppress error logs in tests
    },
  });

const createWrapper =
  (queryClient: QueryClient) =>
  ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

describe("useTransactionInsert", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    jest.clearAllMocks();
    queryClient = createTestQueryClient();
    mockGenerateSecureUUID.mockResolvedValue("test-uuid-123");
    
    // Mock validation success by default
    const { hookValidators } = require("../../utils/validation");
    hookValidators.validateApiPayload.mockReturnValue({
      isValid: true,
      validatedData: {
        transactionDate: new Date("2024-01-01"),
        description: "Test Transaction",
        amount: 100.50,
        category: "groceries",
        notes: "Test notes",
        transactionType: "expense",
        transactionState: "cleared",
        accountNameOwner: "test_account",
        accountType: "debit",
        reoccurringType: "onetime",
        activeStatus: true,
      },
      errors: [],
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("Successful Transaction Insertion", () => {
    it("inserts a regular transaction successfully", async () => {
      const mockResponse = {
        guid: "test-uuid-123",
        accountNameOwner: "test_account",
        transactionDate: new Date("2024-01-01"),
        description: "Test Transaction",
        amount: 100.50,
        category: "groceries",
        transactionType: "expense",
        transactionState: "cleared",
        activeStatus: true,
        accountType: "debit",
        reoccurringType: "onetime",
        notes: "Test notes",
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => useTransactionInsert(), {
        wrapper: createWrapper(queryClient),
      });

      const testTransaction: Transaction = {
        guid: "",
        accountNameOwner: "test_account",
        transactionDate: new Date("2024-01-01"),
        description: "Test Transaction",
        amount: 100.50,
        category: "groceries",
        transactionType: "expense",
        transactionState: "cleared",
        activeStatus: true,
        accountType: "debit",
        reoccurringType: "onetime",
        notes: "Test notes",
      };

      result.current.mutate({
        accountNameOwner: "test_account",
        newRow: testTransaction,
        isFutureTransaction: false,
        isImportTransaction: false,
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(fetch).toHaveBeenCalledWith("/api/transaction/insert", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          guid: "test-uuid-123",
          transactionDate: testTransaction.transactionDate,
          description: testTransaction.description,
          category: "groceries",
          notes: "Test notes",
          amount: testTransaction.amount,
          dueDate: undefined,
          transactionType: "expense",
          transactionState: "cleared",
          activeStatus: true,
          accountType: "debit",
          reoccurringType: "onetime",
          accountNameOwner: "test_account",
        }),
      });
    });

    it("inserts a future transaction successfully", async () => {
      const mockResponse = {
        guid: "future-uuid-123",
        accountNameOwner: "test_account",
        transactionDate: new Date("2025-01-01"),
        description: "Future Transaction",
        amount: 200.00,
        transactionState: "future",
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => useTransactionInsert(), {
        wrapper: createWrapper(queryClient),
      });

      const futureTransaction: Transaction = {
        guid: "",
        accountNameOwner: "test_account",
        transactionDate: new Date("2025-01-01"),
        description: "Future Transaction",
        amount: 200.00,
        transactionState: "future",
      };

      result.current.mutate({
        accountNameOwner: "test_account",
        newRow: futureTransaction,
        isFutureTransaction: true,
        isImportTransaction: false,
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(fetch).toHaveBeenCalledWith("/api/transaction/future/insert", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: expect.any(String),
      });
    });

    it("updates query cache correctly for non-import transactions", async () => {
      const existingTransactions = [
        { guid: "existing-1", amount: 50.00, accountNameOwner: "test_account" },
        { guid: "existing-2", amount: 75.00, accountNameOwner: "test_account" },
      ];

      const existingTotals = {
        totals: 125.00,
        totalsFuture: 0,
        totalsCleared: 125.00,
        totalsOutstanding: 0,
      };

      // Set initial query data
      queryClient.setQueryData(["accounts", "test_account"], existingTransactions);
      queryClient.setQueryData(["totals", "test_account"], existingTotals);

      const mockResponse = {
        guid: "new-uuid-123",
        accountNameOwner: "test_account",
        amount: 100.50,
        transactionState: "cleared",
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => useTransactionInsert(), {
        wrapper: createWrapper(queryClient),
      });

      result.current.mutate({
        accountNameOwner: "test_account",
        newRow: {} as Transaction,
        isFutureTransaction: false,
        isImportTransaction: false,
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Check that cache was updated
      const updatedTransactions = queryClient.getQueryData(["accounts", "test_account"]);
      expect(updatedTransactions).toEqual([mockResponse, ...existingTransactions]);

      const updatedTotals = queryClient.getQueryData(["totals", "test_account"]);
      expect(updatedTotals).toEqual({
        totals: 225.50,
        totalsFuture: 0,
        totalsCleared: 225.50,
        totalsOutstanding: 0,
      });
    });

    it("handles different transaction states in totals calculation", async () => {
      const existingTotals = {
        totals: 0,
        totalsFuture: 0,
        totalsCleared: 0,
        totalsOutstanding: 0,
      };

      queryClient.setQueryData(["totals", "test_account"], existingTotals);

      // Test outstanding transaction
      const outstandingResponse = {
        guid: "outstanding-uuid",
        accountNameOwner: "test_account",
        amount: 100.00,
        transactionState: "outstanding",
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => outstandingResponse,
      });

      const { result } = renderHook(() => useTransactionInsert(), {
        wrapper: createWrapper(queryClient),
      });

      result.current.mutate({
        accountNameOwner: "test_account",
        newRow: {} as Transaction,
        isFutureTransaction: false,
        isImportTransaction: false,
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      const updatedTotals = queryClient.getQueryData(["totals", "test_account"]);
      expect(updatedTotals).toEqual({
        totals: 100.00,
        totalsFuture: 0,
        totalsCleared: 0,
        totalsOutstanding: 100.00,
      });
    });

    it("does not update cache for import transactions", async () => {
      const existingTransactions = [{ guid: "existing-1" }];
      queryClient.setQueryData(["accounts", "test_account"], existingTransactions);

      const mockResponse = { guid: "import-uuid", accountNameOwner: "test_account" };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => useTransactionInsert(), {
        wrapper: createWrapper(queryClient),
      });

      result.current.mutate({
        accountNameOwner: "test_account",
        newRow: {} as Transaction,
        isFutureTransaction: false,
        isImportTransaction: true, // Import transaction
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Cache should remain unchanged
      const transactions = queryClient.getQueryData(["accounts", "test_account"]);
      expect(transactions).toEqual(existingTransactions);
    });
  });

  describe("Validation", () => {
    it("handles validation errors", async () => {
      const { hookValidators } = require("../../utils/validation");
      hookValidators.validateApiPayload.mockReturnValue({
        isValid: false,
        validatedData: null,
        errors: [
          { message: "Transaction date is required" },
          { message: "Amount must be a number" },
        ],
      });

      const { result } = renderHook(() => useTransactionInsert(), {
        wrapper: createWrapper(queryClient),
      });

      result.current.mutate({
        accountNameOwner: "test_account",
        newRow: {} as Transaction,
        isFutureTransaction: false,
        isImportTransaction: false,
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(
        new Error("Transaction validation failed: Transaction date is required, Amount must be a number")
      );

      // Should not make API call
      expect(fetch).not.toHaveBeenCalled();
    });

    it("handles missing validation errors gracefully", async () => {
      const { hookValidators } = require("../../utils/validation");
      hookValidators.validateApiPayload.mockReturnValue({
        isValid: false,
        validatedData: null,
        errors: null,
      });

      const { result } = renderHook(() => useTransactionInsert(), {
        wrapper: createWrapper(queryClient),
      });

      result.current.mutate({
        accountNameOwner: "test_account",
        newRow: {} as Transaction,
        isFutureTransaction: false,
        isImportTransaction: false,
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(
        new Error("Transaction validation failed: Validation failed")
      );
    });
  });

  describe("Error Handling", () => {
    it("handles API error responses", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          response: "Invalid transaction data",
        }),
      });

      const { result } = renderHook(() => useTransactionInsert(), {
        wrapper: createWrapper(queryClient),
      });

      result.current.mutate({
        accountNameOwner: "test_account",
        newRow: {} as Transaction,
        isFutureTransaction: false,
        isImportTransaction: false,
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(
        new Error("Invalid transaction data")
      );
    });

    it("handles API error without response message", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({}),
      });

      const { result } = renderHook(() => useTransactionInsert(), {
        wrapper: createWrapper(queryClient),
      });

      result.current.mutate({
        accountNameOwner: "test_account",
        newRow: {} as Transaction,
        isFutureTransaction: false,
        isImportTransaction: false,
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(
        new Error("Failed to parse error response: No error message returned.")
      );
    });

    it("handles JSON parsing errors", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => {
          throw new Error("Invalid JSON");
        },
      });

      const { result } = renderHook(() => useTransactionInsert(), {
        wrapper: createWrapper(queryClient),
      });

      result.current.mutate({
        accountNameOwner: "test_account",
        newRow: {} as Transaction,
        isFutureTransaction: false,
        isImportTransaction: false,
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(
        new Error("Failed to parse error response: Invalid JSON")
      );
    });

    it("handles network errors", async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error("Network error")
      );

      const { result } = renderHook(() => useTransactionInsert(), {
        wrapper: createWrapper(queryClient),
      });

      result.current.mutate({
        accountNameOwner: "test_account",
        newRow: {} as Transaction,
        isFutureTransaction: false,
        isImportTransaction: false,
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(new Error("Network error"));
    });

    it("handles UUID generation errors", async () => {
      mockGenerateSecureUUID.mockRejectedValueOnce(new Error("UUID generation failed"));

      const { result } = renderHook(() => useTransactionInsert(), {
        wrapper: createWrapper(queryClient),
      });

      result.current.mutate({
        accountNameOwner: "test_account",
        newRow: {} as Transaction,
        isFutureTransaction: false,
        isImportTransaction: false,
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(new Error("UUID generation failed"));
    });
  });

  describe("Edge Cases", () => {
    it("handles successful response with empty transaction data", async () => {
      const mockResponse = {
        guid: "test-uuid-123",
        accountNameOwner: "test_account",
        transactionDate: new Date("2024-01-01"),
        description: "",
        amount: 0,
        category: "",
        notes: "",
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => useTransactionInsert(), {
        wrapper: createWrapper(queryClient),
      });

      result.current.mutate({
        accountNameOwner: "test_account",
        newRow: {} as Transaction,
        isFutureTransaction: false,
        isImportTransaction: false,
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockResponse);
    });

    it("handles missing optional fields in transaction", async () => {
      const minimalTransaction: Partial<Transaction> = {
        transactionDate: new Date("2024-01-01"),
        description: "Minimal Transaction",
        amount: 50.00,
      };

      const mockResponse = {
        guid: "minimal-uuid",
        accountNameOwner: "test_account",
        transactionDate: new Date("2024-01-01"),
        description: "Minimal Transaction",
        amount: 50.00,
        category: "",
        notes: "",
        transactionType: "undefined",
        transactionState: "outstanding",
        activeStatus: true,
        accountType: "debit",
        reoccurringType: "onetime",
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => useTransactionInsert(), {
        wrapper: createWrapper(queryClient),
      });

      result.current.mutate({
        accountNameOwner: "test_account",
        newRow: minimalTransaction as Transaction,
        isFutureTransaction: false,
        isImportTransaction: false,
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockResponse);
    });

    it("handles unknown transaction state in totals calculation", async () => {
      const existingTotals = { totals: 0, totalsFuture: 0, totalsCleared: 0, totalsOutstanding: 0 };
      queryClient.setQueryData(["totals", "test_account"], existingTotals);

      const mockResponse = {
        guid: "unknown-state-uuid",
        accountNameOwner: "test_account",
        amount: 100.00,
        transactionState: "unknown_state",
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const { result } = renderHook(() => useTransactionInsert(), {
        wrapper: createWrapper(queryClient),
      });

      result.current.mutate({
        accountNameOwner: "test_account",
        newRow: {} as Transaction,
        isFutureTransaction: false,
        isImportTransaction: false,
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Should log error about adjusting totals
      expect(consoleSpy).toHaveBeenCalledWith("cannot adjust totals.");

      // Totals should still update the main total
      const updatedTotals = queryClient.getQueryData(["totals", "test_account"]);
      expect(updatedTotals).toEqual({
        totals: 100.00,
        totalsFuture: 0,
        totalsCleared: 0,
        totalsOutstanding: 0,
      });

      consoleSpy.mockRestore();
    });
  });
});