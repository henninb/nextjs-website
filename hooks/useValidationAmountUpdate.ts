import { useQueryClient } from "@tanstack/react-query";
import ValidationAmount from "../model/ValidationAmount";
import { useStandardMutation } from "../utils/queryConfig";
import { fetchWithErrorHandling, parseResponse } from "../utils/fetchUtils";
import { InputSanitizer } from "../utils/validation/sanitization";
import { QueryKeys } from "../utils/cacheUtils";
import { createHookLogger } from "../utils/logger";

const log = createHookLogger("useValidationAmountUpdate");

/**
 * Update a validation amount via API
 * Sanitizes ID before sending
 *
 * @param oldValidationAmount - Original validation amount (for ID)
 * @param newValidationAmount - Updated validation amount data
 * @returns Updated validation amount
 */
export const updateValidationAmount = async (
  oldValidationAmount: ValidationAmount,
  newValidationAmount: ValidationAmount,
): Promise<ValidationAmount> => {
  // Sanitize validation ID
  const sanitizedId = InputSanitizer.sanitizeNumericId(
    oldValidationAmount.validationId,
    "validationId",
  );

  log.debug("Updating validation amount", {
    validationId: sanitizedId,
    oldAmount: oldValidationAmount.amount,
    newAmount: newValidationAmount.amount,
  });

  const endpoint = `/api/validation/amount/${sanitizedId}`;
  const response = await fetchWithErrorHandling(endpoint, {
    method: "PUT",
    body: JSON.stringify(newValidationAmount),
  });

  return parseResponse<ValidationAmount>(response) as Promise<ValidationAmount>;
};

/**
 * Hook for updating a validation amount
 * Invalidates all validation amount caches on success
 *
 * @returns React Query mutation hook
 *
 * @example
 * ```typescript
 * const { mutate } = useValidationAmountUpdate();
 * mutate({ oldValidationAmount, newValidationAmount });
 * ```
 */
export default function useValidationAmountUpdate() {
  const queryClient = useQueryClient();

  return useStandardMutation(
    (variables: {
      oldValidationAmount: ValidationAmount;
      newValidationAmount: ValidationAmount;
    }) =>
      updateValidationAmount(
        variables.oldValidationAmount,
        variables.newValidationAmount,
      ),
    {
      mutationKey: ["validationAmountUpdate"],
      onSuccess: (updatedValidation) => {
        log.debug("Validation amount updated successfully", {
          validationId: updatedValidation.validationId,
          amount: updatedValidation.amount,
        });

        // Invalidate all validation amount queries to refetch
        queryClient.invalidateQueries({ queryKey: ["validationAmount"] });
      },
      onError: (error) => {
        log.error("Update failed", error);
      },
    },
  );
}
