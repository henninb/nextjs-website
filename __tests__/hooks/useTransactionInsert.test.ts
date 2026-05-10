import React from "react";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Transaction from "../../model/Transaction";
import Totals from "../../model/Totals";
import {
  createFetchMock,
  createErrorFetchMock,
  createTestTransaction,
  simulateNetworkError,
  createMockValidationUtils,
} from "../../testHelpers";
import { validateInsert } from "../../utils/hookValidation";

// Mock validation utilities
// Mock HookValidator

// Mock CSRF utilities
jest.mock("../../utils/csrf", () => ({
  getCsrfHeaders: jest.fn().mockResolvedValue({}),
  getCsrfToken: jest.fn().mockResolvedValue(null),
  fetchCsrfToken: jest.fn().mockResolvedValue(undefined),
  clearCsrfToken: jest.fn(),
  initCsrfToken: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("../../utils/hookValidation", () => ({
  validateInsert: jest.fn((data) => data),
  validateUpdate: jest.fn((newData) => newData),
  validateDelete: jest.fn(),
  HookValidationError: class HookValidationError extends Error {
    constructor(message: string) {
      super(message);
      this.name = "HookValidationError";
    }
  },
}));

// Mock logger
jest.mock("../../utils/logger", () => ({
  createHookLogger: jest.fn(() => ({
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  })),
  logger: { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

jest.mock("../../utils/validation", () => ({
  DataValidator: {
    validateTransaction: jest.fn(),
  },
  hookValidators: {
    validateApiPayload: jest.fn(),
  },
  ValidationError: jest.fn(),
}));

// Mock secure UUID generation
jest.mock("../../utils/security/secureUUID", () => ({
  generateSecureUUID: jest.fn(),
}));

import useTransactionInsert, {
  setupNewTransaction,
  insertTransaction,
  TransactionInsertType,
} from "../../hooks/useTransactionInsert";
import { DataValidator } from "../../utils/validation";
import { generateSecureUUID } from "../../utils/security/secureUUID";

// Mock the useAuth hook
jest.mock("../../components/AuthProvider", () => ({
  useAuth: jest.fn(() => ({
    isAuthenticated: true,
    loading: false,
    user: { username: "testuser" },
    login: jest.fn(),
    logout: jest.fn(),
  })),
}));

describe("Transaction Insert Functions", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  const mockTransaction = createTestTransaction({
    guid: "",
    accountNameOwner: "test_account",
    transactionDate: new Date("2024-01-01"),
    description: "Test Transaction",
    amount: 100.5,
    category: "groceries",
    transactionType: "expense",
    transactionState: "cleared",
    activeStatus: true,
    accountType: "debit",
    reoccurringType: "onetime",
    notes: "Test notes",
  });

  const mockValidateInsert = validateInsert as jest.Mock;
  const mockGenerateSecureUUID = generateSecureUUID as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default mocks
    mockGenerateSecureUUID.mockResolvedValue("test-uuid-123");
    mockValidateInsert.mockImplementation((data: Transaction) => data);
  });

  afterEach(() => {});

  describe("Helper functions", () => {
    describe("setupNewTransaction", () => {
      it("should setup transaction with generated UUID", async () => {
        mockGenerateSecureUUID.mockResolvedValue("secure-uuid-456");

        const inputTransaction = createTestTransaction({
          transactionDate: new Date("2024-02-01"),
          description: "Setup Test",
          amount: 250.0,
          category: "test",
          notes: "Setup notes",
          transactionType: "income",
          transactionState: "cleared",
          accountType: "credit",
          reoccurringType: "monthly",
        });

        const result = await setupNewTransaction(
          inputTransaction,
          "setup_account",
        );

        expect(result).toStrictEqual({
          guid: "secure-uuid-456",
          transactionDate: new Date("2024-02-01"),
          description: "Setup Test",
          category: "test",
          notes: "Setup notes",
          amount: 250.0,
          dueDate: "2024-12-31", // From createTestTransaction default
          transactionType: "income",
          transactionState: "cleared",
          activeStatus: true,
          accountType: "credit",
          reoccurringType: "monthly",
          accountNameOwner: inputTransaction.accountNameOwner,
        });
      });

      it("should handle missing optional fields with defaults", async () => {
        mockGenerateSecureUUID.mockResolvedValue("default-uuid-789");

        const minimalTransaction = createTestTransaction({
          transactionDate: new Date("2024-03-01"),
          description: "Minimal Test",
          amount: 75.0,
          category: undefined, // Override default
          dueDate: undefined, // Override default
        });

        const result = await setupNewTransaction(
          minimalTransaction,
          "minimal_account",
        );

        expect(result).toStrictEqual({
          guid: "default-uuid-789",
          transactionDate: new Date("2024-03-01"),
          description: "Minimal Test",
          category: "",
          notes: "",
          amount: 75.0,
          transactionType: minimalTransaction.transactionType || "undefined",
          transactionState: "outstanding",
          activeStatus: true,
          accountType: minimalTransaction.accountType || "debit",
          reoccurringType: "onetime",
          accountNameOwner: minimalTransaction.accountNameOwner,
        });
      });

      it("should handle UUID generation errors", async () => {
        mockGenerateSecureUUID.mockRejectedValue(
          new Error("UUID generation failed"),
        );

        await expect(
          setupNewTransaction(mockTransaction, "test_account"),
        ).rejects.toThrow("UUID generation failed");
      });
    });
  });

  describe("insertTransaction function", () => {
    describe("Successful insertion", () => {
      it("should insert regular transaction successfully", async () => {
        const mockResponse = createTestTransaction({
          guid: "test-uuid-123",
          accountNameOwner: "test_account",
          amount: 100.5,
          transactionState: "cleared",
        });

        global.fetch = createFetchMock(mockResponse);

        const result = await insertTransaction(
          "test_account",
          mockTransaction,
          false,
          false,
        );

        expect(result).toStrictEqual(mockResponse);
        expect(global.fetch).toHaveBeenCalledWith(
          "/api/transaction",
          expect.objectContaining({
            method: "POST",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify({
              guid: "test-uuid-123",
              transactionDate: mockTransaction.transactionDate,
              description: mockTransaction.description,
              category: mockTransaction.category,
              notes: mockTransaction.notes,
              amount: mockTransaction.amount,
              transactionType: mockTransaction.transactionType,
              transactionState: mockTransaction.transactionState,
              activeStatus: true,
              accountType: mockTransaction.accountType,
              reoccurringType: mockTransaction.reoccurringType,
              accountNameOwner: mockTransaction.accountNameOwner,
              dueDate: mockTransaction.dueDate, // dueDate is added at the end by setupNewTransaction
            }),
          }),
        );
      });

      it("should insert future transaction with correct endpoint", async () => {
        const futureTransaction = createTestTransaction({
          transactionDate: new Date("2025-01-01"),
          description: "Future Transaction",
          amount: 200.0,
          transactionState: "future",
        });

        const mockResponse = createTestTransaction({
          guid: "future-uuid-123",
          transactionState: "future",
        });

        global.fetch = createFetchMock(mockResponse);

        const result = await insertTransaction(
          "test_account",
          futureTransaction,
          true,
          false,
        );

        expect(result).toStrictEqual(mockResponse);
        expect(global.fetch).toHaveBeenCalledWith(
          "/api/transaction/future",
          expect.any(Object),
        );
      });

      it("should handle 204 no content response", async () => {
        global.fetch = createFetchMock(null, { status: 204 });

        const result = await insertTransaction(
          "test_account",
          mockTransaction,
          false,
          false,
        );

        expect(result).toBeNull();
      });

      it("should use validated data from validation", async () => {
        const validatedTransaction = createTestTransaction({
          ...mockTransaction,
          description: "Sanitized Description",
        });
        mockValidateInsert.mockImplementation(() => validatedTransaction);

        global.fetch = createFetchMock(validatedTransaction);

        await insertTransaction("test_account", mockTransaction, false, false);

        const expectedPayload = await setupNewTransaction(
          validatedTransaction,
          "test_account",
        );
        expect(global.fetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            body: JSON.stringify(expectedPayload),
          }),
        );
      });
    });

    describe("Validation handling", () => {
      it("should handle validation failures", async () => {
        const validationError = { message: "Transaction date is required" };

        mockValidateInsert.mockImplementation(() => {
          throw new Error(validationError.message);
        });

        await expect(
          insertTransaction("test_account", mockTransaction, false, false),
        ).rejects.toThrow("Transaction date is required");

        expect(global.fetch).not.toHaveBeenCalled();
      });

      it("should handle validation failures with multiple errors", async () => {
        const validationErrors = [
          { message: "Transaction date is required" },
          { message: "Amount must be a number" },
        ];

        mockValidateInsert.mockImplementation(() => {
          throw new Error(
            "Transaction date is required, Amount must be a number",
          );
        });

        await expect(
          insertTransaction("test_account", mockTransaction, false, false),
        ).rejects.toThrow(
          "Transaction date is required, Amount must be a number",
        );
      });

      it("should handle validation failures without error details", async () => {
        mockValidateInsert.mockImplementation(() => {
          throw new Error("Validation failed");
        });
        await expect(
          insertTransaction("test_account", mockTransaction, false, false),
        ).rejects.toThrow("Validation failed");
      });

      it("should call validation with correct parameters", async () => {
        global.fetch = createFetchMock(mockTransaction);

        await insertTransaction("test_account", mockTransaction, false, false);

        expect(mockValidateInsert).toHaveBeenCalledWith(
          mockTransaction,
          DataValidator.validateTransaction,
          "insertTransaction",
        );
      });
    });

    describe("Error handling", () => {
      it("should handle server error with error message", async () => {
        const errorMessage = "Invalid transaction data";
        global.fetch = createErrorFetchMock(errorMessage, 400);

        await expect(
          insertTransaction("test_account", mockTransaction, false, false),
        ).rejects.toThrow(errorMessage);
      });

      it("should handle server error without error message", async () => {
        global.fetch = jest.fn().mockResolvedValueOnce({
          ok: false,
          status: 400,
          json: jest.fn().mockResolvedValueOnce({}),
        });

        await expect(
          insertTransaction("test_account", mockTransaction, false, false),
        ).rejects.toThrow("HTTP 400: undefined");
      });

      it("should handle JSON parsing errors in error response", async () => {
        global.fetch = jest.fn().mockResolvedValueOnce({
          ok: false,
          status: 400,
          json: jest.fn().mockRejectedValueOnce(new Error("Invalid JSON")),
        });

        await expect(
          insertTransaction("test_account", mockTransaction, false, false),
        ).rejects.toThrow("HTTP 400: undefined");
      });

      it("should handle network errors", async () => {
        global.fetch = simulateNetworkError();

        await expect(
          insertTransaction("test_account", mockTransaction, false, false),
        ).rejects.toThrow("Network error");
      });

      it("should handle various HTTP error statuses", async () => {
        const errorStatuses = [400, 401, 403, 409, 422, 500];

        for (const status of errorStatuses) {
          const errorMessage = `Error ${status}`;
          global.fetch = createErrorFetchMock(errorMessage, status);

          await expect(
            insertTransaction("test_account", mockTransaction, false, false),
          ).rejects.toThrow(errorMessage);
        }
      });

      it("should handle UUID generation errors", async () => {
        mockGenerateSecureUUID.mockRejectedValue(
          new Error("UUID generation failed"),
        );

        await expect(
          insertTransaction("test_account", mockTransaction, false, false),
        ).rejects.toThrow("UUID generation failed");
      });
    });

    describe("Request format validation", () => {
      it("should use POST method", async () => {
        global.fetch = createFetchMock(mockTransaction);

        await insertTransaction("test_account", mockTransaction, false, false);

        expect(global.fetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            method: "POST",
          }),
        );
      });

      it("should include credentials", async () => {
        global.fetch = createFetchMock(mockTransaction);

        await insertTransaction("test_account", mockTransaction, false, false);

        expect(global.fetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            credentials: "include",
          }),
        );
      });

      it("should include correct headers", async () => {
        global.fetch = createFetchMock(mockTransaction);

        await insertTransaction("test_account", mockTransaction, false, false);

        expect(global.fetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
          }),
        );
      });

      it("should use correct endpoint for regular transactions", async () => {
        global.fetch = createFetchMock(mockTransaction);

        await insertTransaction("test_account", mockTransaction, false, false);

        expect(global.fetch).toHaveBeenCalledWith(
          "/api/transaction",
          expect.any(Object),
        );
      });

      it("should use correct endpoint for future transactions", async () => {
        global.fetch = createFetchMock(mockTransaction);

        await insertTransaction("test_account", mockTransaction, true, false);

        expect(global.fetch).toHaveBeenCalledWith(
          "/api/transaction/future",
          expect.any(Object),
        );
      });
    });

    describe("Response handling", () => {
      it("should return parsed JSON response", async () => {
        const responseData = createTestTransaction({
          guid: "response-uuid",
          description: "Response Transaction",
          amount: 300.0,
        });
        global.fetch = createFetchMock(responseData);

        const result = await insertTransaction(
          "test_account",
          mockTransaction,
          false,
          false,
        );

        expect(result).toStrictEqual(responseData);
      });

      it("should handle empty response body", async () => {
        global.fetch = createFetchMock({});

        const result = await insertTransaction(
          "test_account",
          mockTransaction,
          false,
          false,
        );

        expect(result).toStrictEqual({});
      });

      it("should handle complex response data", async () => {
        const complexResponse = createTestTransaction({
          ...mockTransaction,
          guid: "complex-uuid",
          additionalField: "extra data",
          metadata: { createdBy: "system" },
        });
        global.fetch = createFetchMock(complexResponse);

        const result = await insertTransaction(
          "test_account",
          mockTransaction,
          false,
          false,
        );

        expect(result).toStrictEqual(complexResponse);
      });
    });

    describe("Edge cases", () => {
      it("should handle transaction with minimal data", async () => {
        const minimalTransaction = createTestTransaction({
          transactionDate: new Date("2024-06-01"),
          description: "Minimal",
          amount: 25.0,
        });

        const mockResponse = createTestTransaction({ guid: "minimal-uuid" });
        global.fetch = createFetchMock(mockResponse);

        const result = await insertTransaction(
          "test_account",
          minimalTransaction,
          false,
          false,
        );

        expect(result).toStrictEqual(mockResponse);
      });

      it("should handle transaction with all optional fields", async () => {
        const fullTransaction = createTestTransaction({
          transactionDate: new Date("2024-07-01"),
          description: "Full Transaction",
          amount: 500.0,
          category: "business",
          notes: "Full notes",
          dueDate: new Date("2024-07-15"),
          transactionType: "income",
          transactionState: "cleared",
          accountType: "credit",
          reoccurringType: "monthly",
        });

        const mockResponse = createTestTransaction({ guid: "full-uuid" });
        global.fetch = createFetchMock(mockResponse);

        const result = await insertTransaction(
          "test_account",
          fullTransaction,
          false,
          false,
        );

        expect(result).toStrictEqual(mockResponse);
      });

      it("should handle very large transaction amounts", async () => {
        const largeTransaction = createTestTransaction({
          amount: 999999.99,
          description: "Large Amount",
        });

        const mockResponse = createTestTransaction({ guid: "large-uuid" });
        global.fetch = createFetchMock(mockResponse);

        const result = await insertTransaction(
          "test_account",
          largeTransaction,
          false,
          false,
        );

        expect(result).toStrictEqual(mockResponse);
      });

      it("should handle negative transaction amounts", async () => {
        const negativeTransaction = createTestTransaction({
          amount: -150.0,
          description: "Refund",
        });

        const mockResponse = createTestTransaction({ guid: "negative-uuid" });
        global.fetch = createFetchMock(mockResponse);

        const result = await insertTransaction(
          "test_account",
          negativeTransaction,
          false,
          false,
        );

        expect(result).toStrictEqual(mockResponse);
      });

      it("should handle special characters in transaction data", async () => {
        const specialTransaction = createTestTransaction({
          description: "Transaction & Notes (Special)",
          category: "food & dining",
          notes: "Notes with 'quotes' and symbols @#$",
        });

        const mockResponse = createTestTransaction({ guid: "special-uuid" });
        global.fetch = createFetchMock(mockResponse);

        const result = await insertTransaction(
          "test_account",
          specialTransaction,
          false,
          false,
        );

        expect(result).toStrictEqual(mockResponse);
      });
    });

    describe("Business logic validation", () => {
      it("should enforce validation before UUID generation and API call", async () => {
        const mockResponse = createTestTransaction({ guid: "business-uuid" });
        global.fetch = createFetchMock(mockResponse);

        await insertTransaction("test_account", mockTransaction, false, false);

        expect(mockValidateInsert).toHaveBeenCalled();
        expect(mockGenerateSecureUUID).toHaveBeenCalled();
        expect(global.fetch).toHaveBeenCalled();
      });

      it("should use setupNewTransaction to prepare data correctly", async () => {
        const originalTransaction = createTestTransaction({
          guid: "should-be-overridden",
          transactionDate: new Date("2024-08-01"),
          description: "Original Description",
          amount: 75.0,
          activeStatus: false, // Should be overridden to true
        });

        mockGenerateSecureUUID.mockResolvedValue("new-secure-uuid");
        global.fetch = createFetchMock(originalTransaction);

        await insertTransaction(
          "test_account",
          originalTransaction,
          false,
          false,
        );

        const expectedPayload = {
          guid: "new-secure-uuid", // Should use generated UUID
          transactionDate: new Date("2024-08-01"),
          description: "Original Description",
          category: originalTransaction.category, // Use actual value from createTestTransaction
          notes: originalTransaction.notes || "",
          amount: 75.0,
          transactionType: originalTransaction.transactionType,
          transactionState:
            originalTransaction.transactionState || "outstanding",
          activeStatus: true, // Should be set to true
          accountType: originalTransaction.accountType,
          reoccurringType: originalTransaction.reoccurringType,
          accountNameOwner: originalTransaction.accountNameOwner,
          dueDate: originalTransaction.dueDate, // dueDate is added at the end by setupNewTransaction
        };

        expect(global.fetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            body: JSON.stringify(expectedPayload),
          }),
        );
      });

      it("should differentiate between regular and future transactions", async () => {
        global.fetch = createFetchMock(mockTransaction);

        // Regular transaction
        await insertTransaction("test_account", mockTransaction, false, false);
        expect(global.fetch).toHaveBeenCalledWith(
          "/api/transaction",
          expect.any(Object),
        );

        // Future transaction
        await insertTransaction("test_account", mockTransaction, true, false);
        expect(global.fetch).toHaveBeenCalledWith(
          "/api/transaction/future",
          expect.any(Object),
        );
      });
    });
  });
});

// ---------------------------------------------------------------------------
// renderHook tests for useTransactionInsert default export
// ---------------------------------------------------------------------------

const createHookQueryClient = () =>
  new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

const createHookWrapper = (queryClient: QueryClient) =>
  function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  };

const makeInsertTx = (overrides: Partial<Transaction> = {}): Transaction =>
  createTestTransaction({
    guid: "insert-guid-123",
    accountNameOwner: "checking",
    amount: 100,
    transactionState: "cleared",
    ...overrides,
  }) as Transaction;

const makeInitialTotals = (overrides: Partial<Totals> = {}): Totals => ({
  totals: 500,
  totalsCleared: 200,
  totalsOutstanding: 150,
  totalsFuture: 150,
  ...overrides,
});

describe("useTransactionInsert hook - renderHook tests", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
    (generateSecureUUID as jest.Mock).mockResolvedValue("hook-test-uuid");
    (validateInsert as jest.Mock).mockImplementation((data: Transaction) => data);
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("onSuccess for cleared transaction: adds amount to totals and totalsCleared", async () => {
    const queryClient = createHookQueryClient();
    const response = makeInsertTx({ transactionState: "cleared", amount: 75, accountNameOwner: "checking" });
    queryClient.setQueryData(["totals", "checking"], makeInitialTotals());
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue(response),
    });

    const { result } = renderHook(() => useTransactionInsert(), {
      wrapper: createHookWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync({
        accountNameOwner: "checking",
        newRow: makeInsertTx({ transactionState: "cleared", amount: 75 }),
        isFutureTransaction: false,
        isImportTransaction: false,
      });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const updated = queryClient.getQueryData<Totals>(["totals", "checking"]);
    expect(updated?.totals).toBe(575);
    expect(updated?.totalsCleared).toBe(275);
    expect(updated?.totalsOutstanding).toBe(150);
    expect(updated?.totalsFuture).toBe(150);
  });

  it("onSuccess for outstanding transaction: adds amount to totalsOutstanding", async () => {
    const queryClient = createHookQueryClient();
    const response = makeInsertTx({ transactionState: "outstanding", amount: 50, accountNameOwner: "checking" });
    queryClient.setQueryData(["totals", "checking"], makeInitialTotals());
    global.fetch = jest.fn().mockResolvedValue({
      ok: true, status: 200,
      json: jest.fn().mockResolvedValue(response),
    });

    const { result } = renderHook(() => useTransactionInsert(), {
      wrapper: createHookWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync({
        accountNameOwner: "checking",
        newRow: makeInsertTx({ transactionState: "outstanding", amount: 50 }),
        isFutureTransaction: false,
        isImportTransaction: false,
      });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const updated = queryClient.getQueryData<Totals>(["totals", "checking"]);
    expect(updated?.totals).toBe(550);
    expect(updated?.totalsCleared).toBe(200);
    expect(updated?.totalsOutstanding).toBe(200);
    expect(updated?.totalsFuture).toBe(150);
  });

  it("onSuccess for future transaction: adds amount to totalsFuture", async () => {
    const queryClient = createHookQueryClient();
    const response = makeInsertTx({ transactionState: "future", amount: 40, accountNameOwner: "checking" });
    queryClient.setQueryData(["totals", "checking"], makeInitialTotals());
    global.fetch = jest.fn().mockResolvedValue({
      ok: true, status: 200,
      json: jest.fn().mockResolvedValue(response),
    });

    const { result } = renderHook(() => useTransactionInsert(), {
      wrapper: createHookWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync({
        accountNameOwner: "checking",
        newRow: makeInsertTx({ transactionState: "future", amount: 40 }),
        isFutureTransaction: true,
        isImportTransaction: false,
      });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const updated = queryClient.getQueryData<Totals>(["totals", "checking"]);
    expect(updated?.totals).toBe(540);
    expect(updated?.totalsCleared).toBe(200);
    expect(updated?.totalsOutstanding).toBe(150);
    expect(updated?.totalsFuture).toBe(190);
  });

  it("onSuccess skips cache update for import transactions", async () => {
    const queryClient = createHookQueryClient();
    const response = makeInsertTx({ transactionState: "cleared", amount: 100, accountNameOwner: "checking" });
    queryClient.setQueryData(["totals", "checking"], makeInitialTotals());
    global.fetch = jest.fn().mockResolvedValue({
      ok: true, status: 200,
      json: jest.fn().mockResolvedValue(response),
    });

    const { result } = renderHook(() => useTransactionInsert(), {
      wrapper: createHookWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync({
        accountNameOwner: "checking",
        newRow: makeInsertTx({ transactionState: "cleared", amount: 100 }),
        isFutureTransaction: false,
        isImportTransaction: true,
      });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const updated = queryClient.getQueryData<Totals>(["totals", "checking"]);
    expect(updated?.totals).toBe(500);
    expect(updated?.totalsCleared).toBe(200);
  });

  it("onSuccess with unknown transactionState: adds to totals but not state buckets", async () => {
    const queryClient = createHookQueryClient();
    const response = makeInsertTx({ transactionState: "undefined" as any, amount: 20, accountNameOwner: "checking" });
    queryClient.setQueryData(["totals", "checking"], makeInitialTotals());
    global.fetch = jest.fn().mockResolvedValue({
      ok: true, status: 200,
      json: jest.fn().mockResolvedValue(response),
    });

    const { result } = renderHook(() => useTransactionInsert(), {
      wrapper: createHookWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync({
        accountNameOwner: "checking",
        newRow: makeInsertTx({ transactionState: "undefined" as any, amount: 20 }),
        isFutureTransaction: false,
        isImportTransaction: false,
      });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const updated = queryClient.getQueryData<Totals>(["totals", "checking"]);
    expect(updated?.totals).toBe(520);
    expect(updated?.totalsCleared).toBe(200);
    expect(updated?.totalsOutstanding).toBe(150);
    expect(updated?.totalsFuture).toBe(150);
  });

  it("onSuccess invalidates transaction paged and exact queries", async () => {
    const queryClient = createHookQueryClient();
    const response = makeInsertTx({ transactionState: "cleared", amount: 50, accountNameOwner: "checking" });
    queryClient.setQueryData(["totals", "checking"], makeInitialTotals());
    const invalidateSpy = jest.spyOn(queryClient, "invalidateQueries");
    global.fetch = jest.fn().mockResolvedValue({
      ok: true, status: 200,
      json: jest.fn().mockResolvedValue(response),
    });

    const { result } = renderHook(() => useTransactionInsert(), {
      wrapper: createHookWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync({
        accountNameOwner: "checking",
        newRow: makeInsertTx({ transactionState: "cleared", amount: 50 }),
        isFutureTransaction: false,
        isImportTransaction: false,
      });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["transaction", "checking", "paged"] }),
    );
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["transaction", "checking"], exact: true }),
    );
  });

  it("onError puts mutation into error state", async () => {
    const queryClient = createHookQueryClient();
    global.fetch = jest.fn().mockResolvedValue({
      ok: false, status: 400,
      json: jest.fn().mockResolvedValue({ response: "Insert failed" }),
    });

    const { result } = renderHook(() => useTransactionInsert(), {
      wrapper: createHookWrapper(queryClient),
    });

    await act(async () => {
      try {
        await result.current.mutateAsync({
          accountNameOwner: "checking",
          newRow: makeInsertTx(),
          isFutureTransaction: false,
          isImportTransaction: false,
        });
      } catch {
        // expected
      }
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
