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
import useTransactionDelete, { deleteTransaction } from "../../hooks/useTransactionDelete";
import { validateDelete } from "../../utils/hookValidation";

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

function createMockLogger() {
  return {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
}

jest.mock("../../utils/hookValidation", () => ({
  validateInsert: jest.fn(),
  validateUpdate: jest.fn(),
  validateDelete: jest.fn(() => ({})),
  HookValidationError: class HookValidationError extends Error {
    constructor(message: string) {
      super(message);
      this.name = "HookValidationError";
    }
  },
}));

jest.mock("../../utils/logger", () => {
  const logger = createMockLogger();
  return {
    createHookLogger: jest.fn(() => logger),
    __mockLogger: logger,
    logger: { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() },
  };
});

jest.mock("../../utils/validation/sanitization", () => ({
  InputSanitizer: {
    sanitizeGuid: jest.fn((value: string) => value),
  },
}));

const mockValidateDelete = validateDelete as jest.Mock;
const { __mockLogger: mockLogger } = jest.requireMock("../../utils/logger") as {
  __mockLogger: ReturnType<typeof createMockLogger>;
};
const { InputSanitizer } = jest.requireMock(
  "../../utils/validation/sanitization",
) as {
  InputSanitizer: { sanitizeGuid: jest.Mock };
};

describe("deleteTransaction", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  const baseTransaction = createTestTransaction({
    guid: "test-guid-123",
    accountNameOwner: "checking",
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockLogger.debug.mockClear();
    mockLogger.error.mockClear();
    mockValidateDelete.mockImplementation(() => ({}));
    InputSanitizer.sanitizeGuid.mockImplementation((value) => value);
  });

  it("calls DELETE /api/transaction/{guid}", async () => {
    global.fetch = createFetchMock(baseTransaction, { status: 200 });

    const result = await deleteTransaction(baseTransaction as Transaction);

    expect(result).toStrictEqual(baseTransaction);
    expect(mockValidateDelete).toHaveBeenCalledWith(
      baseTransaction,
      "guid",
      "deleteTransaction",
    );
    expect(InputSanitizer.sanitizeGuid).toHaveBeenCalledWith(
      baseTransaction.guid,
    );
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/transaction/test-guid-123",
      expect.objectContaining({
        method: "DELETE",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      }),
    );
  });

  it("rejects when validation fails before fetch", async () => {
    mockValidateDelete.mockImplementation(() => {
      throw new Error("deleteTransaction: Invalid guid provided");
    });
    const fetchSpy = jest.fn();
    global.fetch = fetchSpy as any;

    await expect(deleteTransaction(baseTransaction)).rejects.toThrow(
      "deleteTransaction: Invalid guid provided",
    );
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("propagates server errors", async () => {
    global.fetch = createErrorFetchMock("Cannot delete transaction", 400);

    await expect(deleteTransaction(baseTransaction)).rejects.toThrow(
      "Cannot delete transaction",
    );
  });

  it("handles malformed error responses", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: jest.fn().mockRejectedValue(new Error("Invalid JSON")),
    });

    await expect(deleteTransaction(baseTransaction)).rejects.toThrow(
      "HTTP 400: undefined",
    );
  });

  it("handles network failures", async () => {
    global.fetch = simulateNetworkError();

    await expect(deleteTransaction(baseTransaction)).rejects.toThrow(
      "Network error",
    );
  });
});

// ---------------------------------------------------------------------------
// renderHook tests for useTransactionDelete default export
// ---------------------------------------------------------------------------

const createHookQueryClient = () =>
  new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

const createHookWrapper = (queryClient: QueryClient) =>
  function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  };

const makeDeleteTx = (overrides: Partial<Transaction> = {}): Transaction =>
  createTestTransaction({
    guid: "del-guid-123",
    accountNameOwner: "checking",
    amount: 50,
    transactionState: "cleared",
    ...overrides,
  }) as Transaction;

const makeInitialTotals = (overrides: Partial<Totals> = {}): Totals => ({
  totals: 200,
  totalsCleared: 100,
  totalsOutstanding: 60,
  totalsFuture: 40,
  ...overrides,
});

describe("useTransactionDelete hook - renderHook tests", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
    InputSanitizer.sanitizeGuid.mockImplementation((v) => v);
    mockValidateDelete.mockImplementation(() => ({}));
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue(makeDeleteTx()),
      text: jest.fn().mockResolvedValue(JSON.stringify(makeDeleteTx())),
    });
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("onSuccess invalidates transaction paged and exact queries", async () => {
    const queryClient = createHookQueryClient();
    queryClient.setQueryData(["totals", "checking"], makeInitialTotals());
    const invalidateSpy = jest.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useTransactionDelete(), {
      wrapper: createHookWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync({ oldRow: makeDeleteTx({ transactionState: "cleared", amount: 50 }) });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["transaction", "checking", "paged"] }),
    );
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["transaction", "checking"], exact: true }),
    );
  });

  it("onSuccess updates totals for cleared transaction", async () => {
    const queryClient = createHookQueryClient();
    queryClient.setQueryData(["totals", "checking"], makeInitialTotals());

    const { result } = renderHook(() => useTransactionDelete(), {
      wrapper: createHookWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync({ oldRow: makeDeleteTx({ transactionState: "cleared", amount: 50 }) });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const updated = queryClient.getQueryData<Totals>(["totals", "checking"]);
    expect(updated?.totals).toBe(150);
    expect(updated?.totalsCleared).toBe(50);
    expect(updated?.totalsOutstanding).toBe(60);
    expect(updated?.totalsFuture).toBe(40);
  });

  it("onSuccess updates totals for outstanding transaction", async () => {
    const queryClient = createHookQueryClient();
    queryClient.setQueryData(["totals", "checking"], makeInitialTotals());

    const { result } = renderHook(() => useTransactionDelete(), {
      wrapper: createHookWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync({ oldRow: makeDeleteTx({ transactionState: "outstanding", amount: 30 }) });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const updated = queryClient.getQueryData<Totals>(["totals", "checking"]);
    expect(updated?.totals).toBe(170);
    expect(updated?.totalsCleared).toBe(100);
    expect(updated?.totalsOutstanding).toBe(30);
    expect(updated?.totalsFuture).toBe(40);
  });

  it("onSuccess updates totals for future transaction", async () => {
    const queryClient = createHookQueryClient();
    queryClient.setQueryData(["totals", "checking"], makeInitialTotals());

    const { result } = renderHook(() => useTransactionDelete(), {
      wrapper: createHookWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync({ oldRow: makeDeleteTx({ transactionState: "future", amount: 40 }) });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const updated = queryClient.getQueryData<Totals>(["totals", "checking"]);
    expect(updated?.totals).toBe(160);
    expect(updated?.totalsCleared).toBe(100);
    expect(updated?.totalsOutstanding).toBe(60);
    expect(updated?.totalsFuture).toBe(0);
  });

  it("onSuccess with unknown state adjusts totals but not state buckets", async () => {
    const queryClient = createHookQueryClient();
    queryClient.setQueryData(["totals", "checking"], makeInitialTotals());

    const { result } = renderHook(() => useTransactionDelete(), {
      wrapper: createHookWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync({ oldRow: makeDeleteTx({ transactionState: "undefined" as any, amount: 20 }) });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const updated = queryClient.getQueryData<Totals>(["totals", "checking"]);
    expect(updated?.totals).toBe(180);
    expect(updated?.totalsCleared).toBe(100);
    expect(updated?.totalsOutstanding).toBe(60);
    expect(updated?.totalsFuture).toBe(40);
  });

  it("onSuccess with no cached totals invalidates totals query", async () => {
    const queryClient = createHookQueryClient();
    const invalidateSpy = jest.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useTransactionDelete(), {
      wrapper: createHookWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync({ oldRow: makeDeleteTx({ transactionState: "cleared", amount: 50 }) });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["totals", "checking"] }),
    );
  });

  it("onError puts mutation into error state", async () => {
    const queryClient = createHookQueryClient();
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: jest.fn().mockResolvedValue({ response: "Delete failed" }),
      text: jest.fn().mockResolvedValue(JSON.stringify({ response: "Delete failed" })),
    });

    const { result } = renderHook(() => useTransactionDelete(), {
      wrapper: createHookWrapper(queryClient),
    });

    await act(async () => {
      try {
        await result.current.mutateAsync({ oldRow: makeDeleteTx() });
      } catch {
        // expected
      }
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
