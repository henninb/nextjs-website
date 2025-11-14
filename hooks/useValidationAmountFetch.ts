import ValidationAmount from "../model/ValidationAmount";
import { useAuthenticatedQuery } from "../utils/queryConfig";
import { InputSanitizer } from "../utils/validation/sanitization";
import { QueryKeys } from "../utils/cacheUtils";
import { createHookLogger } from "../utils/logger";

const log = createHookLogger("useValidationAmountFetch");

/**
 * Fetch single validation amount for an account
 * Returns latest validation amount (first item from API array)
 * Gracefully handles 404/empty array by returning zero values
 *
 * @param accountNameOwner - Account name to fetch validation for
 * @returns Validation amount data or zero-values fallback
 */
export const fetchValidationAmount = async (
  accountNameOwner: string,
): Promise<ValidationAmount> => {
  // Sanitize account name for URL
  const sanitizedAccount = InputSanitizer.sanitizeAccountName(accountNameOwner);

  log.debug("Fetching validation amount", {
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

  // Handle 404 as zero values (no validation data exists)
  if (response.status === 404) {
    log.debug("No validation amount found, returning zero values");
    const zeroValidation: ValidationAmount = {
      validationId: 0,
      validationDate: new Date("1970-01-01"),
      amount: 0,
      transactionState: "cleared",
      activeStatus: true,
    };
    return zeroValidation;
  }

  if (!response.ok) {
    const errorDetails = await response.json().catch(() => ({}));
    const errorMessage = `HTTP error! Status: ${response.status} Details: ${JSON.stringify(errorDetails)}`;
    log.error("Fetch failed", { status: response.status, errorDetails });
    throw new Error(errorMessage);
  }

  const data = await response.json();

  // Modern endpoint returns an array, extract the first (latest) item
  if (Array.isArray(data) && data.length > 0) {
    log.debug("Fetched validation amount", {
      validationId: data[0].validationId,
      amount: data[0].amount,
    });
    return data[0];
  }

  // If empty array, return zero values
  log.debug("Empty array returned, using zero values");
  const zeroValidation: ValidationAmount = {
    validationId: 0,
    validationDate: new Date("1970-01-01"),
    amount: 0,
    transactionState: "cleared",
    activeStatus: true,
  };
  return zeroValidation;
};

/**
 * Hook for fetching single validation amount for an account
 * Requires authentication
 * Returns latest validation amount or zero-values fallback
 *
 * @param accountNameOwner - Account name to fetch validation for
 * @returns React Query result with validation amount data
 *
 * @example
 * ```typescript
 * const { data: validationAmount, isLoading } = useValidationAmountFetch("chase_checking");
 * ```
 */
export default function useValidationAmountFetch(accountNameOwner: string) {
  const queryResult = useAuthenticatedQuery(
    QueryKeys.validationAmount(accountNameOwner),
    () => fetchValidationAmount(accountNameOwner),
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
    log.debug("Query successful", {
      validationId: queryResult.data.validationId,
      amount: queryResult.data.amount,
    });
  }

  return queryResult;
}
