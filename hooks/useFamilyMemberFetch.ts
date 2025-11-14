import { FamilyMember } from "../model/FamilyMember";
import { useAuthenticatedQuery } from "../utils/queryConfig";
import { QueryKeys } from "../utils/cacheUtils";
import { createHookLogger } from "../utils/logger";

const log = createHookLogger("useFamilyMemberFetch");

/**
 * Fetch active family members from API
 * Requires authentication
 * Returns empty array if no family members found (404)
 *
 * @returns List of active family members
 */
const fetchFamilyMembers = async (): Promise<FamilyMember[]> => {
  const response = await fetch("/api/family-members/active", {
    method: "GET",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  });

  // Handle 404 as empty list (no family members)
  if (response.status === 404) {
    log.debug("No family members found, returning empty array");
    return [];
  }

  if (!response.ok) {
    const errorDetails = await response.json().catch(() => ({}));
    const errorMessage = `HTTP error! Status: ${response.status} Details: ${JSON.stringify(errorDetails)}`;
    log.error("Fetch failed", { status: response.status, errorDetails });
    throw new Error(errorMessage);
  }

  return response.status !== 204 ? await response.json() : [];
};

/**
 * Hook for fetching active family members
 * Requires authentication
 *
 * @returns React Query result with family member data
 *
 * @example
 * ```typescript
 * const { data: members, isLoading } = useFamilyMemberFetch();
 * ```
 */
export default function useFamilyMemberFetch() {
  const queryResult = useAuthenticatedQuery(
    QueryKeys.familyMember(),
    fetchFamilyMembers,
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      retry: 1,
    },
  );

  if (queryResult.isError) {
    log.error("Fetch failed", queryResult.error);
  }

  if (queryResult.isSuccess && queryResult.data) {
    log.debug("Fetched family members", { count: queryResult.data.length });
  }

  return queryResult;
}
