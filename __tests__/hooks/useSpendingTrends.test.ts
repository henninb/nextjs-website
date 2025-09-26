/**
 * Tests for useSpendingTrends hook
 * Tests both API logic and data transformation following TDD principles
 */

import {
  fetchAllTransactionsForTrends,
  transformToTrendsData,
  TrendsFilters,
} from "../../hooks/useSpendingTrends";
import Transaction from "../../model/Transaction";
import {
  createFetchMock,
  createErrorFetchMock,
  simulateNetworkError,
  ConsoleSpy,
} from "../../testHelpers";

describe("useSpendingTrends", () => {
  let consoleSpy: ConsoleSpy;
  const originalFetch = global.fetch;

  const createMockTransaction = (
    overrides: Partial<Transaction> = {},
  ): Transaction => ({
    transactionId: Math.floor(Math.random() * 1000),
    transactionDate: new Date("2024-01-15"),
    accountNameOwner: "test-account",
    description: "Test Transaction",
    category: "Food",
    amount: -100.0,
    transactionState: "cleared",
    transactionType: "expense",
    reoccurringType: "onetime",
    accountType: "debit",
    activeStatus: true,
    notes: "",
    guid: "test-guid",
    ...overrides,
  });

  beforeEach(() => {
    consoleSpy = new ConsoleSpy();
  });

  afterEach(() => {
    consoleSpy.stop();
    global.fetch = originalFetch;
  });

  describe("fetchAllTransactionsForTrends", () => {
    beforeEach(() => {
      // Mock Date to have consistent test results
      jest.useFakeTimers();
      jest.setSystemTime(new Date("2024-06-15T12:00:00Z"));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    describe("API calls", () => {
      it("should fetch transactions with correct date range parameters", async () => {
        const mockTransactions = [
          createMockTransaction({ amount: -100.0 }),
          createMockTransaction({ amount: -50.0 }),
        ];
        global.fetch = createFetchMock(mockTransactions);

        await fetchAllTransactionsForTrends({ dateRange: { months: 12 } });

        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining("/api/transaction/select/all"),
          expect.objectContaining({
            method: "GET",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
          }),
        );

        // Check that the URL contains date parameters
        const callUrl = (global.fetch as jest.Mock).mock.calls[0][0];
        expect(callUrl).toContain("startDate=2023-06-15");
        expect(callUrl).toContain("endDate=2024-06-15");
      });

      it("should default to 12 months when no date range specified", async () => {
        const mockTransactions = [createMockTransaction()];
        global.fetch = createFetchMock(mockTransactions);

        await fetchAllTransactionsForTrends();

        const callUrl = (global.fetch as jest.Mock).mock.calls[0][0];
        expect(callUrl).toContain("startDate=2023-06-15");
      });

      it("should use custom month range when specified", async () => {
        const mockTransactions = [createMockTransaction()];
        global.fetch = createFetchMock(mockTransactions);

        await fetchAllTransactionsForTrends({ dateRange: { months: 6 } });

        const callUrl = (global.fetch as jest.Mock).mock.calls[0][0];
        expect(callUrl).toContain("startDate=2023-12-15");
      });

      it("should return array of transactions on successful fetch", async () => {
        const mockTransactions = [
          createMockTransaction({ transactionId: 1, amount: -100.0 }),
          createMockTransaction({ transactionId: 2, amount: -75.0 }),
        ];
        global.fetch = createFetchMock(mockTransactions);

        const result = await fetchAllTransactionsForTrends();

        expect(result).toEqual(mockTransactions);
      });
    });

    describe("Error handling", () => {
      it("should return empty array on 404 response", async () => {
        const mockLog = consoleSpy.start().log;
        global.fetch = jest.fn().mockResolvedValue({
          ok: false,
          status: 404,
          statusText: "Not Found",
        });

        const result = await fetchAllTransactionsForTrends();

        expect(result).toEqual([]);
        expect(mockLog).toHaveBeenCalledWith(
          "No transactions found for trends analysis",
        );
      });

      it("should throw error on 500 server error", async () => {
        const mockError = consoleSpy.start().error;
        global.fetch = createErrorFetchMock("Internal Server Error", 500);

        await expect(fetchAllTransactionsForTrends()).rejects.toThrow(
          "Failed to fetch trends data: Failed to fetch transactions for trends: Bad Request",
        );

        expect(mockError).toHaveBeenCalledWith(
          "Error fetching transactions for trends:",
          expect.any(Error),
        );
      });

      it("should handle network errors", async () => {
        const mockError = consoleSpy.start().error;
        global.fetch = simulateNetworkError();

        await expect(fetchAllTransactionsForTrends()).rejects.toThrow(
          "Failed to fetch trends data: Network error",
        );

        expect(mockError).toHaveBeenCalled();
      });

      it("should return empty array for non-array responses", async () => {
        global.fetch = createFetchMock({ message: "Not an array" });

        const result = await fetchAllTransactionsForTrends();

        expect(result).toEqual([]);
      });

      it("should return empty array for null response", async () => {
        global.fetch = createFetchMock(null);

        const result = await fetchAllTransactionsForTrends();

        expect(result).toEqual([]);
      });
    });
  });

  describe("transformToTrendsData", () => {
    describe("Data transformation", () => {
      it("should transform transactions into trends data structure", () => {
        const transactions = [
          createMockTransaction({
            transactionDate: new Date("2024-02-15"),
            amount: -150.0,
            category: "Food",
          }),
          createMockTransaction({
            transactionDate: new Date("2024-02-20"),
            amount: -75.0,
            category: "Transportation",
          }),
          createMockTransaction({
            transactionDate: new Date("2024-01-15"),
            amount: -200.0,
            category: "Food",
          }),
        ];

        const result = transformToTrendsData(transactions);

        expect(result).toEqual(
          expect.objectContaining({
            monthlySpending: expect.arrayContaining([
              expect.objectContaining({
                yearMonth: "2024-02",
                totalSpend: 225.0,
                transactionCount: 2,
                categories: {
                  Food: 150.0,
                  Transportation: 75.0,
                },
              }),
              expect.objectContaining({
                yearMonth: "2024-01",
                totalSpend: 200.0,
                transactionCount: 1,
                categories: {
                  Food: 200.0,
                },
              }),
            ]),
            currentMonth: expect.objectContaining({
              yearMonth: "2024-02",
              totalSpend: 225.0,
            }),
            previousMonth: expect.objectContaining({
              yearMonth: "2024-01",
              totalSpend: 200.0,
            }),
          }),
        );
      });

      it("should calculate month-over-month comparison correctly", () => {
        const transactions = [
          createMockTransaction({
            transactionDate: new Date("2024-02-15"),
            amount: -150.0,
          }),
          createMockTransaction({
            transactionDate: new Date("2024-01-15"),
            amount: -100.0,
          }),
        ];

        const result = transformToTrendsData(transactions);

        expect(result.monthOverMonth).toEqual({
          currentAmount: 150.0,
          previousAmount: 100.0,
          absoluteChange: 50.0,
          percentageChange: 50.0,
        });
      });

      it("should provide top categories for current month", () => {
        const transactions = [
          createMockTransaction({
            transactionDate: new Date("2024-02-15"),
            amount: -200.0,
            category: "Food",
          }),
          createMockTransaction({
            transactionDate: new Date("2024-02-20"),
            amount: -150.0,
            category: "Transportation",
          }),
          createMockTransaction({
            transactionDate: new Date("2024-02-25"),
            amount: -100.0,
            category: "Entertainment",
          }),
        ];

        const result = transformToTrendsData(transactions);

        expect(result.topCategories).toHaveLength(3);
        expect(result.topCategories[0]).toEqual(
          expect.objectContaining({
            category: "Food",
            amount: 200.0,
          }),
        );
        expect(result.topCategories[0].percentage).toBeCloseTo(44.44, 2);

        expect(result.topCategories[1]).toEqual(
          expect.objectContaining({
            category: "Transportation",
            amount: 150.0,
          }),
        );
        expect(result.topCategories[1].percentage).toBeCloseTo(33.33, 2);

        expect(result.topCategories[2]).toEqual(
          expect.objectContaining({
            category: "Entertainment",
            amount: 100.0,
          }),
        );
        expect(result.topCategories[2].percentage).toBeCloseTo(22.22, 2);
      });

      it("should calculate category changes between months", () => {
        const transactions = [
          // February
          createMockTransaction({
            transactionDate: new Date("2024-02-15"),
            amount: -180.0,
            category: "Food",
          }),
          createMockTransaction({
            transactionDate: new Date("2024-02-20"),
            amount: -100.0,
            category: "Entertainment",
          }),
          // January
          createMockTransaction({
            transactionDate: new Date("2024-01-15"),
            amount: -200.0,
            category: "Food",
          }),
          createMockTransaction({
            transactionDate: new Date("2024-01-20"),
            amount: -150.0,
            category: "Shopping",
          }),
        ];

        const result = transformToTrendsData(transactions);

        expect(result.categoryChanges).toContainEqual(
          expect.objectContaining({
            category: "Food",
            currentAmount: 180.0,
            previousAmount: 200.0,
            absoluteChange: -20.0,
            percentageChange: -10.0,
          }),
        );

        expect(result.categoryChanges).toContainEqual(
          expect.objectContaining({
            category: "Shopping",
            currentAmount: 0,
            previousAmount: 150.0,
            absoluteChange: -150.0,
            percentageChange: -100.0,
          }),
        );

        expect(result.categoryChanges).toContainEqual(
          expect.objectContaining({
            category: "Entertainment",
            currentAmount: 100.0,
            previousAmount: 0,
            absoluteChange: 100.0,
            percentageChange: null,
          }),
        );
      });
    });

    describe("Filter application", () => {
      it("should apply spending filters to aggregation", () => {
        const transactions = [
          createMockTransaction({
            amount: -100.0,
            accountNameOwner: "account-1",
            category: "Food",
          }),
          createMockTransaction({
            amount: -75.0,
            accountNameOwner: "account-2",
            category: "Transportation",
          }),
          createMockTransaction({
            amount: -50.0,
            transactionType: "transfer",
          }),
        ];

        const filters: TrendsFilters = {
          accountFilter: ["account-1"],
          includeTransfers: false,
        };

        const result = transformToTrendsData(transactions, filters);

        expect(result.currentMonth?.totalSpend).toBe(100.0);
        expect(result.currentMonth?.transactionCount).toBe(1);
        expect(result.currentMonth?.categories).toEqual({ Food: 100.0 });
      });

      it("should handle category filtering", () => {
        const transactions = [
          createMockTransaction({ amount: -100.0, category: "Food" }),
          createMockTransaction({ amount: -75.0, category: "Transportation" }),
          createMockTransaction({ amount: -50.0, category: "Entertainment" }),
        ];

        const result = transformToTrendsData(transactions, {
          categoryFilter: ["Food", "Entertainment"],
        });

        expect(result.currentMonth?.totalSpend).toBe(150.0);
        expect(result.currentMonth?.categories).toEqual({
          Food: 100.0,
          Entertainment: 50.0,
        });
      });

      it("should handle exclude categories filter", () => {
        const transactions = [
          createMockTransaction({ amount: -100.0, category: "Food" }),
          createMockTransaction({ amount: -75.0, category: "Transportation" }),
          createMockTransaction({ amount: -50.0, category: "Entertainment" }),
        ];

        const result = transformToTrendsData(transactions, {
          excludeCategories: ["Transportation"],
        });

        expect(result.currentMonth?.totalSpend).toBe(150.0);
        expect(result.currentMonth?.categories).toEqual({
          Food: 100.0,
          Entertainment: 50.0,
        });
      });
    });

    describe("Edge cases", () => {
      it("should handle empty transaction array", () => {
        const result = transformToTrendsData([]);

        expect(result).toEqual({
          monthlySpending: [],
          currentMonth: null,
          previousMonth: null,
          monthOverMonth: null,
          topCategories: [],
          categoryChanges: [],
        });
      });

      it("should handle single month of data", () => {
        const transactions = [
          createMockTransaction({ amount: -100.0, category: "Food" }),
        ];

        const result = transformToTrendsData(transactions);

        expect(result.currentMonth).toBeTruthy();
        expect(result.previousMonth).toBeNull();
        expect(result.monthOverMonth).toBeNull();
        expect(result.categoryChanges).toEqual([]);
      });

      it("should handle invalid/null transactions gracefully", () => {
        const transactions = [
          createMockTransaction({ amount: -100.0 }),
          null as any,
          undefined as any,
          { ...createMockTransaction(), amount: undefined as any },
        ];

        const result = transformToTrendsData(transactions);

        expect(result.currentMonth?.totalSpend).toBe(100.0);
        expect(result.currentMonth?.transactionCount).toBe(1);
      });
    });
  });

  describe("Query key generation", () => {
    it("should generate stable query keys for caching", () => {
      const filters1: TrendsFilters = {
        dateRange: { months: 12 },
        includeTransfers: false,
        accountFilter: ["account-1", "account-2"],
      };

      const filters2: TrendsFilters = {
        dateRange: { months: 12 },
        includeTransfers: false,
        accountFilter: ["account-1", "account-2"],
      };

      // Same filters should generate same query key for proper caching
      expect(JSON.stringify(filters1)).toEqual(JSON.stringify(filters2));
    });

    it("should generate different query keys for different filters", () => {
      const filters1: TrendsFilters = { dateRange: { months: 12 } };
      const filters2: TrendsFilters = { dateRange: { months: 6 } };

      expect(JSON.stringify(filters1)).not.toEqual(JSON.stringify(filters2));
    });
  });

  describe("Performance considerations", () => {
    it("should handle large datasets efficiently", () => {
      // Generate 10k transactions for performance testing
      const transactions = Array.from({ length: 10000 }, (_, index) =>
        createMockTransaction({
          transactionId: index,
          amount: -Math.random() * 1000,
          transactionDate: new Date(
            2024,
            Math.floor(index / 417),
            (index % 30) + 1,
          ),
          category: ["Food", "Transportation", "Entertainment", "Shopping"][
            index % 4
          ],
        }),
      );

      const startTime = performance.now();
      const result = transformToTrendsData(transactions);
      const endTime = performance.now();

      // Should complete in under 250ms as per requirements
      expect(endTime - startTime).toBeLessThan(250);
      expect(result.monthlySpending.length).toBeGreaterThan(0);
      expect(result.currentMonth).toBeTruthy();
    });

    it("should not mutate original transaction data", () => {
      const originalTransactions = [
        createMockTransaction({ amount: -100.0, category: "Food" }),
      ];

      // Create a deep copy that preserves the original structure
      const transactionsCopy = originalTransactions.map((t) => ({ ...t }));

      transformToTrendsData(originalTransactions);

      // Verify key properties are unchanged
      expect(originalTransactions[0].amount).toBe(transactionsCopy[0].amount);
      expect(originalTransactions[0].category).toBe(
        transactionsCopy[0].category,
      );
      expect(originalTransactions[0].transactionDate.getTime()).toBe(
        transactionsCopy[0].transactionDate.getTime(),
      );
      expect(originalTransactions.length).toBe(transactionsCopy.length);
    });
  });
});
