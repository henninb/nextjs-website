import Totals from "../model/Totals";
import { useAuthenticatedQuery } from "../utils/queryConfig";
import { InputSanitizer } from "../utils/validation/sanitization";
import { QueryKeys } from "../utils/cacheUtils";
import { createHookLogger } from "../utils/logger";

const log = createHookLogger("useTotalsPerAccountFetch");

/**
 * Fetch totals for a specific account from API
 * Requires authentication
 *
 * @param accountNameOwner - Account name to fetch totals for
 * @returns Account-specific totals data
 */
export const fetchTotalsPerAccount = async (
  accountNameOwner: string,
): Promise<Totals> => {
  // Sanitize account name for URL
  const sanitizedAccount = InputSanitizer.sanitizeAccountName(accountNameOwner);

  log.debug("Fetching totals for account", {
    accountNameOwner: sanitizedAccount,
  });

  const response = await fetch(
    `/api/transaction/account/totals/${encodeURIComponent(sanitizedAccount)}`,
    {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    },
  );

  if (!response.ok) {
    const errorDetails = await response.json().catch(() => ({}));
    const errorMessage = `HTTP error! Status: ${response.status} Details: ${JSON.stringify(errorDetails)}`;
    log.error("Fetch failed", { status: response.status, errorDetails });
    throw new Error(errorMessage);
  }

  const data = await response.json();
  log.debug("Fetched account totals", {
    accountNameOwner: sanitizedAccount,
    totals: data.totals,
    cleared: data.cleared,
  });
  return data;
};

/**
 * Hook for fetching totals for a specific account
 * Requires authentication
 *
 * @param accountNameOwner - Account name to fetch totals for
 * @returns React Query result with account totals data
 *
 * @example
 * ```typescript
 * const { data: totals, isLoading } = useTotalsPerAccountFetch("chase_checking");
 * ```
 */
export default function useTotalsPerAccountFetch(accountNameOwner: string) {
  const queryResult = useAuthenticatedQuery(
    QueryKeys.totals(accountNameOwner),
    () => fetchTotalsPerAccount(accountNameOwner),
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      retry: 1,
      enabled: !!accountNameOwner,
    },
  );

  if (queryResult.isError) {
    log.error("Fetch failed", queryResult.error);
  }

  if (queryResult.isSuccess && queryResult.data) {
    log.debug("Query successful", {
      accountNameOwner,
      totals: queryResult.data.totals,
    });
  }

  return queryResult;
}
