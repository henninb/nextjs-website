import Parameter from "../model/Parameter";
import { usePublicQuery } from "../utils/queryConfig";
import { createQueryFn } from "../utils/fetchUtils";
import { QueryKeys } from "../utils/cacheUtils";
import { createHookLogger } from "../utils/logger";

const log = createHookLogger("useParameterFetch");

/**
 * Fetch active parameters from API
 * Note: Parameters are public data (no auth required)
 *
 * @returns List of active parameters
 */
const fetchParameterData = createQueryFn<Parameter[]>("/api/parameter/active", {
  method: "GET",
});

/**
 * Hook for fetching active parameters
 * No authentication required (public data)
 *
 * @returns React Query result with parameter data
 *
 * @example
 * ```typescript
 * const { data: parameters, isLoading } = useParameterFetch();
 * ```
 */
export default function useParameterFetch() {
  const queryResult = usePublicQuery(QueryKeys.parameter(), fetchParameterData);

  if (queryResult.isError) {
    log.error("Fetch failed", queryResult.error);
  }

  if (queryResult.isSuccess && queryResult.data) {
    log.debug("Fetched parameters", { count: queryResult.data.length });
  }

  return queryResult;
}
