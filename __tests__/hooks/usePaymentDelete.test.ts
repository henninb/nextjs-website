import Payment from "../../model/Payment";
import {
  createFetchMock,
  createErrorFetchMock,
  createTestPayment,
  simulateNetworkError,
} from "../../testHelpers";
import usePaymentDelete, { deletePayment } from "../../hooks/usePaymentDelete";
import { validateDelete } from "../../utils/hookValidation";
import React from "react";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Mock cacheUtils
jest.mock("../../utils/cacheUtils", () => ({
  QueryKeys: {
    payment: jest.fn(() => ["payment"]),
  },
  removeFromList: jest.fn(),
}));

// Mock CSRF utilities
jest.mock("../../utils/csrf", () => ({
  getCsrfHeaders: jest.fn().mockResolvedValue({}),
  getCsrfToken: jest.fn().mockResolvedValue(null),
  fetchCsrfToken: jest.fn().mockResolvedValue(undefined),
  clearCsrfToken: jest.fn(),
  initCsrfToken: jest.fn().mockResolvedValue(undefined),
}));

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
    sanitizeNumericId: jest.fn((value) => value),
  },
}));

const mockValidateDelete = validateDelete as jest.Mock;
const { __mockLogger: mockLogger } = jest.requireMock("../../utils/logger") as {
  __mockLogger: ReturnType<typeof createMockLogger>;
};
const { InputSanitizer } = jest.requireMock(
  "../../utils/validation/sanitization",
) as {
  InputSanitizer: { sanitizeNumericId: jest.Mock };
};

describe("deletePayment", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  const payment = createTestPayment({
    paymentId: 99,
    sourceAccount: "checking",
    destinationAccount: "credit",
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockLogger.debug.mockClear();
    mockLogger.error.mockClear();
    mockValidateDelete.mockImplementation(() => ({}));
    InputSanitizer.sanitizeNumericId.mockImplementation((value) => value);
  });

  it("sends DELETE request to /api/payment/{id}", async () => {
    const response = { ...payment };
    global.fetch = createFetchMock(response, { status: 200 });

    const result = await deletePayment(payment as Payment);

    expect(result).toStrictEqual(response);
    expect(mockValidateDelete).toHaveBeenCalledWith(
      payment,
      "paymentId",
      "deletePayment",
    );
    expect(InputSanitizer.sanitizeNumericId).toHaveBeenCalledWith(
      payment.paymentId,
      "paymentId",
    );
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/payment/99",
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

  it("propagates validation errors before fetch", async () => {
    mockValidateDelete.mockImplementation(() => {
      throw new Error("deletePayment: Invalid paymentId provided");
    });
    const fetchSpy = jest.fn();
    global.fetch = fetchSpy as any;

    await expect(deletePayment(payment)).rejects.toThrow(
      "deletePayment: Invalid paymentId provided",
    );
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("handles server errors with message", async () => {
    global.fetch = createErrorFetchMock("Cannot delete payment", 400);

    await expect(deletePayment(payment)).rejects.toThrow(
      "Cannot delete payment",
    );
  });

  it("handles empty error responses gracefully", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: jest.fn().mockResolvedValue({}),
    });

    await expect(deletePayment(payment)).rejects.toThrow("HTTP 400");
  });

  it("handles network failures", async () => {
    global.fetch = simulateNetworkError();

    await expect(deletePayment(payment)).rejects.toThrow("Network error");
  });
});

// ---------------------------------------------------------------------------
// renderHook tests for usePaymentDelete default export
// ---------------------------------------------------------------------------

const createPaymentDeleteHookQueryClient = () =>
  new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

const createPaymentDeleteHookWrapper = (queryClient: QueryClient) =>
  function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  };

describe("usePaymentDelete hook", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    (validateDelete as jest.Mock).mockImplementation(() => ({}));
    const { InputSanitizer: sanitizer } = jest.requireMock("../../utils/validation/sanitization") as {
      InputSanitizer: { sanitizeNumericId: jest.Mock };
    };
    sanitizer.sanitizeNumericId.mockImplementation((value: number) => value);
  });

  it("onSuccess calls removeFromList with the deleted payment", async () => {
    const queryClient = createPaymentDeleteHookQueryClient();
    const testPayment = createTestPayment({ paymentId: 99, sourceAccount: "checking", destinationAccount: "credit" });

    global.fetch = createFetchMock({ ...testPayment }, { status: 200 });

    const { result } = renderHook(() => usePaymentDelete(), {
      wrapper: createPaymentDeleteHookWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync({ oldRow: testPayment as Payment });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const { removeFromList } = jest.requireMock("../../utils/cacheUtils");
    expect(removeFromList).toHaveBeenCalledWith(
      expect.anything(),
      ["payment"],
      expect.objectContaining({ paymentId: 99 }),
      "paymentId",
    );
  });

  it("onError puts mutation into error state", async () => {
    const queryClient = createPaymentDeleteHookQueryClient();
    global.fetch = createErrorFetchMock("Delete failed", 400);

    const { result } = renderHook(() => usePaymentDelete(), {
      wrapper: createPaymentDeleteHookWrapper(queryClient),
    });

    const testPayment = createTestPayment({ paymentId: 99 }) as Payment;

    await act(async () => {
      try {
        await result.current.mutateAsync({ oldRow: testPayment });
      } catch {
        // expected
      }
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
