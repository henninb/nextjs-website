import Payment from "../../model/Payment";
import {
  createFetchMock,
  createErrorFetchMock,
  createTestPayment,
  simulateNetworkError,
} from "../../testHelpers";
import { deletePayment } from "../../hooks/usePaymentDelete";
import { HookValidator } from "../../utils/hookValidation";


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
  HookValidator: {
    validateInsert: jest.fn(),
    validateUpdate: jest.fn(),
    validateDelete: jest.fn(() => ({})),
  },
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
  };
});

jest.mock("../../utils/validation/sanitization", () => ({
  InputSanitizer: {
    sanitizeNumericId: jest.fn((value) => value),
  },
}));

const mockValidateDelete = HookValidator.validateDelete as jest.Mock;
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
