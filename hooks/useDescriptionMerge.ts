import { useQueryClient } from "@tanstack/react-query";
import { useStandardMutation } from "../utils/queryConfig";
import { fetchWithErrorHandling, parseResponse } from "../utils/fetchUtils";
import { QueryKeys } from "../utils/cacheUtils";
import { createHookLogger } from "../utils/logger";

const log = createHookLogger("useDescriptionMerge");

/**
 * Payload for merging descriptions
 */
export type MergePayload = {
  sourceNames: string[];
  targetName: string;
};

/**
 * Merge multiple source descriptions into a single target description via API
 * This operation updates all transactions referencing the source descriptions
 *
 * @param payload - Source description names and target description name
 * @returns Merge operation result
 */
export const mergeDescriptions = async (
  payload: MergePayload,
): Promise<any> => {
  log.debug("Merging descriptions", {
    sourceCount: payload.sourceNames.length,
    targetName: payload.targetName,
  });

  const endpoint = "/api/description/merge";
  const response = await fetchWithErrorHandling(endpoint, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  return parseResponse<any>(response) as Promise<any>;
};

/**
 * Hook for merging descriptions
 * Automatically invalidates description cache on success
 *
 * @returns React Query mutation hook
 *
 * @example
 * ```typescript
 * const { mutate } = useDescriptionMerge();
 * mutate({ sourceNames: ["starbucks", "coffee"], targetName: "Starbucks Coffee" });
 * ```
 */
export default function useDescriptionMerge() {
  const queryClient = useQueryClient();

  return useStandardMutation(
    (payload: MergePayload) => mergeDescriptions(payload),
    {
      mutationKey: ["descriptionMerge"],
      onSuccess: (_response, variables) => {
        log.debug("Descriptions merged successfully", {
          sourceNames: variables.sourceNames,
          targetName: variables.targetName,
        });

        // Invalidate descriptions to refresh the list
        queryClient.invalidateQueries({ queryKey: QueryKeys.description() });
      },
      onError: (error) => {
        log.error("Merge failed", error);
      },
    },
  );
}
