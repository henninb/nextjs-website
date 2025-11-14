import Transaction from "../model/Transaction";
import { useAuthenticatedQuery } from "../utils/queryConfig";
import { InputSanitizer } from "../utils/validation/sanitization";
import { QueryKeys } from "../utils/cacheUtils";
import { createHookLogger } from "../utils/logger";

const log = createHookLogger("useTransactionByCategoryFetch");

/**
 * Fetch transactions for a specific category
 * Requires authentication
 *
 * @param categoryName - Category name to fetch transactions for
 * @returns List of transactions for the category
 */
const fetchTransactionsByCategory = async (
  categoryName: string,
): Promise<Transaction[] | null> => {
  // Sanitize category name for URL
  const sanitizedCategory = InputSanitizer.sanitizeForUrl(categoryName);

  log.debug("Fetching transactions by category", { categoryName });

  const endpoint = `/api/transaction/category/${sanitizedCategory}`;
  const response = await fetch(endpoint, {
    method: "GET",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const errorMessage = `Failed to fetch transactions for category: ${response.statusText}`;
    log.error("Fetch failed", { error: errorMessage, status: response.status });
    throw new Error(errorMessage);
  }

  return response.status !== 204 ? await response.json() : null;
};

/**
 * Hook for fetching transactions by category
 * Requires authentication
 *
 * @param categoryName - Category name to fetch transactions for
 * @returns React Query result with transaction data
 *
 * @example
 * ```typescript
 * const { data: transactions, isLoading } = useTransactionByCategoryFetch("groceries");
 * ```
 */
export default function useTransactionByCategoryFetch(categoryName: string) {
  const queryResult = useAuthenticatedQuery(
    QueryKeys.transactionByCategory(categoryName),
    () => fetchTransactionsByCategory(categoryName),
    {
      enabled: !!categoryName,
    },
  );

  if (queryResult.isError) {
    log.error("Fetch failed", queryResult.error);
  }

  if (queryResult.isSuccess && queryResult.data) {
    log.debug("Fetched transactions", {
      categoryName,
      count: queryResult.data.length,
    });
  }

  return queryResult;
}
