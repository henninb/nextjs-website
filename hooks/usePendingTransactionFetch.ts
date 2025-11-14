import PendingTransaction from "../model/PendingTransaction";
import { useAuthenticatedQuery } from "../utils/queryConfig";
import { QueryKeys } from "../utils/cacheUtils";
import { createHookLogger } from "../utils/logger";

const log = createHookLogger("usePendingTransactionFetch");

/**
 * Fetch active pending transactions from API
 * Requires authentication
 *
 * @returns List of active pending transactions
 */
export const fetchPendingTransactions = async (): Promise<
  PendingTransaction[]
> => {
  log.debug("Fetching pending transactions");

  const response = await fetch("/api/pending/transaction/active", {
    method: "GET",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const errorDetails = await response.json().catch(() => ({}));
    const errorMessage = `HTTP error! Status: ${response.status} Details: ${JSON.stringify(errorDetails)}`;
    log.error("Fetch failed", { status: response.status, errorDetails });
    throw new Error(errorMessage);
  }

  const data = await response.json();
  log.debug("Fetched pending transactions", { count: data.length });
  return data;
};

/**
 * Hook for fetching active pending transactions
 * Requires authentication
 *
 * @returns React Query result with pending transaction data
 *
 * @example
 * ```typescript
 * const { data: pendingTransactions, isLoading } = usePendingTransactionFetch();
 * ```
 */
export default function usePendingTransactionFetch() {
  const queryResult = useAuthenticatedQuery(
    QueryKeys.pendingTransaction(),
    fetchPendingTransactions,
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      retry: 1,
    },
  );

  if (queryResult.isError) {
    log.error("Fetch failed", queryResult.error);
  }

  if (queryResult.isSuccess && queryResult.data) {
    log.debug("Query successful", { count: queryResult.data.length });
  }

  return queryResult;
}
