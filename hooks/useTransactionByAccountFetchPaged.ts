import Transaction from "../model/Transaction";
import { useAuthenticatedQuery } from "../utils/queryConfig";
import { InputSanitizer } from "../utils/validation/sanitization";
import { getAccountKey } from "../utils/cacheUtils";
import { createHookLogger } from "../utils/logger";

const log = createHookLogger("useTransactionByAccountFetchPaged");

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  numberOfElements: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export interface TransactionPageFilters {
  search?: string;
  states?: string[];
  transactionTypes?: string[];
  reoccurringTypes?: string[];
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
}

export const fetchTransactionsByAccountPaged = async (
  accountNameOwner: string,
  page: number,
  size: number,
  filters: TransactionPageFilters = {},
): Promise<PageResponse<Transaction> | null> => {
  const sanitizedAccount = InputSanitizer.sanitizeForUrl(accountNameOwner);

  log.debug("Fetching paginated transactions by account", {
    accountNameOwner,
    page,
    size,
    filters,
  });

  const params = new URLSearchParams({
    page: String(page),
    size: String(size),
  });

  if (filters.search) params.set("search", filters.search);
  if (filters.states?.length) params.set("states", filters.states.join(","));
  if (filters.transactionTypes?.length)
    params.set("transactionTypes", filters.transactionTypes.join(","));
  if (filters.reoccurringTypes?.length)
    params.set("reoccurringTypes", filters.reoccurringTypes.join(","));
  if (filters.startDate) params.set("startDate", filters.startDate);
  if (filters.endDate) params.set("endDate", filters.endDate);
  if (filters.minAmount !== undefined)
    params.set("minAmount", String(filters.minAmount));
  if (filters.maxAmount !== undefined)
    params.set("maxAmount", String(filters.maxAmount));

  const endpoint = `/api/transaction/account/select/${sanitizedAccount}/paged?${params.toString()}`;
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

export default function useTransactionByAccountFetchPaged(
  accountNameOwner: string,
  page: number,
  size: number = 50,
  filters: TransactionPageFilters = {},
) {
  const queryResult = useAuthenticatedQuery(
    [...getAccountKey(accountNameOwner), "paged", page, size, filters],
    () => fetchTransactionsByAccountPaged(accountNameOwner, page, size, filters),
    {
      staleTime: 5 * 60 * 1000,
      retry: 1,
      enabled: !!accountNameOwner,
    },
  );

  return queryResult;
}
