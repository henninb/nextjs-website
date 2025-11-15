import Transaction from "../../model/Transaction";
import {
  createFetchMock,
  createErrorFetchMock,
  createTestTransaction,
  simulateNetworkError,
} from "../../testHelpers";
import { deleteTransaction } from "../../hooks/useTransactionDelete";
import { HookValidator } from "../../utils/hookValidation";

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
    sanitizeGuid: jest.fn((value: string) => value),
  },
}));

const mockValidateDelete = HookValidator.validateDelete as jest.Mock;
const { __mockLogger: mockLogger } = jest.requireMock(
  "../../utils/logger",
) as { __mockLogger: ReturnType<typeof createMockLogger> };
const { InputSanitizer } = jest.requireMock(
  "../../utils/validation/sanitization",
) as {
  InputSanitizer: { sanitizeGuid: jest.Mock };
};

describe("deleteTransaction (isolated)", () => {
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

    expect(result).toEqual(baseTransaction);
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
