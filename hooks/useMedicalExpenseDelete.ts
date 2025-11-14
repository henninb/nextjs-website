import { useQueryClient } from "@tanstack/react-query";
import { MedicalExpense } from "../model/MedicalExpense";
import { useStandardMutation } from "../utils/queryConfig";
import { fetchWithErrorHandling } from "../utils/fetchUtils";
import { InputSanitizer } from "../utils/validation/sanitization";
import { QueryKeys } from "../utils/cacheUtils";
import { createHookLogger } from "../utils/logger";

const log = createHookLogger("useMedicalExpenseDelete");

/**
 * Delete a medical expense via API
 * Validates and sanitizes ID before sending
 *
 * @param oldRow - Medical expense to delete
 * @returns void
 */
export const deleteMedicalExpense = async (
  oldRow: MedicalExpense,
): Promise<void> => {
  // Sanitize medical expense ID
  const sanitizedId = InputSanitizer.sanitizeNumericId(
    oldRow.medicalExpenseId,
    "medicalExpenseId",
  );

  log.debug("Deleting medical expense", { medicalExpenseId: sanitizedId });

  const endpoint = `/api/medical-expenses/${sanitizedId}`;
  await fetchWithErrorHandling(endpoint, {
    method: "DELETE",
  });
};

/**
 * Hook for deleting a medical expense
 * Automatically invalidates medical expenses cache on success
 *
 * @returns React Query mutation hook
 *
 * @example
 * ```typescript
 * const { mutate } = useMedicalExpenseDelete();
 * mutate({ oldRow: expenseToDelete });
 * ```
 */
export default function useMedicalExpenseDelete() {
  const queryClient = useQueryClient();

  return useStandardMutation(
    (variables: { oldRow: MedicalExpense }) =>
      deleteMedicalExpense(variables.oldRow),
    {
      mutationKey: ["deleteMedicalExpense"],
      onSuccess: (_response, variables) => {
        log.debug("Medical expense deleted successfully", {
          medicalExpenseId: variables.oldRow.medicalExpenseId,
        });

        // Invalidate medical expenses queries to refresh the list
        queryClient.invalidateQueries({ queryKey: QueryKeys.medicalExpense() });
      },
      onError: (error) => {
        log.error("Delete failed", error);
      },
    },
  );
}
