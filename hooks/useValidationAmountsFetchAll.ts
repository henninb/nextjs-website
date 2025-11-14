import ValidationAmount from "../model/ValidationAmount";
import { useAuthenticatedQuery } from "../utils/queryConfig";
import { InputSanitizer } from "../utils/validation/sanitization";
import { QueryKeys } from "../utils/cacheUtils";
import { createHookLogger } from "../utils/logger";

const log = createHookLogger("useValidationAmountsFetchAll");

/**
 * Fetch all validation amounts for an account
 * Returns full array of validation amounts
 * Gracefully handles 404 by returning empty array
 *
 * @param accountNameOwner - Account name to fetch validations for
 * @returns Array of validation amounts or empty array
 */
export const fetchAllValidationAmounts = async (
  accountNameOwner: string,
): Promise<ValidationAmount[]> => {
  // Sanitize account name for URL
  const sanitizedAccount = InputSanitizer.sanitizeAccountName(accountNameOwner);

  log.debug("Fetching all validation amounts", {
    accountNameOwner: sanitizedAccount,
  });

  // Modern endpoint with query parameters for filtering
  const endpoint = `/api/validation/amount/active?accountNameOwner=${encodeURIComponent(sanitizedAccount)}&transactionState=cleared`;

  const response = await fetch(endpoint, {
    method: "GET",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  });

  // Handle 404 as empty array (no validation data)
  if (response.status === 404) {
    log.debug("No validation amounts found, returning empty array");
    return [];
  }

  if (!response.ok) {
    const errorDetails = await response.json().catch(() => ({}));
    const errorMessage = `HTTP error! Status: ${response.status} Details: ${JSON.stringify(errorDetails)}`;
    log.error("Fetch failed", { status: response.status, errorDetails });
    throw new Error(errorMessage);
  }

  const data = await response.json();
  // Modern endpoint always returns an array
  const amounts = Array.isArray(data) ? data : [];
  log.debug("Fetched validation amounts", { count: amounts.length });
  return amounts;
};

/**
 * Hook for fetching all validation amounts for an account
 * Requires authentication
 * Returns full array instead of just latest (unlike useValidationAmountFetch)
 *
 * @param accountNameOwner - Account name to fetch validations for
 * @returns React Query result with array of validation amounts
 *
 * @example
 * ```typescript
 * const { data: validationAmounts, isLoading } = useValidationAmountsFetchAll("chase_checking");
 * ```
 */
export default function useValidationAmountsFetchAll(accountNameOwner: string) {
  const queryResult = useAuthenticatedQuery(
    QueryKeys.validationAmountAll(accountNameOwner),
    () => fetchAllValidationAmounts(accountNameOwner),
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      retry: 1,
      enabled: !!accountNameOwner,
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
