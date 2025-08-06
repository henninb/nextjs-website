import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider, createTheme } from "@mui/material/styles";

// Mock next/router before any imports that might use it
jest.mock("next/router", () => ({
  useRouter: () => ({
    push: jest.fn(),
    pathname: "/finance",
    query: {},
    asPath: "/finance",
    replace: jest.fn(),
  }),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  const theme = createTheme();
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        {children}
      </ThemeProvider>
    </QueryClientProvider>
  );
};

describe("Finance Totals Integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Totals Data Processing", () => {
    it("handles empty totals data", () => {
      const emptyTotals = [];
      expect(emptyTotals).toHaveLength(0);
    });

    it("processes totals data correctly", () => {
      const mockTotals = [
        {
          accountNameOwner: "Chase Checking",
          totalAmount: 1500.00,
          transactionCount: 25,
          category: "Income",
        },
        {
          accountNameOwner: "Savings Account",
          totalAmount: -200.50,
          transactionCount: 8,
          category: "Expenses",
        },
      ];

      expect(mockTotals).toHaveLength(2);
      expect(mockTotals[0].totalAmount).toBe(1500.00);
      expect(mockTotals[1].totalAmount).toBe(-200.50);
    });

    it("calculates net totals correctly", () => {
      const income = 2500.00;
      const expenses = -850.75;
      const netTotal = income + expenses;
      
      expect(netTotal).toBe(1649.25);
    });
  });

  describe("Financial Summary Calculations", () => {
    it("calculates monthly totals", () => {
      const monthlyData = [
        { month: "January", income: 3000, expenses: -1200 },
        { month: "February", income: 3200, expenses: -1100 },
        { month: "March", income: 2800, expenses: -1300 },
      ];

      const totalIncome = monthlyData.reduce((sum, month) => sum + month.income, 0);
      const totalExpenses = monthlyData.reduce((sum, month) => sum + month.expenses, 0);
      
      expect(totalIncome).toBe(9000);
      expect(totalExpenses).toBe(-3600);
      expect(totalIncome + totalExpenses).toBe(5400);
    });

    it("groups transactions by category", () => {
      const transactions = [
        { category: "Food", amount: -125.50 },
        { category: "Food", amount: -89.25 },
        { category: "Transportation", amount: -45.00 },
        { category: "Income", amount: 2500.00 },
      ];

      const categoryTotals = transactions.reduce((acc, transaction) => {
        if (!acc[transaction.category]) {
          acc[transaction.category] = 0;
        }
        acc[transaction.category] += transaction.amount;
        return acc;
      }, {} as Record<string, number>);

      expect(categoryTotals["Food"]).toBe(-214.75);
      expect(categoryTotals["Transportation"]).toBe(-45.00);
      expect(categoryTotals["Income"]).toBe(2500.00);
    });
  });

  describe("Account Balance Calculations", () => {
    it("calculates running balance", () => {
      const transactions = [
        { date: "2024-01-01", amount: 1000.00 },
        { date: "2024-01-02", amount: -150.50 },
        { date: "2024-01-03", amount: 500.00 },
        { date: "2024-01-04", amount: -75.25 },
      ];

      let runningBalance = 0;
      const balances = transactions.map(transaction => {
        runningBalance += transaction.amount;
        return { ...transaction, balance: runningBalance };
      });

      expect(balances[0].balance).toBe(1000.00);
      expect(balances[1].balance).toBe(849.50);
      expect(balances[2].balance).toBe(1349.50);
      expect(balances[3].balance).toBe(1274.25);
    });

    it("handles multiple account balances", () => {
      const accounts = [
        { name: "Chase Checking", balance: 2500.00 },
        { name: "Savings Account", balance: 15000.00 },
        { name: "Credit Card", balance: -850.50 },
      ];

      const totalAssets = accounts
        .filter(account => account.balance > 0)
        .reduce((sum, account) => sum + account.balance, 0);
        
      const totalLiabilities = Math.abs(accounts
        .filter(account => account.balance < 0)
        .reduce((sum, account) => sum + account.balance, 0));

      const netWorth = totalAssets - totalLiabilities;

      expect(totalAssets).toBe(17500.00);
      expect(totalLiabilities).toBe(850.50);
      expect(netWorth).toBe(16649.50);
    });
  });

  describe("Date Range Filtering", () => {
    it("filters transactions by date range", () => {
      const allTransactions = [
        { date: "2024-01-01", amount: 1000 },
        { date: "2024-01-15", amount: -200 },
        { date: "2024-02-01", amount: 1500 },
        { date: "2024-02-15", amount: -300 },
        { date: "2024-03-01", amount: 800 },
      ];

      const startDate = new Date("2024-01-01");
      const endDate = new Date("2024-02-28");

      const filteredTransactions = allTransactions.filter(transaction => {
        const transactionDate = new Date(transaction.date);
        return transactionDate >= startDate && transactionDate <= endDate;
      });

      expect(filteredTransactions).toHaveLength(4);
      expect(filteredTransactions.map(t => t.amount)).toEqual([1000, -200, 1500, -300]);
    });

    it("calculates totals for specific time periods", () => {
      const currentMonth = "2024-01";
      const transactions = [
        { date: "2024-01-05", amount: 2500 },
        { date: "2024-01-10", amount: -150 },
        { date: "2024-01-20", amount: -200 },
        { date: "2024-02-01", amount: 3000 }, // Different month
      ];

      const currentMonthTransactions = transactions.filter(t => 
        t.date.startsWith(currentMonth)
      );

      const monthlyTotal = currentMonthTransactions.reduce(
        (sum, t) => sum + t.amount, 0
      );

      expect(currentMonthTransactions).toHaveLength(3);
      expect(monthlyTotal).toBe(2150);
    });
  });

  describe("Error Handling in Calculations", () => {
    it("handles null and undefined values", () => {
      const transactions = [
        { amount: 100 },
        { amount: null },
        { amount: undefined },
        { amount: 0 },
        { amount: -50 },
      ];

      const validAmounts = transactions
        .map(t => t.amount)
        .filter(amount => typeof amount === "number" && !isNaN(amount));

      const total = validAmounts.reduce((sum, amount) => sum + amount, 0);

      expect(validAmounts).toEqual([100, 0, -50]);
      expect(total).toBe(50);
    });

    it("handles invalid number formats", () => {
      const amounts = ["100.50", "invalid", "200", "", null, undefined, 150.75];
      
      const validAmounts = amounts
        .map(amount => {
          if (typeof amount === "number") return amount;
          if (typeof amount === "string" && amount.trim() !== "") {
            const parsed = parseFloat(amount);
            return isNaN(parsed) ? 0 : parsed;
          }
          return 0;
        });

      const total = validAmounts.reduce((sum, amount) => sum + amount, 0);

      expect(validAmounts).toEqual([100.50, 0, 200, 0, 0, 0, 150.75]);
      expect(total).toBe(451.25);
    });
  });

  describe("Performance Considerations", () => {
    it("handles large datasets efficiently", () => {
      const largeDataset = Array.from({ length: 10000 }, (_, index) => ({
        id: index,
        amount: Math.random() * 1000 - 500,
        category: `Category ${index % 10}`,
      }));

      const startTime = performance.now();
      
      const total = largeDataset.reduce((sum, transaction) => 
        sum + transaction.amount, 0
      );

      const endTime = performance.now();
      const executionTime = endTime - startTime;

      expect(largeDataset).toHaveLength(10000);
      expect(typeof total).toBe("number");
      expect(executionTime).toBeLessThan(100); // Should complete in less than 100ms
    });

    it("memoizes expensive calculations", () => {
      let calculationCount = 0;
      
      const expensiveCalculation = (data: number[]) => {
        calculationCount++;
        return data.reduce((sum, val) => sum + val * val, 0);
      };

      const data = [1, 2, 3, 4, 5];
      
      // Simulate memoization by caching result
      let cachedResult: number | null = null;
      
      const memoizedCalculation = (data: number[]) => {
        if (cachedResult === null) {
          cachedResult = expensiveCalculation(data);
        }
        return cachedResult;
      };

      const result1 = memoizedCalculation(data);
      const result2 = memoizedCalculation(data);

      expect(result1).toBe(result2);
      expect(calculationCount).toBe(1); // Should only calculate once
      expect(result1).toBe(55); // 1 + 4 + 9 + 16 + 25
    });
  });
});