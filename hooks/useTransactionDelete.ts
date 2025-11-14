import { useQueryClient } from "@tanstack/react-query";
import Transaction from "../model/Transaction";
import { useStandardMutation } from "../utils/queryConfig";
import { fetchWithErrorHandling, parseResponse } from "../utils/fetchUtils";
import { HookValidator } from "../utils/hookValidation";
import { InputSanitizer } from "../utils/validation/sanitization";
import { getAccountKey, getTotalsKey } from "../utils/cacheUtils";
import { createHookLogger } from "../utils/logger";

const log = createHookLogger("useTransactionDelete");

/**
 * Delete a transaction via API
 * Validates identifier and sanitizes before sending
 *
 * @param payload - Transaction to delete
 * @returns Deleted transaction
 */
export const deleteTransaction = async (
  payload: Transaction,
): Promise<Transaction> => {
  // Validate that GUID exists
  HookValidator.validateDelete(payload, "guid", "deleteTransaction");

  // Sanitize GUID for URL
  const sanitizedGuid = InputSanitizer.sanitizeGuid(payload.guid);

  log.debug("Deleting transaction", {
    guid: sanitizedGuid,
    accountNameOwner: payload.accountNameOwner,
  });

  const endpoint = `/api/transaction/${sanitizedGuid}`;
  const response = await fetchWithErrorHandling(endpoint, {
    method: "DELETE",
  });

  return parseResponse<Transaction>(response) as Promise<Transaction>;
};

/**
 * Hook for deleting a transaction
 * Automatically removes transaction from cache and invalidates totals
 *
 * @returns React Query mutation hook
 *
 * @example
 * ```typescript
 * const { mutate } = useTransactionDelete();
 * mutate({ oldRow: transactionToDelete });
 * ```
 */
export default function useTransactionDelete() {
  const queryClient = useQueryClient();

  return useStandardMutation(
    (variables: { oldRow: Transaction }) => deleteTransaction(variables.oldRow),
    {
      mutationKey: ["deleteTransaction"],
      onSuccess: (_response, variables) => {
        log.debug("Transaction deleted successfully", {
          transactionId: variables.oldRow.transactionId,
          guid: variables.oldRow.guid,
        });

        const accountKey = getAccountKey(variables.oldRow.accountNameOwner);
        const totalsKey = getTotalsKey(variables.oldRow.accountNameOwner);

        // Remove the deleted transaction from the cache
        const oldData: Transaction[] | undefined =
          queryClient.getQueryData(accountKey);

        if (oldData) {
          const newData = oldData.filter(
            (t: Transaction) =>
              t.transactionId !== variables.oldRow.transactionId,
          );
          queryClient.setQueryData(accountKey, newData);

          log.debug("Transaction removed from cache", {
            accountNameOwner: variables.oldRow.accountNameOwner,
            remainingCount: newData.length,
          });
        } else {
          log.warn("No cached data found for account", {
            accountNameOwner: variables.oldRow.accountNameOwner,
          });
        }

        // Invalidate the totals query to refetch updated totals
        queryClient.invalidateQueries({ queryKey: totalsKey });

        log.debug("Totals invalidated", {
          accountNameOwner: variables.oldRow.accountNameOwner,
        });
      },
      onError: (error) => {
        log.error("Delete failed", error);
      },
    },
  );
}
