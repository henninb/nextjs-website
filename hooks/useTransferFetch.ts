import Transfer from "../model/Transfer";
import { useAuthenticatedQuery } from "../utils/queryConfig";
import { createQueryFn } from "../utils/fetchUtils";
import { QueryKeys } from "../utils/cacheUtils";
import { createHookLogger } from "../utils/logger";

const log = createHookLogger("useTransferFetch");

/**
 * Fetch active transfers from API
 * Requires authentication
 *
 * @returns List of active transfers
 */
const fetchTransferData = createQueryFn<Transfer[]>("/api/transfer/active", {
  method: "GET",
});

/**
 * Hook for fetching active transfers
 * Requires authentication
 *
 * @returns React Query result with transfer data
 *
 * @example
 * ```typescript
 * const { data: transfers, isLoading } = useTransferFetch();
 * ```
 */
export default function useTransferFetch() {
  const queryResult = useAuthenticatedQuery(
    QueryKeys.transfer(),
    fetchTransferData,
  );

  if (queryResult.isError) {
    log.error("Fetch failed", queryResult.error);
  }

  if (queryResult.isSuccess && queryResult.data) {
    log.debug("Fetched transfers", { count: queryResult.data.length });
  }

  return queryResult;
}
