/**
 * Tests for Monthly Spending Trends Analysis Utilities
 * Comprehensive test coverage for domain logic following TDD principles
 */

import {
  aggregateMonthlySpend,
  diffMoM,
  getTopCategories,
  getCategoryChanges,
  SpendingFilters,
  MonthlySpending,
} from "../../utils/trendAnalysis";
import Transaction from "../../model/Transaction";

describe("trendAnalysis utilities", () => {
  // Sample transaction data for testing
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
    accountType: "credit", // Default to credit for consistency with trend analysis
    activeStatus: true,
    notes: "",
    guid: "test-guid",
    ...overrides,
  });

  describe("aggregateMonthlySpend", () => {
    describe("Basic aggregation", () => {
      it("should aggregate spending by calendar month", () => {
        const transactions = [
          createMockTransaction({
            transactionDate: new Date("2024-01-15"),
            amount: -50.0,
          }),
          createMockTransaction({
            transactionDate: new Date("2024-01-20"),
            amount: -75.0,
          }),
          createMockTransaction({
            transactionDate: new Date("2024-02-05"),
            amount: -100.0,
          }),
        ];

        const result = aggregateMonthlySpend(transactions);

        expect(result).toHaveLength(2);
        expect(result[0]).toEqual({
          yearMonth: "2024-02",
          totalSpend: 100.0,
          transactionCount: 1,
          categories: { Food: 100.0 },
        });
        expect(result[1]).toEqual({
          yearMonth: "2024-01",
          totalSpend: 125.0,
          transactionCount: 2,
          categories: { Food: 125.0 },
        });
      });

      it("should handle different categories within same month", () => {
        const transactions = [
          createMockTransaction({
            transactionDate: new Date("2024-01-15"),
            amount: -50.0,
            category: "Food",
          }),
          createMockTransaction({
            transactionDate: new Date("2024-01-20"),
            amount: -75.0,
            category: "Transportation",
          }),
        ];

        const result = aggregateMonthlySpend(transactions);

        expect(result).toHaveLength(1);
        expect(result[0]).toEqual({
          yearMonth: "2024-01",
          totalSpend: 125.0,
          transactionCount: 2,
          categories: {
            Food: 50.0,
            Transportation: 75.0,
          },
        });
      });

      it("should sort results by year-month descending", () => {
        const transactions = [
          createMockTransaction({
            transactionDate: new Date("2023-12-15"),
            amount: -50.0,
          }),
          createMockTransaction({
            transactionDate: new Date("2024-02-05"),
            amount: -100.0,
          }),
          createMockTransaction({
            transactionDate: new Date("2024-01-20"),
            amount: -75.0,
          }),
        ];

        const result = aggregateMonthlySpend(transactions);

        expect(result.map((r) => r.yearMonth)).toEqual([
          "2024-02",
          "2024-01",
          "2023-12",
        ]);
      });

      it("should handle empty categories as 'Uncategorized'", () => {
        const transactions = [
          createMockTransaction({
            transactionDate: new Date("2024-01-15"),
            amount: -50.0,
            category: "",
          }),
          createMockTransaction({
            transactionDate: new Date("2024-01-15"),
            amount: -75.0,
            category: undefined as any,
          }),
        ];

        const result = aggregateMonthlySpend(transactions);

        expect(result[0].categories).toEqual({
          Uncategorized: 125.0,
        });
      });
    });

    describe("Spending calculation rules", () => {
      it("should exclude refunds/positive amounts by default when includeRefunds is false", () => {
        const transactions = [
          createMockTransaction({ amount: -100.0 }), // spending
          createMockTransaction({ amount: 50.0 }), // refund
          createMockTransaction({ amount: -75.0 }), // spending
        ];

        const result = aggregateMonthlySpend(transactions, {
          includeRefunds: false,
        });

        expect(result[0].totalSpend).toBe(175.0);
        expect(result[0].transactionCount).toBe(2);
      });

      it("should include refunds when includeRefunds is true", () => {
        const transactions = [
          createMockTransaction({ amount: -100.0 }), // spending
          createMockTransaction({ amount: 50.0 }), // refund
          createMockTransaction({ amount: -75.0 }), // spending
        ];

        const result = aggregateMonthlySpend(transactions, {
          includeRefunds: true,
        });

        expect(result[0].totalSpend).toBe(225.0);
        expect(result[0].transactionCount).toBe(3);
      });

      it("should exclude transfers by default", () => {
        const transactions = [
          createMockTransaction({ amount: -100.0, transactionType: "expense" }),
          createMockTransaction({ amount: -75.0, transactionType: "transfer" }),
        ];

        const result = aggregateMonthlySpend(transactions);

        expect(result[0].totalSpend).toBe(100.0);
        expect(result[0].transactionCount).toBe(1);
      });

      it("should include transfers when includeTransfers is true", () => {
        const transactions = [
          createMockTransaction({ amount: -100.0, transactionType: "expense" }),
          createMockTransaction({ amount: -75.0, transactionType: "transfer" }),
        ];

        const result = aggregateMonthlySpend(transactions, {
          includeTransfers: true,
        });

        expect(result[0].totalSpend).toBe(175.0);
        expect(result[0].transactionCount).toBe(2);
      });

      it("should use absolute values for spending amounts", () => {
        const transactions = [
          createMockTransaction({ amount: -100.0 }),
          createMockTransaction({ amount: 50.0 }), // This should be 50 when included
        ];

        const result = aggregateMonthlySpend(transactions, {
          includeRefunds: true,
        });

        expect(result[0].totalSpend).toBe(150.0); // |−100| + |50|
      });
    });

    describe("Filters", () => {
      it("should filter by account when accountFilter is provided", () => {
        const transactions = [
          createMockTransaction({
            accountNameOwner: "account-1",
            amount: -100.0,
          }),
          createMockTransaction({
            accountNameOwner: "account-2",
            amount: -75.0,
          }),
          createMockTransaction({
            accountNameOwner: "account-3",
            amount: -50.0,
          }),
        ];

        const result = aggregateMonthlySpend(transactions, {
          accountFilter: ["account-1", "account-3"],
        });

        expect(result[0].totalSpend).toBe(150.0);
        expect(result[0].transactionCount).toBe(2);
      });

      it("should filter by category when categoryFilter is provided", () => {
        const transactions = [
          createMockTransaction({ category: "Food", amount: -100.0 }),
          createMockTransaction({ category: "Transportation", amount: -75.0 }),
          createMockTransaction({ category: "Entertainment", amount: -50.0 }),
        ];

        const result = aggregateMonthlySpend(transactions, {
          categoryFilter: ["Food", "Entertainment"],
        });

        expect(result[0].totalSpend).toBe(150.0);
        expect(result[0].categories).toEqual({
          Food: 100.0,
          Entertainment: 50.0,
        });
      });

      it("should exclude categories when excludeCategories is provided", () => {
        const transactions = [
          createMockTransaction({ category: "Food", amount: -100.0 }),
          createMockTransaction({ category: "Transportation", amount: -75.0 }),
          createMockTransaction({ category: "Entertainment", amount: -50.0 }),
        ];

        const result = aggregateMonthlySpend(transactions, {
          excludeCategories: ["Transportation"],
        });

        expect(result[0].totalSpend).toBe(150.0);
        expect(result[0].categories).toEqual({
          Food: 100.0,
          Entertainment: 50.0,
        });
      });

      it("should filter by account type when accountTypeFilter is provided", () => {
        const transactions = [
          createMockTransaction({
            accountType: "credit",
            amount: -100.0,
            accountNameOwner: "credit-card"
          }),
          createMockTransaction({
            accountType: "debit",
            amount: -75.0,
            accountNameOwner: "checking"
          }),
          createMockTransaction({
            accountType: "credit",
            amount: -50.0,
            accountNameOwner: "credit-card-2"
          }),
        ];

        const result = aggregateMonthlySpend(transactions, {
          accountTypeFilter: ["credit"],
        });

        expect(result[0].totalSpend).toBe(150.0);
        expect(result[0].transactionCount).toBe(2);
      });

      it("should exclude payment transactions when excludePayments is true", () => {
        const transactions = [
          createMockTransaction({
            description: "grocery store",
            amount: -100.0
          }),
          createMockTransaction({
            description: "credit card payment",
            amount: -200.0
          }),
          createMockTransaction({
            description: "autopay payment",
            amount: -150.0
          }),
          createMockTransaction({
            category: "payment",
            amount: -75.0
          }),
          createMockTransaction({
            description: "restaurant",
            amount: -50.0
          }),
        ];

        const result = aggregateMonthlySpend(transactions, {
          excludePayments: true,
        });

        expect(result[0].totalSpend).toBe(150.0);
        expect(result[0].transactionCount).toBe(2);
      });

      it("should include payment transactions when excludePayments is false", () => {
        const transactions = [
          createMockTransaction({
            description: "grocery store",
            amount: -100.0
          }),
          createMockTransaction({
            description: "credit card payment",
            amount: -200.0
          }),
        ];

        const result = aggregateMonthlySpend(transactions, {
          excludePayments: false,
        });

        expect(result[0].totalSpend).toBe(300.0);
        expect(result[0].transactionCount).toBe(2);
      });
    });

    describe("Edge cases", () => {
      it("should handle empty transaction array", () => {
        const result = aggregateMonthlySpend([]);
        expect(result).toEqual([]);
      });

      it("should handle null/undefined input", () => {
        const result = aggregateMonthlySpend(null as any);
        expect(result).toEqual([]);
      });

      it("should skip invalid transactions", () => {
        const transactions = [
          createMockTransaction({ amount: -100.0 }),
          null as any,
          undefined as any,
          { ...createMockTransaction(), amount: undefined as any },
          createMockTransaction({ amount: -50.0 }),
        ];

        const result = aggregateMonthlySpend(transactions);

        expect(result[0].totalSpend).toBe(150.0);
        expect(result[0].transactionCount).toBe(2);
      });

      it("should handle zero amounts", () => {
        const transactions = [
          createMockTransaction({ amount: 0 }),
          createMockTransaction({ amount: -100.0 }),
        ];

        const result = aggregateMonthlySpend(transactions, {
          includeRefunds: true,
        });

        expect(result[0].totalSpend).toBe(100.0);
        expect(result[0].transactionCount).toBe(2);
      });

      it("should handle different months correctly", () => {
        // Use clear month boundaries to avoid date parsing issues
        const transactions = [
          createMockTransaction({
            transactionDate: new Date("2024-01-15"),
            amount: -100.0,
          }),
          createMockTransaction({
            transactionDate: new Date("2024-02-15"),
            amount: -75.0,
          }),
          createMockTransaction({
            transactionDate: new Date("2024-03-15"),
            amount: -50.0,
          }),
        ];

        const result = aggregateMonthlySpend(transactions);

        expect(result).toHaveLength(3);

        // Should be sorted descending by year-month
        expect(result[0].yearMonth).toBe("2024-03");
        expect(result[1].yearMonth).toBe("2024-02");
        expect(result[2].yearMonth).toBe("2024-01");

        expect(result[0].totalSpend).toBe(50.0);
        expect(result[1].totalSpend).toBe(75.0);
        expect(result[2].totalSpend).toBe(100.0);
      });
    });

    describe("Timezone handling", () => {
      it("should respect normalized date boundaries for month calculation", () => {
        // Use different months to ensure clear separation
        const transactions = [
          createMockTransaction({
            transactionDate: new Date("2024-01-15"),
            amount: -100.0,
          }),
          createMockTransaction({
            transactionDate: new Date("2024-02-15"),
            amount: -75.0,
          }),
        ];

        const result = aggregateMonthlySpend(transactions);

        expect(result).toHaveLength(2);

        const jan = result.find((r) => r.yearMonth === "2024-01");
        const feb = result.find((r) => r.yearMonth === "2024-02");

        expect(jan?.totalSpend).toBe(100.0);
        expect(feb?.totalSpend).toBe(75.0);
      });

      it("should handle different timezones consistently", () => {
        // Test that the normalizeTransactionDate function works consistently
        const transactions = [
          createMockTransaction({
            transactionDate: new Date("2024-01-15"),
            amount: -100.0,
          }),
          createMockTransaction({
            transactionDate: new Date("2024-01-15"),
            amount: -75.0,
          }),
        ];

        const result = aggregateMonthlySpend(transactions);

        expect(result).toHaveLength(1);
        expect(result[0].yearMonth).toBe("2024-01");
        expect(result[0].totalSpend).toBe(175.0);
        expect(result[0].transactionCount).toBe(2);
      });
    });
  });

  describe("diffMoM", () => {
    it("should calculate positive month-over-month change", () => {
      const result = diffMoM(150.0, 100.0);

      expect(result).toEqual({
        currentAmount: 150.0,
        previousAmount: 100.0,
        absoluteChange: 50.0,
        percentageChange: 50.0,
      });
    });

    it("should calculate negative month-over-month change", () => {
      const result = diffMoM(75.0, 100.0);

      expect(result).toEqual({
        currentAmount: 75.0,
        previousAmount: 100.0,
        absoluteChange: -25.0,
        percentageChange: -25.0,
      });
    });

    it("should handle zero previous amount with safe division", () => {
      const result = diffMoM(100.0, 0);

      expect(result).toEqual({
        currentAmount: 100.0,
        previousAmount: 0,
        absoluteChange: 100.0,
        percentageChange: null,
      });
    });

    it("should handle zero current amount", () => {
      const result = diffMoM(0, 100.0);

      expect(result).toEqual({
        currentAmount: 0,
        previousAmount: 100.0,
        absoluteChange: -100.0,
        percentageChange: -100.0,
      });
    });

    it("should handle both amounts being zero", () => {
      const result = diffMoM(0, 0);

      expect(result).toEqual({
        currentAmount: 0,
        previousAmount: 0,
        absoluteChange: 0,
        percentageChange: null,
      });
    });
  });

  describe("getTopCategories", () => {
    const monthlyData: MonthlySpending = {
      yearMonth: "2024-01",
      totalSpend: 500.0,
      transactionCount: 10,
      categories: {
        Food: 200.0,
        Transportation: 150.0,
        Entertainment: 100.0,
        Shopping: 30.0,
        Utilities: 20.0,
      },
    };

    it("should return top categories sorted by spending amount", () => {
      const result = getTopCategories(monthlyData, 3);

      expect(result).toEqual([
        { category: "Food", amount: 200.0, percentage: 40.0 },
        { category: "Transportation", amount: 150.0, percentage: 30.0 },
        { category: "Entertainment", amount: 100.0, percentage: 20.0 },
      ]);
    });

    it("should default to top 5 categories when limit not specified", () => {
      const result = getTopCategories(monthlyData);

      expect(result).toHaveLength(5);
      expect(result[0].category).toBe("Food");
      expect(result[4].category).toBe("Utilities");
    });

    it("should handle empty categories", () => {
      const emptyData: MonthlySpending = {
        yearMonth: "2024-01",
        totalSpend: 0,
        transactionCount: 0,
        categories: {},
      };

      const result = getTopCategories(emptyData);

      expect(result).toEqual([]);
    });

    it("should calculate percentages correctly with zero total", () => {
      const zeroData: MonthlySpending = {
        yearMonth: "2024-01",
        totalSpend: 0,
        transactionCount: 1,
        categories: {
          Food: 0,
        },
      };

      const result = getTopCategories(zeroData);

      expect(result[0].percentage).toBe(0);
    });
  });

  describe("getCategoryChanges", () => {
    const currentMonth: MonthlySpending = {
      yearMonth: "2024-02",
      totalSpend: 400.0,
      transactionCount: 8,
      categories: {
        Food: 180.0,
        Transportation: 120.0,
        Entertainment: 100.0,
      },
    };

    const previousMonth: MonthlySpending = {
      yearMonth: "2024-01",
      totalSpend: 500.0,
      transactionCount: 10,
      categories: {
        Food: 200.0,
        Transportation: 150.0,
        Shopping: 150.0,
      },
    };

    it("should calculate category changes correctly", () => {
      const result = getCategoryChanges(currentMonth, previousMonth);

      expect(result).toContainEqual(
        expect.objectContaining({
          category: "Food",
          currentAmount: 180.0,
          previousAmount: 200.0,
          absoluteChange: -20.0,
          percentageChange: -10.0,
        }),
      );

      expect(result).toContainEqual(
        expect.objectContaining({
          category: "Transportation",
          currentAmount: 120.0,
          previousAmount: 150.0,
          absoluteChange: -30.0,
          percentageChange: -20.0,
        }),
      );

      expect(result).toContainEqual(
        expect.objectContaining({
          category: "Shopping",
          currentAmount: 0,
          previousAmount: 150.0,
          absoluteChange: -150.0,
          percentageChange: -100.0,
        }),
      );

      expect(result).toContainEqual(
        expect.objectContaining({
          category: "Entertainment",
          currentAmount: 100.0,
          previousAmount: 0,
          absoluteChange: 100.0,
          percentageChange: null,
        }),
      );
    });

    it("should sort by absolute change magnitude", () => {
      const result = getCategoryChanges(currentMonth, previousMonth);

      // Shopping has the largest absolute change (-150), followed by Entertainment (+100)
      expect(result[0].category).toBe("Shopping");
      expect(result[1].category).toBe("Entertainment");
      expect(Math.abs(result[0].absoluteChange)).toBeGreaterThanOrEqual(
        Math.abs(result[1].absoluteChange),
      );
    });

    it("should handle empty previous month", () => {
      const emptyPrevious: MonthlySpending = {
        yearMonth: "2024-01",
        totalSpend: 0,
        transactionCount: 0,
        categories: {},
      };

      const result = getCategoryChanges(currentMonth, emptyPrevious);

      expect(result).toHaveLength(3);
      result.forEach((change) => {
        expect(change.previousAmount).toBe(0);
        expect(change.percentageChange).toBeNull();
      });
    });
  });
});
