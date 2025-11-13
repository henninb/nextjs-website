import { useQueryClient } from "@tanstack/react-query";
import Account from "../model/Account";
import { DataValidator } from "../utils/validation";
import { useStandardMutation } from "../utils/queryConfig";
import { fetchWithErrorHandling, parseResponse } from "../utils/fetchUtils";
import { HookValidator } from "../utils/hookValidation";
import { QueryKeys, CacheUpdateStrategies } from "../utils/cacheUtils";
import { createHookLogger } from "../utils/logger";

const log = createHookLogger("useAccountInsert");

/**
 * Setup default values for a new account
 * Ensures all required fields have proper defaults
 */
export const setupNewAccount = (payload: Account): Account => {
  return {
    cleared: 0.0,
    future: 0.0,
    outstanding: 0.0,
    dateClosed: new Date(0), // January 1, 1970 to indicate "not closed"
    dateAdded: new Date(),
    dateUpdated: new Date(),
    validationDate: new Date(0),
    ...payload,
    activeStatus: true, // Always force activeStatus to true for new accounts
  };
};

/**
 * Insert a new account with validation and sanitization
 * Exported for testing and reuse
 *
 * @param payload - Account data to insert
 * @returns Inserted account or null
 * @throws {HookValidationError} If validation fails
 * @throws {FetchError} If API request fails
 */
export const insertAccount = async (
  payload: Account,
): Promise<Account | null> => {
  // Validate and sanitize the account data
  const validatedData = HookValidator.validateInsert(
    payload,
    DataValidator.validateAccount,
    "insertAccount",
  );

  log.debug("Inserting account", {
    accountNameOwner: validatedData.accountNameOwner,
  });

  const endpoint = "/api/account";
  const newPayload = setupNewAccount(validatedData);

  const response = await fetchWithErrorHandling(endpoint, {
    method: "POST",
    body: JSON.stringify(newPayload),
  });

  const result = await parseResponse<Account>(response);

  log.debug("Account inserted successfully", {
    accountNameOwner: result?.accountNameOwner,
  });

  return result;
};

/**
 * Hook to insert a new account
 * Handles validation, API call, and optimistic cache updates
 *
 * @returns Mutation object with mutate, mutateAsync, and state
 *
 * @example
 * ```typescript
 * const insertMutation = useAccountInsert();
 *
 * const handleSubmit = async (accountData: Account) => {
 *   await insertMutation.mutateAsync({ payload: accountData });
 * };
 * ```
 */
export default function useAccountInsert() {
  const queryClient = useQueryClient();

  return useStandardMutation(
    (variables: { payload: Account }) => insertAccount(variables.payload),
    {
      mutationKey: ["insertAccount"],
      onError: (error) => {
        log.error("Failed to insert account", error);
      },
      onSuccess: (response) => {
        if (response) {
          log.debug("Cache updated with new account", {
            accountNameOwner: response.accountNameOwner,
          });

          // Optimistically update cache
          CacheUpdateStrategies.addToList(
            queryClient,
            QueryKeys.account(),
            response,
            "start",
          );
        }
      },
    },
  );
}
