import Description from "../model/Description";
import { useAuthenticatedQuery } from "../utils/queryConfig";
import { createQueryFn } from "../utils/fetchUtils";
import { QueryKeys } from "../utils/cacheUtils";
import { createHookLogger } from "../utils/logger";

const log = createHookLogger("useDescriptionFetch");

/**
 * Fetch active descriptions from API
 *
 * @returns List of active descriptions
 */
const fetchDescriptionData = createQueryFn<Description[]>(
  "/api/description/active",
  { method: "GET" },
);

/**
 * Hook for fetching active descriptions
 * Automatically gated by authentication
 *
 * @returns React Query result with description data
 *
 * @example
 * ```typescript
 * const { data: descriptions, isLoading } = useDescriptionFetch();
 * ```
 */
export default function useDescriptionFetch() {
  const queryResult = useAuthenticatedQuery(
    QueryKeys.description(),
    fetchDescriptionData,
  );

  if (queryResult.isError) {
    log.error("Fetch failed", queryResult.error);
  }

  if (queryResult.isSuccess && queryResult.data) {
    log.debug("Fetched descriptions", { count: queryResult.data.length });
  }

  return queryResult;
}
