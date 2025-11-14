import Payment from "../model/Payment";
import { usePublicQuery } from "../utils/queryConfig";
import { createQueryFn } from "../utils/fetchUtils";
import { QueryKeys } from "../utils/cacheUtils";
import { createHookLogger } from "../utils/logger";

const log = createHookLogger("usePaymentFetch");

/**
 * Fetch active payments from API
 * Note: Payments are public data (no auth required)
 *
 * @returns List of active payments
 */
const fetchPaymentData = createQueryFn<Payment[]>("/api/payment/active", {
  method: "GET",
});

/**
 * Hook for fetching active payments
 * No authentication required (public data)
 *
 * @returns React Query result with payment data
 *
 * @example
 * ```typescript
 * const { data: payments, isLoading } = usePaymentFetch();
 * ```
 */
export default function usePaymentFetch() {
  const queryResult = usePublicQuery(QueryKeys.payment(), fetchPaymentData);

  if (queryResult.isError) {
    log.error("Fetch failed", queryResult.error);
  }

  if (queryResult.isSuccess && queryResult.data) {
    log.debug("Fetched payments", { count: queryResult.data.length });
  }

  return queryResult;
}
