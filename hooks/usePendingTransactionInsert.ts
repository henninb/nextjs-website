import { useQueryClient } from "@tanstack/react-query";
import PendingTransaction from "../model/PendingTransaction";
import { useStandardMutation } from "../utils/queryConfig";
import { fetchWithErrorHandling, parseResponse } from "../utils/fetchUtils";
import { CacheUpdateStrategies, QueryKeys } from "../utils/cacheUtils";
import { createHookLogger } from "../utils/logger";
import { useAuth } from "../components/AuthProvider";

const log = createHookLogger("usePendingTransactionInsert");

/**
 * Insert a new pending transaction via API
 * No validation/sanitization needed - PendingTransaction validated by API
 *
 * @param payload - Pending transaction data to insert
 * @returns Newly created pending transaction
 */
export const insertPendingTransaction = async (
  payload: PendingTransaction,
): Promise<PendingTransaction> => {
  log.debug("Inserting pending transaction", {
    accountNameOwner: payload.accountNameOwner,
    transactionDate: payload.transactionDate,
  });

  const endpoint = "/api/pending/transaction";
  const response = await fetchWithErrorHandling(endpoint, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  return parseResponse<PendingTransaction>(
    response,
  ) as Promise<PendingTransaction>;
};

/**
 * Hook for inserting a new pending transaction
 * Automatically adds to pending transactions cache on success
 *
 * @returns React Query mutation hook
 *
 * @example
 * ```typescript
 * const { mutate } = usePendingTransactionInsert();
 * mutate({ pendingTransaction: newTransaction });
 * ```
 */
export default function usePendingTransactionInsert() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useStandardMutation(
    (variables: { pendingTransaction: PendingTransaction }) => {
      if (!user?.username) {
        throw new Error("User must be logged in to insert a pending transaction");
      }
      return insertPendingTransaction({ ...variables.pendingTransaction, owner: user.username });
    },
    {
      mutationKey: ["insertPendingTransaction"],
      onSuccess: (newTransaction) => {
        log.debug("Pending transaction inserted successfully", {
          pendingTransactionId: newTransaction.pendingTransactionId,
        });

        // Add new transaction to start of list
        CacheUpdateStrategies.addToList(
          queryClient,
          QueryKeys.pendingTransaction(),
          newTransaction,
          "start",
        );
      },
      onError: (error) => {
        log.error("Insert failed", error);
      },
    },
  );
}
