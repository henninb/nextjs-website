import { useQueryClient } from "@tanstack/react-query";
import Account from "../model/Account";
import { InputSanitizer } from "../utils/validation/sanitization";
import { useStandardMutation } from "../utils/queryConfig";
import { fetchWithErrorHandling, parseResponse } from "../utils/fetchUtils";
import { HookValidator } from "../utils/hookValidation";
import { QueryKeys, CacheUpdateStrategies } from "../utils/cacheUtils";
import { createHookLogger } from "../utils/logger";

const log = createHookLogger("useAccountDeactivate");

/**
 * Deactivate an account (sets activeStatus=false, dateClosed=now, and cascades to transactions)
 * Exported for testing and reuse
 *
 * @param payload - Account to deactivate
 * @returns Deactivated account or null
 * @throws {HookValidationError} If validation fails
 * @throws {FetchError} If API request fails
 */
export const deactivateAccount = async (
  payload: Account,
): Promise<Account | null> => {
  // Validate that account identifier exists
  HookValidator.validateDelete(
    payload,
    "accountNameOwner",
    "deactivateAccount",
  );

  // Sanitize account name for URL
  const sanitizedAccountName = InputSanitizer.sanitizeAccountName(
    payload.accountNameOwner,
  );

  log.debug("Deactivating account", {
    accountNameOwner: sanitizedAccountName,
  });

  const endpoint = `/api/account/deactivate/${sanitizedAccountName}`;

  const response = await fetchWithErrorHandling(endpoint, {
    method: "PUT",
  });

  const result = await parseResponse<Account>(response);

  log.debug("Account deactivated successfully", {
    accountNameOwner: sanitizedAccountName,
  });

  return result;
};

/**
 * Hook to deactivate an account and cascade to all associated transactions
 * Handles validation, API call, and cache updates
 *
 * @returns Mutation object with mutate, mutateAsync, and state
 *
 * @example
 * ```typescript
 * const deactivateMutation = useAccountDeactivate();
 *
 * const handleDeactivate = async (account: Account) => {
 *   await deactivateMutation.mutateAsync({ oldRow: account });
 * };
 * ```
 */
export default function useAccountDeactivate() {
  const queryClient = useQueryClient();

  return useStandardMutation(
    (variables: { oldRow: Account }) => deactivateAccount(variables.oldRow),
    {
      mutationKey: ["deactivateAccount"],
      onError: (error) => {
        log.error("Failed to deactivate account", error);
      },
      onSuccess: (data, variables) => {
        log.debug("Cache updated - account deactivated", {
          accountId: variables.oldRow.accountId,
        });

        // Update the account in cache with deactivated status
        if (data) {
          CacheUpdateStrategies.updateInList(
            queryClient,
            QueryKeys.account(),
            data,
            "accountId",
          );
        }

        // Invalidate all transaction-related queries to reflect cascade
        queryClient.invalidateQueries({
          predicate: (query) => {
            const queryKey = query.queryKey;
            return Array.isArray(queryKey) && queryKey[0] === "transaction";
          },
        });

        // Invalidate totals as well since transactions changed
        queryClient.invalidateQueries({
          predicate: (query) => {
            const queryKey = query.queryKey;
            return Array.isArray(queryKey) && queryKey[0] === "totals";
          },
        });
      },
    },
  );
}
