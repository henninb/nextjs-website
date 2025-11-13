import { useQueryClient } from "@tanstack/react-query";
import Description from "../model/Description";
import { useStandardMutation } from "../utils/queryConfig";
import { fetchWithErrorHandling, parseResponse } from "../utils/fetchUtils";
import { HookValidator } from "../utils/hookValidation";
import { InputSanitizer } from "../utils/validation/sanitization";
import { CacheUpdateStrategies, QueryKeys } from "../utils/cacheUtils";
import { createHookLogger } from "../utils/logger";

const log = createHookLogger("useDescriptionDelete");

/**
 * Delete a description via API
 * Validates identifier and sanitizes before sending
 *
 * @param oldRow - Description to delete
 * @returns Deleted description or null
 */
export const deleteDescription = async (
  oldRow: Description,
): Promise<Description | null> => {
  // Validate that description name exists
  HookValidator.validateDelete(oldRow, "descriptionName", "deleteDescription");

  // Sanitize description name for URL
  const sanitizedDescriptionName = InputSanitizer.sanitizeDescription(
    oldRow.descriptionName,
  );

  log.debug("Deleting description", {
    descriptionName: sanitizedDescriptionName,
  });

  const endpoint = `/api/description/${sanitizedDescriptionName}`;
  const response = await fetchWithErrorHandling(endpoint, {
    method: "DELETE",
  });

  return parseResponse<Description>(response);
};

/**
 * Hook for deleting a description
 * Automatically removes description from the cache on success
 *
 * @returns React Query mutation hook
 *
 * @example
 * ```typescript
 * const { mutate } = useDescriptionDelete();
 * mutate(descriptionToDelete);
 * ```
 */
export default function useDescriptionDelete() {
  const queryClient = useQueryClient();

  return useStandardMutation(
    (variables: Description) => deleteDescription(variables),
    {
      mutationKey: ["deleteDescription"],
      onSuccess: (response, variables) => {
        log.debug("Description deleted successfully", {
          descriptionName: variables.descriptionName,
        });

        // Remove from cache using descriptionName as identifier
        CacheUpdateStrategies.removeFromList(
          queryClient,
          QueryKeys.description(),
          variables,
          "descriptionName",
        );
      },
      onError: (error) => {
        log.error("Delete failed", error);
      },
    },
  );
}
