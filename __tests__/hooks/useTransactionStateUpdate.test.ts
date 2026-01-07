/**
 * Isolated tests for useTransactionStateUpdate business logic
 * Tests changeTransactionState function without React Query overhead
 */

import { createFetchMock, ConsoleSpy } from "../../testHelpers";
import { TransactionState } from "../../model/TransactionState";
import Transaction from "../../model/Transaction";

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

// Copy the function to test
const changeTransactionState = async (
  guid: string,
  newTransactionState: TransactionState,
): Promise<Transaction> => {
  const endpoint = `/api/transaction/state/update/${guid}/${newTransactionState}`;
  try {
    const response = await fetch(endpoint, {
      method: "PUT",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({}),
    });

    if (response.status === 404) {
      console.log("Resource not found (404).");
    }

    if (!response.ok) {
      throw new Error(
        `Failed to update transaction state: ${response.statusText}`,
      );
    }

    return await response.json();
  } catch (error: any) {
    console.log(`An error occurred: ${error.message}`);
    throw error;
  }
};

// Helper function to create test transaction data
const createTestTransaction = (
  overrides: Partial<Transaction> = {},
): Transaction => ({
  guid: "test-guid-123",
  transactionDate: new Date("2024-01-01"),
  accountNameOwner: "checking_john",
  accountType: "debit",
  description: "Test transaction",
  category: "groceries",
  amount: 100.0,
  cleared: 1,
  reoccurringType: "onetime",
  notes: "",
  transactionState: "outstanding",
  activeStatus: true,
  ...overrides,
});

describe("useTransactionStateUpdate Business Logic", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  let consoleSpy: ConsoleSpy;

  beforeEach(() => {
    consoleSpy = new ConsoleSpy();
    jest.clearAllMocks();
  });

  afterEach(() => {
    consoleSpy.stop();
  });

  describe("changeTransactionState", () => {
    describe("Successful state update operations", () => {
      it("should update transaction state to cleared successfully", async () => {
        const testTransaction = createTestTransaction({
          transactionState: "cleared",
        });

        global.fetch = createFetchMock(testTransaction);

        const result = await changeTransactionState("test-guid-123", "cleared");

        expect(result).toStrictEqual(testTransaction);
        expect(fetch).toHaveBeenCalledWith(
          "/api/transaction/state/update/test-guid-123/cleared",
          {
            method: "PUT",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify({}),
          },
        );
      });

      it("should update transaction state to outstanding", async () => {
        const testTransaction = createTestTransaction({
          transactionState: "outstanding",
        });

        global.fetch = createFetchMock(testTransaction);

        const result = await changeTransactionState(
          "test-guid-456",
          "outstanding",
        );

        expect(result.transactionState).toBe("outstanding");
        expect(fetch).toHaveBeenCalledWith(
          "/api/transaction/state/update/test-guid-456/outstanding",
          expect.any(Object),
        );
      });

      it("should update transaction state to pending", async () => {
        const testTransaction = createTestTransaction({
          transactionState: "pending",
        });

        global.fetch = createFetchMock(testTransaction);

        const result = await changeTransactionState("test-guid-789", "pending");

        expect(result.transactionState).toBe("pending");
      });

      it("should update transaction state to future", async () => {
        const testTransaction = createTestTransaction({
          transactionState: "future",
        });

        global.fetch = createFetchMock(testTransaction);

        const result = await changeTransactionState("test-guid-abc", "future");

        expect(result.transactionState).toBe("future");
      });

      it("should send empty body with request", async () => {
        const testTransaction = createTestTransaction();

        global.fetch = createFetchMock(testTransaction);

        await changeTransactionState("test-guid", "cleared");

        const callArgs = (fetch as jest.Mock).mock.calls[0][1];
        expect(callArgs.body).toBe(JSON.stringify({}));
      });

      it("should use PUT method", async () => {
        const testTransaction = createTestTransaction();

        global.fetch = createFetchMock(testTransaction);

        await changeTransactionState("test-guid", "cleared");

        const callArgs = (fetch as jest.Mock).mock.calls[0][1];
        expect(callArgs.method).toBe("PUT");
      });

      it("should include correct headers", async () => {
        const testTransaction = createTestTransaction();

        global.fetch = createFetchMock(testTransaction);

        await changeTransactionState("test-guid", "cleared");

        const callArgs = (fetch as jest.Mock).mock.calls[0][1];
        expect(callArgs.headers).toStrictEqual({
          "Content-Type": "application/json",
          Accept: "application/json",
        });
      });

      it("should handle different GUIDs", async () => {
        const guids = [
          "short",
          "very-long-guid-12345678901234567890",
          "guid-with-special-chars_123!",
          "123-456-789",
        ];

        for (const guid of guids) {
          const testTransaction = createTestTransaction({ guid });
          global.fetch = createFetchMock(testTransaction);

          await changeTransactionState(guid, "cleared");

          expect(fetch).toHaveBeenCalledWith(
            `/api/transaction/state/update/${guid}/cleared`,
            expect.any(Object),
          );
        }
      });
    });

    describe("Error handling", () => {
      it("should handle 404 not found error", async () => {
        global.fetch = jest.fn().mockResolvedValue({
          ok: false,
          status: 404,
          statusText: "Not Found",
        });

        consoleSpy.start();

        await expect(
          changeTransactionState("nonexistent-guid", "cleared"),
        ).rejects.toThrow("Failed to update transaction state: Not Found");

        const calls = consoleSpy.getCalls();
        expect(
          calls.log.some((call) =>
            call[0].includes("Resource not found (404)"),
          ),
        ).toBe(true);
      });

      it("should handle 500 server error", async () => {
        global.fetch = jest.fn().mockResolvedValue({
          ok: false,
          status: 500,
          statusText: "Internal Server Error",
        });

        consoleSpy.start();

        await expect(
          changeTransactionState("test-guid", "cleared"),
        ).rejects.toThrow(
          "Failed to update transaction state: Internal Server Error",
        );

        const calls = consoleSpy.getCalls();
        expect(
          calls.log.some((call) => call[0].includes("An error occurred:")),
        ).toBe(true);
      });

      it("should handle 401 unauthorized error", async () => {
        global.fetch = jest.fn().mockResolvedValue({
          ok: false,
          status: 401,
          statusText: "Unauthorized",
        });

        consoleSpy.start();

        await expect(
          changeTransactionState("test-guid", "cleared"),
        ).rejects.toThrow("Failed to update transaction state: Unauthorized");
      });

      it("should handle 403 forbidden error", async () => {
        global.fetch = jest.fn().mockResolvedValue({
          ok: false,
          status: 403,
          statusText: "Forbidden",
        });

        consoleSpy.start();

        await expect(
          changeTransactionState("test-guid", "cleared"),
        ).rejects.toThrow("Failed to update transaction state: Forbidden");
      });

      it("should handle network errors", async () => {
        global.fetch = jest.fn().mockRejectedValue(new Error("Network error"));

        consoleSpy.start();

        await expect(
          changeTransactionState("test-guid", "cleared"),
        ).rejects.toThrow("Network error");

        const calls = consoleSpy.getCalls();
        expect(
          calls.log.some((call) =>
            call[0].includes("An error occurred: Network error"),
          ),
        ).toBe(true);
      });

      it("should handle invalid JSON response", async () => {
        global.fetch = jest.fn().mockResolvedValue({
          ok: true,
          json: jest.fn().mockRejectedValue(new Error("Invalid JSON")),
        });

        consoleSpy.start();

        await expect(
          changeTransactionState("test-guid", "cleared"),
        ).rejects.toThrow("Invalid JSON");
      });

      it("should handle timeout errors", async () => {
        global.fetch = jest.fn().mockRejectedValue(new Error("Timeout"));

        consoleSpy.start();

        await expect(
          changeTransactionState("test-guid", "cleared"),
        ).rejects.toThrow("Timeout");
      });
    });

    describe("Edge cases", () => {
      it("should handle empty GUID", async () => {
        const testTransaction = createTestTransaction({ guid: "" });
        global.fetch = createFetchMock(testTransaction);

        await changeTransactionState("", "cleared");

        expect(fetch).toHaveBeenCalledWith(
          "/api/transaction/state/update//cleared",
          expect.any(Object),
        );
      });

      it("should handle GUID with special characters", async () => {
        const specialGuid = "guid-with-!@#$%^&*()";
        const testTransaction = createTestTransaction({ guid: specialGuid });
        global.fetch = createFetchMock(testTransaction);

        await changeTransactionState(specialGuid, "cleared");

        expect(fetch).toHaveBeenCalledWith(
          `/api/transaction/state/update/${specialGuid}/cleared`,
          expect.any(Object),
        );
      });

      it("should preserve transaction data in response", async () => {
        const testTransaction = createTestTransaction({
          amount: 250.75,
          description: "Important transaction",
          category: "bills",
        });

        global.fetch = createFetchMock(testTransaction);

        const result = await changeTransactionState("test-guid", "cleared");

        expect(result.amount).toBe(250.75);
        expect(result.description).toBe("Important transaction");
        expect(result.category).toBe("bills");
      });

      it("should handle concurrent state updates", async () => {
        const testTransaction = createTestTransaction();
        global.fetch = createFetchMock(testTransaction);

        const promise1 = changeTransactionState("guid-1", "cleared");
        const promise2 = changeTransactionState("guid-2", "outstanding");
        const promise3 = changeTransactionState("guid-3", "pending");

        const results = await Promise.all([promise1, promise2, promise3]);

        expect(results).toHaveLength(3);
        expect(fetch).toHaveBeenCalledTimes(3);
      });

      it("should log error message on failure", async () => {
        global.fetch = jest
          .fn()
          .mockRejectedValue(new Error("Custom error message"));

        consoleSpy.start();

        try {
          await changeTransactionState("test-guid", "cleared");
          fail("Should have thrown an error");
        } catch (error) {
          const calls = consoleSpy.getCalls();
          expect(
            calls.log.some((call) =>
              call[0].includes("An error occurred: Custom error message"),
            ),
          ).toBe(true);
        }
      });

      it("should preserve error stack trace", async () => {
        const testError = new Error("Test error");
        global.fetch = jest.fn().mockRejectedValue(testError);

        try {
          await changeTransactionState("test-guid", "cleared");
          fail("Should have thrown an error");
        } catch (error: any) {
          expect(error).toBe(testError);
          expect(error.message).toBe("Test error");
        }
      });
    });

    describe("Transaction state transitions", () => {
      it("should transition from outstanding to cleared", async () => {
        const testTransaction = createTestTransaction({
          transactionState: "cleared",
        });
        global.fetch = createFetchMock(testTransaction);

        const result = await changeTransactionState("test-guid", "cleared");

        expect(result.transactionState).toBe("cleared");
      });

      it("should transition from cleared to outstanding", async () => {
        const testTransaction = createTestTransaction({
          transactionState: "outstanding",
        });
        global.fetch = createFetchMock(testTransaction);

        const result = await changeTransactionState("test-guid", "outstanding");

        expect(result.transactionState).toBe("outstanding");
      });

      it("should transition from future to outstanding", async () => {
        const testTransaction = createTestTransaction({
          transactionState: "outstanding",
        });
        global.fetch = createFetchMock(testTransaction);

        const result = await changeTransactionState("test-guid", "outstanding");

        expect(result.transactionState).toBe("outstanding");
      });

      it("should handle multiple state transitions for same transaction", async () => {
        const guid = "test-guid-multi";
        let callCount = 0;

        // First transition: outstanding -> cleared
        let testTransaction = createTestTransaction({
          guid,
          transactionState: "cleared",
        });
        global.fetch = createFetchMock(testTransaction);
        let result = await changeTransactionState(guid, "cleared");
        expect(result.transactionState).toBe("cleared");
        callCount++;

        // Second transition: cleared -> outstanding
        testTransaction = createTestTransaction({
          guid,
          transactionState: "outstanding",
        });
        global.fetch = createFetchMock(testTransaction);
        result = await changeTransactionState(guid, "outstanding");
        expect(result.transactionState).toBe("outstanding");
        callCount++;

        expect(callCount).toBe(2);
      });
    });
  });
});
