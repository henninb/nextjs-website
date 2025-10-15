/**
 * Isolated tests for usePendingTransactionUpdate business logic
 * Tests updatePendingTransaction function without React Query overhead
 */

import {
  createFetchMock,
  createErrorFetchMock,
  ConsoleSpy,
} from "../../testHelpers";
import PendingTransaction from "../../model/PendingTransaction";

import { updatePendingTransaction } from "../../hooks/usePendingTransactionUpdate";

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

describe("usePendingTransactionUpdate Business Logic (Isolated)", () => {
  let consoleSpy: ConsoleSpy;

  beforeEach(() => {
    consoleSpy = new ConsoleSpy();
    jest.clearAllMocks();
  });

  afterEach(() => {
    consoleSpy.stop();
  });

  describe("updatePendingTransaction", () => {
    describe("Successful updates", () => {
      it("should update pending transaction successfully", async () => {
        const oldPendingTransaction = createTestPendingTransaction({
          pendingTransactionId: 42,
          reviewStatus: "pending",
        });
        const newPendingTransaction = createTestPendingTransaction({
          pendingTransactionId: 42,
          reviewStatus: "approved",
          amount: 250.75,
        });

        const expectedResponse = {
          ...newPendingTransaction,
        };

        global.fetch = createFetchMock(expectedResponse);

        const result = await updatePendingTransaction(
          oldPendingTransaction,
          newPendingTransaction,
        );

        expect(result).toEqual(expectedResponse);
        expect(fetch).toHaveBeenCalledWith("/api/pending/transaction/42", {
          method: "PUT",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(newPendingTransaction),
        });
      });

      it("should use correct endpoint with pending transaction ID", async () => {
        const oldPendingTransaction = createTestPendingTransaction({
          pendingTransactionId: 999,
        });
        const newPendingTransaction = createTestPendingTransaction({
          pendingTransactionId: 999,
        });

        global.fetch = createFetchMock({ pendingTransactionId: 999 });

        await updatePendingTransaction(
          oldPendingTransaction,
          newPendingTransaction,
        );

        expect(fetch).toHaveBeenCalledWith(
          "/api/pending/transaction/999",
          expect.any(Object),
        );
      });

      it("should handle review status changes", async () => {
        const statusChanges = [
          { from: "pending", to: "approved" },
          { from: "approved", to: "rejected" },
          { from: "under_review", to: "approved" },
          { from: "pending", to: "under_review" },
        ];

        for (const statusChange of statusChanges) {
          const oldPendingTransaction = createTestPendingTransaction({
            reviewStatus: statusChange.from,
          });
          const newPendingTransaction = createTestPendingTransaction({
            reviewStatus: statusChange.to,
          });

          const expectedResponse = { ...newPendingTransaction };
          global.fetch = createFetchMock(expectedResponse);

          const result = await updatePendingTransaction(
            oldPendingTransaction,
            newPendingTransaction,
          );

          expect(result.reviewStatus).toBe(statusChange.to);
        }
      });

      it("should handle amount changes", async () => {
        const oldPendingTransaction = createTestPendingTransaction({
          amount: 100.0,
        });
        const newPendingTransaction = createTestPendingTransaction({
          amount: 250.5,
        });

        const expectedResponse = { ...newPendingTransaction };
        global.fetch = createFetchMock(expectedResponse);

        const result = await updatePendingTransaction(
          oldPendingTransaction,
          newPendingTransaction,
        );

        expect(result.amount).toBe(250.5);
      });

      it("should handle description changes", async () => {
        const oldPendingTransaction = createTestPendingTransaction({
          description: "Old description",
        });
        const newPendingTransaction = createTestPendingTransaction({
          description: "Updated description with more details",
        });

        const expectedResponse = { ...newPendingTransaction };
        global.fetch = createFetchMock(expectedResponse);

        const result = await updatePendingTransaction(
          oldPendingTransaction,
          newPendingTransaction,
        );

        expect(result.description).toBe(
          "Updated description with more details",
        );
      });

      it("should handle date changes", async () => {
        const oldPendingTransaction = createTestPendingTransaction({
          transactionDate: new Date("2024-01-01T00:00:00.000Z"),
        });
        const newDate = new Date("2024-06-15T14:30:00.000Z");
        const newPendingTransaction = createTestPendingTransaction({
          transactionDate: newDate,
        });

        const expectedResponse = { ...newPendingTransaction };
        global.fetch = createFetchMock(expectedResponse);

        const result = await updatePendingTransaction(
          oldPendingTransaction,
          newPendingTransaction,
        );

        expect(result.transactionDate).toEqual(newDate);
      });

      it("should handle account owner changes", async () => {
        const oldPendingTransaction = createTestPendingTransaction({
          accountNameOwner: "oldUser",
        });
        const newPendingTransaction = createTestPendingTransaction({
          accountNameOwner: "newUser",
        });

        const expectedResponse = { ...newPendingTransaction };
        global.fetch = createFetchMock(expectedResponse);

        const result = await updatePendingTransaction(
          oldPendingTransaction,
          newPendingTransaction,
        );

        expect(result.accountNameOwner).toBe("newUser");
      });
    });

    describe("Error handling", () => {
      it("should handle 404 not found errors with specific logging", async () => {
        const oldPendingTransaction = createTestPendingTransaction({
          pendingTransactionId: 999,
        });
        const newPendingTransaction = createTestPendingTransaction({
          pendingTransactionId: 999,
        });

        global.fetch = jest.fn().mockResolvedValue({
          ok: false,
          status: 404,
          statusText: "Not Found",
          json: jest.fn(),
        });
        consoleSpy.start();

        await expect(
          updatePendingTransaction(
            oldPendingTransaction,
            newPendingTransaction,
          ),
        ).rejects.toThrow("Failed to update pending transaction: Not Found");

        const calls = consoleSpy.getCalls();
        expect(calls.log).toEqual([
          ["Resource not found (404)."],
          [
            "An error occurred: Failed to update pending transaction: Not Found",
          ],
        ]);
      });

      it("should handle 400 bad request errors", async () => {
        const oldPendingTransaction = createTestPendingTransaction();
        const newPendingTransaction = createTestPendingTransaction();

        global.fetch = jest.fn().mockResolvedValue({
          ok: false,
          status: 400,
          statusText: "Bad Request",
          json: jest.fn(),
        });
        consoleSpy.start();

        await expect(
          updatePendingTransaction(
            oldPendingTransaction,
            newPendingTransaction,
          ),
        ).rejects.toThrow("Failed to update pending transaction: Bad Request");

        const calls = consoleSpy.getCalls();
        expect(calls.log[0]).toEqual([
          "An error occurred: Failed to update pending transaction: Bad Request",
        ]);
      });

      it("should handle 403 forbidden errors", async () => {
        const oldPendingTransaction = createTestPendingTransaction();
        const newPendingTransaction = createTestPendingTransaction();

        global.fetch = jest.fn().mockResolvedValue({
          ok: false,
          status: 403,
          statusText: "Forbidden",
          json: jest.fn(),
        });
        consoleSpy.start();

        await expect(
          updatePendingTransaction(
            oldPendingTransaction,
            newPendingTransaction,
          ),
        ).rejects.toThrow("Failed to update pending transaction: Forbidden");

        const calls = consoleSpy.getCalls();
        expect(calls.log[0]).toEqual([
          "An error occurred: Failed to update pending transaction: Forbidden",
        ]);
      });

      it("should handle 500 server errors", async () => {
        const oldPendingTransaction = createTestPendingTransaction();
        const newPendingTransaction = createTestPendingTransaction();

        global.fetch = jest.fn().mockResolvedValue({
          ok: false,
          status: 500,
          statusText: "Internal Server Error",
          json: jest.fn(),
        });
        consoleSpy.start();

        await expect(
          updatePendingTransaction(
            oldPendingTransaction,
            newPendingTransaction,
          ),
        ).rejects.toThrow(
          "Failed to update pending transaction: Internal Server Error",
        );

        const calls = consoleSpy.getCalls();
        expect(calls.log[0]).toEqual([
          "An error occurred: Failed to update pending transaction: Internal Server Error",
        ]);
      });

      it("should handle network errors", async () => {
        const oldPendingTransaction = createTestPendingTransaction();
        const newPendingTransaction = createTestPendingTransaction();

        global.fetch = jest.fn().mockRejectedValue(new Error("Network error"));
        consoleSpy.start();

        await expect(
          updatePendingTransaction(
            oldPendingTransaction,
            newPendingTransaction,
          ),
        ).rejects.toThrow("Network error");

        const calls = consoleSpy.getCalls();
        expect(calls.log[0]).toEqual(["An error occurred: Network error"]);
      });

      it("should handle timeout errors", async () => {
        const oldPendingTransaction = createTestPendingTransaction();
        const newPendingTransaction = createTestPendingTransaction();

        global.fetch = jest
          .fn()
          .mockRejectedValue(new Error("Request timeout"));
        consoleSpy.start();

        await expect(
          updatePendingTransaction(
            oldPendingTransaction,
            newPendingTransaction,
          ),
        ).rejects.toThrow("Request timeout");

        const calls = consoleSpy.getCalls();
        expect(calls.log[0]).toEqual(["An error occurred: Request timeout"]);
      });

      it("should handle JSON parsing errors", async () => {
        const oldPendingTransaction = createTestPendingTransaction();
        const newPendingTransaction = createTestPendingTransaction();

        global.fetch = jest.fn().mockResolvedValue({
          ok: true,
          status: 200,
          json: jest.fn().mockRejectedValue(new Error("Invalid JSON")),
        });
        consoleSpy.start();

        await expect(
          updatePendingTransaction(
            oldPendingTransaction,
            newPendingTransaction,
          ),
        ).rejects.toThrow("Invalid JSON");

        const calls = consoleSpy.getCalls();
        expect(calls.log[0]).toEqual(["An error occurred: Invalid JSON"]);
      });
    });

    describe("Request format validation", () => {
      it("should use PUT method", async () => {
        const oldPendingTransaction = createTestPendingTransaction();
        const newPendingTransaction = createTestPendingTransaction();

        global.fetch = createFetchMock({ pendingTransactionId: 1 });

        await updatePendingTransaction(
          oldPendingTransaction,
          newPendingTransaction,
        );

        expect(fetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({ method: "PUT" }),
        );
      });

      it("should include credentials", async () => {
        const oldPendingTransaction = createTestPendingTransaction();
        const newPendingTransaction = createTestPendingTransaction();

        global.fetch = createFetchMock({ pendingTransactionId: 1 });

        await updatePendingTransaction(
          oldPendingTransaction,
          newPendingTransaction,
        );

        expect(fetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({ credentials: "include" }),
        );
      });

      it("should send correct headers", async () => {
        const oldPendingTransaction = createTestPendingTransaction();
        const newPendingTransaction = createTestPendingTransaction();

        global.fetch = createFetchMock({ pendingTransactionId: 1 });

        await updatePendingTransaction(
          oldPendingTransaction,
          newPendingTransaction,
        );

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

      it("should stringify the new pending transaction data", async () => {
        const oldPendingTransaction = createTestPendingTransaction({
          pendingTransactionId: 123,
        });
        const newPendingTransaction = createTestPendingTransaction({
          pendingTransactionId: 123,
          description: "Updated transaction",
        });

        global.fetch = createFetchMock({ pendingTransactionId: 123 });

        await updatePendingTransaction(
          oldPendingTransaction,
          newPendingTransaction,
        );

        expect(fetch).toHaveBeenCalledWith(
          "/api/pending/transaction/123",
          expect.objectContaining({
            body: JSON.stringify(newPendingTransaction),
          }),
        );
      });
    });

    describe("Business logic scenarios", () => {
      it("should handle pending transaction approval workflow", async () => {
        const oldPendingTransaction = createTestPendingTransaction({
          pendingTransactionId: 100,
          reviewStatus: "pending",
          description: "Large expense awaiting approval",
          amount: 5000.0,
        });
        const newPendingTransaction = createTestPendingTransaction({
          pendingTransactionId: 100,
          reviewStatus: "approved",
          description: "Large expense awaiting approval",
          amount: 5000.0,
        });

        const expectedResponse = { ...newPendingTransaction };
        global.fetch = createFetchMock(expectedResponse);

        const result = await updatePendingTransaction(
          oldPendingTransaction,
          newPendingTransaction,
        );

        expect(result.reviewStatus).toBe("approved");
        expect(result.amount).toBe(5000.0);
        expect(result.pendingTransactionId).toBe(100);
      });

      it("should handle pending transaction rejection workflow", async () => {
        const oldPendingTransaction = createTestPendingTransaction({
          reviewStatus: "under_review",
          description: "Questionable expense",
        });
        const newPendingTransaction = createTestPendingTransaction({
          reviewStatus: "rejected",
          description: "Questionable expense - denied",
        });

        const expectedResponse = { ...newPendingTransaction };
        global.fetch = createFetchMock(expectedResponse);

        const result = await updatePendingTransaction(
          oldPendingTransaction,
          newPendingTransaction,
        );

        expect(result.reviewStatus).toBe("rejected");
        expect(result.description).toBe("Questionable expense - denied");
      });

      it("should handle amount adjustments during review", async () => {
        const oldPendingTransaction = createTestPendingTransaction({
          amount: 1000.0,
          reviewStatus: "pending",
        });
        const newPendingTransaction = createTestPendingTransaction({
          amount: 750.0, // Adjusted down
          reviewStatus: "approved",
        });

        const expectedResponse = { ...newPendingTransaction };
        global.fetch = createFetchMock(expectedResponse);

        const result = await updatePendingTransaction(
          oldPendingTransaction,
          newPendingTransaction,
        );

        expect(result.amount).toBe(750.0);
        expect(result.reviewStatus).toBe("approved");
      });

      it("should handle account reassignment during review", async () => {
        const oldPendingTransaction = createTestPendingTransaction({
          accountNameOwner: "departmentA",
          reviewStatus: "pending",
        });
        const newPendingTransaction = createTestPendingTransaction({
          accountNameOwner: "departmentB",
          reviewStatus: "approved",
        });

        const expectedResponse = { ...newPendingTransaction };
        global.fetch = createFetchMock(expectedResponse);

        const result = await updatePendingTransaction(
          oldPendingTransaction,
          newPendingTransaction,
        );

        expect(result.accountNameOwner).toBe("departmentB");
        expect(result.reviewStatus).toBe("approved");
      });

      it("should handle complex workflow state transitions", async () => {
        const workflowStates = [
          { from: "pending", to: "under_review" },
          { from: "under_review", to: "requires_documentation" },
          { from: "requires_documentation", to: "approved" },
        ];

        for (const transition of workflowStates) {
          const oldPendingTransaction = createTestPendingTransaction({
            reviewStatus: transition.from,
          });
          const newPendingTransaction = createTestPendingTransaction({
            reviewStatus: transition.to,
          });

          global.fetch = createFetchMock({ ...newPendingTransaction });

          const result = await updatePendingTransaction(
            oldPendingTransaction,
            newPendingTransaction,
          );
          expect(result.reviewStatus).toBe(transition.to);
        }
      });

      it("should handle zero pending transaction ID", async () => {
        const oldPendingTransaction = createTestPendingTransaction({
          pendingTransactionId: 0,
        });
        const newPendingTransaction = createTestPendingTransaction({
          pendingTransactionId: 0,
        });

        global.fetch = createFetchMock({ pendingTransactionId: 0 });

        await updatePendingTransaction(
          oldPendingTransaction,
          newPendingTransaction,
        );

        expect(fetch).toHaveBeenCalledWith(
          "/api/pending/transaction/0",
          expect.any(Object),
        );
      });

      it("should handle large pending transaction IDs", async () => {
        const largeId = 999999999;
        const oldPendingTransaction = createTestPendingTransaction({
          pendingTransactionId: largeId,
        });
        const newPendingTransaction = createTestPendingTransaction({
          pendingTransactionId: largeId,
        });

        global.fetch = createFetchMock({ pendingTransactionId: largeId });

        await updatePendingTransaction(
          oldPendingTransaction,
          newPendingTransaction,
        );

        expect(fetch).toHaveBeenCalledWith(
          `/api/pending/transaction/${largeId}`,
          expect.any(Object),
        );
      });
    });

    describe("Edge cases", () => {
      it("should handle special characters in descriptions", async () => {
        const oldPendingTransaction = createTestPendingTransaction();
        const newPendingTransaction = createTestPendingTransaction({
          description: "Expense for Smith & Co: Invoice #123-ABC!@#",
        });

        const expectedResponse = { ...newPendingTransaction };
        global.fetch = createFetchMock(expectedResponse);

        const result = await updatePendingTransaction(
          oldPendingTransaction,
          newPendingTransaction,
        );

        expect(result.description).toBe(
          "Expense for Smith & Co: Invoice #123-ABC!@#",
        );
      });

      it("should handle unicode characters in descriptions", async () => {
        const oldPendingTransaction = createTestPendingTransaction();
        const newPendingTransaction = createTestPendingTransaction({
          description: "支付给供应商 Payment to Supplier 💰",
        });

        const expectedResponse = { ...newPendingTransaction };
        global.fetch = createFetchMock(expectedResponse);

        const result = await updatePendingTransaction(
          oldPendingTransaction,
          newPendingTransaction,
        );

        expect(result.description).toBe("支付给供应商 Payment to Supplier 💰");
      });

      it("should handle very long descriptions", async () => {
        const longDescription = "A".repeat(1000);
        const oldPendingTransaction = createTestPendingTransaction();
        const newPendingTransaction = createTestPendingTransaction({
          description: longDescription,
        });

        const expectedResponse = { ...newPendingTransaction };
        global.fetch = createFetchMock(expectedResponse);

        const result = await updatePendingTransaction(
          oldPendingTransaction,
          newPendingTransaction,
        );

        expect(result.description).toBe(longDescription);
      });

      it("should handle special characters in account names", async () => {
        const specialAccountName = "Business Account & Co: 2024!";
        const oldPendingTransaction = createTestPendingTransaction();
        const newPendingTransaction = createTestPendingTransaction({
          accountNameOwner: specialAccountName,
        });

        const expectedResponse = { ...newPendingTransaction };
        global.fetch = createFetchMock(expectedResponse);

        const result = await updatePendingTransaction(
          oldPendingTransaction,
          newPendingTransaction,
        );

        expect(result.accountNameOwner).toBe(specialAccountName);
      });

      it("should handle unicode characters in account names", async () => {
        const unicodeAccountName = "企业账户 Business Account";
        const oldPendingTransaction = createTestPendingTransaction();
        const newPendingTransaction = createTestPendingTransaction({
          accountNameOwner: unicodeAccountName,
        });

        const expectedResponse = { ...newPendingTransaction };
        global.fetch = createFetchMock(expectedResponse);

        const result = await updatePendingTransaction(
          oldPendingTransaction,
          newPendingTransaction,
        );

        expect(result.accountNameOwner).toBe(unicodeAccountName);
      });

      it("should handle decimal precision amounts", async () => {
        const preciseAmount = 123.456789;
        const oldPendingTransaction = createTestPendingTransaction({
          amount: 100.0,
        });
        const newPendingTransaction = createTestPendingTransaction({
          amount: preciseAmount,
        });

        const expectedResponse = { ...newPendingTransaction };
        global.fetch = createFetchMock(expectedResponse);

        const result = await updatePendingTransaction(
          oldPendingTransaction,
          newPendingTransaction,
        );

        expect(result.amount).toBe(preciseAmount);
      });

      it("should handle zero amounts", async () => {
        const oldPendingTransaction = createTestPendingTransaction({
          amount: 100.0,
        });
        const newPendingTransaction = createTestPendingTransaction({
          amount: 0,
        });

        const expectedResponse = { ...newPendingTransaction };
        global.fetch = createFetchMock(expectedResponse);

        const result = await updatePendingTransaction(
          oldPendingTransaction,
          newPendingTransaction,
        );

        expect(result.amount).toBe(0);
      });

      it("should handle negative amounts", async () => {
        const oldPendingTransaction = createTestPendingTransaction({
          amount: 100.0,
        });
        const newPendingTransaction = createTestPendingTransaction({
          amount: -500.25,
        });

        const expectedResponse = { ...newPendingTransaction };
        global.fetch = createFetchMock(expectedResponse);

        const result = await updatePendingTransaction(
          oldPendingTransaction,
          newPendingTransaction,
        );

        expect(result.amount).toBe(-500.25);
      });

      it("should handle past and future date changes", async () => {
        const oldPendingTransaction = createTestPendingTransaction({
          transactionDate: new Date("2024-01-01T00:00:00.000Z"),
        });

        // Test future date
        const futureDate = new Date("2025-12-31T23:59:59.000Z");
        const newPendingTransactionFuture = createTestPendingTransaction({
          transactionDate: futureDate,
        });

        global.fetch = createFetchMock({ ...newPendingTransactionFuture });

        const resultFuture = await updatePendingTransaction(
          oldPendingTransaction,
          newPendingTransactionFuture,
        );
        expect(resultFuture.transactionDate).toEqual(futureDate);

        // Test past date
        const pastDate = new Date("2020-01-01T00:00:00.000Z");
        const newPendingTransactionPast = createTestPendingTransaction({
          transactionDate: pastDate,
        });

        global.fetch = createFetchMock({ ...newPendingTransactionPast });

        const resultPast = await updatePendingTransaction(
          oldPendingTransaction,
          newPendingTransactionPast,
        );
        expect(resultPast.transactionDate).toEqual(pastDate);
      });
    });

    describe("Console logging", () => {
      it("should log 404 errors specifically", async () => {
        const oldPendingTransaction = createTestPendingTransaction();
        const newPendingTransaction = createTestPendingTransaction();

        global.fetch = jest.fn().mockResolvedValue({
          ok: false,
          status: 404,
          statusText: "Not Found",
          json: jest.fn(),
        });
        consoleSpy.start();

        try {
          await updatePendingTransaction(
            oldPendingTransaction,
            newPendingTransaction,
          );
        } catch (error) {
          // Expected error
        }

        const calls = consoleSpy.getCalls();
        expect(calls.log[0]).toEqual(["Resource not found (404)."]);
      });

      it("should log general errors", async () => {
        const oldPendingTransaction = createTestPendingTransaction();
        const newPendingTransaction = createTestPendingTransaction();

        global.fetch = jest
          .fn()
          .mockRejectedValue(new Error("Connection failed"));
        consoleSpy.start();

        try {
          await updatePendingTransaction(
            oldPendingTransaction,
            newPendingTransaction,
          );
        } catch (error) {
          // Expected error
        }

        const calls = consoleSpy.getCalls();
        expect(calls.log[0]).toEqual(["An error occurred: Connection failed"]);
      });

      it("should not log 404 message for non-404 errors", async () => {
        const oldPendingTransaction = createTestPendingTransaction();
        const newPendingTransaction = createTestPendingTransaction();

        global.fetch = jest.fn().mockResolvedValue({
          ok: false,
          status: 500,
          statusText: "Internal Server Error",
          json: jest.fn(),
        });
        consoleSpy.start();

        try {
          await updatePendingTransaction(
            oldPendingTransaction,
            newPendingTransaction,
          );
        } catch (error) {
          // Expected error
        }

        const calls = consoleSpy.getCalls();
        expect(calls.log).not.toContain([["Resource not found (404)."]]);
        expect(calls.log[0]).toEqual([
          "An error occurred: Failed to update pending transaction: Internal Server Error",
        ]);
      });
    });

    describe("Integration scenarios", () => {
      it("should handle complete pending transaction update workflow", async () => {
        const oldPendingTransaction = createTestPendingTransaction({
          pendingTransactionId: 777,
          accountNameOwner: "corporateExpenses",
          transactionDate: new Date("2024-06-01T10:00:00.000Z"),
          description: "Quarterly software license - pending approval",
          amount: 12000.0,
          reviewStatus: "pending",
        });

        const newPendingTransaction = createTestPendingTransaction({
          pendingTransactionId: 777,
          accountNameOwner: "corporateExpenses",
          transactionDate: new Date("2024-06-01T10:00:00.000Z"),
          description: "Quarterly software license - approved by CFO",
          amount: 10500.0, // Negotiated down
          reviewStatus: "approved",
        });

        const expectedResponse = {
          ...newPendingTransaction,
        };

        global.fetch = createFetchMock(expectedResponse);

        const result = await updatePendingTransaction(
          oldPendingTransaction,
          newPendingTransaction,
        );

        expect(result).toEqual(expectedResponse);
        expect(result.pendingTransactionId).toBe(777);
        expect(result.amount).toBe(10500.0);
        expect(result.reviewStatus).toBe("approved");
        expect(result.description).toBe(
          "Quarterly software license - approved by CFO",
        );
      });

      it("should handle pending transaction update with validation failure", async () => {
        const oldPendingTransaction = createTestPendingTransaction({
          pendingTransactionId: 123,
        });
        const newPendingTransaction = createTestPendingTransaction({
          pendingTransactionId: 123,
          reviewStatus: "invalid_status", // Invalid status
        });

        global.fetch = jest.fn().mockResolvedValue({
          ok: false,
          status: 400,
          statusText: "Bad Request - Invalid review status",
          json: jest.fn(),
        });
        consoleSpy.start();

        await expect(
          updatePendingTransaction(
            oldPendingTransaction,
            newPendingTransaction,
          ),
        ).rejects.toThrow(
          "Failed to update pending transaction: Bad Request - Invalid review status",
        );

        const calls = consoleSpy.getCalls();
        expect(calls.log[0]).toEqual([
          "An error occurred: Failed to update pending transaction: Bad Request - Invalid review status",
        ]);
      });

      it("should handle pending transaction ID mismatch scenarios", async () => {
        const oldPendingTransaction = createTestPendingTransaction({
          pendingTransactionId: 100,
        });
        const newPendingTransaction = createTestPendingTransaction({
          pendingTransactionId: 200,
        }); // Different ID

        // The API endpoint should still use the old pending transaction ID
        global.fetch = createFetchMock({ pendingTransactionId: 200 });

        await updatePendingTransaction(
          oldPendingTransaction,
          newPendingTransaction,
        );

        // Should use old pending transaction ID in endpoint, regardless of new ID
        expect(fetch).toHaveBeenCalledWith(
          "/api/pending/transaction/100",
          expect.any(Object),
        );
      });

      it("should handle escalation workflow scenarios", async () => {
        const oldPendingTransaction = createTestPendingTransaction({
          reviewStatus: "pending",
          amount: 25000.0, // High-value transaction
          description: "Equipment purchase request",
        });

        const newPendingTransaction = createTestPendingTransaction({
          reviewStatus: "escalated",
          amount: 25000.0,
          description:
            "Equipment purchase request - escalated to board approval",
        });

        global.fetch = createFetchMock({ ...newPendingTransaction });

        const result = await updatePendingTransaction(
          oldPendingTransaction,
          newPendingTransaction,
        );

        expect(result.reviewStatus).toBe("escalated");
        expect(result.description).toBe(
          "Equipment purchase request - escalated to board approval",
        );
      });
    });
  });
});
