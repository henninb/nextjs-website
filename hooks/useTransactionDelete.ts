import { useQueryClient } from "@tanstack/react-query";
import Transaction from "../model/Transaction";
import Totals from "../model/Totals";
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

        const totalsKey = getTotalsKey(variables.oldRow.accountNameOwner);

        // Invalidate paginated transaction queries for this account
        // This ensures all pages are refetched with the server's sort order and business logic
        queryClient.invalidateQueries({
          queryKey: ["transaction", variables.oldRow.accountNameOwner, "paged"],
        });

        // Invalidate non-paginated transaction queries (used in BackupRestore)
        queryClient.invalidateQueries({
          queryKey: ["transaction", variables.oldRow.accountNameOwner],
          exact: true,
        });

        // Optimistically update totals based on transaction state
        const oldTotals = queryClient.getQueryData<Totals>(totalsKey);

        if (oldTotals) {
          const newTotals = { ...oldTotals };
          newTotals.totals -= variables.oldRow.amount;

          // Adjust state-specific totals
          if (variables.oldRow.transactionState === "cleared") {
            newTotals.totalsCleared -= variables.oldRow.amount;
          } else if (variables.oldRow.transactionState === "outstanding") {
            newTotals.totalsOutstanding -= variables.oldRow.amount;
          } else if (variables.oldRow.transactionState === "future") {
            newTotals.totalsFuture -= variables.oldRow.amount;
          } else {
            log.warn("Unknown transaction state, totals may be incorrect", {
              transactionState: variables.oldRow.transactionState,
            });
          }

          queryClient.setQueryData(totalsKey, newTotals);

          log.debug("Cache updated", {
            accountNameOwner: variables.oldRow.accountNameOwner,
            newTotals,
          });
        } else {
          log.warn("No cached totals found, invalidating to refetch", {
            accountNameOwner: variables.oldRow.accountNameOwner,
          });
          queryClient.invalidateQueries({ queryKey: totalsKey });
        }
      },
      onError: (error) => {
        log.error("Delete failed", error);
      },
    },
  );
}
