import { MedicalExpense } from "../model/MedicalExpense";
import { useAuthenticatedQuery } from "../utils/queryConfig";
import { QueryKeys } from "../utils/cacheUtils";
import { createHookLogger } from "../utils/logger";

const log = createHookLogger("useMedicalExpenseFetch");

/**
 * Fetch active medical expenses from API
 * Requires authentication
 * Returns empty array if no medical expenses found (404)
 *
 * @returns List of active medical expenses
 */
export const fetchMedicalExpenses = async (): Promise<MedicalExpense[]> => {
  log.debug("Fetching medical expenses");

  const response = await fetch("/api/medical-expenses/active", {
    method: "GET",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  });

  // Handle 404 as empty list (no medical expenses)
  if (response.status === 404) {
    log.debug("No medical expenses found, returning empty array");
    return [];
  }

  if (!response.ok) {
    const errorDetails = await response.json().catch(() => ({}));
    const errorMessage = `HTTP error! Status: ${response.status} Details: ${JSON.stringify(errorDetails)}`;
    log.error("Fetch failed", { status: response.status, errorDetails });
    throw new Error(errorMessage);
  }

  const data = await response.json();
  log.debug("Fetched medical expenses", { count: data.length });
  return response.status !== 204 ? data : [];
};

/**
 * Hook for fetching active medical expenses
 * Requires authentication
 *
 * @returns React Query result with medical expense data
 *
 * @example
 * ```typescript
 * const { data: expenses, isLoading } = useMedicalExpenseFetch();
 * ```
 */
export default function useMedicalExpenseFetch() {
  const queryResult = useAuthenticatedQuery(
    QueryKeys.medicalExpense(),
    fetchMedicalExpenses,
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      retry: 1,
    },
  );

  if (queryResult.isError) {
    log.error("Fetch failed", queryResult.error);
  }

  if (queryResult.isSuccess && queryResult.data) {
    log.debug("Query successful", { count: queryResult.data.length });
  }

  return queryResult;
}
