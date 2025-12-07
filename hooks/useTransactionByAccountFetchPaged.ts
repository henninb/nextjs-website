import Transaction from "../model/Transaction";
import { useAuthenticatedQuery } from "../utils/queryConfig";
import { InputSanitizer } from "../utils/validation/sanitization";
import { getAccountKey } from "../utils/cacheUtils";
import { createHookLogger } from "../utils/logger";

const log = createHookLogger("useTransactionByAccountFetchPaged");

/**
 * Spring Boot Page response structure
 */
export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number; // current page number (0-indexed)
  size: number;
  numberOfElements: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

/**
 * Fetch paginated transactions for a specific account
 * Requires authentication
 *
 * @param accountNameOwner - Account name to fetch transactions for
 * @param page - Page number (0-indexed)
 * @param size - Page size
 * @returns Page of transactions with pagination metadata
 */
export const fetchTransactionsByAccountPaged = async (
  accountNameOwner: string,
  page: number,
  size: number,
): Promise<PageResponse<Transaction> | null> => {
  // Sanitize account name for URL
  const sanitizedAccount = InputSanitizer.sanitizeForUrl(accountNameOwner);

  log.debug("Fetching paginated transactions by account", {
    accountNameOwner,
    page,
    size,
  });

  const endpoint = `/api/transaction/account/select/${sanitizedAccount}/paged?page=${page}&size=${size}`;
  const response = await fetch(endpoint, {
    method: "GET",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const errorMessage = `Failed to fetch paginated transactions for account: ${response.statusText}`;
    log.error("Fetch failed", { error: errorMessage, status: response.status });
    throw new Error(errorMessage);
  }

  return response.status !== 204 ? await response.json() : null;
};

/**
 * Hook for fetching paginated transactions by account
 * Requires authentication
 *
 * @param accountNameOwner - Account name to fetch transactions for
 * @param page - Page number (0-indexed)
 * @param size - Page size (default: 50)
 * @returns React Query result with paginated transaction data
 *
 * @example
 * ```typescript
 * const { data, isLoading } = useTransactionByAccountFetchPaged("checking", 0, 50);
 * const transactions = data?.content || [];
 * const totalCount = data?.totalElements || 0;
 * ```
 */
export default function useTransactionByAccountFetchPaged(
  accountNameOwner: string,
  page: number,
  size: number = 50,
) {
  const queryResult = useAuthenticatedQuery(
    [...getAccountKey(accountNameOwner), "paged", page, size],
    () => fetchTransactionsByAccountPaged(accountNameOwner, page, size),
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
      enabled: !!accountNameOwner,
      // Note: In React Query v5, keepPreviousData was removed
      // The library now handles this automatically with the new cache behavior
    },
  );

  if (queryResult.isError) {
    log.error("Fetch failed", queryResult.error);
  }

  if (queryResult.isSuccess && queryResult.data) {
    log.debug("Fetched paginated transactions", {
      accountNameOwner,
      page,
      size,
      totalElements: queryResult.data.totalElements,
      numberOfElements: queryResult.data.numberOfElements,
    });
  }

  return queryResult;
}
