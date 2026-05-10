import React from "react";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Payment from "../../model/Payment";
import {
  createFetchMock,
  createErrorFetchMock,
  createTestPayment,
  simulateNetworkError,
} from "../../testHelpers";
import usePaymentInsert, { setupNewPayment, insertPayment } from "../../hooks/usePaymentInsert";
import { validateInsert } from "../../utils/hookValidation";

// Mock the useAuth hook
jest.mock("../../components/AuthProvider", () => ({
  useAuth: () => ({
    isAuthenticated: true,
    loading: false,
    user: { username: "testuser" },
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
  validateInsert: jest.fn((data) => data),
  validateUpdate: jest.fn((updated) => updated),
  validateDelete: jest.fn(),
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

jest.mock("../../utils/validation", () => ({
  DataValidator: {
    validatePayment: jest.fn(),
  },
}));

const mockValidateInsert = validateInsert as jest.Mock;
const { __mockLogger: mockLogger } = jest.requireMock("../../utils/logger") as {
  __mockLogger: ReturnType<typeof createMockLogger>;
};

describe("usePaymentInsert business logic", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  const basePayment = createTestPayment({
    sourceAccount: "checking",
    destinationAccount: "credit",
    transactionDate: new Date("2025-01-15T12:00:00Z"),
    amount: 125.5,
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockLogger.debug.mockClear();
    mockLogger.error.mockClear();
    mockValidateInsert.mockImplementation((data: Payment) => data);
  });

  describe("setupNewPayment", () => {
    it("formats payment payload for API", async () => {
      const result = await setupNewPayment(basePayment);

      expect(result).toStrictEqual({
        paymentId: 0,
        amount: 125.5,
        transactionDate: "2025-01-15",
        sourceAccount: "checking",
        destinationAccount: "credit",
        guidSource: null,
        guidDestination: null,
        owner: undefined,
        activeStatus: true,
      });
    });

    it("handles missing optional fields", async () => {
      const minimalPayment = createTestPayment({
        sourceAccount: "savings",
        destinationAccount: "loan",
        amount: 50,
        transactionDate: new Date(),
      });

      const result = await setupNewPayment(minimalPayment);

      expect(result.paymentId).toBe(0);
      expect(result.guidSource).toBeNull();
      expect(result.guidDestination).toBeNull();
      expect(result.activeStatus).toBe(true);
    });
  });

  describe("insertPayment", () => {
    it("posts validated payload to /api/payment", async () => {
      const apiResponse = { ...basePayment, paymentId: 42 };
      global.fetch = createFetchMock(apiResponse, { status: 201 });

      const result = await insertPayment(basePayment);

      expect(result).toStrictEqual(apiResponse);
      expect(mockValidateInsert).toHaveBeenCalledWith(
        basePayment,
        expect.any(Function),
        "insertPayment",
      );
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/payment",
        expect.objectContaining({
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: expect.stringContaining('"guidSource":null'),
        }),
      );
    });

    it("returns payload when API responds with data", async () => {
      const response = { ...basePayment, paymentId: 100 };
      global.fetch = createFetchMock(response, { status: 200 });

      await expect(insertPayment(basePayment)).resolves.toStrictEqual(response);
    });

    it("surface validation failures before fetch", async () => {
      mockValidateInsert.mockImplementation(() => {
        throw new Error("insertPayment validation failed: amount required");
      });
      const fetchSpy = jest.fn();
      global.fetch = fetchSpy as any;

      await expect(insertPayment(basePayment)).rejects.toThrow(
        "insertPayment validation failed: amount required",
      );
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it("propagates server errors", async () => {
      global.fetch = createErrorFetchMock("Invalid payment", 400);

      await expect(insertPayment(basePayment)).rejects.toThrow(
        "Invalid payment",
      );
    });

    it("handles network failures", async () => {
      global.fetch = simulateNetworkError();

      await expect(insertPayment(basePayment)).rejects.toThrow("Network error");
    });
  });
});

// ---------------------------------------------------------------------------
// renderHook tests for usePaymentInsert default export
// ---------------------------------------------------------------------------

const createPaymentInsertQueryClient = () =>
  new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

const createPaymentInsertWrapper = (queryClient: QueryClient) =>
  function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  };

describe("usePaymentInsert hook", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
    mockValidateInsert.mockImplementation((data: unknown) => data);
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("onSuccess puts mutation into success state", async () => {
    const payment = createTestPayment({
      sourceAccount: "checking",
      destinationAccount: "credit",
      transactionDate: new Date("2025-01-15T12:00:00Z"),
      amount: 100,
    });
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue(payment),
    });

    const queryClient = createPaymentInsertQueryClient();
    const { result } = renderHook(() => usePaymentInsert(), {
      wrapper: createPaymentInsertWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync({ payload: payment });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it("onError puts mutation into error state", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: jest.fn().mockResolvedValue({ response: "Insert failed" }),
    });

    const queryClient = createPaymentInsertQueryClient();
    const { result } = renderHook(() => usePaymentInsert(), {
      wrapper: createPaymentInsertWrapper(queryClient),
    });

    const payment = createTestPayment({
      sourceAccount: "checking",
      destinationAccount: "credit",
      transactionDate: new Date("2025-01-15T12:00:00Z"),
      amount: 100,
    });

    await act(async () => {
      try {
        await result.current.mutateAsync({ payload: payment });
      } catch {
        // expected
      }
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
