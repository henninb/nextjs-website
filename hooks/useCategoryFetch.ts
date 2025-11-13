import Category from "../model/Category";
import { useAuthenticatedQuery } from "../utils/queryConfig";
import { createQueryFn } from "../utils/fetchUtils";
import { QueryKeys } from "../utils/cacheUtils";
import { createHookLogger } from "../utils/logger";

const log = createHookLogger("useCategoryFetch");

/**
 * Fetch active categories for the authenticated user
 * Uses centralized query configuration with automatic authentication gating
 */
const fetchCategoryData = createQueryFn<Category[]>("/api/category/active", {
  method: "GET",
});

/**
 * Hook to fetch all active categories
 * Automatically handles authentication, caching, and error states
 *
 * @returns React Query result with categories data, loading, and error states
 *
 * @example
 * ```typescript
 * const { data: categories, isLoading, error } = useCategoryFetch();
 * ```
 */
export default function useCategoryFetch() {
  const queryResult = useAuthenticatedQuery(
    QueryKeys.category(),
    fetchCategoryData,
  );

  // Log errors (React Query v5 removed onError from queries)
  if (queryResult.isError) {
    log.error("Failed to fetch categories", queryResult.error);
  }

  // Log success in development
  if (queryResult.isSuccess && queryResult.data) {
    log.debug("Categories fetched successfully", {
      count: queryResult.data.length,
    });
  }

  return queryResult;
}
