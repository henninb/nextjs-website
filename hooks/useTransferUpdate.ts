import { useQueryClient } from "@tanstack/react-query";
import Transfer from "../model/Transfer";
import { DataValidator } from "../utils/validation";
import { useStandardMutation } from "../utils/queryConfig";
import { fetchWithErrorHandling, parseResponse } from "../utils/fetchUtils";
import { HookValidator } from "../utils/hookValidation";
import { InputSanitizer } from "../utils/validation/sanitization";
import { CacheUpdateStrategies, QueryKeys } from "../utils/cacheUtils";
import { createHookLogger } from "../utils/logger";

const log = createHookLogger("useTransferUpdate");

/**
 * Update an existing transfer via API
 * Validates and sanitizes input before sending
 *
 * @param oldTransfer - Original transfer data (for identifier)
 * @param newTransfer - Updated transfer data
 * @returns Updated transfer
 */
export const updateTransfer = async (
  oldTransfer: Transfer,
  newTransfer: Transfer,
): Promise<Transfer> => {
  // Validate new transfer data
  const validatedData = HookValidator.validateUpdate(
    newTransfer,
    oldTransfer,
    DataValidator.validateTransfer,
    "updateTransfer",
  );

  // Validate and sanitize transfer ID
  const sanitizedTransferId = InputSanitizer.sanitizeNumericId(
    oldTransfer.transferId,
    "transferId",
  );

  log.debug("Updating transfer", {
    transferId: sanitizedTransferId,
    oldAmount: oldTransfer.amount,
    newAmount: validatedData.amount,
  });

  const endpoint = `/api/transfer/${sanitizedTransferId}`;
  const response = await fetchWithErrorHandling(endpoint, {
    method: "PUT",
    body: JSON.stringify(validatedData),
  });

  return parseResponse<Transfer>(response) as Promise<Transfer>;
};

/**
 * Hook for updating an existing transfer
 * Automatically updates transfer cache on success
 *
 * @returns React Query mutation hook
 *
 * @example
 * ```typescript
 * const { mutate } = useTransferUpdate();
 * mutate({ oldTransfer, newTransfer });
 * ```
 */
export default function useTransferUpdate() {
  const queryClient = useQueryClient();

  return useStandardMutation(
    ({
      oldTransfer,
      newTransfer,
    }: {
      oldTransfer: Transfer;
      newTransfer: Transfer;
    }) => updateTransfer(oldTransfer, newTransfer),
    {
      mutationKey: ["transferUpdate"],
      onSuccess: (updatedTransfer: Transfer) => {
        log.debug("Transfer updated successfully", {
          transferId: updatedTransfer.transferId,
        });

        // Update transfer in cache using transferId as stable identifier
        CacheUpdateStrategies.updateInList(
          queryClient,
          QueryKeys.transfer(),
          updatedTransfer,
          "transferId",
        );
      },
      onError: (error) => {
        log.error("Update failed", error);
      },
    },
  );
}
