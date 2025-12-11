import { useQueryClient } from "@tanstack/react-query";
import { TransactionState } from "../model/TransactionState";
import Transaction from "../model/Transaction";
import { useStandardMutation } from "../utils/queryConfig";
import { fetchWithErrorHandling, parseResponse } from "../utils/fetchUtils";
import { InputSanitizer } from "../utils/validation/sanitization";
import { getAccountKey, getTotalsKey } from "../utils/cacheUtils";
import { createHookLogger } from "../utils/logger";

const log = createHookLogger("useTransactionStateUpdate");

/**
 * Change transaction state via API
 * Updates state (cleared, outstanding, future) for a transaction
 *
 * @param guid - Transaction GUID
 * @param newTransactionState - New state to set
 * @returns Updated transaction
 */
const changeTransactionState = async (
  guid: string,
  newTransactionState: TransactionState,
): Promise<Transaction> => {
  // Sanitize GUID for URL
  const sanitizedGuid = InputSanitizer.sanitizeGuid(guid);

  log.debug("Changing transaction state", {
    guid: sanitizedGuid,
    newState: newTransactionState,
  });

  const endpoint = `/api/transaction/state/update/${sanitizedGuid}/${newTransactionState}`;
  const response = await fetchWithErrorHandling(endpoint, {
    method: "PUT",
    body: JSON.stringify({}),
  });

  return parseResponse<Transaction>(response) as Promise<Transaction>;
};

/**
 * Hook for updating transaction state
 * Automatically updates transaction in cache and invalidates totals
 *
 * @param accountNameOwner - Account name owner for cache updates
 * @returns React Query mutation hook
 *
 * @example
 * ```typescript
 * const { mutate } = useTransactionStateUpdate("checking");
 * mutate({
 *   guid: "550e8400-e29b-41d4-a716-446655440000",
 *   transactionState: "cleared"
 * });
 * ```
 */
export default function useTransactionStateUpdate(accountNameOwner: string) {
  const queryClient = useQueryClient();

  return useStandardMutation(
    (variables: { guid: string; transactionState: TransactionState }) =>
      changeTransactionState(variables.guid, variables.transactionState),
    {
      mutationKey: ["transactionState"],
      onSuccess: (response: Transaction) => {
        log.debug("Transaction state updated successfully", {
          guid: response.guid,
          newState: response.transactionState,
        });

        const accountKey = getAccountKey(accountNameOwner);
        const totalsKey = getTotalsKey(accountNameOwner);

        // Update transaction state in cache
        const oldData: Transaction[] =
          queryClient.getQueryData<Transaction[]>(accountKey) || [];

        const newData = oldData.map((element) =>
          element.guid === response.guid
            ? { ...element, transactionState: response.transactionState }
            : element,
        );

        queryClient.setQueryData(accountKey, newData);

        log.debug("Transaction cache updated", {
          accountNameOwner,
          updatedCount: 1,
        });

        // Invalidate totals since state change affects totals
        queryClient.invalidateQueries({ queryKey: totalsKey });

        log.debug("Totals invalidated", { accountNameOwner });
      },
      onError: (error) => {
        log.error("State update failed", error);
      },
    },
  );
}
