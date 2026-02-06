import { useQueryClient } from "@tanstack/react-query";
import ValidationAmount from "../model/ValidationAmount";
import { useStandardMutation } from "../utils/queryConfig";
import { fetchWithErrorHandling, parseResponse } from "../utils/fetchUtils";
import { QueryKeys } from "../utils/cacheUtils";
import { createHookLogger } from "../utils/logger";
import { useAuth } from "../components/AuthProvider";

const log = createHookLogger("useValidationAmountInsert");

/**
 * Insert a new validation amount via API
 * No validation/sanitization needed - ValidationAmount is system-generated
 *
 * @param accountNameOwner - Account name (for cache key only)
 * @param payload - Validation amount data to insert
 * @returns Newly created validation amount
 */
export const insertValidationAmount = async (
  accountNameOwner: string,
  payload: ValidationAmount,
): Promise<ValidationAmount> => {
  log.debug("Inserting validation amount", {
    accountNameOwner,
    amount: payload.amount,
    transactionState: payload.transactionState,
  });

  const endpoint = `/api/validation/amount`;
  const response = await fetchWithErrorHandling(endpoint, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  return parseResponse<ValidationAmount>(response) as Promise<ValidationAmount>;
};

/**
 * Hook for inserting a new validation amount
 * Updates cache with new validation amount for the account
 *
 * @returns React Query mutation hook
 *
 * @example
 * ```typescript
 * const { mutate } = useValidationAmountInsert();
 * mutate({ accountNameOwner: "chase_checking", payload: newValidation });
 * ```
 */
export default function useValidationAmountInsert() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useStandardMutation(
    (variables: { accountNameOwner: string; payload: ValidationAmount }) =>
      insertValidationAmount(variables.accountNameOwner, { ...variables.payload, owner: user?.username || "" }),
    {
      mutationKey: ["insertValidationAmount"],
      onSuccess: (newValidation, variables) => {
        log.debug("Validation amount inserted successfully", {
          validationId: newValidation.validationId,
          accountNameOwner: variables.accountNameOwner,
        });

        // Set the new validation as the current one for this account
        queryClient.setQueryData(
          QueryKeys.validationAmount(variables.accountNameOwner),
          newValidation,
        );

        // Invalidate the "all" query to include new validation
        queryClient.invalidateQueries({
          queryKey: QueryKeys.validationAmountAll(variables.accountNameOwner),
        });
      },
      onError: (error) => {
        log.error("Insert failed", error);
      },
    },
  );
}
