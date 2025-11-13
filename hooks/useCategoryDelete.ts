import { useQueryClient } from "@tanstack/react-query";
import Category from "../model/Category";
import { useStandardMutation } from "../utils/queryConfig";
import { fetchWithErrorHandling, parseResponse } from "../utils/fetchUtils";
import { HookValidator } from "../utils/hookValidation";
import { InputSanitizer } from "../utils/validation/sanitization";
import { CacheUpdateStrategies, QueryKeys } from "../utils/cacheUtils";
import { createHookLogger } from "../utils/logger";

const log = createHookLogger("useCategoryDelete");

/**
 * Delete a category via API
 * Validates identifier and sanitizes before sending
 *
 * @param payload - Category to delete
 * @returns Deleted category or null
 */
export const deleteCategory = async (
  payload: Category,
): Promise<Category | null> => {
  // Validate that category name exists
  HookValidator.validateDelete(payload, "categoryName", "deleteCategory");

  // Sanitize category name for URL
  const sanitizedCategoryName = InputSanitizer.sanitizeCategory(
    payload.categoryName,
  );

  log.debug("Deleting category", { categoryName: sanitizedCategoryName });

  const endpoint = `/api/category/${sanitizedCategoryName}`;
  const response = await fetchWithErrorHandling(endpoint, {
    method: "DELETE",
  });

  return parseResponse<Category>(response);
};

/**
 * Hook for deleting a category
 * Automatically removes category from the cache on success
 *
 * @returns React Query mutation hook
 *
 * @example
 * ```typescript
 * const { mutate } = useCategoryDelete();
 * mutate(categoryToDelete);
 * ```
 */
export default function useCategoryDelete() {
  const queryClient = useQueryClient();

  return useStandardMutation(
    (variables: Category) => deleteCategory(variables),
    {
      mutationKey: ["deleteCategory"],
      onSuccess: (response, variables) => {
        log.debug("Category deleted successfully", {
          categoryName: variables.categoryName,
        });

        // Remove from cache using categoryName as identifier
        CacheUpdateStrategies.removeFromList(
          queryClient,
          QueryKeys.category(),
          variables,
          "categoryName",
        );
      },
      onError: (error) => {
        log.error("Delete failed", error);
      },
    },
  );
}
