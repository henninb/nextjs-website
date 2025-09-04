/**
 * Isolated tests for useTransactionByAccountFetch business logic
 * Tests the fetchTransactionsByAccount function without React Query/React overhead
 */

import { fetchTransactionsByAccount } from "../../hooks/useTransactionByAccountFetch";
import Transaction from "../../model/Transaction";
import {
  createFetchMock,
  createErrorFetchMock,
  ConsoleSpy,
  simulateNetworkError,
  simulateTimeoutError,
  createMockResponse,
  createTestTransaction,
} from "../../testHelpers";

describe("fetchTransactionsByAccount (Isolated)", () => {
  let consoleSpy: ConsoleSpy;
  const originalFetch = global.fetch;

  beforeEach(() => {
    consoleSpy = new ConsoleSpy();
  });

  afterEach(() => {
    consoleSpy.stop();
    global.fetch = originalFetch;
  });

  describe("Successful Transaction Fetch", () => {
    it("should fetch transactions by account successfully", async () => {
      const testTransactions = [
        createTestTransaction({
          transactionId: 1,
          guid: "test-guid-1",
          accountNameOwner: "testAccount",
          description: "Test transaction 1",
          category: "electronics",
          amount: 100.0,
        }),
        createTestTransaction({
          transactionId: 2,
          guid: "test-guid-2",
          accountNameOwner: "testAccount",
          description: "Test transaction 2",
          category: "groceries",
          amount: 50.0,
        }),
      ];
      global.fetch = createFetchMock(testTransactions);

      const result = await fetchTransactionsByAccount("testAccount");

      expect(result).toEqual(testTransactions);
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/transaction/account/select/testAccount",
        {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );
    });

    it("should handle single transaction response", async () => {
      const singleTransaction = [createTestTransaction({
        transactionId: 123,
        guid: "unique-guid-123",
        accountNameOwner: "singleAccount",
        description: "Single transaction",
        category: "utilities",
        amount: 75.25,
        transactionState: "outstanding",
        transactionType: "expense",
      })];
      global.fetch = createFetchMock(singleTransaction);

      const result = await fetchTransactionsByAccount("singleAccount");

      expect(result).toEqual(singleTransaction);
      expect(result).toHaveLength(1);
      expect(result![0].transactionId).toBe(123);
      expect(result![0].amount).toBe(75.25);
    });

    it("should handle empty transaction array", async () => {
      global.fetch = createFetchMock([]);

      const result = await fetchTransactionsByAccount("emptyAccount");

      expect(result).toEqual([]);
      expect(Array.isArray(result)).toBe(true);
    });

    it("should handle 204 No Content response", async () => {
      global.fetch = jest.fn().mockResolvedValue(
        createMockResponse(null, { status: 204 })
      );

      const result = await fetchTransactionsByAccount("noContentAccount");

      expect(result).toBeNull();
    });

    it("should construct correct endpoint URL for different account names", async () => {
      const testTransactions = [createTestTransaction()];
      global.fetch = createFetchMock(testTransactions);

      await fetchTransactionsByAccount("my-business-account");

      expect(global.fetch).toHaveBeenCalledWith(
        "/api/transaction/account/select/my-business-account",
        expect.any(Object)
      );
    });
  });

  describe("Error Handling", () => {
    it("should handle 404 resource not found", async () => {
      const mockLog = consoleSpy.start().log;
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: "Not Found",
        json: jest.fn().mockResolvedValue({ message: "Account not found" }),
      });

      await expect(fetchTransactionsByAccount("nonexistent")).rejects.toThrow(
        "Failed to fetch transactionsByAccount data: Not Found"
      );

      expect(mockLog).toHaveBeenCalledWith("Resource not found (404).");
    });

    it("should handle 500 server error", async () => {
      const mockError = consoleSpy.start().error;
      global.fetch = createErrorFetchMock("Internal Server Error", 500);

      await expect(fetchTransactionsByAccount("testAccount")).rejects.toThrow(
        "Failed to fetch transaction by account data: Failed to fetch transactionsByAccount data: Bad Request"
      );

      expect(mockError).toHaveBeenCalledWith(
        "Error fetching transaction by account data:",
        expect.any(Error)
      );
    });

    it("should handle 400 bad request", async () => {
      const mockError = consoleSpy.start().error;
      global.fetch = createErrorFetchMock("Invalid account name", 400);

      await expect(fetchTransactionsByAccount("")).rejects.toThrow(
        "Failed to fetch transaction by account data: Failed to fetch transactionsByAccount data: Bad Request"
      );

      expect(mockError).toHaveBeenCalledWith(
        "Error fetching transaction by account data:",
        expect.any(Error)
      );
    });

    it("should handle network errors", async () => {
      const mockError = consoleSpy.start().error;
      global.fetch = simulateNetworkError();

      await expect(fetchTransactionsByAccount("testAccount")).rejects.toThrow(
        "Failed to fetch transaction by account data: Network error"
      );

      expect(mockError).toHaveBeenCalledWith(
        "Error fetching transaction by account data:",
        expect.any(Error)
      );
    });

    it("should handle timeout errors", async () => {
      const mockError = consoleSpy.start().error;
      global.fetch = simulateTimeoutError();

      await expect(fetchTransactionsByAccount("testAccount")).rejects.toThrow(
        "Failed to fetch transaction by account data: Request timeout"
      );

      expect(mockError).toHaveBeenCalledWith(
        "Error fetching transaction by account data:",
        expect.any(Error)
      );
    });

    it("should handle fetch errors without specific message", async () => {
      const mockError = consoleSpy.start().error;
      global.fetch = jest.fn().mockRejectedValue(new Error());

      await expect(fetchTransactionsByAccount("testAccount")).rejects.toThrow(
        "Failed to fetch transaction by account data:"
      );

      expect(mockError).toHaveBeenCalledWith(
        "Error fetching transaction by account data:",
        expect.any(Error)
      );
    });
  });

  describe("Account-Specific Transaction Filtering", () => {
    it("should fetch transactions for checking account", async () => {
      const checkingTransactions = [
        createTestTransaction({
          accountNameOwner: "checking-main",
          accountType: "checking",
          category: "salary",
          amount: 3000.0,
          transactionType: "income",
        }),
        createTestTransaction({
          accountNameOwner: "checking-main",
          accountType: "checking",
          category: "groceries",
          amount: -150.0,
          transactionType: "expense",
        }),
      ];
      global.fetch = createFetchMock(checkingTransactions);

      const result = await fetchTransactionsByAccount("checking-main");

      expect(result).toHaveLength(2);
      expect(result![0].accountType).toBe("checking");
      expect(result![1].accountType).toBe("checking");
    });

    it("should fetch transactions for savings account", async () => {
      const savingsTransactions = [
        createTestTransaction({
          accountNameOwner: "savings-emergency",
          accountType: "savings",
          category: "transfer",
          amount: 500.0,
          transactionType: "income",
        }),
      ];
      global.fetch = createFetchMock(savingsTransactions);

      const result = await fetchTransactionsByAccount("savings-emergency");

      expect(result).toHaveLength(1);
      expect(result![0].accountType).toBe("savings");
    });

    it("should handle transactions with different states", async () => {
      const mixedStateTransactions = [
        createTestTransaction({
          transactionState: "cleared",
          amount: 100.0,
        }),
        createTestTransaction({
          transactionState: "outstanding",
          amount: 200.0,
        }),
        createTestTransaction({
          transactionState: "future",
          amount: 300.0,
        }),
      ];
      global.fetch = createFetchMock(mixedStateTransactions);

      const result = await fetchTransactionsByAccount("testAccount");

      expect(result).toHaveLength(3);
      expect(result![0].transactionState).toBe("cleared");
      expect(result![1].transactionState).toBe("outstanding");
      expect(result![2].transactionState).toBe("future");
    });

    it("should handle transactions with different categories", async () => {
      const categoryTransactions = [
        createTestTransaction({ category: "groceries", amount: 150.0 }),
        createTestTransaction({ category: "utilities", amount: 100.0 }),
        createTestTransaction({ category: "entertainment", amount: 75.0 }),
        createTestTransaction({ category: "electronics", amount: 500.0 }),
      ];
      global.fetch = createFetchMock(categoryTransactions);

      const result = await fetchTransactionsByAccount("testAccount");

      const categories = result!.map(t => t.category);
      expect(categories).toContain("groceries");
      expect(categories).toContain("utilities");
      expect(categories).toContain("entertainment");
      expect(categories).toContain("electronics");
    });
  });

  describe("Request Configuration", () => {
    it("should use correct HTTP method and headers", async () => {
      const testTransactions = [createTestTransaction()];
      global.fetch = createFetchMock(testTransactions);

      await fetchTransactionsByAccount("testAccount");

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );
    });

    it("should include credentials for authentication", async () => {
      const testTransactions = [createTestTransaction()];
      global.fetch = createFetchMock(testTransactions);

      await fetchTransactionsByAccount("testAccount");

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          credentials: "include",
        })
      );
    });
  });

  describe("Response Processing", () => {
    it("should parse JSON response correctly", async () => {
      const testTransactions = [createTestTransaction()];
      const mockResponse = createMockResponse(testTransactions);
      global.fetch = jest.fn().mockResolvedValue(mockResponse);

      const result = await fetchTransactionsByAccount("testAccount");

      expect(mockResponse.json).toHaveBeenCalled();
      expect(result).toEqual(testTransactions);
    });

    it("should handle transactions with complex data types", async () => {
      const complexTransaction = createTestTransaction({
        transactionDate: new Date("2023-12-15T10:30:00Z"),
        amount: 1234.56,
        notes: "Transaction with special characters: áéíóú & symbols!",
        reoccurringType: "monthly",
        activeStatus: true,
      });
      global.fetch = createFetchMock([complexTransaction]);

      const result = await fetchTransactionsByAccount("testAccount");

      expect(result).toHaveLength(1);
      expect(result![0].amount).toBe(1234.56);
      expect(result![0].notes).toContain("special characters");
      expect(result![0].reoccurringType).toBe("monthly");
    });

    it("should handle large transaction datasets", async () => {
      const largeDataset = Array.from({ length: 100 }, (_, index) =>
        createTestTransaction({
          transactionId: index + 1,
          guid: `guid-${index + 1}`,
          amount: Math.round((Math.random() * 1000) * 100) / 100,
        })
      );
      global.fetch = createFetchMock(largeDataset);

      const result = await fetchTransactionsByAccount("largeAccount");

      expect(result).toHaveLength(100);
      expect(result![0].transactionId).toBe(1);
      expect(result![99].transactionId).toBe(100);
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty account name", async () => {
      const testTransactions = [createTestTransaction()];
      global.fetch = createFetchMock(testTransactions);

      await fetchTransactionsByAccount("");

      expect(global.fetch).toHaveBeenCalledWith(
        "/api/transaction/account/select/",
        expect.any(Object)
      );
    });

    it("should handle account names with special characters", async () => {
      const testTransactions = [createTestTransaction()];
      global.fetch = createFetchMock(testTransactions);

      await fetchTransactionsByAccount("account-with_special.chars@123");

      expect(global.fetch).toHaveBeenCalledWith(
        "/api/transaction/account/select/account-with_special.chars@123",
        expect.any(Object)
      );
    });

    it("should handle very long account names", async () => {
      const longAccountName = "a".repeat(255);
      const testTransactions = [createTestTransaction()];
      global.fetch = createFetchMock(testTransactions);

      await fetchTransactionsByAccount(longAccountName);

      expect(global.fetch).toHaveBeenCalledWith(
        `/api/transaction/account/select/${longAccountName}`,
        expect.any(Object)
      );
    });

    it("should handle numeric account names", async () => {
      const testTransactions = [createTestTransaction()];
      global.fetch = createFetchMock(testTransactions);

      await fetchTransactionsByAccount("12345");

      expect(global.fetch).toHaveBeenCalledWith(
        "/api/transaction/account/select/12345",
        expect.any(Object)
      );
    });

    it("should handle transactions with null/undefined fields", async () => {
      const transactionWithNulls = {
        ...createTestTransaction(),
        transactionId: undefined,
        accountId: null,
        notes: "",
        receiptImage: undefined,
        dueDate: null,
      };
      global.fetch = createFetchMock([transactionWithNulls]);

      const result = await fetchTransactionsByAccount("testAccount");

      expect(result).toHaveLength(1);
      expect(result![0].transactionId).toBeUndefined();
      expect(result![0].notes).toBe("");
    });
  });

  describe("Transaction Business Logic", () => {
    it("should handle different transaction types", async () => {
      const transactionTypes = [
        createTestTransaction({ transactionType: "expense", amount: -100.0 }),
        createTestTransaction({ transactionType: "income", amount: 100.0 }),
        createTestTransaction({ transactionType: "transfer", amount: 50.0 }),
      ];
      global.fetch = createFetchMock(transactionTypes);

      const result = await fetchTransactionsByAccount("testAccount");

      const types = result!.map(t => t.transactionType);
      expect(types).toContain("expense");
      expect(types).toContain("income");
      expect(types).toContain("transfer");
    });

    it("should handle different reoccurring types", async () => {
      const reoccurringTransactions = [
        createTestTransaction({ reoccurringType: "onetime" }),
        createTestTransaction({ reoccurringType: "monthly" }),
        createTestTransaction({ reoccurringType: "weekly" }),
        createTestTransaction({ reoccurringType: "yearly" }),
      ];
      global.fetch = createFetchMock(reoccurringTransactions);

      const result = await fetchTransactionsByAccount("testAccount");

      const reoccurringTypes = result!.map(t => t.reoccurringType);
      expect(reoccurringTypes).toContain("onetime");
      expect(reoccurringTypes).toContain("monthly");
      expect(reoccurringTypes).toContain("weekly");
      expect(reoccurringTypes).toContain("yearly");
    });

    it("should handle active and inactive transactions", async () => {
      const statusTransactions = [
        createTestTransaction({ activeStatus: true }),
        createTestTransaction({ activeStatus: false }),
      ];
      global.fetch = createFetchMock(statusTransactions);

      const result = await fetchTransactionsByAccount("testAccount");

      expect(result![0].activeStatus).toBe(true);
      expect(result![1].activeStatus).toBe(false);
    });
  });
});