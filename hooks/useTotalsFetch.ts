import Totals from "../model/Totals";
import { useAuthenticatedQuery } from "../utils/queryConfig";
import { QueryKeys } from "../utils/cacheUtils";
import { createHookLogger } from "../utils/logger";

const log = createHookLogger("useTotalsFetch");

/**
 * Fetch account totals from API
 * Requires authentication
 *
 * @returns Account totals data
 */
export const fetchTotals = async (): Promise<Totals> => {
  log.debug("Fetching account totals");

  const response = await fetch("/api/account/totals", {
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
  log.debug("Fetched account totals", {
    totals: data.totals,
    cleared: data.cleared,
  });
  return data;
};

/**
 * Hook for fetching account totals
 * Requires authentication
 * Note: Uses "totalsPerAccount" cache key for consistency with existing code
 *
 * @returns React Query result with totals data
 *
 * @example
 * ```typescript
 * const { data: totals, isLoading } = useTotalsFetch();
 * ```
 */
export default function useTotalsFetch() {
  const queryResult = useAuthenticatedQuery(
    QueryKeys.totalsPerAccount(),
    fetchTotals,
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
    log.debug("Query successful", {
      totals: queryResult.data.totals,
    });
  }

  return queryResult;
}
