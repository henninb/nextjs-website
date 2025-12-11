import { useQueryClient } from "@tanstack/react-query";
import Transaction from "../model/Transaction";
import Totals from "../model/Totals";
import { UpdateTransactionOptions } from "../model/UpdateTransactionOptions";
import { DataValidator } from "../utils/validation";
import { useStandardMutation } from "../utils/queryConfig";
import { fetchWithErrorHandling, parseResponse } from "../utils/fetchUtils";
import { HookValidator } from "../utils/hookValidation";
import { InputSanitizer } from "../utils/validation/sanitization";
import { getTotalsKey } from "../utils/cacheUtils";
import { createHookLogger } from "../utils/logger";

const log = createHookLogger("useTransactionUpdate");

/**
 * Update an existing transaction via API
 * Validates and sanitizes input before sending
 * Handles receipt image base64 cleanup
 *
 * @param newData - Updated transaction data
 * @param oldData - Original transaction data (for identifier)
 * @param options - Optional update options
 * @returns Updated transaction
 */
export const updateTransaction = async (
  newData: Transaction,
  oldData: Transaction,
  options?: UpdateTransactionOptions,
): Promise<Transaction> => {
  // Validate new transaction data
  const validatedData = HookValidator.validateUpdate(
    newData,
    oldData,
    DataValidator.validateTransaction,
    "updateTransaction",
  );

  // Sanitize GUID for URL
  const sanitizedGuid = InputSanitizer.sanitizeGuid(oldData.guid);

  log.debug("Updating transaction", {
    guid: sanitizedGuid,
    oldAccount: oldData.accountNameOwner,
    newAccount: validatedData.accountNameOwner,
    oldAmount: oldData.amount,
    newAmount: validatedData.amount,
  });

  // Handle receipt image base64 cleanup if present
  const dataToSend = { ...validatedData };
  if (dataToSend.receiptImage !== undefined) {
    dataToSend["receiptImage"].image = dataToSend["receiptImage"].image.replace(
      /^data:image\/[a-z]+;base64,/,
      "",
    );
  }

  const endpoint = `/api/transaction/${sanitizedGuid}`;
  const response = await fetchWithErrorHandling(endpoint, {
    method: "PUT",
    body: JSON.stringify(dataToSend),
  });

  return parseResponse<Transaction>(response) as Promise<Transaction>;
};

/**
 * Hook for updating an existing transaction
 * Handles complex cache updates including:
 * - Same account updates (amount changes, state changes)
 * - Cross-account transfers (moving transaction between accounts)
 * - Totals recalculation based on state and amount changes
 *
 * @returns React Query mutation hook
 *
 * @example
 * ```typescript
 * const { mutate } = useTransactionUpdate();
 * mutate({ oldRow: originalTransaction, newRow: updatedTransaction });
 * ```
 */
export default function useTransactionUpdate() {
  const queryClient = useQueryClient();

  const invalidateTransactionCaches = (accountNameOwner: string): void => {
    // Invalidate paginated transaction queries for this account
    // This ensures all pages are refetched with the server's sort order and business logic
    queryClient.invalidateQueries({
      queryKey: ["transaction", accountNameOwner, "paged"],
    });

    // Invalidate non-paginated transaction queries (used in BackupRestore)
    queryClient.invalidateQueries({
      queryKey: ["transaction", accountNameOwner],
      exact: true,
    });
  };

  return useStandardMutation(
    (variables: {
      newRow: Transaction;
      oldRow: Transaction;
      options?: UpdateTransactionOptions;
    }) =>
      updateTransaction(variables.newRow, variables.oldRow, variables.options),
    {
      mutationKey: ["updateTransaction"],
      onSuccess: (response, variables) => {
        log.debug("Transaction updated successfully", {
          guid: response.guid,
          transactionId: response.transactionId,
        });

        const oldTotalsKey = getTotalsKey(variables.oldRow.accountNameOwner);
        const newTotalsKey = getTotalsKey(variables.newRow.accountNameOwner);

        if (
          variables.oldRow.accountNameOwner ===
          variables.newRow.accountNameOwner
        ) {
          // ===== SAME ACCOUNT UPDATE =====
          log.debug("Handling same-account update");

          // Invalidate transaction caches to refetch with server's sort order
          invalidateTransactionCaches(variables.oldRow.accountNameOwner);

          // Clone existing totals or create defaults
          let totals: Totals = {
            ...(queryClient.getQueryData<Totals>(oldTotalsKey) || {
              totals: 0,
              totalsFuture: 0,
              totalsCleared: 0,
              totalsOutstanding: 0,
            }),
          };

          // Handle amount change
          const difference = variables.newRow.amount - variables.oldRow.amount;

          if (variables.oldRow.amount !== variables.newRow.amount) {
            log.debug("Amount changed", {
              oldAmount: variables.oldRow.amount,
              newAmount: variables.newRow.amount,
              difference,
            });

            totals.totals += difference;

            // Adjust state-specific totals for amount change
            if (variables.oldRow.transactionState === "future") {
              totals.totalsFuture += difference;
            } else if (variables.oldRow.transactionState === "cleared") {
              totals.totalsCleared += difference;
            } else if (variables.oldRow.transactionState === "outstanding") {
              totals.totalsOutstanding += difference;
            }
          }

          // Handle state change
          if (
            variables.oldRow.transactionState !==
            variables.newRow.transactionState
          ) {
            log.debug("State changed", {
              oldState: variables.oldRow.transactionState,
              newState: variables.newRow.transactionState,
            });

            const amount = variables.newRow.amount;

            // Deduct from old state
            if (variables.oldRow.transactionState === "future") {
              totals.totalsFuture -= amount;
            } else if (variables.oldRow.transactionState === "cleared") {
              totals.totalsCleared -= amount;
            } else if (variables.oldRow.transactionState === "outstanding") {
              totals.totalsOutstanding -= amount;
            }

            // Add to new state
            if (variables.newRow.transactionState === "future") {
              totals.totalsFuture += amount;
            } else if (variables.newRow.transactionState === "cleared") {
              totals.totalsCleared += amount;
            } else if (variables.newRow.transactionState === "outstanding") {
              totals.totalsOutstanding += amount;
            }
          }

          queryClient.setQueryData(oldTotalsKey, totals);

          log.debug("Same-account update complete", {
            accountNameOwner: variables.oldRow.accountNameOwner,
            newTotals: totals,
          });
        } else {
          // ===== CROSS-ACCOUNT TRANSFER =====
          log.debug("Handling cross-account transfer", {
            from: variables.oldRow.accountNameOwner,
            to: variables.newRow.accountNameOwner,
          });

          // Invalidate old account transaction caches
          invalidateTransactionCaches(variables.oldRow.accountNameOwner);

          // Update old account totals
          let oldTotals: Totals = {
            ...(queryClient.getQueryData<Totals>(oldTotalsKey) || {
              totals: 0,
              totalsFuture: 0,
              totalsCleared: 0,
              totalsOutstanding: 0,
            }),
          };

          if (oldTotals) {
            const amount = variables.oldRow.amount;

            // Deduct from old account state-specific totals
            if (variables.oldRow.transactionState === "future") {
              oldTotals.totalsFuture -= amount;
            } else if (variables.oldRow.transactionState === "cleared") {
              oldTotals.totalsCleared -= amount;
            } else if (variables.oldRow.transactionState === "outstanding") {
              oldTotals.totalsOutstanding -= amount;
            }

            oldTotals.totals -= variables.oldRow.amount;
            queryClient.setQueryData(oldTotalsKey, oldTotals);

            log.debug("Old account totals updated", {
              accountNameOwner: variables.oldRow.accountNameOwner,
              newTotals: oldTotals,
            });
          }

          // For destination account, invalidate transaction caches to refetch
          invalidateTransactionCaches(variables.newRow.accountNameOwner);

          // Invalidate destination account totals to refetch
          // We don't have complete state to calculate accurately
          queryClient.invalidateQueries({ queryKey: newTotalsKey });

          log.debug("Cross-account transfer complete", {
            oldAccount: variables.oldRow.accountNameOwner,
            newAccount: variables.newRow.accountNameOwner,
          });
        }
      },
      onError: (error) => {
        log.error("Update failed", error);
      },
    },
  );
}
