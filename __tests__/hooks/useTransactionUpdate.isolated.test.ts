import Transaction from "../../model/Transaction";
import {
  createFetchMock,
  createErrorFetchMock,
  createTestTransaction,
  simulateNetworkError,
} from "../../testHelpers";
import { updateTransaction } from "../../hooks/useTransactionUpdate";
import { HookValidator } from "../../utils/hookValidation";

jest.mock("../../utils/hookValidation", () => ({
  HookValidator: {
    validateInsert: jest.fn(),
    validateUpdate: jest.fn((newData) => newData),
    validateDelete: jest.fn(),
  },
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
  };
});

jest.mock("../../utils/validation/sanitization", () => ({
  InputSanitizer: {
    sanitizeGuid: jest.fn((value) => value),
  },
}));

const mockValidateUpdate = HookValidator.validateUpdate as jest.Mock;
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

describe("updateTransaction (isolated)", () => {
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

    expect(result).toEqual(apiResponse);
    expect(mockValidateUpdate).toHaveBeenCalledWith(
      newTransaction,
      oldTransaction,
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

    const body = JSON.parse(
      (global.fetch as jest.Mock).mock.calls[0][1].body,
    );
    expect(body.receiptImage.image).toBe("iVBORw0KGgoAAAANSUhEUgAAA...");
  });

  it("propagates validation errors before calling fetch", async () => {
    mockValidateUpdate.mockImplementation(() => {
      throw new Error("updateTransaction validation failed: amount required");
    });
    const fetchSpy = jest.fn();
    global.fetch = fetchSpy as any;

    await expect(updateTransaction(newTransaction, oldTransaction)).rejects.toThrow(
      "updateTransaction validation failed: amount required",
    );
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("handles server errors with message", async () => {
    global.fetch = createErrorFetchMock("Cannot update transaction", 400);

    await expect(updateTransaction(newTransaction, oldTransaction)).rejects.toThrow(
      "Cannot update transaction",
    );
  });

  it("handles network failures", async () => {
    global.fetch = simulateNetworkError();

    await expect(updateTransaction(newTransaction, oldTransaction)).rejects.toThrow(
      "Network error",
    );
  });
});
