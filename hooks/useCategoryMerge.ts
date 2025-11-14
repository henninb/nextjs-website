import { useQueryClient } from "@tanstack/react-query";
import { useStandardMutation } from "../utils/queryConfig";
import { fetchWithErrorHandling, parseResponse } from "../utils/fetchUtils";
import { QueryKeys } from "../utils/cacheUtils";
import { createHookLogger } from "../utils/logger";

const log = createHookLogger("useCategoryMerge");

/**
 * Payload for merging categories
 */
export type MergePayload = {
  sourceNames: string[];
  targetName: string;
};

/**
 * Merge multiple source categories into a single target category via API
 * This operation updates all transactions referencing the source categories
 *
 * @param payload - Source category names and target category name
 * @returns Merge operation result
 */
export const mergeCategories = async (payload: MergePayload): Promise<any> => {
  log.debug("Merging categories", {
    sourceCount: payload.sourceNames.length,
    targetName: payload.targetName,
  });

  const endpoint = "/api/category/merge";
  const response = await fetchWithErrorHandling(endpoint, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  return parseResponse<any>(response) as Promise<any>;
};

/**
 * Hook for merging categories
 * Automatically invalidates category cache on success
 *
 * @returns React Query mutation hook
 *
 * @example
 * ```typescript
 * const { mutate } = useCategoryMerge();
 * mutate({ sourceNames: ["food", "dining"], targetName: "restaurants" });
 * ```
 */
export default function useCategoryMerge() {
  const queryClient = useQueryClient();

  return useStandardMutation((payload: MergePayload) => mergeCategories(payload), {
    mutationKey: ["categoryMerge"],
    onSuccess: (_response, variables) => {
      log.debug("Categories merged successfully", {
        sourceNames: variables.sourceNames,
        targetName: variables.targetName,
      });

      // Invalidate categories to refresh the list
      queryClient.invalidateQueries({ queryKey: QueryKeys.category() });
    },
    onError: (error) => {
      log.error("Merge failed", error);
    },
  });
}
