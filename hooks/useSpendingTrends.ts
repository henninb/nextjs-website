/**
 * React Query hook for fetching and analyzing spending trends
 * Combines transaction data with trend analysis utilities
 */

import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { useAuth } from "../components/AuthProvider";
import Transaction from "../model/Transaction";
import {
  aggregateMonthlySpend,
  diffMoM,
  getTopCategories,
  getCategoryChanges,
  SpendingFilters,
  MonthlySpending,
  MonthOverMonthComparison,
} from "../utils/trendAnalysis";

export interface SpendingTrendsData {
  monthlySpending: MonthlySpending[];
  currentMonth: MonthlySpending | null;
  previousMonth: MonthlySpending | null;
  monthOverMonth: MonthOverMonthComparison | null;
  topCategories: Array<{
    category: string;
    amount: number;
    percentage: number;
  }>;
  categoryChanges: Array<{
    category: string;
    currentAmount: number;
    previousAmount: number;
    absoluteChange: number;
    percentageChange: number | null;
  }>;
}

export interface TrendsFilters extends SpendingFilters {
  dateRange?: {
    months: number; // How many months back to fetch (6, 12, 24)
  };
}

/**
 * Fetch all transactions for trends analysis
 * Note: This assumes we can call a general transaction endpoint
 * In a real implementation, this might need to be adjusted based on the actual API
 */
export const fetchAllTransactionsForTrends = async (
  filters: TrendsFilters = {},
): Promise<Transaction[]> => {
  const { dateRange } = filters;
  const monthsBack = dateRange?.months || 12;

  try {
    // Calculate date range for the API call
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - monthsBack);

    // This endpoint might need to be created or adjusted based on the actual API structure
    // For now, I'm assuming a general transaction endpoint with date filtering
    const params = new URLSearchParams({
      startDate: startDate.toISOString().split("T")[0],
      endDate: endDate.toISOString().split("T")[0],
    });

    const response = await fetch(`/api/transaction/select/all?${params}`, {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        console.log("No transactions found for trends analysis");
        return [];
      }
      throw new Error(
        `Failed to fetch transactions for trends: ${response.statusText}`,
      );
    }

    const transactions = await response.json();
    return Array.isArray(transactions) ? transactions : [];
  } catch (error: any) {
    console.error("Error fetching transactions for trends:", error);
    throw new Error(`Failed to fetch trends data: ${error.message}`);
  }
};

/**
 * Transform raw transactions into analyzed trends data
 */
export const transformToTrendsData = (
  transactions: Transaction[],
  filters: TrendsFilters = {},
): SpendingTrendsData => {
  // Apply aggregation with filters
  const monthlySpending = aggregateMonthlySpend(transactions, filters);

  // Get current and previous month data
  const currentMonth = monthlySpending[0] || null;
  const previousMonth = monthlySpending[1] || null;

  // Calculate month-over-month comparison
  const monthOverMonth =
    currentMonth && previousMonth
      ? diffMoM(currentMonth.totalSpend, previousMonth.totalSpend)
      : null;

  // Get top categories for current month
  const topCategories = currentMonth ? getTopCategories(currentMonth, 5) : [];

  // Get category changes
  const categoryChanges =
    currentMonth && previousMonth
      ? getCategoryChanges(currentMonth, previousMonth)
      : [];

  return {
    monthlySpending,
    currentMonth,
    previousMonth,
    monthOverMonth,
    topCategories,
    categoryChanges,
  };
};

/**
 * React Query hook for spending trends analysis
 */
export default function useSpendingTrends(
  filters: TrendsFilters = {},
): UseQueryResult<SpendingTrendsData, Error> {
  const { isAuthenticated, loading } = useAuth();

  const queryResult = useQuery({
    queryKey: ["spendingTrends", filters],
    queryFn: async () => {
      const transactions = await fetchAllTransactionsForTrends(filters);
      return transformToTrendsData(transactions, filters);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
    enabled: !loading && isAuthenticated,
  });

  return queryResult;
}

/**
 * Hook specifically for current month KPIs
 */
export function useCurrentMonthKPIs(filters: TrendsFilters = {}) {
  const trendsQuery = useSpendingTrends(filters);

  return {
    ...trendsQuery,
    data: trendsQuery.data
      ? {
          currentSpend: trendsQuery.data.currentMonth?.totalSpend || 0,
          transactionCount:
            trendsQuery.data.currentMonth?.transactionCount || 0,
          topCategory: trendsQuery.data.topCategories[0]?.category || "None",
          monthOverMonthChange: trendsQuery.data.monthOverMonth,
        }
      : null,
  };
}
