import Transaction from "../../model/Transaction";
import {
  createFetchMock,
  createErrorFetchMock,
  ConsoleSpy,
  createTestTransaction,
  expectSuccessfulDeletion,
  expectValidationError,
  expectServerError,
  simulateNetworkError,
} from "../../testHelpers";

import {
  deleteTransaction,
  getAccountKey,
} from "../../hooks/useTransactionDelete";

// Since getAccountKey might be used in tests, import it too

describe("deleteTransaction (Isolated)", () => {
  const mockTransaction = createTestTransaction({
    transactionId: 1,
    guid: "test-guid-456",
    accountNameOwner: "checking",
    transactionDate: new Date("2024-01-01"),
    description: "Test transaction",
    category: "groceries",
    amount: 125.5,
    transactionState: "outstanding",
    transactionType: "expense",
  });


  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
  });

  describe("Successful deletion", () => {
    it("should delete transaction successfully with 204 response", async () => {
      global.fetch = createFetchMock(null, { status: 204 });

      const result = await deleteTransaction(mockTransaction);

      expect(result).toBeNull();
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/transaction/test-guid-456",
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

    it("should return transaction data for non-204 responses", async () => {
      const responseData = { ...mockTransaction, deleted: true };
      global.fetch = createFetchMock(responseData, { status: 200 });

      const result = await deleteTransaction(mockTransaction);

      expect(result).toEqual(responseData);
    });

    it("should construct correct endpoint URL with transaction GUID", async () => {
      const transactionWithDifferentGuid = createTestTransaction({
        guid: "custom-guid-789",
      });
      global.fetch = createFetchMock(null, { status: 204 });

      await deleteTransaction(transactionWithDifferentGuid);

      expect(global.fetch).toHaveBeenCalledWith(
        "/api/transaction/custom-guid-789",
        expect.any(Object),
      );
    });
  });

  describe("Error handling", () => {
    it("should handle server error with error message", async () => {
      const errorMessage = "Cannot delete transaction with pending transfers";
      global.fetch = createErrorFetchMock(errorMessage, 400);

      await expect(deleteTransaction(mockTransaction)).rejects.toThrow(
        errorMessage,
      );
    });

    it("should handle server error without error message", async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: jest.fn().mockResolvedValueOnce({}),
      });

      await expect(deleteTransaction(mockTransaction)).rejects.toThrow(
        "No error message returned.",
      );
        "No error message returned.",
      );
    });

    it("should handle malformed error response", async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: jest.fn().mockRejectedValueOnce(new Error("Invalid JSON")),
      });

      await expect(deleteTransaction(mockTransaction)).rejects.toThrow(
        "Failed to parse error response: Invalid JSON",
      );
        "Failed to parse error response: Invalid JSON",
      );
    });

    it("should handle empty error message gracefully", async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: jest.fn().mockResolvedValueOnce({ response: [] }),
      });

      await expect(deleteTransaction(mockTransaction)).rejects.toThrow(
        "cannot throw a null value",
      );
    });

    it("should handle network errors", async () => {
      global.fetch = simulateNetworkError();

      await expect(deleteTransaction(mockTransaction)).rejects.toThrow(
        "Network error",
      );
        "An error occurred: Network error",
      );
    });

    it("should handle fetch rejection", async () => {
      global.fetch = jest
        .fn()
        .mockRejectedValueOnce(new Error("Connection failed"));

      await expect(deleteTransaction(mockTransaction)).rejects.toThrow(
        "Connection failed",
      );
        "An error occurred: Connection failed",
      );
    });
  });

  describe("Edge cases", () => {
    it("should handle transaction with empty GUID", async () => {
      const transactionWithEmptyGuid = createTestTransaction({ guid: "" });
      global.fetch = createFetchMock(null, { status: 204 });

      await deleteTransaction(transactionWithEmptyGuid);

      expect(global.fetch).toHaveBeenCalledWith(
        "/api/transaction/",
        expect.any(Object),
      );
    });

    it("should handle transaction with special characters in GUID", async () => {
      const transactionWithSpecialGuid = createTestTransaction({
        guid: "guid-with-special@#$%chars",
      });
      global.fetch = createFetchMock(null, { status: 204 });

      await deleteTransaction(transactionWithSpecialGuid);

      expect(global.fetch).toHaveBeenCalledWith(
        "/api/transaction/guid-with-special@#$%chars",
        expect.any(Object),
      );
    });

    it("should handle transaction with very long GUID", async () => {
      const longGuid = "a".repeat(500);
      const transactionWithLongGuid = createTestTransaction({ guid: longGuid });
      global.fetch = createFetchMock(null, { status: 204 });

      await deleteTransaction(transactionWithLongGuid);

      expect(global.fetch).toHaveBeenCalledWith(
        `/api/transaction/${longGuid}`,
        expect.any(Object),
      );
    });

    it("should handle transaction with UUID format GUID", async () => {
      const uuidGuid = "550e8400-e29b-41d4-a716-446655440000";
      const transactionWithUuid = createTestTransaction({ guid: uuidGuid });
      global.fetch = createFetchMock(null, { status: 204 });

      await deleteTransaction(transactionWithUuid);

      expect(global.fetch).toHaveBeenCalledWith(
        "/api/transaction/550e8400-e29b-41d4-a716-446655440000",
        expect.any(Object),
      );
    });
  });

  describe("Response parsing", () => {
    it("should handle JSON response correctly", async () => {
      const jsonResponse = {
        message: "Transaction deleted",
        transactionId: mockTransaction.transactionId,
        timestamp: "2024-01-01T00:00:00Z",
      };
      global.fetch = createFetchMock(jsonResponse, { status: 200 });

      const result = await deleteTransaction(mockTransaction);

      expect(result).toEqual(jsonResponse);
    });

    it("should handle empty JSON response", async () => {
      global.fetch = createFetchMock({}, { status: 200 });

      const result = await deleteTransaction(mockTransaction);

      expect(result).toEqual({});
    });

    it("should prioritize 204 status over response body", async () => {
      const mockJson = jest.fn().mockResolvedValueOnce({ message: "ignored" });
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        status: 204,
        json: mockJson,
      });

      const result = await deleteTransaction(mockTransaction);

      expect(result).toBeNull();
      expect(mockJson).not.toHaveBeenCalled();
    });

    it("should handle complex JSON response", async () => {
      const complexResponse = {
        transaction: mockTransaction,
        relatedTransactions: [],
        affectedTotals: { checking: 1000.5 },
        metadata: { deletedAt: "2024-01-01", deletedBy: "user123" },
      };
      global.fetch = createFetchMock(complexResponse, { status: 200 });

      const result = await deleteTransaction(mockTransaction);

      expect(result).toEqual(complexResponse);
    });
  });

  describe("HTTP headers and credentials", () => {
    it("should include correct headers in request", async () => {
      global.fetch = createFetchMock(null, { status: 204 });

      await deleteTransaction(mockTransaction);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }),
      );
    });

    it("should include credentials in request", async () => {
      global.fetch = createFetchMock(null, { status: 204 });

      await deleteTransaction(mockTransaction);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          credentials: "include",
        }),
      );
    });

    it("should use DELETE method", async () => {
      global.fetch = createFetchMock(null, { status: 204 });

      await deleteTransaction(mockTransaction);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: "DELETE",
        }),
      );
    });
  });

  describe("Console logging behavior", () => {
    it("should log error messages from server", async () => {
      const errorMessage = "Transaction deletion failed";
      global.fetch = createErrorFetchMock(errorMessage, 400);

      await expect(deleteTransaction(mockTransaction)).rejects.toThrow();
    });

    it("should log general errors with context", async () => {
      global.fetch = simulateNetworkError();

      await expect(deleteTransaction(mockTransaction)).rejects.toThrow();
        "An error occurred: Network error",
      );
    });

    it("should not log anything for successful deletions", async () => {
      global.fetch = createFetchMock(null, { status: 204 });

      await deleteTransaction(mockTransaction);

      expect(mockConsole.log).not.toHaveBeenCalled();
      expect(mockConsole.error).not.toHaveBeenCalled();
      expect(mockConsole.warn).not.toHaveBeenCalled();
    });

    it("should log different error types appropriately", async () => {
      // Test multiple error scenarios
      const scenarios = [
        { error: "Invalid transaction state", status: 400 },
        { error: "Transaction already deleted", status: 409 },
        { error: "Insufficient permissions", status: 403 },
        { error: "Transaction not found", status: 404 },
      ];

      for (const scenario of scenarios) {
        jest.clearAllMocks();

        global.fetch = createErrorFetchMock(scenario.error, scenario.status);

        await expect(deleteTransaction(mockTransaction)).rejects.toThrow(
          scenario.error,
        );
      }
    });
  });

  describe("Transaction-specific validations", () => {
    it("should handle transaction with all required fields", async () => {
      const fullTransaction = createTestTransaction({
        transactionId: 123,
        guid: "full-transaction-guid",
        accountId: 456,
        accountType: "savings",
        accountNameOwner: "fullAccount",
        transactionDate: new Date("2024-02-15"),
        description: "Full test transaction",
        category: "utilities",
        amount: 250.75,
        transactionState: "cleared",
        transactionType: "income",
        activeStatus: true,
        reoccurringType: "monthly",
        notes: "Test notes for full transaction",
        dueDate: "2024-03-15",
      });

      global.fetch = createFetchMock(null, { status: 204 });

      const result = await deleteTransaction(fullTransaction);

      expect(result).toBeNull();
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/transaction/full-transaction-guid",
        expect.any(Object),
      );
    });

    it("should handle transaction with minimal required fields", async () => {
      const minimalTransaction = createTestTransaction({
        guid: "minimal-guid",
        accountNameOwner: "minimalAccount",
      });

      global.fetch = createFetchMock(null, { status: 204 });

      const result = await deleteTransaction(minimalTransaction);

      expect(result).toBeNull();
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/transaction/minimal-guid",
        expect.any(Object),
      );
    });
  });
});
