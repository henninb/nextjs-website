import { useQueryClient } from "@tanstack/react-query";
import Description from "../model/Description";
import { DataValidator } from "../utils/validation";
import { useStandardMutation } from "../utils/queryConfig";
import { fetchWithErrorHandling, parseResponse } from "../utils/fetchUtils";
import { HookValidator } from "../utils/hookValidation";
import { CacheUpdateStrategies, QueryKeys } from "../utils/cacheUtils";
import { createHookLogger } from "../utils/logger";
import { useAuth } from "../components/AuthProvider";

const log = createHookLogger("useDescriptionInsert");

/**
 * Insert a new description via API
 * Validates input and sanitizes data before sending
 *
 * @param descriptionName - Name of the description to insert
 * @returns Newly created description
 */
export const insertDescription = async (
  descriptionName: string,
  owner: string = "",
): Promise<Description> => {
  // Create description object with default activeStatus
  const descriptionData = { descriptionName, activeStatus: true, owner };

  // Validate description data
  const validatedData = HookValidator.validateInsert(
    descriptionData,
    DataValidator.validateDescription,
    "insertDescription",
  );

  log.debug("Inserting description", {
    descriptionName: validatedData.descriptionName,
  });

  const endpoint = "/api/description";
  const response = await fetchWithErrorHandling(endpoint, {
    method: "POST",
    body: JSON.stringify(validatedData),
  });

  return parseResponse<Description>(response) as Promise<Description>;
};

/**
 * Hook for inserting a new description
 * Automatically updates the description list cache on success
 *
 * @returns React Query mutation hook
 *
 * @example
 * ```typescript
 * const { mutate } = useDescriptionInsert();
 * mutate({ descriptionName: "New Description" });
 * ```
 */
export default function useDescriptionInsert() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useStandardMutation(
    (variables: { descriptionName: string }) =>
      insertDescription(variables.descriptionName, user?.username || ""),
    {
      mutationKey: ["insertDescription"],
      onSuccess: (newDescription) => {
        if (newDescription) {
          log.debug("Description inserted successfully", {
            descriptionName: newDescription.descriptionName,
          });

          CacheUpdateStrategies.addToList(
            queryClient,
            QueryKeys.description(),
            newDescription,
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
