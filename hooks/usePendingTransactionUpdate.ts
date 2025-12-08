import { useQueryClient } from "@tanstack/react-query";
import PendingTransaction from "../model/PendingTransaction";
import { useStandardMutation } from "../utils/queryConfig";
import { fetchWithErrorHandling, parseResponse } from "../utils/fetchUtils";
import { InputSanitizer } from "../utils/validation/sanitization";
import { CacheUpdateStrategies, QueryKeys } from "../utils/cacheUtils";
import { createHookLogger } from "../utils/logger";

const log = createHookLogger("usePendingTransactionUpdate");

/**
 * Update a pending transaction via API
 * Sanitizes ID before sending
 *
 * @param oldPendingTransaction - Original pending transaction (for ID)
 * @param newPendingTransaction - Updated pending transaction data
 * @returns Updated pending transaction
 */
export const updatePendingTransaction = async (
  oldPendingTransaction: PendingTransaction,
  newPendingTransaction: PendingTransaction,
): Promise<PendingTransaction> => {
  // Sanitize pending transaction ID
  const sanitizedId = InputSanitizer.sanitizeNumericId(
    oldPendingTransaction.pendingTransactionId!,
    "pendingTransactionId",
  );

  log.debug("Updating pending transaction", {
    pendingTransactionId: sanitizedId,
  });

  const endpoint = `/api/pending/transaction/${sanitizedId}`;
  const response = await fetchWithErrorHandling(endpoint, {
    method: "PUT",
    body: JSON.stringify(newPendingTransaction),
  });

  return parseResponse<PendingTransaction>(
    response,
  ) as Promise<PendingTransaction>;
};

/**
 * Hook for updating a pending transaction
 * Automatically updates transaction in cache on success
 *
 * @returns React Query mutation hook
 *
 * @example
 * ```typescript
 * const { mutate } = usePendingTransactionUpdate();
 * mutate({ oldPendingTransaction, newPendingTransaction });
 * ```
 */
export default function usePendingTransactionUpdate() {
  const queryClient = useQueryClient();

  return useStandardMutation(
    (variables: {
      oldPendingTransaction: PendingTransaction;
      newPendingTransaction: PendingTransaction;
    }) =>
      updatePendingTransaction(
        variables.oldPendingTransaction,
        variables.newPendingTransaction,
      ),
    {
      mutationKey: ["pendingTransactionUpdate"],
      onSuccess: (updatedTransaction) => {
        log.debug("Pending transaction updated successfully", {
          pendingTransactionId: updatedTransaction.pendingTransactionId,
        });

        // Update transaction in cache
        CacheUpdateStrategies.updateInList(
          queryClient,
          QueryKeys.pendingTransaction(),
          updatedTransaction,
          "pendingTransactionId",
        );
      },
      onError: (error) => {
        log.error("Update failed", error);
      },
    },
  );
}
