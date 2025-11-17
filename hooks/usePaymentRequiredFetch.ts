import PaymentRequired from "../model/PaymentRequired";
import { useAuthenticatedQuery } from "../utils/queryConfig";
import { QueryKeys } from "../utils/cacheUtils";
import { createHookLogger } from "../utils/logger";

const log = createHookLogger("usePaymentRequiredFetch");

/**
 * Fetch payment required data from API
 * Returns accounts requiring payment
 * Requires authentication
 *
 * @returns List of accounts requiring payment
 */
export const fetchPaymentRequiredData = async (): Promise<
  PaymentRequired[]
> => {
  log.debug("Fetching payment required data");

  const response = await fetch("/api/account/payment/required", {
    method: "GET",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const errorDetails = await response.json().catch(() => ({}));
    const errorMessage = `HTTP error! Status: ${response.status} Details: ${JSON.stringify(errorDetails)}`;
    log.error("Fetch failed", { status: response.status, errorDetails });
    throw new Error(errorMessage);
  }

  const data = await response.json();
  log.debug("Fetched payment required data", { count: data.length });
  return data;
};

/**
 * Hook for fetching payment required data
 * Requires authentication
 *
 * @returns React Query result with payment required data
 *
 * @example
 * ```typescript
 * const { data: paymentsRequired, isLoading } = usePaymentRequiredFetch();
 * ```
 */
export default function usePaymentRequiredFetch() {
  const queryResult = useAuthenticatedQuery(
    QueryKeys.paymentRequired(),
    fetchPaymentRequiredData,
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
