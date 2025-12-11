import { useQueryClient } from "@tanstack/react-query";
import Account from "../model/Account";
import { DataValidator } from "../utils/validation";
import { InputSanitizer } from "../utils/validation/sanitization";
import { useStandardMutation } from "../utils/queryConfig";
import { fetchWithErrorHandling, parseResponse } from "../utils/fetchUtils";
import { HookValidator } from "../utils/hookValidation";
import { QueryKeys, CacheUpdateStrategies } from "../utils/cacheUtils";
import { createHookLogger } from "../utils/logger";

const log = createHookLogger("useAccountUpdate");

/**
 * Update an existing account with validation and sanitization
 * Exported for testing and reuse
 *
 * @param oldRow - Existing account data
 * @param newRow - Updated account data
 * @returns Updated account
 * @throws {HookValidationError} If validation fails
 * @throws {FetchError} If API request fails
 */
export const updateAccount = async (
  oldRow: Account,
  newRow: Account,
): Promise<Account> => {
  // Validate new data
  const validatedData = HookValidator.validateUpdate(
    newRow,
    oldRow,
    DataValidator.validateAccount,
    "updateAccount",
  );

  // Check if this is a rename operation
  const isRename = oldRow.accountNameOwner !== newRow.accountNameOwner;

  if (isRename) {
    // Use the specialized rename endpoint for account name changes
    const sanitizedOldName = InputSanitizer.sanitizeAccountName(
      oldRow.accountNameOwner,
    );
    const sanitizedNewName = InputSanitizer.sanitizeAccountName(
      newRow.accountNameOwner,
    );

    log.debug("Renaming account", {
      oldAccountNameOwner: sanitizedOldName,
      newAccountNameOwner: sanitizedNewName,
    });

    const endpoint = `/api/account/rename?old=${encodeURIComponent(sanitizedOldName)}&new=${encodeURIComponent(sanitizedNewName)}`;

    const response = await fetchWithErrorHandling(endpoint, {
      method: "PUT",
    });

    const result = await parseResponse<Account>(response);

    if (!result) {
      throw new Error("Rename failed: No data returned");
    }

    log.debug("Account renamed successfully", {
      accountNameOwner: result.accountNameOwner,
    });

    return result;
  } else {
    // Use standard update endpoint for other field changes
    // Sanitize account name for URL
    const sanitizedAccountName = InputSanitizer.sanitizeAccountName(
      oldRow.accountNameOwner,
    );

    log.debug("Updating account", {
      accountNameOwner: sanitizedAccountName,
    });

    const endpoint = `/api/account/${sanitizedAccountName}`;

    const response = await fetchWithErrorHandling(endpoint, {
      method: "PUT",
      body: JSON.stringify(validatedData),
    });

    const result = await parseResponse<Account>(response);

    if (!result) {
      throw new Error("Update failed: No data returned");
    }

    log.debug("Account updated successfully", {
      accountNameOwner: result.accountNameOwner,
    });

    return result;
  }
};

/**
 * Hook to update an existing account
 * Handles validation, API call, and cache updates
 *
 * @returns Mutation object with mutate, mutateAsync, and state
 *
 * @example
 * ```typescript
 * const updateMutation = useAccountUpdate();
 *
 * const handleUpdate = async (oldAccount: Account, newAccount: Account) => {
 *   await updateMutation.mutateAsync({ oldRow: oldAccount, newRow: newAccount });
 * };
 * ```
 */
export default function useAccountUpdate() {
  const queryClient = useQueryClient();

  return useStandardMutation(
    (variables: { oldRow: Account; newRow: Account }) =>
      updateAccount(variables.oldRow, variables.newRow),
    {
      mutationKey: ["updateAccount"],
      onError: (error) => {
        log.error("Failed to update account", error);
      },
      onSuccess: (response) => {
        log.debug("Cache updated with updated account", {
          accountId: response.accountId,
        });

        // Optimistically update cache using accountId as stable identifier
        CacheUpdateStrategies.updateInList(
          queryClient,
          QueryKeys.account(),
          response,
          "accountId",
        );
      },
    },
  );
}
