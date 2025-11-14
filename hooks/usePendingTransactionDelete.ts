import { useQueryClient } from "@tanstack/react-query";
import PendingTransaction from "../model/PendingTransaction";
import { useStandardMutation } from "../utils/queryConfig";
import { fetchWithErrorHandling } from "../utils/fetchUtils";
import { InputSanitizer } from "../utils/validation/sanitization";
import { QueryKeys } from "../utils/cacheUtils";
import { createHookLogger } from "../utils/logger";

const log = createHookLogger("usePendingTransactionDelete");

/**
 * Delete a pending transaction via API
 * Validates and sanitizes ID before sending
 *
 * @param id - Pending transaction ID to delete
 * @returns void
 */
export const deletePendingTransaction = async (id: number): Promise<void> => {
  // Sanitize pending transaction ID
  const sanitizedId = InputSanitizer.sanitizeNumericId(
    id,
    "pendingTransactionId",
  );

  log.debug("Deleting pending transaction", {
    pendingTransactionId: sanitizedId,
  });

  const endpoint = `/api/pending/transaction/${sanitizedId}`;
  await fetchWithErrorHandling(endpoint, {
    method: "DELETE",
  });
};

/**
 * Hook for deleting a pending transaction
 * Automatically removes from cache on success
 *
 * @returns React Query mutation hook
 *
 * @example
 * ```typescript
 * const { mutate } = usePendingTransactionDelete();
 * mutate(transactionId);
 * ```
 */
export default function usePendingTransactionDelete() {
  const queryClient = useQueryClient();

  return useStandardMutation((id: number) => deletePendingTransaction(id), {
    mutationKey: ["deletePendingTransaction"],
    onSuccess: (_response, id) => {
      log.debug("Pending transaction deleted successfully", {
        pendingTransactionId: id,
      });

      // Remove deleted transaction from cache
      queryClient.setQueryData(
        QueryKeys.pendingTransaction(),
        (oldData: PendingTransaction[] | undefined) => {
          if (!oldData) return oldData;
          return oldData.filter(
            (transaction) => transaction.pendingTransactionId !== id,
          );
        },
      );
    },
    onError: (error) => {
      log.error("Delete failed", error);
    },
  });
}
