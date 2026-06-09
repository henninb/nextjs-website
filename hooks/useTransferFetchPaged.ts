import { useAuthenticatedQuery } from "../utils/queryConfig";
import { PageResponse } from "./useTransactionByAccountFetchPaged";
import Transfer from "../model/Transfer";
import { createHookLogger } from "../utils/logger";

const log = createHookLogger("useTransferFetchPaged");

const fetchTransfersPaged = async (
  page: number,
  size: number,
): Promise<PageResponse<Transfer> | null> => {
  log.debug("Fetching paginated transfers", { page, size });

  const endpoint = `/api/transfer/active/paged?page=${page}&size=${size}&sort=transactionDate,desc`;
  const response = await fetch(endpoint, {
    method: "GET",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const errorMessage = `Failed to fetch transfers: ${response.statusText}`;
    log.error("Fetch failed", { error: errorMessage, status: response.status });
    throw new Error(errorMessage);
  }

  return response.status !== 204 ? await response.json() : null;
};

export default function useTransferFetchPaged(page: number, size: number = 50) {
  return useAuthenticatedQuery(
    ["transfer", "paged", page, size],
    () => fetchTransfersPaged(page, size),
    { staleTime: 5 * 60 * 1000, retry: 1 },
  );
}
