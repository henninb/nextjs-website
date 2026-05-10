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
} from "../../testHelpers";
import useTransactionUpdate, { updateTransaction } from "../../hooks/useTransactionUpdate";
import { validateUpdate } from "../../utils/hookValidation";

// Mock the useAuth hook

// Mock CSRF utilities
jest.mock("../../utils/csrf", () => ({
  getCsrfHeaders: jest.fn().mockResolvedValue({}),
  getCsrfToken: jest.fn().mockResolvedValue(null),
  fetchCsrfToken: jest.fn().mockResolvedValue(undefined),
  clearCsrfToken: jest.fn(),
  initCsrfToken: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("../../components/AuthProvider", () => ({
  useAuth: () => ({
    isAuthenticated: true,
    loading: false,
    user: null,
    login: jest.fn(),
    logout: jest.fn(),
  }),
}));

jest.mock("../../utils/hookValidation", () => ({
  validateInsert: jest.fn(),
  validateUpdate: jest.fn((newData) => newData),
  validateDelete: jest.fn(),
  HookValidationError: class HookValidationError extends Error {
    constructor(message: string) {
      super(message);
      this.name = "HookValidationError";
    }
  },
}));

jest.mock("../../utils/logger", () => {
  const logger = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
  return {
    createHookLogger: jest.fn(() => logger),
    __mockLogger: logger,
    logger: { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() },
  };
});

jest.mock("../../utils/validation/sanitization", () => ({
  InputSanitizer: {
    sanitizeGuid: jest.fn((value) => value),
  },
}));

const mockValidateUpdate = validateUpdate as jest.Mock;
const { __mockLogger: mockLogger } = jest.requireMock("../../utils/logger") as {
  __mockLogger: {
    debug: jest.Mock;
    info: jest.Mock;
    warn: jest.Mock;
    error: jest.Mock;
  };
};
const { InputSanitizer } = jest.requireMock(
  "../../utils/validation/sanitization",
) as {
  InputSanitizer: { sanitizeGuid: jest.Mock };
};

describe("updateTransaction", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  const oldTransaction = createTestTransaction({
    guid: "old-guid-123",
    accountNameOwner: "checking",
  });
  const newTransaction = createTestTransaction({
    guid: "new-guid-123",
    accountNameOwner: "checking",
    amount: 200,
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockLogger.debug.mockClear();
    mockLogger.error.mockClear();
    mockValidateUpdate.mockImplementation((data: Transaction) => data);
    InputSanitizer.sanitizeGuid.mockImplementation((value) => value);
  });

  it("sends PUT /api/transaction/{guid} with validated payload", async () => {
    const apiResponse = { ...newTransaction, transactionState: "cleared" };
    global.fetch = createFetchMock(apiResponse, { status: 200 });

    const result = await updateTransaction(newTransaction, oldTransaction);

    expect(result).toStrictEqual(apiResponse);
    expect(mockValidateUpdate).toHaveBeenCalledWith(
      newTransaction,
      expect.any(Function),
      "updateTransaction",
    );
    expect(InputSanitizer.sanitizeGuid).toHaveBeenCalledWith(
      oldTransaction.guid,
    );
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/transaction/old-guid-123",
      expect.objectContaining({
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: expect.stringContaining('"amount":200'),
      }),
    );
  });

  it("strips base64 prefix from receipt image before sending", async () => {
    const transactionWithReceipt = createTestTransaction({
      guid: "new-guid-123",
      receiptImage: {
        image: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAA...",
        filename: "receipt.png",
      },
    });
    global.fetch = createFetchMock(transactionWithReceipt, { status: 200 });

    await updateTransaction(transactionWithReceipt, oldTransaction);

    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    expect(body.receiptImage.image).toBe("iVBORw0KGgoAAAANSUhEUgAAA...");
  });

  it("propagates validation errors before calling fetch", async () => {
    mockValidateUpdate.mockImplementation(() => {
      throw new Error("updateTransaction validation failed: amount required");
    });
    const fetchSpy = jest.fn();
    global.fetch = fetchSpy as any;

    await expect(
      updateTransaction(newTransaction, oldTransaction),
    ).rejects.toThrow("updateTransaction validation failed: amount required");
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("handles server errors with message", async () => {
    global.fetch = createErrorFetchMock("Cannot update transaction", 400);

    await expect(
      updateTransaction(newTransaction, oldTransaction),
    ).rejects.toThrow("Cannot update transaction");
  });

  it("handles network failures", async () => {
    global.fetch = simulateNetworkError();

    await expect(
      updateTransaction(newTransaction, oldTransaction),
    ).rejects.toThrow("Network error");
  });
});

// ---------------------------------------------------------------------------
// renderHook tests for useTransactionUpdate default export
// ---------------------------------------------------------------------------

const createHookQueryClient = () =>
  new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

const createHookWrapper = (queryClient: QueryClient) =>
  function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  };

const makeUpdateTx = (overrides: Partial<Transaction> = {}): Transaction =>
  createTestTransaction({
    guid: "upd-guid-123",
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

describe("useTransactionUpdate hook - renderHook tests", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
    InputSanitizer.sanitizeGuid.mockImplementation((v) => v);
    mockValidateUpdate.mockImplementation((data: Transaction) => data);
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue(makeUpdateTx()),
      text: jest.fn().mockResolvedValue(JSON.stringify(makeUpdateTx())),
    });
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("onSuccess same account: amount change for cleared transaction", async () => {
    const queryClient = createHookQueryClient();
    queryClient.setQueryData(["totals", "checking"], makeInitialTotals());

    const { result } = renderHook(() => useTransactionUpdate(), {
      wrapper: createHookWrapper(queryClient),
    });

    const oldRow = makeUpdateTx({ amount: 100, transactionState: "cleared" });
    const newRow = makeUpdateTx({ amount: 150, transactionState: "cleared" });

    await act(async () => {
      await result.current.mutateAsync({ oldRow, newRow });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const updated = queryClient.getQueryData<Totals>(["totals", "checking"]);
    expect(updated?.totals).toBe(550);
    expect(updated?.totalsCleared).toBe(250);
    expect(updated?.totalsOutstanding).toBe(150);
    expect(updated?.totalsFuture).toBe(150);
  });

  it("onSuccess same account: amount change for outstanding transaction", async () => {
    const queryClient = createHookQueryClient();
    queryClient.setQueryData(["totals", "checking"], makeInitialTotals());

    const { result } = renderHook(() => useTransactionUpdate(), {
      wrapper: createHookWrapper(queryClient),
    });

    const oldRow = makeUpdateTx({ amount: 100, transactionState: "outstanding" });
    const newRow = makeUpdateTx({ amount: 80, transactionState: "outstanding" });

    await act(async () => {
      await result.current.mutateAsync({ oldRow, newRow });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const updated = queryClient.getQueryData<Totals>(["totals", "checking"]);
    expect(updated?.totals).toBe(480);
    expect(updated?.totalsCleared).toBe(200);
    expect(updated?.totalsOutstanding).toBe(130);
    expect(updated?.totalsFuture).toBe(150);
  });

  it("onSuccess same account: amount change for future transaction", async () => {
    const queryClient = createHookQueryClient();
    queryClient.setQueryData(["totals", "checking"], makeInitialTotals());

    const { result } = renderHook(() => useTransactionUpdate(), {
      wrapper: createHookWrapper(queryClient),
    });

    const oldRow = makeUpdateTx({ amount: 100, transactionState: "future" });
    const newRow = makeUpdateTx({ amount: 120, transactionState: "future" });

    await act(async () => {
      await result.current.mutateAsync({ oldRow, newRow });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const updated = queryClient.getQueryData<Totals>(["totals", "checking"]);
    expect(updated?.totals).toBe(520);
    expect(updated?.totalsCleared).toBe(200);
    expect(updated?.totalsOutstanding).toBe(150);
    expect(updated?.totalsFuture).toBe(170);
  });

  it("onSuccess same account: state change from outstanding to cleared", async () => {
    const queryClient = createHookQueryClient();
    queryClient.setQueryData(["totals", "checking"], makeInitialTotals());

    const { result } = renderHook(() => useTransactionUpdate(), {
      wrapper: createHookWrapper(queryClient),
    });

    const oldRow = makeUpdateTx({ amount: 100, transactionState: "outstanding" });
    const newRow = makeUpdateTx({ amount: 100, transactionState: "cleared" });

    await act(async () => {
      await result.current.mutateAsync({ oldRow, newRow });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const updated = queryClient.getQueryData<Totals>(["totals", "checking"]);
    expect(updated?.totals).toBe(500);
    expect(updated?.totalsCleared).toBe(300);
    expect(updated?.totalsOutstanding).toBe(50);
    expect(updated?.totalsFuture).toBe(150);
  });

  it("onSuccess same account: state change from cleared to future", async () => {
    const queryClient = createHookQueryClient();
    queryClient.setQueryData(["totals", "checking"], makeInitialTotals());

    const { result } = renderHook(() => useTransactionUpdate(), {
      wrapper: createHookWrapper(queryClient),
    });

    const oldRow = makeUpdateTx({ amount: 50, transactionState: "cleared" });
    const newRow = makeUpdateTx({ amount: 50, transactionState: "future" });

    await act(async () => {
      await result.current.mutateAsync({ oldRow, newRow });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const updated = queryClient.getQueryData<Totals>(["totals", "checking"]);
    expect(updated?.totals).toBe(500);
    expect(updated?.totalsCleared).toBe(150);
    expect(updated?.totalsOutstanding).toBe(150);
    expect(updated?.totalsFuture).toBe(200);
  });

  it("onSuccess same account: no change in amount or state", async () => {
    const queryClient = createHookQueryClient();
    queryClient.setQueryData(["totals", "checking"], makeInitialTotals());

    const { result } = renderHook(() => useTransactionUpdate(), {
      wrapper: createHookWrapper(queryClient),
    });

    const oldRow = makeUpdateTx({ amount: 100, transactionState: "cleared" });
    const newRow = makeUpdateTx({ amount: 100, transactionState: "cleared" });

    await act(async () => {
      await result.current.mutateAsync({ oldRow, newRow });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const updated = queryClient.getQueryData<Totals>(["totals", "checking"]);
    expect(updated?.totals).toBe(500);
    expect(updated?.totalsCleared).toBe(200);
    expect(updated?.totalsOutstanding).toBe(150);
    expect(updated?.totalsFuture).toBe(150);
  });

  it("onSuccess cross-account: deducts cleared amount from old account and invalidates new account totals", async () => {
    const queryClient = createHookQueryClient();
    queryClient.setQueryData(["totals", "checking"], makeInitialTotals());
    const invalidateSpy = jest.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useTransactionUpdate(), {
      wrapper: createHookWrapper(queryClient),
    });

    const oldRow = makeUpdateTx({ amount: 100, transactionState: "cleared", accountNameOwner: "checking" });
    const newRow = makeUpdateTx({ amount: 100, transactionState: "cleared", accountNameOwner: "savings" });

    await act(async () => {
      await result.current.mutateAsync({ oldRow, newRow });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const updatedOld = queryClient.getQueryData<Totals>(["totals", "checking"]);
    expect(updatedOld?.totals).toBe(400);
    expect(updatedOld?.totalsCleared).toBe(100);

    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["totals", "savings"] }),
    );
  });

  it("onSuccess invalidates transaction paged and exact queries", async () => {
    const queryClient = createHookQueryClient();
    queryClient.setQueryData(["totals", "checking"], makeInitialTotals());
    const invalidateSpy = jest.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useTransactionUpdate(), {
      wrapper: createHookWrapper(queryClient),
    });

    const oldRow = makeUpdateTx({ amount: 100, transactionState: "cleared" });
    const newRow = makeUpdateTx({ amount: 100, transactionState: "cleared" });

    await act(async () => {
      await result.current.mutateAsync({ oldRow, newRow });
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
      ok: false,
      status: 400,
      json: jest.fn().mockResolvedValue({ response: "Update failed" }),
      text: jest.fn().mockResolvedValue(JSON.stringify({ response: "Update failed" })),
    });

    const { result } = renderHook(() => useTransactionUpdate(), {
      wrapper: createHookWrapper(queryClient),
    });

    await act(async () => {
      try {
        await result.current.mutateAsync({ oldRow: makeUpdateTx(), newRow: makeUpdateTx({ amount: 200 }) });
      } catch {
        // expected
      }
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it("onSuccess same account: uses default totals when none cached", async () => {
    const queryClient = createHookQueryClient();
    // No totals pre-populated — forces lines 129-132 default fallback

    const { result } = renderHook(() => useTransactionUpdate(), {
      wrapper: createHookWrapper(queryClient),
    });

    const oldRow = makeUpdateTx({ amount: 100, transactionState: "cleared" });
    const newRow = makeUpdateTx({ amount: 100, transactionState: "cleared" });

    await act(async () => {
      await result.current.mutateAsync({ oldRow, newRow });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    // Started from zero totals, no amount/state change → totals stay at 0
    const updated = queryClient.getQueryData<Totals>(["totals", "checking"]);
    expect(updated?.totals).toBe(0);
  });

  it("onSuccess same account: state change from future covers totalsFuture deduction", async () => {
    const queryClient = createHookQueryClient();
    queryClient.setQueryData(["totals", "checking"], makeInitialTotals());

    const { result } = renderHook(() => useTransactionUpdate(), {
      wrapper: createHookWrapper(queryClient),
    });

    // future → cleared: deducts totalsFuture (line 172), adds totalsCleared
    const oldRow = makeUpdateTx({ amount: 50, transactionState: "future" });
    const newRow = makeUpdateTx({ amount: 50, transactionState: "cleared" });

    await act(async () => {
      await result.current.mutateAsync({ oldRow, newRow });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const updated = queryClient.getQueryData<Totals>(["totals", "checking"]);
    expect(updated?.totalsFuture).toBe(100);  // 150 - 50
    expect(updated?.totalsCleared).toBe(250); // 200 + 50
  });

  it("onSuccess same account: state change TO outstanding covers totalsOutstanding addition", async () => {
    const queryClient = createHookQueryClient();
    queryClient.setQueryData(["totals", "checking"], makeInitialTotals());

    const { result } = renderHook(() => useTransactionUpdate(), {
      wrapper: createHookWrapper(queryClient),
    });

    // cleared → outstanding: deducts totalsCleared, adds totalsOutstanding (lines 185-186)
    const oldRow = makeUpdateTx({ amount: 50, transactionState: "cleared" });
    const newRow = makeUpdateTx({ amount: 50, transactionState: "outstanding" });

    await act(async () => {
      await result.current.mutateAsync({ oldRow, newRow });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const updated = queryClient.getQueryData<Totals>(["totals", "checking"]);
    expect(updated?.totalsCleared).toBe(150);     // 200 - 50
    expect(updated?.totalsOutstanding).toBe(200);  // 150 + 50
  });

  it("onSuccess cross-account: uses default totals when none cached", async () => {
    const queryClient = createHookQueryClient();
    // No old account totals cached — forces lines 208-211 default fallback

    const { result } = renderHook(() => useTransactionUpdate(), {
      wrapper: createHookWrapper(queryClient),
    });

    const oldRow = makeUpdateTx({ amount: 100, transactionState: "cleared", accountNameOwner: "checking" });
    const newRow = makeUpdateTx({ amount: 100, transactionState: "cleared", accountNameOwner: "savings" });

    await act(async () => {
      await result.current.mutateAsync({ oldRow, newRow });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const oldAccountTotals = queryClient.getQueryData<Totals>(["totals", "checking"]);
    expect(oldAccountTotals?.totals).toBe(-100); // 0 - 100
  });

  it("onSuccess cross-account: deducts future amount when old state is future", async () => {
    const queryClient = createHookQueryClient();
    queryClient.setQueryData(["totals", "checking"], makeInitialTotals());

    const { result } = renderHook(() => useTransactionUpdate(), {
      wrapper: createHookWrapper(queryClient),
    });

    // Cross-account with old state=future covers line 220
    const oldRow = makeUpdateTx({ amount: 75, transactionState: "future", accountNameOwner: "checking" });
    const newRow = makeUpdateTx({ amount: 75, transactionState: "future", accountNameOwner: "savings" });

    await act(async () => {
      await result.current.mutateAsync({ oldRow, newRow });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const oldAccountTotals = queryClient.getQueryData<Totals>(["totals", "checking"]);
    expect(oldAccountTotals?.totalsFuture).toBe(75);  // 150 - 75
    expect(oldAccountTotals?.totals).toBe(425);       // 500 - 75
  });

  it("onSuccess cross-account: deducts outstanding amount when old state is outstanding", async () => {
    const queryClient = createHookQueryClient();
    queryClient.setQueryData(["totals", "checking"], makeInitialTotals());

    const { result } = renderHook(() => useTransactionUpdate(), {
      wrapper: createHookWrapper(queryClient),
    });

    // Cross-account with old state=outstanding covers lines 224-225
    const oldRow = makeUpdateTx({ amount: 60, transactionState: "outstanding", accountNameOwner: "checking" });
    const newRow = makeUpdateTx({ amount: 60, transactionState: "outstanding", accountNameOwner: "savings" });

    await act(async () => {
      await result.current.mutateAsync({ oldRow, newRow });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const oldAccountTotals = queryClient.getQueryData<Totals>(["totals", "checking"]);
    expect(oldAccountTotals?.totalsOutstanding).toBe(90);  // 150 - 60
    expect(oldAccountTotals?.totals).toBe(440);            // 500 - 60
  });
});
