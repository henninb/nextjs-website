import { useQueryClient } from "@tanstack/react-query";
import Transaction from "../model/Transaction";
import Totals from "../model/Totals";
import { DataValidator } from "../utils/validation";
import { generateSecureUUID } from "../utils/security/secureUUID";
import { useStandardMutation } from "../utils/queryConfig";
import { fetchWithErrorHandling, parseResponse } from "../utils/fetchUtils";
import { HookValidator } from "../utils/hookValidation";
import { getAccountKey, getTotalsKey } from "../utils/cacheUtils";
import { createHookLogger } from "../utils/logger";
import { useAuth } from "../components/AuthProvider";

const log = createHookLogger("useTransactionInsert");

export type TransactionInsertType = {
  accountNameOwner: string;
  newRow: Transaction;
  isFutureTransaction: boolean;
  isImportTransaction: boolean;
};

/**
 * Setup new transaction payload with secure UUID and defaults
 * Preserves business logic for transaction creation
 *
 * @param payload - Transaction data
 * @param accountNameOwner - Account name owner
 * @returns Formatted transaction payload
 */
export const setupNewTransaction = async (
  payload: Transaction,
  accountNameOwner: string,
): Promise<Partial<Transaction>> => {
  // Generate secure UUID server-side
  const secureGuid = await generateSecureUUID();

  // Build payload object excluding fields that should not be sent to backend
  // Backend will generate transactionId, accountId, and receiptImage
  const result: Partial<Transaction> = {
    guid: secureGuid, // Now using secure server-side generation
    transactionDate: payload.transactionDate,
    description: payload.description,
    category: payload.category || "",
    notes: payload.notes || "",
    amount: payload.amount,
    transactionType: payload.transactionType || "undefined",
    transactionState: payload.transactionState || "outstanding",
    activeStatus: true,
    accountType: payload.accountType || "debit",
    reoccurringType: payload.reoccurringType || "onetime",
    accountNameOwner: payload.accountNameOwner || "",
  };

  // Only include dueDate if it has a value
  if (payload.dueDate) {
    result.dueDate = payload.dueDate;
  }

  // Include owner if provided
  if (payload.owner) {
    result.owner = payload.owner;
  }

  // Explicitly DO NOT include: transactionId, accountId, receiptImage
  // These are generated/managed by the backend
  return result;
};

/**
 * Insert a new transaction via API
 * Validates input and sanitizes data before sending
 * Supports both regular and future transactions
 *
 * @param accountNameOwner - Account name owner
 * @param payload - Transaction data to insert
 * @param isFutureTransaction - Whether this is a future transaction
 * @param isImportTransaction - Whether this is from import (affects cache updates)
 * @returns Newly created transaction
 */
export const insertTransaction = async (
  accountNameOwner: string,
  payload: Transaction,
  isFutureTransaction: boolean,
  isImportTransaction: boolean,
): Promise<Transaction> => {
  // Validate transaction data
  const validatedData = HookValidator.validateInsert(
    payload,
    DataValidator.validateTransaction,
    "insertTransaction",
  );

  log.debug("Inserting transaction", {
    accountNameOwner,
    isFutureTransaction,
    isImportTransaction,
    amount: validatedData.amount,
    description: validatedData.description,
  });

  // Determine endpoint based on transaction type
  const endpoint = isFutureTransaction
    ? "/api/transaction/future"
    : "/api/transaction";

  const newPayload = await setupNewTransaction(validatedData, accountNameOwner);

  const response = await fetchWithErrorHandling(endpoint, {
    method: "POST",
    body: JSON.stringify(newPayload),
  });

  return parseResponse<Transaction>(response) as Promise<Transaction>;
};

/**
 * Hook for inserting a new transaction
 * Automatically updates transaction list and totals cache on success
 * Skips cache updates for import transactions
 *
 * @returns React Query mutation hook
 *
 * @example
 * ```typescript
 * const { mutate } = useTransactionInsert();
 * mutate({
 *   accountNameOwner: "checking",
 *   newRow: transaction,
 *   isFutureTransaction: false,
 *   isImportTransaction: false
 * });
 * ```
 */
export default function useTransactionInsert() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useStandardMutation(
    (variables: TransactionInsertType) => {
      if (!user?.username) {
        throw new Error("User must be logged in to insert a transaction");
      }
      return insertTransaction(
        variables.newRow.accountNameOwner,
        { ...variables.newRow, owner: user.username },
        variables.isFutureTransaction,
        variables.isImportTransaction,
      );
    },
    {
      mutationKey: ["insertTransaction"],
      onSuccess: (response: Transaction, variables: TransactionInsertType) => {
        log.debug("Transaction inserted successfully", {
          transactionId: response.transactionId,
          guid: response.guid,
          isImportTransaction: variables.isImportTransaction,
        });

        // Skip cache updates for import transactions
        if (!variables.isImportTransaction) {
          const totalsKey = getTotalsKey(response.accountNameOwner);

          // Invalidate paginated transaction queries for this account
          // This ensures all pages are refetched with the server's sort order and business logic
          queryClient.invalidateQueries({
            queryKey: ["transaction", response.accountNameOwner, "paged"],
          });

          // Invalidate non-paginated transaction queries (used in BackupRestore)
          queryClient.invalidateQueries({
            queryKey: ["transaction", response.accountNameOwner],
            exact: true,
          });

          // Optimistically update totals based on transaction state
          const oldTotals: Totals = queryClient.getQueryData<Totals>(
            totalsKey,
          ) || {
            totals: 0,
            totalsFuture: 0,
            totalsCleared: 0,
            totalsOutstanding: 0,
          };

          const newTotals = { ...oldTotals };
          newTotals.totals += response.amount;

          // Adjust state-specific totals
          if (response.transactionState === "cleared") {
            newTotals.totalsCleared += response.amount;
          } else if (response.transactionState === "outstanding") {
            newTotals.totalsOutstanding += response.amount;
          } else if (response.transactionState === "future") {
            newTotals.totalsFuture += response.amount;
          } else {
            log.warn("Unknown transaction state, totals may be incorrect", {
              transactionState: response.transactionState,
            });
          }

          queryClient.setQueryData(totalsKey, newTotals);

          log.debug("Cache updated", {
            accountNameOwner: response.accountNameOwner,
            newTotals,
          });
        }
      },
      onError: (error) => {
        log.error("Insert failed", error);
      },
    },
  );
}
