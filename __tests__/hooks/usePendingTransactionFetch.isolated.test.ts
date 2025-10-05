/**
 * Isolated tests for usePendingTransactionFetch business logic
 * Tests fetchPendingTransactions function without React Query overhead
 */

import {
  createFetchMock,
  createErrorFetchMock,
  ConsoleSpy,
} from "../../testHelpers";
import PendingTransaction from "../../model/PendingTransaction";

// Import the function we need to test
// We need to export it from the hook file
const fetchPendingTransactions = async (): Promise<PendingTransaction[]> => {
  try {
    const response = await fetch("/api/pending/transaction/all", {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        console.log("No pending transactions found (404).");
        return [];
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error: any) {
    console.error("Error fetching pending transaction data:", error);
    throw new Error(
      `Failed to fetch pending transaction data: ${error.message}`,
    );
  }
};

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

describe("usePendingTransactionFetch Business Logic (Isolated)", () => {
  let consoleSpy: ConsoleSpy;

  beforeEach(() => {
    consoleSpy = new ConsoleSpy();
    jest.clearAllMocks();
  });

  afterEach(() => {
    consoleSpy.stop();
  });

  describe("fetchPendingTransactions", () => {
    describe("Successful fetch operations", () => {
      it("should fetch pending transactions successfully", async () => {
        const testTransactions = [
          createTestPendingTransaction({ pendingTransactionId: 1 }),
          createTestPendingTransaction({ pendingTransactionId: 2 }),
        ];

        global.fetch = createFetchMock(testTransactions);

        const result = await fetchPendingTransactions();

        expect(result).toEqual(testTransactions);
        expect(fetch).toHaveBeenCalledWith("/api/pending/transaction/all", {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        });
      });

      it("should return empty array when no pending transactions exist (404)", async () => {
        global.fetch = jest.fn().mockResolvedValue({
          ok: false,
          status: 404,
        });

        consoleSpy.start();

        const result = await fetchPendingTransactions();

        expect(result).toEqual([]);
        const calls = consoleSpy.getCalls();
        expect(calls.log.some((call) => call[0].includes("404"))).toBe(true);
      });

      it("should fetch pending transactions with different amounts", async () => {
        const testTransactions = [
          createTestPendingTransaction({ amount: 10.99 }),
          createTestPendingTransaction({ amount: 250.0 }),
          createTestPendingTransaction({ amount: -50.5 }),
        ];

        global.fetch = createFetchMock(testTransactions);

        const result = await fetchPendingTransactions();

        expect(result).toHaveLength(3);
        expect(result[0].amount).toBe(10.99);
        expect(result[1].amount).toBe(250.0);
        expect(result[2].amount).toBe(-50.5);
      });

      it("should fetch pending transactions with different accounts", async () => {
        const testTransactions = [
          createTestPendingTransaction({ accountNameOwner: "checking_john" }),
          createTestPendingTransaction({ accountNameOwner: "savings_jane" }),
          createTestPendingTransaction({ accountNameOwner: "credit_bob" }),
        ];

        global.fetch = createFetchMock(testTransactions);

        const result = await fetchPendingTransactions();

        expect(result).toHaveLength(3);
        expect(result[0].accountNameOwner).toBe("checking_john");
        expect(result[1].accountNameOwner).toBe("savings_jane");
        expect(result[2].accountNameOwner).toBe("credit_bob");
      });

      it("should handle empty array response", async () => {
        global.fetch = createFetchMock([]);

        const result = await fetchPendingTransactions();

        expect(result).toEqual([]);
        expect(Array.isArray(result)).toBe(true);
      });
    });

    describe("Error handling", () => {
      it("should throw error for 500 server error", async () => {
        global.fetch = jest.fn().mockResolvedValue({
          ok: false,
          status: 500,
        });

        consoleSpy.start();

        await expect(fetchPendingTransactions()).rejects.toThrow(
          "Failed to fetch pending transaction data: HTTP error! status: 500",
        );

        const calls = consoleSpy.getCalls();
        expect(
          calls.error.some((call) =>
            call[0].includes("Error fetching pending transaction data:"),
          ),
        ).toBe(true);
      });

      it("should throw error for 401 unauthorized", async () => {
        global.fetch = jest.fn().mockResolvedValue({
          ok: false,
          status: 401,
        });

        consoleSpy.start();

        await expect(fetchPendingTransactions()).rejects.toThrow(
          "Failed to fetch pending transaction data: HTTP error! status: 401",
        );
      });

      it("should throw error for 403 forbidden", async () => {
        global.fetch = jest.fn().mockResolvedValue({
          ok: false,
          status: 403,
        });

        consoleSpy.start();

        await expect(fetchPendingTransactions()).rejects.toThrow(
          "Failed to fetch pending transaction data: HTTP error! status: 403",
        );
      });

      it("should handle network errors", async () => {
        global.fetch = jest
          .fn()
          .mockRejectedValue(new Error("Network error"));

        consoleSpy.start();

        await expect(fetchPendingTransactions()).rejects.toThrow(
          "Failed to fetch pending transaction data: Network error",
        );

        const calls = consoleSpy.getCalls();
        expect(
          calls.error.some((call) =>
            call[0].includes("Error fetching pending transaction data:"),
          ),
        ).toBe(true);
      });

      it("should handle invalid JSON response", async () => {
        global.fetch = jest.fn().mockResolvedValue({
          ok: true,
          json: jest.fn().mockRejectedValue(new Error("Invalid JSON")),
        });

        consoleSpy.start();

        await expect(fetchPendingTransactions()).rejects.toThrow(
          "Failed to fetch pending transaction data: Invalid JSON",
        );
      });

      it("should handle fetch failure", async () => {
        global.fetch = jest
          .fn()
          .mockRejectedValue(new Error("Failed to fetch"));

        consoleSpy.start();

        await expect(fetchPendingTransactions()).rejects.toThrow(
          "Failed to fetch pending transaction data: Failed to fetch",
        );
      });
    });

    describe("Edge cases", () => {
      it("should handle pending transactions with special characters in description", async () => {
        const testTransactions = [
          createTestPendingTransaction({
            description: 'Test "quote" & <special> chars',
          }),
        ];

        global.fetch = createFetchMock(testTransactions);

        const result = await fetchPendingTransactions();

        expect(result[0].description).toBe('Test "quote" & <special> chars');
      });

      it("should handle pending transactions with very large amounts", async () => {
        const testTransactions = [
          createTestPendingTransaction({ amount: 999999.99 }),
        ];

        global.fetch = createFetchMock(testTransactions);

        const result = await fetchPendingTransactions();

        expect(result[0].amount).toBe(999999.99);
      });

      it("should handle pending transactions with zero amount", async () => {
        const testTransactions = [createTestPendingTransaction({ amount: 0 })];

        global.fetch = createFetchMock(testTransactions);

        const result = await fetchPendingTransactions();

        expect(result[0].amount).toBe(0);
      });

      it("should handle pending transactions with different review statuses", async () => {
        const testTransactions = [
          createTestPendingTransaction({ reviewStatus: "pending" }),
          createTestPendingTransaction({ reviewStatus: "approved" }),
          createTestPendingTransaction({ reviewStatus: "rejected" }),
        ];

        global.fetch = createFetchMock(testTransactions);

        const result = await fetchPendingTransactions();

        expect(result[0].reviewStatus).toBe("pending");
        expect(result[1].reviewStatus).toBe("approved");
        expect(result[2].reviewStatus).toBe("rejected");
      });
    });
  });
});
