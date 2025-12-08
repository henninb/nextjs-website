import { useQueryClient } from "@tanstack/react-query";
import Transfer from "../model/Transfer";
import { DataValidator } from "../utils/validation";
import { useStandardMutation } from "../utils/queryConfig";
import { fetchWithErrorHandling, parseResponse } from "../utils/fetchUtils";
import { HookValidator } from "../utils/hookValidation";
import { CacheUpdateStrategies, QueryKeys } from "../utils/cacheUtils";
import { createHookLogger } from "../utils/logger";

const log = createHookLogger("useTransferInsert");

/**
 * Setup new transfer payload with required defaults
 *
 * @param payload - Transfer data to setup
 * @returns Formatted transfer payload
 */
export const overRideTransferValues = (payload: Transfer) => {
  return {
    ...payload,
    activeStatus: true,
  };
};

/**
 * Insert a new transfer via API
 * Validates input and sanitizes data before sending
 *
 * @param payload - Transfer data to insert
 * @returns Newly created transfer
 */
export const insertTransfer = async (payload: Transfer): Promise<Transfer> => {
  console.log(
    "[useTransferInsert] insertTransfer PAYLOAD INPUT:",
    JSON.stringify(payload),
  );

  // Validate transfer data
  const validatedData = HookValidator.validateInsert(
    payload,
    DataValidator.validateTransfer,
    "insertTransfer",
  );

  console.log(
    "[useTransferInsert] VALIDATED DATA:",
    JSON.stringify(validatedData),
  );

  log.debug("Inserting transfer", {
    sourceAccount: validatedData.sourceAccount,
    destinationAccount: validatedData.destinationAccount,
    amount: validatedData.amount,
  });

  const endpoint = "/api/transfer";
  const newPayload = overRideTransferValues(validatedData);

  console.log(
    "[useTransferInsert] FINAL PAYLOAD TO API:",
    JSON.stringify(newPayload),
  );

  const response = await fetchWithErrorHandling(endpoint, {
    method: "POST",
    body: JSON.stringify(newPayload),
  });

  return parseResponse<Transfer>(response) as Promise<Transfer>;
};

/**
 * Hook for inserting a new transfer
 * Automatically updates the transfer list cache on success
 *
 * @returns React Query mutation hook
 *
 * @example
 * ```typescript
 * const { mutate } = useTransferInsert();
 * mutate({ payload: newTransfer });
 * ```
 */
export default function useTransferInsert() {
  const queryClient = useQueryClient();

  return useStandardMutation(
    (variables: { payload: Transfer }) => insertTransfer(variables.payload),
    {
      mutationKey: ["insertTransfer"],
      onSuccess: (newTransfer) => {
        if (newTransfer) {
          log.debug("Transfer inserted successfully", {
            transferId: newTransfer.transferId,
          });

          CacheUpdateStrategies.addToList(
            queryClient,
            QueryKeys.transfer(),
            newTransfer,
            "start",
          );
        }
      },
      onError: (error) => {
        log.error("Insert failed", error);
      },
    },
  );
}
