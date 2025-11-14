import { useQueryClient } from "@tanstack/react-query";
import Transfer from "../model/Transfer";
import { useStandardMutation } from "../utils/queryConfig";
import { fetchWithErrorHandling, parseResponse } from "../utils/fetchUtils";
import { HookValidator } from "../utils/hookValidation";
import { InputSanitizer } from "../utils/validation/sanitization";
import { CacheUpdateStrategies, QueryKeys } from "../utils/cacheUtils";
import { createHookLogger } from "../utils/logger";

const log = createHookLogger("useTransferDelete");

/**
 * Delete a transfer via API
 * Validates identifier and sanitizes before sending
 *
 * @param payload - Transfer to delete
 * @returns Deleted transfer
 */
export const deleteTransfer = async (payload: Transfer): Promise<Transfer> => {
  // Validate that transfer ID exists
  HookValidator.validateDelete(payload, "transferId", "deleteTransfer");

  // Sanitize transfer ID for URL
  const sanitizedTransferId = InputSanitizer.sanitizeNumericId(
    payload.transferId,
    "transferId",
  );

  log.debug("Deleting transfer", { transferId: sanitizedTransferId });

  const endpoint = `/api/transfer/${sanitizedTransferId}`;
  const response = await fetchWithErrorHandling(endpoint, {
    method: "DELETE",
  });

  return parseResponse<Transfer>(response) as Promise<Transfer>;
};

/**
 * Hook for deleting a transfer
 * Automatically removes transfer from the cache on success
 *
 * @returns React Query mutation hook
 *
 * @example
 * ```typescript
 * const { mutate } = useTransferDelete();
 * mutate({ oldRow: transferToDelete });
 * ```
 */
export default function useTransferDelete() {
  const queryClient = useQueryClient();

  return useStandardMutation(
    (variables: { oldRow: Transfer }) => deleteTransfer(variables.oldRow),
    {
      mutationKey: ["deleteTransfer"],
      onSuccess: (_response, variables) => {
        log.debug("Transfer deleted successfully", {
          transferId: variables.oldRow.transferId,
        });

        // Remove from cache using transferId as identifier
        CacheUpdateStrategies.removeFromList(
          queryClient,
          QueryKeys.transfer(),
          variables.oldRow,
          "transferId",
        );
      },
      onError: (error) => {
        log.error("Delete failed", error);
      },
    },
  );
}
