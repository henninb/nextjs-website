/**
 * Isolated tests for useValidationAmountInsert business logic
 * Tests insertValidationAmount function without React Query overhead
 */

import {
  createModernFetchMock as createFetchMock,
  createModernErrorFetchMock as createErrorFetchMock,
  ConsoleSpy,
} from "../../testHelpers.modern";
import { simulateNetworkError, simulateTimeoutError } from "../../testHelpers";
import ValidationAmount from "../../model/ValidationAmount";
import { TransactionState } from "../../model/TransactionState";

// Extract the business logic function from useValidationAmountInsert
const insertValidationAmount = async (
  accountNameOwner: string,
  payload: ValidationAmount,
): Promise<ValidationAmount> => {
  const endpoint = `/api/validation/amount`;

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorBody = await response
        .json()
        .catch(() => ({ error: `HTTP error! Status: ${response.status}` }));
      const errorMessage =
        errorBody.error || `HTTP error! Status: ${response.status}`;
      console.error(`Failed to insert validation amount: ${errorMessage}`);
      throw new Error(errorMessage);
    }

    return await response.json();
  } catch (error: any) {
    console.error(`An error occurred: ${error.message}`);
    throw error;
  }
};

// Helper function to create test validation amount data
const createTestValidationAmount = (
  overrides: Partial<ValidationAmount> = {},
): ValidationAmount => ({
  validationId: 1,
  validationDate: new Date("2024-01-01T00:00:00.000Z"),
  accountId: 100,
  amount: 1000.0,
  transactionState: "cleared" as TransactionState,
  activeStatus: true,
  dateAdded: new Date("2024-01-01T10:00:00.000Z"),
  dateUpdated: new Date("2024-01-01T10:00:00.000Z"),
  ...overrides,
});

describe("useValidationAmountInsert Business Logic (Isolated)", () => {
  let consoleSpy: ConsoleSpy;

  beforeEach(() => {
    consoleSpy = new ConsoleSpy();
    jest.clearAllMocks();
  });

  afterEach(() => {
    consoleSpy.stop();
  });

  describe("insertValidationAmount", () => {
    describe("Successful validation amount creation", () => {
      it("should create validation amount successfully with 200 response", async () => {
        const testPayload = createTestValidationAmount();
        const accountNameOwner = "testAccount";
        const expectedResponse = {
          ...testPayload,
          validationId: 42,
        };

        global.fetch = createFetchMock(expectedResponse);

        const result = await insertValidationAmount(
          accountNameOwner,
          testPayload,
        );

        expect(result).toEqual(expectedResponse);
        expect(fetch).toHaveBeenCalledWith(
          "/api/validation/amount",
          {
            method: "POST",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify(testPayload),
          },
        );
      });

      it("should use correct modern endpoint", async () => {
        const testPayload = createTestValidationAmount();
        const accountNameOwner = "specialAccount";

        global.fetch = createFetchMock({ validationId: 1 });

        await insertValidationAmount(accountNameOwner, testPayload);

        expect(fetch).toHaveBeenCalledWith(
          "/api/validation/amount",
          expect.any(Object),
        );
      });

      it("should handle different transaction states", async () => {
        const transactionStates: TransactionState[] = [
          "cleared",
          "outstanding",
          "future",
        ];

        for (const transactionState of transactionStates) {
          const testPayload = createTestValidationAmount({ transactionState });
          const accountNameOwner = "testAccount";

          global.fetch = createFetchMock({ ...testPayload });

          const result = await insertValidationAmount(
            accountNameOwner,
            testPayload,
          );

          expect(result!.transactionState).toBe(transactionState);
        }
      });

      it("should preserve all validation amount properties", async () => {
        const testPayload = createTestValidationAmount({
          validationId: 999,
          validationDate: new Date("2024-06-15T14:30:00.000Z"),
          accountId: 555,
          amount: 2500.75,
          transactionState: "outstanding" as TransactionState,
          activeStatus: false,
        });
        const accountNameOwner = "detailedAccount";

        global.fetch = createFetchMock({ ...testPayload });

        const result = await insertValidationAmount(
          accountNameOwner,
          testPayload,
        );

        expect(result).toEqual(testPayload);
      });
    });

    describe("API error handling", () => {
      it("should handle 400 error with error message", async () => {
        const testPayload = createTestValidationAmount();
        const accountNameOwner = "testAccount";

        global.fetch = jest.fn().mockResolvedValue({
          ok: false,
          status: 400,
          json: jest.fn().mockResolvedValue({ error: "Invalid validation amount data" }),
        });
        consoleSpy.start();

        await expect(
          insertValidationAmount(accountNameOwner, testPayload),
        ).rejects.toThrow("Invalid validation amount data");

        const calls = consoleSpy.getCalls();
        expect(calls.error.some(call =>
          call.some(arg => String(arg).includes("Failed to insert validation amount:"))
        )).toBe(true);
      });

      it("should handle 409 conflict error", async () => {
        const testPayload = createTestValidationAmount();
        const accountNameOwner = "testAccount";

        global.fetch = jest.fn().mockResolvedValue({
          ok: false,
          status: 409,
          json: jest.fn().mockResolvedValue({ error: "Validation amount already exists" }),
        });
        consoleSpy.start();

        await expect(
          insertValidationAmount(accountNameOwner, testPayload),
        ).rejects.toThrow("Validation amount already exists");

        const calls = consoleSpy.getCalls();
        expect(calls.error.some(call =>
          call.some(arg => String(arg).includes("Failed to insert validation amount:"))
        )).toBe(true);
      });

      it("should handle 500 server error", async () => {
        const testPayload = createTestValidationAmount();
        const accountNameOwner = "testAccount";

        global.fetch = jest.fn().mockResolvedValue({
          ok: false,
          status: 500,
          json: jest.fn().mockResolvedValue({ error: "Internal server error" }),
        });
        consoleSpy.start();

        await expect(
          insertValidationAmount(accountNameOwner, testPayload),
        ).rejects.toThrow("Internal server error");

        const calls = consoleSpy.getCalls();
        expect(calls.error.some(call =>
          call.some(arg => String(arg).includes("Failed to insert validation amount:"))
        )).toBe(true);
      });

      it("should handle error response without message", async () => {
        const testPayload = createTestValidationAmount();
        const accountNameOwner = "testAccount";

        global.fetch = jest.fn().mockResolvedValue({
          ok: false,
          status: 400,
          json: jest.fn().mockResolvedValue({}),
        });
        consoleSpy.start();

        await expect(
          insertValidationAmount(accountNameOwner, testPayload),
        ).rejects.toThrow("HTTP error! Status: 400");

        const calls = consoleSpy.getCalls();
        expect(calls.error.some(call =>
          call.some(arg => String(arg).includes("Failed to insert validation amount:"))
        )).toBe(true);
      });

      it("should handle malformed error response", async () => {
        const testPayload = createTestValidationAmount();
        const accountNameOwner = "testAccount";

        global.fetch = jest.fn().mockResolvedValue({
          ok: false,
          status: 400,
          json: jest.fn().mockRejectedValue(new Error("Invalid JSON")),
        });
        consoleSpy.start();

        await expect(
          insertValidationAmount(accountNameOwner, testPayload),
        ).rejects.toThrow("HTTP error! Status: 400");

        const calls = consoleSpy.getCalls();
        expect(calls.error.some(call =>
          call.some(arg => String(arg).includes("Failed to insert validation amount:"))
        )).toBe(true);
      });

      it("should handle network errors", async () => {
        const testPayload = createTestValidationAmount();
        const accountNameOwner = "testAccount";

        global.fetch = jest.fn().mockRejectedValue(new Error("Network error"));
        consoleSpy.start();

        await expect(
          insertValidationAmount(accountNameOwner, testPayload),
        ).rejects.toThrow("Network error");

        const calls = consoleSpy.getCalls();
        expect(calls.error.some(call =>
          call.some(arg => String(arg).includes("An error occurred:"))
        )).toBe(true);
      });

      it("should handle timeout errors", async () => {
        const testPayload = createTestValidationAmount();
        const accountNameOwner = "testAccount";

        global.fetch = jest
          .fn()
          .mockRejectedValue(new Error("Request timeout"));
        consoleSpy.start();

        await expect(
          insertValidationAmount(accountNameOwner, testPayload),
        ).rejects.toThrow("Request timeout");

        const calls = consoleSpy.getCalls();
        expect(calls.error.some(call =>
          call.some(arg => String(arg).includes("An error occurred:"))
        )).toBe(true);
      });
    });

    describe("Request format validation", () => {
      it("should send correct headers", async () => {
        const testPayload = createTestValidationAmount();
        const accountNameOwner = "testAccount";

        global.fetch = createFetchMock({ validationId: 1 });

        await insertValidationAmount(accountNameOwner, testPayload);

        expect(fetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
          }),
        );
      });

      it("should use correct endpoint pattern", async () => {
        const testPayload = createTestValidationAmount();
        const accountNameOwner = "mySpecialAccount";

        global.fetch = createFetchMock({ validationId: 1 });

        await insertValidationAmount(accountNameOwner, testPayload);

        expect(fetch).toHaveBeenCalledWith(
          "/api/validation/amount",
          expect.any(Object),
        );
      });

      it("should send POST method", async () => {
        const testPayload = createTestValidationAmount();
        const accountNameOwner = "testAccount";

        global.fetch = createFetchMock({ validationId: 1 });

        await insertValidationAmount(accountNameOwner, testPayload);

        expect(fetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({ method: "POST" }),
        );
      });

      it("should include credentials", async () => {
        const testPayload = createTestValidationAmount();
        const accountNameOwner = "testAccount";

        global.fetch = createFetchMock({ validationId: 1 });

        await insertValidationAmount(accountNameOwner, testPayload);

        expect(fetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({ credentials: "include" }),
        );
      });

      it("should stringify the validation amount data", async () => {
        const testPayload = createTestValidationAmount();
        const accountNameOwner = "testAccount";

        global.fetch = createFetchMock({ validationId: 1 });

        await insertValidationAmount(accountNameOwner, testPayload);

        expect(fetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            body: JSON.stringify(testPayload),
          }),
        );
      });
    });

    describe("Business logic scenarios", () => {
      it("should handle account balance validation scenarios", async () => {
        const testPayload = createTestValidationAmount({
          amount: 5000.0,
          transactionState: "cleared" as TransactionState,
          validationDate: new Date("2024-01-31T23:59:59.000Z"),
        });
        const accountNameOwner = "checkingAccount";

        global.fetch = createFetchMock({ ...testPayload });

        const result = await insertValidationAmount(
          accountNameOwner,
          testPayload,
        );

        expect(result!.amount).toBe(5000.0);
        expect(result!.transactionState).toBe("cleared");
        expect(result!.validationDate).toEqual(
          new Date("2024-01-31T23:59:59.000Z"),
        );
      });

      it("should handle outstanding transaction validations", async () => {
        const testPayload = createTestValidationAmount({
          amount: -250.5, // Negative amount for outstanding transactions
          transactionState: "outstanding" as TransactionState,
          activeStatus: true,
        });
        const accountNameOwner = "creditAccount";

        global.fetch = createFetchMock({ ...testPayload });

        const result = await insertValidationAmount(
          accountNameOwner,
          testPayload,
        );

        expect(result!.amount).toBe(-250.5);
        expect(result!.transactionState).toBe("outstanding");
        expect(result!.activeStatus).toBe(true);
      });

      it("should handle future transaction validations", async () => {
        const futureDate = new Date("2025-12-31T00:00:00.000Z");
        const testPayload = createTestValidationAmount({
          amount: 1000.0,
          transactionState: "future" as TransactionState,
          validationDate: futureDate,
        });
        const accountNameOwner = "savingsAccount";

        global.fetch = createFetchMock({ ...testPayload });

        const result = await insertValidationAmount(
          accountNameOwner,
          testPayload,
        );

        expect(result!.amount).toBe(1000.0);
        expect(result!.transactionState).toBe("future");
        expect(result!.validationDate).toEqual(futureDate);
      });

      it("should handle validation for different account types", async () => {
        const accountTypes = [
          "checking",
          "savings",
          "credit",
          "investment",
          "business-checking",
          "money-market",
        ];

        for (const accountType of accountTypes) {
          const testPayload = createTestValidationAmount({
            amount: 1500.25,
            accountId: Math.floor(Math.random() * 1000),
          });

          global.fetch = createFetchMock({ ...testPayload });

          const result = await insertValidationAmount(accountType, testPayload);

          expect(result!.amount).toBe(1500.25);
          expect(fetch).toHaveBeenCalledWith(
            `/api/validation/amount`,
            expect.any(Object),
          );
        }
      });

      it("should handle high-value validation amounts", async () => {
        const testPayload = createTestValidationAmount({
          amount: 999999.99,
          transactionState: "cleared" as TransactionState,
          activeStatus: true,
        });
        const accountNameOwner = "highValueAccount";

        global.fetch = createFetchMock({ ...testPayload });

        const result = await insertValidationAmount(
          accountNameOwner,
          testPayload,
        );

        expect(result!.amount).toBe(999999.99);
        expect(result!.transactionState).toBe("cleared");
      });

      it("should handle micro-amount validations", async () => {
        const testPayload = createTestValidationAmount({
          amount: 0.01,
          transactionState: "cleared" as TransactionState,
        });
        const accountNameOwner = "microPaymentAccount";

        global.fetch = createFetchMock({ ...testPayload });

        const result = await insertValidationAmount(
          accountNameOwner,
          testPayload,
        );

        expect(result!.amount).toBe(0.01);
      });

      it("should handle validation business rules", async () => {
        const testPayload = createTestValidationAmount({
          validationId: 12345,
          validationDate: new Date("2024-03-15T12:00:00.000Z"),
          accountId: 789,
          amount: 2750.5,
          transactionState: "outstanding" as TransactionState,
          activeStatus: true,
        });
        const accountNameOwner = "businessRulesAccount";

        global.fetch = createFetchMock({
          ...testPayload,
          validationId: 67890, // Server-assigned ID
        });

        const result = await insertValidationAmount(
          accountNameOwner,
          testPayload,
        );

        expect(result!.validationId).toBe(67890);
        expect(result!.amount).toBe(2750.5);
        expect(result!.transactionState).toBe("outstanding");
      });
    });

    describe("Edge cases", () => {
      it("should handle special characters in account names", async () => {
        const testPayload = createTestValidationAmount();
        const accountNameOwner = "Account & Co: 2024!";

        global.fetch = createFetchMock({ ...testPayload });

        const result = await insertValidationAmount(
          accountNameOwner,
          testPayload,
        );

        expect(result).toEqual(testPayload);
        expect(fetch).toHaveBeenCalledWith(
          "/api/validation/amount",
          expect.any(Object),
        );
      });

      it("should handle unicode characters in account names", async () => {
        const testPayload = createTestValidationAmount();
        const accountNameOwner = "验证账户 Validation Account 💰";

        global.fetch = createFetchMock({ ...testPayload });

        const result = await insertValidationAmount(
          accountNameOwner,
          testPayload,
        );

        expect(result).toEqual(testPayload);
        expect(fetch).toHaveBeenCalledWith(
          "/api/validation/amount",
          expect.any(Object),
        );
      });

      it("should handle very long account names", async () => {
        const testPayload = createTestValidationAmount();
        const longAccountName = "A".repeat(500);

        global.fetch = createFetchMock({ ...testPayload });

        const result = await insertValidationAmount(
          longAccountName,
          testPayload,
        );

        expect(result).toEqual(testPayload);
        expect(fetch).toHaveBeenCalledWith(
          `/api/validation/amount`,
          expect.any(Object),
        );
      });

      it("should handle zero amounts", async () => {
        const testPayload = createTestValidationAmount({ amount: 0 });
        const accountNameOwner = "zeroAmountAccount";

        global.fetch = createFetchMock({ ...testPayload });

        const result = await insertValidationAmount(
          accountNameOwner,
          testPayload,
        );

        expect(result!.amount).toBe(0);
      });

      it("should handle decimal precision amounts", async () => {
        const preciseAmount = 123.456789;
        const testPayload = createTestValidationAmount({
          amount: preciseAmount,
        });
        const accountNameOwner = "precisionAccount";

        global.fetch = createFetchMock({ ...testPayload });

        const result = await insertValidationAmount(
          accountNameOwner,
          testPayload,
        );

        expect(result!.amount).toBe(preciseAmount);
      });

      it("should handle inactive validation amounts", async () => {
        const testPayload = createTestValidationAmount({ activeStatus: false });
        const accountNameOwner = "inactiveAccount";

        global.fetch = createFetchMock({ ...testPayload });

        const result = await insertValidationAmount(
          accountNameOwner,
          testPayload,
        );

        expect(result!.activeStatus).toBe(false);
      });

      it("should handle missing optional fields", async () => {
        const testPayload = createTestValidationAmount({
          accountId: undefined,
          dateAdded: undefined,
          dateUpdated: undefined,
        });
        const accountNameOwner = "minimalFieldsAccount";

        global.fetch = createFetchMock({ ...testPayload });

        const result = await insertValidationAmount(
          accountNameOwner,
          testPayload,
        );

        expect(result!.accountId).toBeUndefined();
        expect(result!.dateAdded).toBeUndefined();
        expect(result!.dateUpdated).toBeUndefined();
      });
    });

    describe("Console logging", () => {
      it("should log API error messages", async () => {
        const testPayload = createTestValidationAmount();
        const accountNameOwner = "testAccount";

        global.fetch = createErrorFetchMock("Validation failed", 400);
        consoleSpy.start();

        try {
          await insertValidationAmount(accountNameOwner, testPayload);
        } catch (error) {
          // Expected error
        }

        const calls = consoleSpy.getCalls();
        expect(calls.error.some(call =>
          call.some(arg => String(arg).includes("Failed to insert validation amount: Validation failed"))
        )).toBe(true);
        expect(calls.error.some(call =>
          call.some(arg => String(arg).includes("An error occurred:"))
        )).toBe(true);
      });

      it("should log parsing errors", async () => {
        const testPayload = createTestValidationAmount();
        const accountNameOwner = "testAccount";

        global.fetch = jest.fn().mockResolvedValue({
          ok: false,
          status: 400,
          json: jest.fn().mockRejectedValue(new Error("JSON parse error")),
        });
        consoleSpy.start();

        try {
          await insertValidationAmount(accountNameOwner, testPayload);
        } catch (error) {
          // Expected error
        }

        const calls = consoleSpy.getCalls();
        expect(calls.error.some(call =>
          call.some(arg => String(arg).includes("Failed to insert validation amount:"))
        )).toBe(true);
        expect(calls.error.some(call =>
          call.some(arg => String(arg).includes("An error occurred:"))
        )).toBe(true);
      });

      it("should log network errors", async () => {
        const testPayload = createTestValidationAmount();
        const accountNameOwner = "testAccount";

        global.fetch = jest
          .fn()
          .mockRejectedValue(new Error("Connection failed"));
        consoleSpy.start();

        try {
          await insertValidationAmount(accountNameOwner, testPayload);
        } catch (error) {
          // Expected error
        }

        const calls = consoleSpy.getCalls();
        expect(calls.error.some(call =>
          call.some(arg => String(arg).includes("An error occurred:"))
        )).toBe(true);
      });

      it("should log unknown error fallback", async () => {
        const testPayload = createTestValidationAmount();
        const accountNameOwner = "testAccount";

        global.fetch = jest.fn().mockResolvedValue({
          ok: false,
          status: 500,
          json: jest.fn().mockResolvedValue({}), // No error field
        });
        consoleSpy.start();

        try {
          await insertValidationAmount(accountNameOwner, testPayload);
        } catch (error) {
          // Expected error
        }

        const calls = consoleSpy.getCalls();
        expect(calls.error.some(call =>
          call.some(arg => String(arg).includes("HTTP error! Status: 500"))
        )).toBe(true);
        expect(calls.error.some(call =>
          call.some(arg => String(arg).includes("An error occurred:"))
        )).toBe(true);
      });
    });

    describe("Integration scenarios", () => {
      it("should handle complete validation amount creation workflow", async () => {
        const testPayload = createTestValidationAmount({
          validationDate: new Date("2024-06-30T18:00:00.000Z"),
          accountId: 987654,
          amount: 15750.25,
          transactionState: "cleared" as TransactionState,
          activeStatus: true,
        });
        const accountNameOwner = "integrationTestAccount";

        const expectedResponse = {
          validationId: 555555,
          validationDate: new Date("2024-06-30T18:00:00.000Z"),
          accountId: 987654,
          amount: 15750.25,
          transactionState: "cleared" as TransactionState,
          activeStatus: true,
          dateAdded: new Date("2024-06-30T18:05:00.000Z"),
          dateUpdated: new Date("2024-06-30T18:05:00.000Z"),
        };

        global.fetch = createFetchMock(expectedResponse);

        const result = await insertValidationAmount(
          accountNameOwner,
          testPayload,
        );

        expect(result).toEqual(expectedResponse);
        expect(result!.validationId).toBe(555555);
        expect(result!.amount).toBe(15750.25);
      });

      it("should handle validation amount creation to API error chain", async () => {
        const testPayload = createTestValidationAmount({
          amount: -999999, // Invalid large negative amount
        });
        const accountNameOwner = "errorChainAccount";

        global.fetch = createErrorFetchMock(
          "Amount exceeds allowed negative limit",
          400,
        );
        consoleSpy.start();

        await expect(
          insertValidationAmount(accountNameOwner, testPayload),
        ).rejects.toThrow("Amount exceeds allowed negative limit");

        const calls = consoleSpy.getCalls();
        expect(calls.error.some(call =>
          call.some(arg => String(arg).includes("Amount exceeds allowed negative limit"))
        )).toBe(true);
        expect(calls.error.some(call =>
          call.some(arg => String(arg).includes("An error occurred:"))
        )).toBe(true);
      });

      it("should handle duplicate validation amount detection", async () => {
        const testPayload = createTestValidationAmount();
        const accountNameOwner = "duplicateTestAccount";

        global.fetch = createErrorFetchMock(
          "Duplicate validation amount for this account and date",
          409,
        );
        consoleSpy.start();

        await expect(
          insertValidationAmount(accountNameOwner, testPayload),
        ).rejects.toThrow(
          "Duplicate validation amount for this account and date",
        );

        const calls = consoleSpy.getCalls();
        expect(calls.error.some(call =>
          call.some(arg => String(arg).includes("Duplicate validation amount for this account and date"))
        )).toBe(true);
        expect(calls.error.some(call =>
          call.some(arg => String(arg).includes("An error occurred:"))
        )).toBe(true);
      });
    });
  });
});
