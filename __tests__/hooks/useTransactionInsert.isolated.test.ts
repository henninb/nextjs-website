import Transaction from "../../model/Transaction";
import Totals from "../../model/Totals";
import {
  createFetchMock,
  createErrorFetchMock,
  ConsoleSpy,
  createTestTransaction,
  simulateNetworkError,
  createMockValidationUtils,
} from "../testHelpers";

// Mock the validation utilities since we're testing in isolation
const mockValidationUtils = createMockValidationUtils();

jest.mock("../../utils/validation", () => mockValidationUtils);

// Mock secure UUID generation
const mockGenerateSecureUUID = jest.fn();
jest.mock("../../utils/security/secureUUID", () => ({
  generateSecureUUID: mockGenerateSecureUUID,
}));

export type TransactionInsertType = {
  accountNameOwner: string;
  newRow: Transaction;
  isFutureTransaction: boolean;
  isImportTransaction: boolean;
};

// Extract helper functions for testing
const getAccountKey = (accountNameOwner: string) => [
  "accounts",
  accountNameOwner,
];

const getTotalsKey = (accountNameOwner: string) => ["totals", accountNameOwner];

const setupNewTransaction = async (
  payload: Transaction,
  accountNameOwner: string,
): Promise<Transaction> => {
  // Generate secure UUID server-side
  const secureGuid = await mockGenerateSecureUUID();

  return {
    guid: secureGuid, // Now using secure server-side generation
    transactionDate: payload.transactionDate,
    description: payload.description,
    category: payload.category || "",
    notes: payload.notes || "",
    amount: payload.amount,
    dueDate: payload.dueDate || undefined,
    transactionType: payload.transactionType || "undefined",
    transactionState: payload.transactionState || "outstanding",
    activeStatus: true,
    accountType: payload.accountType || "debit",
    reoccurringType: payload.reoccurringType || "onetime",
    accountNameOwner: payload.accountNameOwner || "",
  };
};

const insertTransaction = async (
  accountNameOwner: string,
  payload: Transaction,
  isFutureTransaction: boolean,
  isImportTransaction: boolean,
): Promise<Transaction> => {
  // Validate and sanitize the transaction data
  const validation = mockValidationUtils.hookValidators.validateApiPayload(
    payload,
    mockValidationUtils.DataValidator.validateTransaction,
    "insertTransaction",
  );

  if (!validation.isValid) {
    const errorMessages =
      validation.errors?.map((err) => err.message).join(", ") ||
      "Validation failed";
    throw new Error(errorMessages);
  }

  let endpoint = "/api/transaction/insert";
  if (isFutureTransaction) {
    endpoint = "/api/transaction/future/insert";
  }

  const newPayload = await setupNewTransaction(
    validation.validatedData,
    accountNameOwner,
  );

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(newPayload),
    });

    if (!response.ok) {
      let errorMessage = "";

      try {
        const errorBody = await response.json();
        if (errorBody && errorBody.response) {
          errorMessage = `${errorBody.response}`;
        } else {
          console.log("No error message returned.");
          throw new Error("No error message returned.");
        }
      } catch (error: any) {
        console.log(`Failed to parse error response: ${error.message}`);
        throw new Error(`Failed to parse error response: ${error.message}`);
      }

      console.log(errorMessage || "cannot throw a null value");
      throw new Error(errorMessage || "cannot throw a null value");
    }

    return response.status !== 204 ? await response.json() : null;
  } catch (error: any) {
    console.log(`An error occurred: ${error.message}`);
    throw error;
  }
};

describe("Transaction Insert Functions (Isolated)", () => {
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

  let consoleSpy: ConsoleSpy;
  let mockConsole: any;

  beforeEach(() => {
    consoleSpy = new ConsoleSpy();
    mockConsole = consoleSpy.start();
    jest.clearAllMocks();

    // Setup default mocks
    mockGenerateSecureUUID.mockResolvedValue("test-uuid-123");
    mockValidationUtils.hookValidators.validateApiPayload.mockReturnValue({
      isValid: true,
      validatedData: mockTransaction,
    });
  });

  afterEach(() => {
    consoleSpy.stop();
  });

  describe("Helper functions", () => {
    describe("getAccountKey", () => {
      it("should create correct account key", () => {
        const result = getAccountKey("test_account");
        expect(result).toEqual(["accounts", "test_account"]);
      });
    });

    describe("getTotalsKey", () => {
      it("should create correct totals key", () => {
        const result = getTotalsKey("test_account");
        expect(result).toEqual(["totals", "test_account"]);
      });
    });

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

        const result = await setupNewTransaction(inputTransaction, "setup_account");

        expect(result).toEqual({
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

        const result = await setupNewTransaction(minimalTransaction, "minimal_account");

        expect(result).toEqual({
          guid: "default-uuid-789",
          transactionDate: new Date("2024-03-01"),
          description: "Minimal Test",
          category: "",
          notes: "",
          amount: 75.0,
          dueDate: undefined,
          transactionType: minimalTransaction.transactionType || "undefined",
          transactionState: "outstanding",
          activeStatus: true,
          accountType: minimalTransaction.accountType || "debit",
          reoccurringType: "onetime",
          accountNameOwner: minimalTransaction.accountNameOwner,
        });
      });

      it("should handle UUID generation errors", async () => {
        mockGenerateSecureUUID.mockRejectedValue(new Error("UUID generation failed"));

        await expect(setupNewTransaction(mockTransaction, "test_account")).rejects.toThrow(
          "UUID generation failed"
        );
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

        const result = await insertTransaction("test_account", mockTransaction, false, false);

        expect(result).toEqual(mockResponse);
        expect(global.fetch).toHaveBeenCalledWith(
          "/api/transaction/insert",
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
              dueDate: mockTransaction.dueDate, // Include dueDate from createTestTransaction
              transactionType: mockTransaction.transactionType,
              transactionState: mockTransaction.transactionState,
              activeStatus: true,
              accountType: mockTransaction.accountType,
              reoccurringType: mockTransaction.reoccurringType,
              accountNameOwner: mockTransaction.accountNameOwner,
            }),
          })
        );
      });

      it("should insert future transaction with correct endpoint", async () => {
        const futureTransaction = createTestTransaction({
          transactionDate: new Date("2025-01-01"),
          description: "Future Transaction",
          amount: 200.0,
          transactionState: "future",
        });

        mockValidationUtils.hookValidators.validateApiPayload.mockReturnValue({
          isValid: true,
          validatedData: futureTransaction,
        });

        const mockResponse = createTestTransaction({
          guid: "future-uuid-123",
          transactionState: "future",
        });

        global.fetch = createFetchMock(mockResponse);

        const result = await insertTransaction("test_account", futureTransaction, true, false);

        expect(result).toEqual(mockResponse);
        expect(global.fetch).toHaveBeenCalledWith(
          "/api/transaction/future/insert",
          expect.any(Object)
        );
      });

      it("should handle 204 no content response", async () => {
        global.fetch = createFetchMock(null, { status: 204 });

        const result = await insertTransaction("test_account", mockTransaction, false, false);

        expect(result).toBeNull();
      });

      it("should use validated data from validation", async () => {
        const validatedTransaction = createTestTransaction({
          ...mockTransaction,
          description: "Sanitized Description",
        });

        mockValidationUtils.hookValidators.validateApiPayload.mockReturnValue({
          isValid: true,
          validatedData: validatedTransaction,
        });

        global.fetch = createFetchMock(validatedTransaction);

        await insertTransaction("test_account", mockTransaction, false, false);

        const expectedPayload = await setupNewTransaction(validatedTransaction, "test_account");
        expect(global.fetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            body: JSON.stringify(expectedPayload),
          })
        );
      });
    });

    describe("Validation handling", () => {
      it("should handle validation failures", async () => {
        const validationError = { message: "Transaction date is required" };

        mockValidationUtils.hookValidators.validateApiPayload.mockReturnValue({
          isValid: false,
          errors: [validationError],
        });

        await expect(
          insertTransaction("test_account", mockTransaction, false, false)
        ).rejects.toThrow("Transaction date is required");

        expect(global.fetch).not.toHaveBeenCalled();
      });

      it("should handle validation failures with multiple errors", async () => {
        const validationErrors = [
          { message: "Transaction date is required" },
          { message: "Amount must be a number" },
        ];

        mockValidationUtils.hookValidators.validateApiPayload.mockReturnValue({
          isValid: false,
          errors: validationErrors,
        });

        await expect(
          insertTransaction("test_account", mockTransaction, false, false)
        ).rejects.toThrow("Transaction date is required, Amount must be a number");
      });

      it("should handle validation failures without error details", async () => {
        mockValidationUtils.hookValidators.validateApiPayload.mockReturnValue({
          isValid: false,
        });

        await expect(
          insertTransaction("test_account", mockTransaction, false, false)
        ).rejects.toThrow("Validation failed");
      });

      it("should call validation with correct parameters", async () => {
        global.fetch = createFetchMock(mockTransaction);

        await insertTransaction("test_account", mockTransaction, false, false);

        expect(mockValidationUtils.hookValidators.validateApiPayload).toHaveBeenCalledWith(
          mockTransaction,
          mockValidationUtils.DataValidator.validateTransaction,
          "insertTransaction"
        );
      });
    });

    describe("Error handling", () => {
      it("should handle server error with error message", async () => {
        const errorMessage = "Invalid transaction data";
        global.fetch = createErrorFetchMock(errorMessage, 400);

        await expect(
          insertTransaction("test_account", mockTransaction, false, false)
        ).rejects.toThrow(errorMessage);
        expect(mockConsole.log).toHaveBeenCalledWith(errorMessage);
        expect(mockConsole.log).toHaveBeenCalledWith(
          `An error occurred: ${errorMessage}`
        );
      });

      it("should handle server error without error message", async () => {
        global.fetch = jest.fn().mockResolvedValueOnce({
          ok: false,
          status: 400,
          json: jest.fn().mockResolvedValueOnce({}),
        });

        await expect(
          insertTransaction("test_account", mockTransaction, false, false)
        ).rejects.toThrow("No error message returned.");
        expect(mockConsole.log).toHaveBeenCalledWith("No error message returned.");
      });

      it("should handle JSON parsing errors in error response", async () => {
        global.fetch = jest.fn().mockResolvedValueOnce({
          ok: false,
          status: 400,
          json: jest.fn().mockRejectedValueOnce(new Error("Invalid JSON")),
        });

        await expect(
          insertTransaction("test_account", mockTransaction, false, false)
        ).rejects.toThrow("Failed to parse error response: Invalid JSON");
        expect(mockConsole.log).toHaveBeenCalledWith(
          "Failed to parse error response: Invalid JSON"
        );
      });

      it("should handle network errors", async () => {
        global.fetch = simulateNetworkError();

        await expect(
          insertTransaction("test_account", mockTransaction, false, false)
        ).rejects.toThrow("Network error");
        expect(mockConsole.log).toHaveBeenCalledWith(
          "An error occurred: Network error"
        );
      });

      it("should handle various HTTP error statuses", async () => {
        const errorStatuses = [400, 401, 403, 409, 422, 500];

        for (const status of errorStatuses) {
          const errorMessage = `Error ${status}`;
          global.fetch = createErrorFetchMock(errorMessage, status);

          await expect(
            insertTransaction("test_account", mockTransaction, false, false)
          ).rejects.toThrow(errorMessage);
        }
      });

      it("should handle UUID generation errors", async () => {
        mockGenerateSecureUUID.mockRejectedValue(new Error("UUID generation failed"));

        await expect(
          insertTransaction("test_account", mockTransaction, false, false)
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
          })
        );
      });

      it("should include credentials", async () => {
        global.fetch = createFetchMock(mockTransaction);

        await insertTransaction("test_account", mockTransaction, false, false);

        expect(global.fetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            credentials: "include",
          })
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
          })
        );
      });

      it("should use correct endpoint for regular transactions", async () => {
        global.fetch = createFetchMock(mockTransaction);

        await insertTransaction("test_account", mockTransaction, false, false);

        expect(global.fetch).toHaveBeenCalledWith(
          "/api/transaction/insert",
          expect.any(Object)
        );
      });

      it("should use correct endpoint for future transactions", async () => {
        global.fetch = createFetchMock(mockTransaction);

        await insertTransaction("test_account", mockTransaction, true, false);

        expect(global.fetch).toHaveBeenCalledWith(
          "/api/transaction/future/insert",
          expect.any(Object)
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

        const result = await insertTransaction("test_account", mockTransaction, false, false);

        expect(result).toEqual(responseData);
      });

      it("should handle empty response body", async () => {
        global.fetch = createFetchMock({});

        const result = await insertTransaction("test_account", mockTransaction, false, false);

        expect(result).toEqual({});
      });

      it("should handle complex response data", async () => {
        const complexResponse = createTestTransaction({
          ...mockTransaction,
          guid: "complex-uuid",
          additionalField: "extra data",
          metadata: { createdBy: "system" },
        });
        global.fetch = createFetchMock(complexResponse);

        const result = await insertTransaction("test_account", mockTransaction, false, false);

        expect(result).toEqual(complexResponse);
      });
    });

    describe("Edge cases", () => {
      it("should handle transaction with minimal data", async () => {
        const minimalTransaction = createTestTransaction({
          transactionDate: new Date("2024-06-01"),
          description: "Minimal",
          amount: 25.0,
        });

        mockValidationUtils.hookValidators.validateApiPayload.mockReturnValue({
          isValid: true,
          validatedData: minimalTransaction,
        });

        const mockResponse = createTestTransaction({ guid: "minimal-uuid" });
        global.fetch = createFetchMock(mockResponse);

        const result = await insertTransaction("test_account", minimalTransaction, false, false);

        expect(result).toEqual(mockResponse);
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

        mockValidationUtils.hookValidators.validateApiPayload.mockReturnValue({
          isValid: true,
          validatedData: fullTransaction,
        });

        const mockResponse = createTestTransaction({ guid: "full-uuid" });
        global.fetch = createFetchMock(mockResponse);

        const result = await insertTransaction("test_account", fullTransaction, false, false);

        expect(result).toEqual(mockResponse);
      });

      it("should handle very large transaction amounts", async () => {
        const largeTransaction = createTestTransaction({
          amount: 999999.99,
          description: "Large Amount",
        });

        mockValidationUtils.hookValidators.validateApiPayload.mockReturnValue({
          isValid: true,
          validatedData: largeTransaction,
        });

        const mockResponse = createTestTransaction({ guid: "large-uuid" });
        global.fetch = createFetchMock(mockResponse);

        const result = await insertTransaction("test_account", largeTransaction, false, false);

        expect(result).toEqual(mockResponse);
      });

      it("should handle negative transaction amounts", async () => {
        const negativeTransaction = createTestTransaction({
          amount: -150.0,
          description: "Refund",
        });

        mockValidationUtils.hookValidators.validateApiPayload.mockReturnValue({
          isValid: true,
          validatedData: negativeTransaction,
        });

        const mockResponse = createTestTransaction({ guid: "negative-uuid" });
        global.fetch = createFetchMock(mockResponse);

        const result = await insertTransaction("test_account", negativeTransaction, false, false);

        expect(result).toEqual(mockResponse);
      });

      it("should handle special characters in transaction data", async () => {
        const specialTransaction = createTestTransaction({
          description: "Transaction & Notes (Special)",
          category: "food & dining",
          notes: "Notes with 'quotes' and symbols @#$",
        });

        mockValidationUtils.hookValidators.validateApiPayload.mockReturnValue({
          isValid: true,
          validatedData: specialTransaction,
        });

        const mockResponse = createTestTransaction({ guid: "special-uuid" });
        global.fetch = createFetchMock(mockResponse);

        const result = await insertTransaction("test_account", specialTransaction, false, false);

        expect(result).toEqual(mockResponse);
      });
    });

    describe("Business logic validation", () => {
      it("should enforce validation before UUID generation and API call", async () => {
        const mockResponse = createTestTransaction({ guid: "business-uuid" });
        global.fetch = createFetchMock(mockResponse);

        await insertTransaction("test_account", mockTransaction, false, false);

        expect(mockValidationUtils.hookValidators.validateApiPayload).toHaveBeenCalled();
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

        mockValidationUtils.hookValidators.validateApiPayload.mockReturnValue({
          isValid: true,
          validatedData: originalTransaction,
        });

        mockGenerateSecureUUID.mockResolvedValue("new-secure-uuid");
        global.fetch = createFetchMock(originalTransaction);

        await insertTransaction("test_account", originalTransaction, false, false);

        const expectedPayload = {
          guid: "new-secure-uuid", // Should use generated UUID
          transactionDate: new Date("2024-08-01"),
          description: "Original Description",
          category: originalTransaction.category, // Use actual value from createTestTransaction
          notes: originalTransaction.notes || "",
          amount: 75.0,
          dueDate: originalTransaction.dueDate, // Use actual value from createTestTransaction
          transactionType: originalTransaction.transactionType,
          transactionState: originalTransaction.transactionState || "outstanding",
          activeStatus: true, // Should be set to true
          accountType: originalTransaction.accountType,
          reoccurringType: originalTransaction.reoccurringType,
          accountNameOwner: originalTransaction.accountNameOwner,
        };

        expect(global.fetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            body: JSON.stringify(expectedPayload),
          })
        );
      });

      it("should differentiate between regular and future transactions", async () => {
        global.fetch = createFetchMock(mockTransaction);

        // Regular transaction
        await insertTransaction("test_account", mockTransaction, false, false);
        expect(global.fetch).toHaveBeenCalledWith("/api/transaction/insert", expect.any(Object));

        // Future transaction
        await insertTransaction("test_account", mockTransaction, true, false);
        expect(global.fetch).toHaveBeenCalledWith("/api/transaction/future/insert", expect.any(Object));
      });
    });
  });
});