import { useQueryClient } from "@tanstack/react-query";
import Payment from "../model/Payment";
import { useStandardMutation } from "../utils/queryConfig";
import { fetchWithErrorHandling, parseResponse } from "../utils/fetchUtils";
import { HookValidator } from "../utils/hookValidation";
import { InputSanitizer } from "../utils/validation/sanitization";
import { CacheUpdateStrategies, QueryKeys } from "../utils/cacheUtils";
import { createHookLogger } from "../utils/logger";

const log = createHookLogger("usePaymentDelete");

/**
 * Delete a payment via API
 * Validates identifier and sanitizes before sending
 *
 * @param payload - Payment to delete
 * @returns Deleted payment
 */
export const deletePayment = async (payload: Payment): Promise<Payment> => {
  // Validate that payment ID exists
  HookValidator.validateDelete(payload, "paymentId", "deletePayment");

  // Sanitize payment ID for URL
  const sanitizedPaymentId = InputSanitizer.sanitizeNumericId(
    payload.paymentId,
    "paymentId",
  );

  log.debug("Deleting payment", { paymentId: sanitizedPaymentId });

  const endpoint = `/api/payment/${sanitizedPaymentId}`;
  const response = await fetchWithErrorHandling(endpoint, {
    method: "DELETE",
  });

  return parseResponse<Payment>(response) as Promise<Payment>;
};

/**
 * Hook for deleting a payment
 * Automatically removes payment from the cache on success
 *
 * @returns React Query mutation hook
 *
 * @example
 * ```typescript
 * const { mutate } = usePaymentDelete();
 * mutate({ oldRow: paymentToDelete });
 * ```
 */
export default function usePaymentDelete() {
  const queryClient = useQueryClient();

  return useStandardMutation(
    (variables: { oldRow: Payment }) => deletePayment(variables.oldRow),
    {
      mutationKey: ["deletePayment"],
      onSuccess: (_response, variables) => {
        log.debug("Payment deleted successfully", {
          paymentId: variables.oldRow.paymentId,
        });

        // Remove from cache using paymentId as identifier
        CacheUpdateStrategies.removeFromList(
          queryClient,
          QueryKeys.payment(),
          variables.oldRow,
          "paymentId",
        );
      },
      onError: (error) => {
        log.error("Delete failed", error);
      },
    },
  );
}
