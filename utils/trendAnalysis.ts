/**
 * Monthly Spending Trends Analysis Utilities
 *
 * Core domain logic for aggregating and analyzing spending patterns
 * across months with timezone-aware handling and configurable filters.
 */

import { normalizeTransactionDate } from "../components/Common";
import Transaction from "../model/Transaction";

export interface MonthlySpending {
  yearMonth: string; // YYYY-MM format
  totalSpend: number;
  transactionCount: number;
  categories: Record<string, number>;
}

export interface SpendingFilters {
  includeTransfers?: boolean;
  includeRefunds?: boolean;
  accountFilter?: string[];
  categoryFilter?: string[];
  excludeCategories?: string[];
}

export interface MonthOverMonthComparison {
  currentAmount: number;
  previousAmount: number;
  absoluteChange: number;
  percentageChange: number | null; // null if previous is 0
}

/**
 * Aggregate spending by month from transaction data
 * Excludes transfers by default, includes only negative amounts as spending
 */
export const aggregateMonthlySpend = (
  transactions: Transaction[],
  filters: SpendingFilters = {},
): MonthlySpending[] => {
  const {
    includeTransfers = false,
    includeRefunds = true,
    accountFilter = [],
    categoryFilter = [],
    excludeCategories = [],
  } = filters;

  if (!Array.isArray(transactions)) {
    return [];
  }

  const monthlyData = new Map<string, MonthlySpending>();

  for (const transaction of transactions) {
    // Skip invalid transactions
    if (!transaction || typeof transaction.amount !== "number") {
      continue;
    }

    // Apply filters
    if (!includeTransfers && transaction.transactionType === "transfer") {
      continue;
    }

    if (!includeRefunds && transaction.amount > 0) {
      continue;
    }

    if (
      accountFilter.length > 0 &&
      !accountFilter.includes(transaction.accountNameOwner || "")
    ) {
      continue;
    }

    if (
      categoryFilter.length > 0 &&
      !categoryFilter.includes(transaction.category || "")
    ) {
      continue;
    }

    if (
      excludeCategories.length > 0 &&
      excludeCategories.includes(transaction.category || "")
    ) {
      continue;
    }

    // Get normalized date and extract year-month
    const normalizedDate = normalizeTransactionDate(
      transaction.transactionDate,
    );
    const year = normalizedDate.getUTCFullYear();
    const month = normalizedDate.getUTCMonth();
    const yearMonth = `${year}-${String(month + 1).padStart(2, "0")}`;

    // Initialize monthly data if not exists
    if (!monthlyData.has(yearMonth)) {
      monthlyData.set(yearMonth, {
        yearMonth,
        totalSpend: 0,
        transactionCount: 0,
        categories: {},
      });
    }

    const monthData = monthlyData.get(yearMonth)!;

    // Use absolute value for spending calculation
    const spendAmount = Math.abs(transaction.amount);
    monthData.totalSpend += spendAmount;
    monthData.transactionCount += 1;

    // Track by category
    const category = transaction.category || "Uncategorized";
    monthData.categories[category] =
      (monthData.categories[category] || 0) + spendAmount;
  }

  // Convert to array and sort by year-month descending
  return Array.from(monthlyData.values()).sort((a, b) =>
    b.yearMonth.localeCompare(a.yearMonth),
  );
};

/**
 * Calculate month-over-month comparison with safe division
 */
export const diffMoM = (
  currentMonth: number,
  previousMonth: number,
): MonthOverMonthComparison => {
  const absoluteChange = currentMonth - previousMonth;
  const percentageChange =
    previousMonth === 0 ? null : (absoluteChange / previousMonth) * 100;

  return {
    currentAmount: currentMonth,
    previousAmount: previousMonth,
    absoluteChange,
    percentageChange,
  };
};

/**
 * Get top spending categories for a given month
 */
export const getTopCategories = (
  monthlyData: MonthlySpending,
  limit: number = 5,
): Array<{ category: string; amount: number; percentage: number }> => {
  const categoryEntries = Object.entries(monthlyData.categories);

  const sortedCategories = categoryEntries
    .map(([category, amount]) => ({
      category,
      amount,
      percentage:
        monthlyData.totalSpend > 0
          ? (amount / monthlyData.totalSpend) * 100
          : 0,
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, limit);

  return sortedCategories;
};

/**
 * Find categories with largest MoM changes
 */
export const getCategoryChanges = (
  currentMonth: MonthlySpending,
  previousMonth: MonthlySpending,
): Array<{
  category: string;
  currentAmount: number;
  previousAmount: number;
  absoluteChange: number;
  percentageChange: number | null;
}> => {
  const allCategories = new Set([
    ...Object.keys(currentMonth.categories),
    ...Object.keys(previousMonth.categories),
  ]);

  const changes = Array.from(allCategories).map((category) => {
    const current = currentMonth.categories[category] || 0;
    const previous = previousMonth.categories[category] || 0;
    const change = diffMoM(current, previous);

    return {
      category,
      currentAmount: current,
      previousAmount: previous,
      absoluteChange: change.absoluteChange,
      percentageChange: change.percentageChange,
    };
  });

  // Sort by absolute change magnitude
  return changes.sort(
    (a, b) => Math.abs(b.absoluteChange) - Math.abs(a.absoluteChange),
  );
};
