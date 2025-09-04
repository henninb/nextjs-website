/**
 * Isolated tests for usePendingTransactionInsert business logic
 * Tests insertPendingTransaction function without React Query overhead
 */

import {
  createFetchMock,
  createErrorFetchMock,
  ConsoleSpy,
} from "../../testHelpers";
import PendingTransaction from "../../model/PendingTransaction";

import { insertPendingTransaction } from "../../hooks/usePendingTransactionInsert";

// Helper function to create test pending transaction data
const createTestPendingTransaction = (overrides: Partial<PendingTransaction> = {}): PendingTransaction => ({
  pendingTransactionId: 1,
  accountNameOwner: "testUser",
  transactionDate: new Date("2024-01-01T00:00:00.000Z"),
  description: "Test pending transaction",
  amount: 100.50,
  reviewStatus: "pending",
  ...overrides,
});

describe("usePendingTransactionInsert Business Logic (Isolated)", () => {
  let consoleSpy: ConsoleSpy;

  beforeEach(() => {
    consoleSpy = new ConsoleSpy();
    jest.clearAllMocks();
  });

  afterEach(() => {
    consoleSpy.stop();
  });

  describe("insertPendingTransaction", () => {
    describe("Successful pending transaction creation", () => {
      it("should create pending transaction successfully", async () => {
        const testPendingTransaction = createTestPendingTransaction();
        const expectedResponse = {
          ...testPendingTransaction,
          pendingTransactionId: 42,
        };

        global.fetch = createFetchMock(expectedResponse);
        consoleSpy.start();

        const result = await insertPendingTransaction(testPendingTransaction);

        expect(result).toEqual(expectedResponse);
        expect(fetch).toHaveBeenCalledWith("/api/pending/transaction/insert", {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(testPendingTransaction),
        });

        const calls = consoleSpy.getCalls();
        expect(calls.log[0][0]).toContain("Sending data:");
        expect(calls.log[0][0]).toContain(JSON.stringify(testPendingTransaction));
      });

      it("should log the data being sent before API call", async () => {
        const testPendingTransaction = createTestPendingTransaction({
          description: "Important pending transaction",
          amount: 250.75,
        });

        global.fetch = createFetchMock({ pendingTransactionId: 1 });
        consoleSpy.start();

        await insertPendingTransaction(testPendingTransaction);

        const calls = consoleSpy.getCalls();
        expect(calls.log[0]).toEqual([`Sending data: ${JSON.stringify(testPendingTransaction)}`]);
      });

      it("should handle different review statuses", async () => {
        const reviewStatuses = ["pending", "approved", "rejected", "under_review"];

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

        expect(result).toEqual(testPendingTransaction);
      });
    });

    describe("API error handling", () => {
      it("should handle 400 error with response message", async () => {
        const testPendingTransaction = createTestPendingTransaction();
        global.fetch = createErrorFetchMock("Invalid pending transaction data", 400);
        consoleSpy.start();

        await expect(insertPendingTransaction(testPendingTransaction)).rejects.toThrow(
          "Invalid pending transaction data",
        );

        const calls = consoleSpy.getCalls();
        expect(calls.log).toEqual([
          [`Sending data: ${JSON.stringify(testPendingTransaction)}`],
          ["Invalid pending transaction data"],
        ]);
      });

      it("should handle 409 conflict error", async () => {
        const testPendingTransaction = createTestPendingTransaction();
        global.fetch = createErrorFetchMock("Pending transaction already exists", 409);
        consoleSpy.start();

        await expect(insertPendingTransaction(testPendingTransaction)).rejects.toThrow(
          "Pending transaction already exists",
        );

        const calls = consoleSpy.getCalls();
        expect(calls.log).toEqual([
          [`Sending data: ${JSON.stringify(testPendingTransaction)}`],
          ["Pending transaction already exists"],
        ]);
      });

      it("should handle 500 server error", async () => {
        const testPendingTransaction = createTestPendingTransaction();
        global.fetch = createErrorFetchMock("Internal server error", 500);
        consoleSpy.start();

        await expect(insertPendingTransaction(testPendingTransaction)).rejects.toThrow(
          "Internal server error",
        );

        const calls = consoleSpy.getCalls();
        expect(calls.log).toEqual([
          [`Sending data: ${JSON.stringify(testPendingTransaction)}`],
          ["Internal server error"],
        ]);
      });

      it("should handle error response without message", async () => {
        const testPendingTransaction = createTestPendingTransaction();
        global.fetch = jest.fn().mockResolvedValue({
          ok: false,
          status: 400,
          json: jest.fn().mockResolvedValue({}),
        });
        consoleSpy.start();

        await expect(insertPendingTransaction(testPendingTransaction)).rejects.toThrow(
          "Failed to parse error response: No error message returned.",
        );

        const calls = consoleSpy.getCalls();
        expect(calls.log[0][0]).toContain("Sending data:");
        expect(calls.log[1]).toEqual(["Failed to parse error response: No error message returned."]);
      });

      it("should handle malformed error response", async () => {
        const testPendingTransaction = createTestPendingTransaction();
        global.fetch = jest.fn().mockResolvedValue({
          ok: false,
          status: 400,
          json: jest.fn().mockRejectedValue(new Error("Invalid JSON")),
        });
        consoleSpy.start();

        await expect(insertPendingTransaction(testPendingTransaction)).rejects.toThrow(
          "Failed to parse error response: Invalid JSON",
        );

        const calls = consoleSpy.getCalls();
        expect(calls.log).toEqual([
          [`Sending data: ${JSON.stringify(testPendingTransaction)}`],
          ["Failed to parse error response: Invalid JSON"],
        ]);
      });

      it("should handle network errors", async () => {
        const testPendingTransaction = createTestPendingTransaction();
        global.fetch = jest.fn().mockRejectedValue(new Error("Network error"));
        consoleSpy.start();

        await expect(insertPendingTransaction(testPendingTransaction)).rejects.toThrow(
          "Network error",
        );

        const calls = consoleSpy.getCalls();
        expect(calls.log[0][0]).toContain("Sending data:");
      });

      it("should handle timeout errors", async () => {
        const testPendingTransaction = createTestPendingTransaction();
        global.fetch = jest.fn().mockRejectedValue(new Error("Request timeout"));
        consoleSpy.start();

        await expect(insertPendingTransaction(testPendingTransaction)).rejects.toThrow(
          "Request timeout",
        );

        const calls = consoleSpy.getCalls();
        expect(calls.log[0][0]).toContain("Sending data:");
      });

      it("should handle unknown error fallback", async () => {
        const testPendingTransaction = createTestPendingTransaction();
        global.fetch = jest.fn().mockResolvedValue({
          ok: false,
          status: 400,
          json: jest.fn().mockResolvedValue({ response: "" }), // Empty error message
        });
        consoleSpy.start();

        await expect(insertPendingTransaction(testPendingTransaction)).rejects.toThrow(
          "Failed to parse error response: No error message returned.",
        );

        const calls = consoleSpy.getCalls();
        expect(calls.log).toEqual([
          [`Sending data: ${JSON.stringify(testPendingTransaction)}`],
          ["Failed to parse error response: No error message returned."],
        ]);
      });
    });

    describe("Request format validation", () => {
      it("should send correct headers", async () => {
        const testPendingTransaction = createTestPendingTransaction();
        global.fetch = createFetchMock({ pendingTransactionId: 1 });

        await insertPendingTransaction(testPendingTransaction);

        expect(fetch).toHaveBeenCalledWith("/api/pending/transaction/insert", {
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
          "/api/pending/transaction/insert",
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
        const amounts = [0.01, 100.50, 1000.00, 9999.99, 0];

        for (const amount of amounts) {
          const testPendingTransaction = createTestPendingTransaction({ amount });

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
          const testPendingTransaction = createTestPendingTransaction({ transactionDate });

          global.fetch = createFetchMock({ ...testPendingTransaction });

          const result = await insertPendingTransaction(testPendingTransaction);

          expect(result.transactionDate).toEqual(transactionDate);
        }
      });

      it("should handle complex pending transaction workflows", async () => {
        const testPendingTransaction = createTestPendingTransaction({
          accountNameOwner: "businessAccount",
          description: "Quarterly tax payment - pending approval",
          amount: 5000.00,
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
        expect(result.amount).toBe(5000.00);
        expect(result.reviewStatus).toBe("under_review");
      });

      it("should handle pending transaction validation scenarios", async () => {
        const testPendingTransaction = createTestPendingTransaction({
          description: "High-value transaction requiring approval",
          amount: 10000.00,
          reviewStatus: "pending",
        });

        global.fetch = createFetchMock({ ...testPendingTransaction });

        const result = await insertPendingTransaction(testPendingTransaction);

        expect(result.amount).toBe(10000.00);
        expect(result.reviewStatus).toBe("pending");
        expect(result.description).toBe("High-value transaction requiring approval");
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

        expect(result.description).toBe("Monthly recurring payment - auto-generated");
        expect(result.reviewStatus).toBe("approved");
        expect(result.amount).toBe(299.99);
      });
    });

    describe("Edge cases", () => {
      it("should handle special characters in descriptions", async () => {
        const specialDescription = "Payment for Smith & Co: Invoice #123-ABC!@#";
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

    describe("Console logging", () => {
      it("should always log data being sent", async () => {
        const testPendingTransaction = createTestPendingTransaction();
        global.fetch = createFetchMock({ pendingTransactionId: 1 });
        consoleSpy.start();

        await insertPendingTransaction(testPendingTransaction);

        const calls = consoleSpy.getCalls();
        expect(calls.log[0][0]).toMatch(/^Sending data: /);
        expect(calls.log[0][0]).toContain(JSON.stringify(testPendingTransaction));
      });

      it("should log API error messages", async () => {
        const testPendingTransaction = createTestPendingTransaction();
        global.fetch = createErrorFetchMock("Validation failed", 400);
        consoleSpy.start();

        try {
          await insertPendingTransaction(testPendingTransaction);
        } catch (error) {
          // Expected error
        }

        const calls = consoleSpy.getCalls();
        expect(calls.log).toEqual([
          [`Sending data: ${JSON.stringify(testPendingTransaction)}`],
          ["Validation failed"],
        ]);
      });

      it("should log parsing errors", async () => {
        const testPendingTransaction = createTestPendingTransaction();
        global.fetch = jest.fn().mockResolvedValue({
          ok: false,
          status: 400,
          json: jest.fn().mockRejectedValue(new Error("JSON parse error")),
        });
        consoleSpy.start();

        try {
          await insertPendingTransaction(testPendingTransaction);
        } catch (error) {
          // Expected error
        }

        const calls = consoleSpy.getCalls();
        expect(calls.log).toEqual([
          [`Sending data: ${JSON.stringify(testPendingTransaction)}`],
          ["Failed to parse error response: JSON parse error"],
        ]);
      });

      it("should log unknown error fallback", async () => {
        const testPendingTransaction = createTestPendingTransaction();
        global.fetch = jest.fn().mockResolvedValue({
          ok: false,
          status: 500,
          json: jest.fn().mockResolvedValue({ response: null }), // Null error message
        });
        consoleSpy.start();

        try {
          await insertPendingTransaction(testPendingTransaction);
        } catch (error) {
          // Expected error
        }

        const calls = consoleSpy.getCalls();
        expect(calls.log).toEqual([
          [`Sending data: ${JSON.stringify(testPendingTransaction)}`],
          ["Failed to parse error response: No error message returned."],
        ]);
      });
    });

    describe("Integration scenarios", () => {
      it("should handle complete pending transaction creation workflow", async () => {
        const testPendingTransaction = createTestPendingTransaction({
          accountNameOwner: "corporateAccount",
          transactionDate: new Date("2024-06-30T18:00:00.000Z"),
          description: "End of quarter expense - requires CFO approval",
          amount: 15000.00,
          reviewStatus: "under_review",
        });

        const expectedResponse = {
          pendingTransactionId: 555,
          accountNameOwner: "corporateAccount",
          transactionDate: new Date("2024-06-30T18:00:00.000Z"),
          description: "End of quarter expense - requires CFO approval",
          amount: 15000.00,
          reviewStatus: "under_review",
        };

        global.fetch = createFetchMock(expectedResponse);
        consoleSpy.start();

        const result = await insertPendingTransaction(testPendingTransaction);

        expect(result).toEqual(expectedResponse);
        expect(result.pendingTransactionId).toBe(555);
        expect(result.amount).toBe(15000.00);

        const calls = consoleSpy.getCalls();
        expect(calls.log[0][0]).toContain("Sending data:");
        expect(calls.log[0][0]).toContain(JSON.stringify(testPendingTransaction));
      });

      it("should handle validation to API error chain", async () => {
        const testPendingTransaction = createTestPendingTransaction({
          amount: -999999, // Invalid large negative amount
        });

        global.fetch = createErrorFetchMock("Amount exceeds allowed negative limit", 400);
        consoleSpy.start();

        await expect(insertPendingTransaction(testPendingTransaction)).rejects.toThrow(
          "Amount exceeds allowed negative limit",
        );

        const calls = consoleSpy.getCalls();
        expect(calls.log).toEqual([
          [`Sending data: ${JSON.stringify(testPendingTransaction)}`],
          ["Amount exceeds allowed negative limit"],
        ]);
      });

      it("should handle duplicate pending transaction detection", async () => {
        const testPendingTransaction = createTestPendingTransaction();

        global.fetch = createErrorFetchMock("Duplicate pending transaction detected", 409);
        consoleSpy.start();

        await expect(insertPendingTransaction(testPendingTransaction)).rejects.toThrow(
          "Duplicate pending transaction detected",
        );

        const calls = consoleSpy.getCalls();
        expect(calls.log).toEqual([
          [`Sending data: ${JSON.stringify(testPendingTransaction)}`],
          ["Duplicate pending transaction detected"],
        ]);
      });
    });
  });
});