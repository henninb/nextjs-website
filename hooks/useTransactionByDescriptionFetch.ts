import Transaction from "../model/Transaction";
import { useAuthenticatedQuery } from "../utils/queryConfig";
import { InputSanitizer } from "../utils/validation/sanitization";
import { QueryKeys } from "../utils/cacheUtils";
import { createHookLogger } from "../utils/logger";

const log = createHookLogger("useTransactionByDescriptionFetch");

/**
 * Fetch transactions for a specific description
 * Requires authentication
 *
 * @param descriptionName - Description name to fetch transactions for
 * @returns List of transactions for the description
 */
const fetchTransactionsByDescription = async (
  descriptionName: string,
): Promise<Transaction[] | null> => {
  // Sanitize description name for URL
  const sanitizedDescription = InputSanitizer.sanitizeForUrl(descriptionName);

  log.debug("Fetching transactions by description", { descriptionName });

  const endpoint = `/api/transaction/description/${sanitizedDescription}`;
  const response = await fetch(endpoint, {
    method: "GET",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const errorMessage = `Failed to fetch transactions for description: ${response.statusText}`;
    log.error("Fetch failed", { error: errorMessage, status: response.status });
    throw new Error(errorMessage);
  }

  return response.status !== 204 ? await response.json() : null;
};

/**
 * Hook for fetching transactions by description
 * Requires authentication
 *
 * @param descriptionName - Description name to fetch transactions for
 * @returns React Query result with transaction data
 *
 * @example
 * ```typescript
 * const { data: transactions, isLoading } = useTransactionByDescriptionFetch("amazon");
 * ```
 */
export default function useTransactionByDescriptionFetch(
  descriptionName: string,
) {
  const queryResult = useAuthenticatedQuery(
    QueryKeys.transactionByDescription(descriptionName),
    () => fetchTransactionsByDescription(descriptionName),
    {
      enabled: !!descriptionName,
    },
  );

  if (queryResult.isError) {
    log.error("Fetch failed", queryResult.error);
  }

  if (queryResult.isSuccess && queryResult.data) {
    log.debug("Fetched transactions", {
      descriptionName,
      count: queryResult.data.length,
    });
  }

  return queryResult;
}
