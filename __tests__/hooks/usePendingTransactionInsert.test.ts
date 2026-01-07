/**
 * Isolated tests for usePendingTransactionInsert business logic
 * Tests insertPendingTransaction function without React Query overhead
 */

// Mock HookValidator
jest.mock("../../utils/hookValidation", () => ({
  HookValidator: {
    validateInsert: jest.fn((data) => data),
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

// Mock logger
jest.mock("../../utils/logger", () => ({
  createHookLogger: jest.fn(() => ({
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  })),
}));

// Mock validation utilities
jest.mock("../../utils/validation", () => ({
  DataValidator: {
    validatePendingTransaction: jest.fn(),
  },
  ValidationError: jest.fn(),
}));

import { createFetchMock, createErrorFetchMock } from "../../testHelpers";
import PendingTransaction from "../../model/PendingTransaction";

import { insertPendingTransaction } from "../../hooks/usePendingTransactionInsert";
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

const mockValidateInsert = HookValidator.validateInsert as jest.Mock;

// Helper function to create test pending transaction data
const createTestPendingTransaction = (
  overrides: Partial<PendingTransaction> = {},
): PendingTransaction => ({
  pendingTransactionId: 1,
  accountNameOwner: "testUser",
  transactionDate: new Date("2024-01-01T00:00:00.000Z"),
  description: "Test pending transaction",
  amount: 100.5,
  reviewStatus: "pending",
  ...overrides,
});

describe("usePendingTransactionInsert Business Logic", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset validation mock
    mockValidateInsert.mockImplementation((data) => data);
  });

  afterEach(() => {});

  describe("insertPendingTransaction", () => {
    describe("Successful pending transaction creation", () => {
      it("should create pending transaction successfully", async () => {
        const testPendingTransaction = createTestPendingTransaction();
        const expectedResponse = {
          ...testPendingTransaction,
          pendingTransactionId: 42,
        };

        global.fetch = createFetchMock(expectedResponse);

        const result = await insertPendingTransaction(testPendingTransaction);

        expect(result).toStrictEqual(expectedResponse);
        expect(fetch).toHaveBeenCalledWith("/api/pending/transaction", {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(testPendingTransaction),
        });
      });

      it("should log the data being sent before API call", async () => {
        const testPendingTransaction = createTestPendingTransaction({
          description: "Important pending transaction",
          amount: 250.75,
        });

        global.fetch = createFetchMock({ pendingTransactionId: 1 });

        await insertPendingTransaction(testPendingTransaction);
      });

      it("should handle different review statuses", async () => {
        const reviewStatuses = [
          "pending",
          "approved",
          "rejected",
          "under_review",
        ];

        for (const status of reviewStatuses) {
          const testPendingTransaction = createTestPendingTransaction({
            reviewStatus: status,
          });

          global.fetch = createFetchMock({ ...testPendingTransaction });

          const result = await insertPendingTransaction(testPendingTransaction);

          expect(result.reviewStatus).toBe(status);
        }
      });

      it("should handle different account owners", async () => {
        const testPendingTransaction = createTestPendingTransaction({
          accountNameOwner: "differentUser",
        });

        global.fetch = createFetchMock({ ...testPendingTransaction });

        const result = await insertPendingTransaction(testPendingTransaction);

        expect(result.accountNameOwner).toBe("differentUser");
      });

      it("should preserve all transaction properties", async () => {
        const testPendingTransaction = createTestPendingTransaction({
          pendingTransactionId: 999,
          accountNameOwner: "specialUser",
          transactionDate: new Date("2024-06-15T14:30:00.000Z"),
          description: "Special pending transaction",
          amount: 1500.25,
          reviewStatus: "under_review",
        });

        global.fetch = createFetchMock({ ...testPendingTransaction });

        const result = await insertPendingTransaction(testPendingTransaction);

        expect(result).toStrictEqual(testPendingTransaction);
      });
    });

    describe("API error handling", () => {
      it("should handle 400 error with response message", async () => {
        const testPendingTransaction = createTestPendingTransaction();
        global.fetch = createErrorFetchMock(
          "Invalid pending transaction data",
          400,
        );

        await expect(
          insertPendingTransaction(testPendingTransaction),
        ).rejects.toThrow("Invalid pending transaction data");
      });

      it("should handle 409 conflict error", async () => {
        const testPendingTransaction = createTestPendingTransaction();
        global.fetch = createErrorFetchMock(
          "Pending transaction already exists",
          409,
        );

        await expect(
          insertPendingTransaction(testPendingTransaction),
        ).rejects.toThrow("Pending transaction already exists");
      });

      it("should handle 500 server error", async () => {
        const testPendingTransaction = createTestPendingTransaction();
        global.fetch = createErrorFetchMock("Internal server error", 500);

        await expect(
          insertPendingTransaction(testPendingTransaction),
        ).rejects.toThrow("Internal server error");
      });

      it("should handle error response without message", async () => {
        const testPendingTransaction = createTestPendingTransaction();
        global.fetch = jest.fn().mockResolvedValue({
          ok: false,
          status: 400,
          json: jest.fn().mockResolvedValue({}),
        });

        await expect(
          insertPendingTransaction(testPendingTransaction),
        ).rejects.toThrow("HTTP 400");
      });

      it("should handle malformed error response", async () => {
        const testPendingTransaction = createTestPendingTransaction();
        global.fetch = jest.fn().mockResolvedValue({
          ok: false,
          status: 400,
          json: jest.fn().mockRejectedValue(new Error("Invalid JSON")),
        });

        await expect(
          insertPendingTransaction(testPendingTransaction),
        ).rejects.toThrow("HTTP 400");
      });

      it("should handle network errors", async () => {
        const testPendingTransaction = createTestPendingTransaction();
        global.fetch = jest.fn().mockRejectedValue(new Error("Network error"));

        await expect(
          insertPendingTransaction(testPendingTransaction),
        ).rejects.toThrow("Network error");
      });

      it("should handle timeout errors", async () => {
        const testPendingTransaction = createTestPendingTransaction();
        global.fetch = jest
          .fn()
          .mockRejectedValue(new Error("Request timeout"));

        await expect(
          insertPendingTransaction(testPendingTransaction),
        ).rejects.toThrow("Request timeout");
      });

      it("should handle unknown error fallback", async () => {
        const testPendingTransaction = createTestPendingTransaction();
        global.fetch = jest.fn().mockResolvedValue({
          ok: false,
          status: 400,
          json: jest.fn().mockResolvedValue({ response: "" }), // Empty error message
        });

        await expect(
          insertPendingTransaction(testPendingTransaction),
        ).rejects.toThrow("HTTP 400");
      });
    });

    describe("Request format validation", () => {
      it("should send correct headers", async () => {
        const testPendingTransaction = createTestPendingTransaction();
        global.fetch = createFetchMock({ pendingTransactionId: 1 });

        await insertPendingTransaction(testPendingTransaction);

        expect(fetch).toHaveBeenCalledWith("/api/pending/transaction", {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: expect.any(String),
        });
      });

      it("should use correct endpoint", async () => {
        const testPendingTransaction = createTestPendingTransaction();
        global.fetch = createFetchMock({ pendingTransactionId: 1 });

        await insertPendingTransaction(testPendingTransaction);

        expect(fetch).toHaveBeenCalledWith(
          "/api/pending/transaction",
          expect.any(Object),
        );
      });

      it("should send POST method", async () => {
        const testPendingTransaction = createTestPendingTransaction();
        global.fetch = createFetchMock({ pendingTransactionId: 1 });

        await insertPendingTransaction(testPendingTransaction);

        expect(fetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({ method: "POST" }),
        );
      });

      it("should include credentials", async () => {
        const testPendingTransaction = createTestPendingTransaction();
        global.fetch = createFetchMock({ pendingTransactionId: 1 });

        await insertPendingTransaction(testPendingTransaction);

        expect(fetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({ credentials: "include" }),
        );
      });

      it("should stringify the pending transaction data", async () => {
        const testPendingTransaction = createTestPendingTransaction();
        global.fetch = createFetchMock({ pendingTransactionId: 1 });

        await insertPendingTransaction(testPendingTransaction);

        expect(fetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            body: JSON.stringify(testPendingTransaction),
          }),
        );
      });
    });

    describe("Business logic scenarios", () => {
      it("should handle pending transactions for different account types", async () => {
        const accountTypes = ["checking", "savings", "credit", "investment"];

        for (const accountType of accountTypes) {
          const testPendingTransaction = createTestPendingTransaction({
            accountNameOwner: `${accountType}-account`,
            description: `Pending ${accountType} transaction`,
          });

          global.fetch = createFetchMock({ ...testPendingTransaction });

          const result = await insertPendingTransaction(testPendingTransaction);

          expect(result.accountNameOwner).toBe(`${accountType}-account`);
          expect(result.description).toBe(`Pending ${accountType} transaction`);
        }
      });

      it("should handle different amount types", async () => {
        const amounts = [0.01, 100.5, 1000.0, 9999.99, 0];

        for (const amount of amounts) {
          const testPendingTransaction = createTestPendingTransaction({
            amount,
          });

          global.fetch = createFetchMock({ ...testPendingTransaction });

          const result = await insertPendingTransaction(testPendingTransaction);

          expect(result.amount).toBe(amount);
        }
      });

      it("should handle various transaction dates", async () => {
        const dates = [
          new Date("2024-01-01T00:00:00.000Z"), // Past date
          new Date(), // Current date
          new Date("2025-12-31T23:59:59.000Z"), // Future date
        ];

        for (const transactionDate of dates) {
          const testPendingTransaction = createTestPendingTransaction({
            transactionDate,
          });

          global.fetch = createFetchMock({ ...testPendingTransaction });

          const result = await insertPendingTransaction(testPendingTransaction);

          expect(result.transactionDate).toStrictEqual(transactionDate);
        }
      });

      it("should handle complex pending transaction workflows", async () => {
        const testPendingTransaction = createTestPendingTransaction({
          accountNameOwner: "businessAccount",
          description: "Quarterly tax payment - pending approval",
          amount: 5000.0,
          reviewStatus: "under_review",
          transactionDate: new Date("2024-03-31T23:59:59.000Z"),
        });

        global.fetch = createFetchMock({
          ...testPendingTransaction,
          pendingTransactionId: 789,
        });

        const result = await insertPendingTransaction(testPendingTransaction);

        expect(result.pendingTransactionId).toBe(789);
        expect(result.accountNameOwner).toBe("businessAccount");
        expect(result.amount).toBe(5000.0);
        expect(result.reviewStatus).toBe("under_review");
      });

      it("should handle pending transaction validation scenarios", async () => {
        const testPendingTransaction = createTestPendingTransaction({
          description: "High-value transaction requiring approval",
          amount: 10000.0,
          reviewStatus: "pending",
        });

        global.fetch = createFetchMock({ ...testPendingTransaction });

        const result = await insertPendingTransaction(testPendingTransaction);

        expect(result.amount).toBe(10000.0);
        expect(result.reviewStatus).toBe("pending");
        expect(result.description).toBe(
          "High-value transaction requiring approval",
        );
      });

      it("should handle recurring pending transaction patterns", async () => {
        const testPendingTransaction = createTestPendingTransaction({
          description: "Monthly recurring payment - auto-generated",
          accountNameOwner: "recurringPayments",
          reviewStatus: "approved",
          amount: 299.99,
        });

        global.fetch = createFetchMock({ ...testPendingTransaction });

        const result = await insertPendingTransaction(testPendingTransaction);

        expect(result.description).toBe(
          "Monthly recurring payment - auto-generated",
        );
        expect(result.reviewStatus).toBe("approved");
        expect(result.amount).toBe(299.99);
      });
    });

    describe("Edge cases", () => {
      it("should handle special characters in descriptions", async () => {
        const specialDescription =
          "Payment for Smith & Co: Invoice #123-ABC!@#";
        const testPendingTransaction = createTestPendingTransaction({
          description: specialDescription,
        });

        global.fetch = createFetchMock({ ...testPendingTransaction });

        const result = await insertPendingTransaction(testPendingTransaction);

        expect(result.description).toBe(specialDescription);
      });

      it("should handle unicode characters in descriptions", async () => {
        const unicodeDescription = "支付给供应商 Payment to Supplier 💰";
        const testPendingTransaction = createTestPendingTransaction({
          description: unicodeDescription,
        });

        global.fetch = createFetchMock({ ...testPendingTransaction });

        const result = await insertPendingTransaction(testPendingTransaction);

        expect(result.description).toBe(unicodeDescription);
      });

      it("should handle very long descriptions", async () => {
        const longDescription = "A".repeat(1000);
        const testPendingTransaction = createTestPendingTransaction({
          description: longDescription,
        });

        global.fetch = createFetchMock({ ...testPendingTransaction });

        const result = await insertPendingTransaction(testPendingTransaction);

        expect(result.description).toBe(longDescription);
      });

      it("should handle special characters in account names", async () => {
        const specialAccountName = "Business Account & Co: 2024!";
        const testPendingTransaction = createTestPendingTransaction({
          accountNameOwner: specialAccountName,
        });

        global.fetch = createFetchMock({ ...testPendingTransaction });

        const result = await insertPendingTransaction(testPendingTransaction);

        expect(result.accountNameOwner).toBe(specialAccountName);
      });

      it("should handle unicode characters in account names", async () => {
        const unicodeAccountName = "企业账户 Business Account";
        const testPendingTransaction = createTestPendingTransaction({
          accountNameOwner: unicodeAccountName,
        });

        global.fetch = createFetchMock({ ...testPendingTransaction });

        const result = await insertPendingTransaction(testPendingTransaction);

        expect(result.accountNameOwner).toBe(unicodeAccountName);
      });

      it("should handle decimal precision amounts", async () => {
        const preciseAmount = 123.456789;
        const testPendingTransaction = createTestPendingTransaction({
          amount: preciseAmount,
        });

        global.fetch = createFetchMock({ ...testPendingTransaction });

        const result = await insertPendingTransaction(testPendingTransaction);

        expect(result.amount).toBe(preciseAmount);
      });

      it("should handle zero amounts", async () => {
        const testPendingTransaction = createTestPendingTransaction({
          amount: 0,
          description: "Zero amount test transaction",
        });

        global.fetch = createFetchMock({ ...testPendingTransaction });

        const result = await insertPendingTransaction(testPendingTransaction);

        expect(result.amount).toBe(0);
      });

      it("should handle negative amounts", async () => {
        const testPendingTransaction = createTestPendingTransaction({
          amount: -500.25,
          description: "Refund pending transaction",
        });

        global.fetch = createFetchMock({ ...testPendingTransaction });

        const result = await insertPendingTransaction(testPendingTransaction);

        expect(result.amount).toBe(-500.25);
      });

      it("should handle custom review status values", async () => {
        const customStatuses = [
          "waiting_approval",
          "escalated",
          "on_hold",
          "requires_documentation",
          "manager_review",
        ];

        for (const status of customStatuses) {
          const testPendingTransaction = createTestPendingTransaction({
            reviewStatus: status,
          });

          global.fetch = createFetchMock({ ...testPendingTransaction });

          const result = await insertPendingTransaction(testPendingTransaction);

          expect(result.reviewStatus).toBe(status);
        }
      });
    });

    describe("Integration scenarios", () => {
      it("should handle complete pending transaction creation workflow", async () => {
        const testPendingTransaction = createTestPendingTransaction({
          accountNameOwner: "corporateAccount",
          transactionDate: new Date("2024-06-30T18:00:00.000Z"),
          description: "End of quarter expense - requires CFO approval",
          amount: 15000.0,
          reviewStatus: "under_review",
        });

        const expectedResponse = {
          pendingTransactionId: 555,
          accountNameOwner: "corporateAccount",
          transactionDate: new Date("2024-06-30T18:00:00.000Z"),
          description: "End of quarter expense - requires CFO approval",
          amount: 15000.0,
          reviewStatus: "under_review",
        };

        global.fetch = createFetchMock(expectedResponse);

        const result = await insertPendingTransaction(testPendingTransaction);

        expect(result).toStrictEqual(expectedResponse);
        expect(result.pendingTransactionId).toBe(555);
        expect(result.amount).toBe(15000.0);
      });

      it("should handle validation to API error chain", async () => {
        const testPendingTransaction = createTestPendingTransaction({
          amount: -999999, // Invalid large negative amount
        });

        global.fetch = createErrorFetchMock(
          "Amount exceeds allowed negative limit",
          400,
        );

        await expect(
          insertPendingTransaction(testPendingTransaction),
        ).rejects.toThrow("Amount exceeds allowed negative limit");
      });

      it("should handle duplicate pending transaction detection", async () => {
        const testPendingTransaction = createTestPendingTransaction();

        global.fetch = createErrorFetchMock(
          "Duplicate pending transaction detected",
          409,
        );

        await expect(
          insertPendingTransaction(testPendingTransaction),
        ).rejects.toThrow("Duplicate pending transaction detected");
      });
    });
  });
});
