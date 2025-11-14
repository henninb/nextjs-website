import { useQueryClient } from "@tanstack/react-query";
import { useStandardMutation } from "../utils/queryConfig";
import { fetchWithErrorHandling } from "../utils/fetchUtils";
import { QueryKeys } from "../utils/cacheUtils";
import { createHookLogger } from "../utils/logger";

const log = createHookLogger("usePendingTransactionDeleteAll");

/**
 * Delete all pending transactions via API
 * Bulk delete operation
 *
 * @returns void
 */
export const deleteAllPendingTransactions = async (): Promise<void> => {
  log.debug("Deleting all pending transactions");

  const endpoint = "/api/pending/transaction/delete/all";
  await fetchWithErrorHandling(endpoint, {
    method: "DELETE",
  });
};

/**
 * Hook for deleting all pending transactions
 * Automatically clears pending transactions cache on success
 *
 * @returns React Query mutation hook
 *
 * @example
 * ```typescript
 * const { mutate } = usePendingTransactionDeleteAll();
 * mutate();
 * ```
 */
export default function usePendingTransactionDeleteAll() {
  const queryClient = useQueryClient();

  return useStandardMutation(() => deleteAllPendingTransactions(), {
    mutationKey: ["deleteAllPendingTransactions"],
    onSuccess: () => {
      log.debug("All pending transactions deleted successfully");

      // Clear the pending transactions cache (set to empty array)
      queryClient.setQueryData(QueryKeys.pendingTransaction(), []);
    },
    onError: (error) => {
      log.error("Delete all failed", error);
    },
  });
}
