import Transaction from "../model/Transaction";
import { useAuthenticatedQuery } from "../utils/queryConfig";
import { InputSanitizer } from "../utils/validation/sanitization";
import { getAccountKey } from "../utils/cacheUtils";
import { createHookLogger } from "../utils/logger";

const log = createHookLogger("useTransactionByAccountFetch");

/**
 * Fetch transactions for a specific account
 * Requires authentication
 *
 * @param accountNameOwner - Account name to fetch transactions for
 * @returns List of transactions for the account
 */
export const fetchTransactionsByAccount = async (
  accountNameOwner: string,
): Promise<Transaction[] | null> => {
  // Sanitize account name for URL
  const sanitizedAccount = InputSanitizer.sanitizeForUrl(accountNameOwner);

  log.debug("Fetching transactions by account", { accountNameOwner });

  const endpoint = `/api/transaction/account/select/${sanitizedAccount}`;
  const response = await fetch(endpoint, {
    method: "GET",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const errorMessage = `Failed to fetch transactions for account: ${response.statusText}`;
    log.error("Fetch failed", { error: errorMessage, status: response.status });
    throw new Error(errorMessage);
  }

  return response.status !== 204 ? await response.json() : null;
};

/**
 * Hook for fetching transactions by account
 * Requires authentication
 *
 * @param accountNameOwner - Account name to fetch transactions for
 * @returns React Query result with transaction data
 *
 * @example
 * ```typescript
 * const { data: transactions, isLoading } = useTransactionByAccountFetch("checking");
 * ```
 */
export default function useTransactionByAccountFetch(accountNameOwner: string) {
  const queryResult = useAuthenticatedQuery(
    getAccountKey(accountNameOwner),
    () => fetchTransactionsByAccount(accountNameOwner),
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
      enabled: !!accountNameOwner,
    },
  );

  if (queryResult.isError) {
    log.error("Fetch failed", queryResult.error);
  }

  if (queryResult.isSuccess && queryResult.data) {
    log.debug("Fetched transactions", {
      accountNameOwner,
      count: queryResult.data.length,
    });
  }

  return queryResult;
}
