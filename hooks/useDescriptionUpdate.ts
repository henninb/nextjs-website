import { useQueryClient } from "@tanstack/react-query";
import Description from "../model/Description";
import { DataValidator } from "../utils/validation";
import { useStandardMutation } from "../utils/queryConfig";
import { fetchWithErrorHandling, parseResponse } from "../utils/fetchUtils";
import { HookValidator } from "../utils/hookValidation";
import { InputSanitizer } from "../utils/validation/sanitization";
import { CacheUpdateStrategies, QueryKeys } from "../utils/cacheUtils";
import { createHookLogger } from "../utils/logger";

const log = createHookLogger("useDescriptionUpdate");

/**
 * Update an existing description via API
 * Validates and sanitizes input before sending
 *
 * @param oldDescription - Original description data (for identifier)
 * @param newDescription - Updated description data
 * @returns Updated description
 */
export const updateDescription = async (
  oldDescription: Description,
  newDescription: Description,
): Promise<Description> => {
  // Validate new description data
  const validatedData = HookValidator.validateUpdate(
    newDescription,
    oldDescription,
    DataValidator.validateDescription,
    "updateDescription",
  );

  // Sanitize description name for URL
  const sanitizedDescriptionName = InputSanitizer.sanitizeDescription(
    oldDescription.descriptionName,
  );

  log.debug("Updating description", {
    oldName: oldDescription.descriptionName,
    newName: validatedData.descriptionName,
  });

  const endpoint = `/api/description/${sanitizedDescriptionName}`;
  const response = await fetchWithErrorHandling(endpoint, {
    method: "PUT",
    body: JSON.stringify(validatedData),
  });

  return parseResponse<Description>(response) as Promise<Description>;
};

/**
 * Hook for updating an existing description
 * Automatically updates the description list cache on success
 *
 * @returns React Query mutation hook
 *
 * @example
 * ```typescript
 * const { mutate } = useDescriptionUpdate();
 * mutate({ oldDescription, newDescription });
 * ```
 */
export default function useDescriptionUpdate() {
  const queryClient = useQueryClient();

  return useStandardMutation(
    ({
      oldDescription,
      newDescription,
    }: {
      oldDescription: Description;
      newDescription: Description;
    }) => updateDescription(oldDescription, newDescription),
    {
      mutationKey: ["updateDescription"],
      onSuccess: (updatedDescription: Description) => {
        log.debug("Description updated successfully", {
          descriptionName: updatedDescription.descriptionName,
        });

        // Use descriptionId as stable identifier for cache updates
        CacheUpdateStrategies.updateInList(
          queryClient,
          QueryKeys.description(),
          updatedDescription,
          "descriptionId",
        );
      },
      onError: (error) => {
        log.error("Update failed", error);
      },
    },
  );
}
