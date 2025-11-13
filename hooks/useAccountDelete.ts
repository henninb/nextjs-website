import { useQueryClient } from "@tanstack/react-query";
import Account from "../model/Account";
import { InputSanitizer } from "../utils/validation/sanitization";
import { useStandardMutation } from "../utils/queryConfig";
import { fetchWithErrorHandling, parseResponse } from "../utils/fetchUtils";
import { HookValidator } from "../utils/hookValidation";
import { QueryKeys, CacheUpdateStrategies } from "../utils/cacheUtils";
import { createHookLogger } from "../utils/logger";

const log = createHookLogger("useAccountDelete");

/**
 * Delete an account with validation and sanitization
 * Exported for testing and reuse
 *
 * @param payload - Account to delete
 * @returns Deleted account or null
 * @throws {HookValidationError} If validation fails
 * @throws {FetchError} If API request fails
 */
export const deleteAccount = async (
  payload: Account,
): Promise<Account | null> => {
  // Validate that account identifier exists
  HookValidator.validateDelete(payload, "accountNameOwner", "deleteAccount");

  // Sanitize account name for URL
  const sanitizedAccountName = InputSanitizer.sanitizeAccountName(
    payload.accountNameOwner,
  );

  log.debug("Deleting account", {
    accountNameOwner: sanitizedAccountName,
  });

  const endpoint = `/api/account/${sanitizedAccountName}`;

  const response = await fetchWithErrorHandling(endpoint, {
    method: "DELETE",
  });

  const result = await parseResponse<Account>(response);

  log.debug("Account deleted successfully", {
    accountNameOwner: sanitizedAccountName,
  });

  return result;
};

/**
 * Hook to delete an account
 * Handles validation, API call, and cache updates
 *
 * @returns Mutation object with mutate, mutateAsync, and state
 *
 * @example
 * ```typescript
 * const deleteMutation = useAccountDelete();
 *
 * const handleDelete = async (account: Account) => {
 *   await deleteMutation.mutateAsync({ oldRow: account });
 * };
 * ```
 */
export default function useAccountDelete() {
  const queryClient = useQueryClient();

  return useStandardMutation(
    (variables: { oldRow: Account }) => deleteAccount(variables.oldRow),
    {
      mutationKey: ["deleteAccount"],
      onError: (error) => {
        log.error("Failed to delete account", error);
      },
      onSuccess: (_, variables) => {
        log.debug("Cache updated - account removed", {
          accountId: variables.oldRow.accountId,
        });

        // Optimistically remove from cache
        CacheUpdateStrategies.removeFromList(
          queryClient,
          QueryKeys.account(),
          variables.oldRow,
          "accountId",
        );
      },
    },
  );
}
