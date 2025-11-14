import { useQueryClient } from "@tanstack/react-query";
import ValidationAmount from "../model/ValidationAmount";
import { useStandardMutation } from "../utils/queryConfig";
import { fetchWithErrorHandling } from "../utils/fetchUtils";
import { InputSanitizer } from "../utils/validation/sanitization";
import { createHookLogger } from "../utils/logger";

const log = createHookLogger("useValidationAmountDelete");

/**
 * Delete a validation amount via API
 * Validates and sanitizes ID before sending
 *
 * @param payload - Validation amount to delete
 * @returns void
 */
export const deleteValidationAmount = async (
  payload: ValidationAmount,
): Promise<void> => {
  // Sanitize validation ID
  const sanitizedId = InputSanitizer.sanitizeNumericId(
    payload.validationId,
    "validationId",
  );

  log.debug("Deleting validation amount", { validationId: sanitizedId });

  const endpoint = `/api/validation/amount/${sanitizedId}`;
  await fetchWithErrorHandling(endpoint, {
    method: "DELETE",
  });
};

/**
 * Hook for deleting a validation amount
 * Automatically invalidates validation amount caches on success
 *
 * @returns React Query mutation hook
 *
 * @example
 * ```typescript
 * const { mutate } = useValidationAmountDelete();
 * mutate(validationToDelete);
 * ```
 */
export default function useValidationAmountDelete() {
  const queryClient = useQueryClient();

  return useStandardMutation(
    (variables: ValidationAmount) => deleteValidationAmount(variables),
    {
      mutationKey: ["deleteValidationAmount"],
      onSuccess: (_response, variables) => {
        log.debug("Validation amount deleted successfully", {
          validationId: variables.validationId,
        });

        // Invalidate all validation amount queries to refetch
        queryClient.invalidateQueries({ queryKey: ["validationAmount"] });
      },
      onError: (error) => {
        log.error("Delete failed", error);
      },
    },
  );
}
