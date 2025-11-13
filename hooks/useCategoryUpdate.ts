import { useQueryClient } from "@tanstack/react-query";
import Category from "../model/Category";
import { DataValidator } from "../utils/validation";
import { useStandardMutation } from "../utils/queryConfig";
import { fetchWithErrorHandling, parseResponse } from "../utils/fetchUtils";
import { HookValidator } from "../utils/hookValidation";
import { InputSanitizer } from "../utils/validation/sanitization";
import { CacheUpdateStrategies, QueryKeys } from "../utils/cacheUtils";
import { createHookLogger } from "../utils/logger";

const log = createHookLogger("useCategoryUpdate");

/**
 * Update an existing category via API
 * Validates and sanitizes input before sending
 *
 * @param oldCategory - Original category data (for identifier)
 * @param newCategory - Updated category data
 * @returns Updated category
 */
export const updateCategory = async (
  oldCategory: Category,
  newCategory: Category,
): Promise<Category> => {
  // Validate new category data
  const validatedData = HookValidator.validateUpdate(
    newCategory,
    oldCategory,
    DataValidator.validateCategory,
    "updateCategory",
  );

  // Sanitize category name for URL
  const sanitizedCategoryName = InputSanitizer.sanitizeCategory(
    oldCategory.categoryName,
  );

  log.debug("Updating category", {
    oldName: oldCategory.categoryName,
    newName: validatedData.categoryName,
  });

  const endpoint = `/api/category/${sanitizedCategoryName}`;
  const response = await fetchWithErrorHandling(endpoint, {
    method: "PUT",
    body: JSON.stringify(validatedData),
  });

  return parseResponse<Category>(response) as Promise<Category>;
};

/**
 * Hook for updating an existing category
 * Automatically updates the category list cache on success
 *
 * @returns React Query mutation hook
 *
 * @example
 * ```typescript
 * const { mutate } = useCategoryUpdate();
 * mutate({ oldCategory, newCategory });
 * ```
 */
export default function useCategoryUpdate() {
  const queryClient = useQueryClient();

  return useStandardMutation(
    ({
      oldCategory,
      newCategory,
    }: {
      oldCategory: Category;
      newCategory: Category;
    }) => updateCategory(oldCategory, newCategory),
    {
      mutationKey: ["updateCategory"],
      onSuccess: (updatedCategory: Category) => {
        log.debug("Category updated successfully", {
          categoryName: updatedCategory.categoryName,
        });

        // Use categoryId as stable identifier for cache updates
        CacheUpdateStrategies.updateInList(
          queryClient,
          QueryKeys.category(),
          updatedCategory,
          "categoryId",
        );
      },
      onError: (error) => {
        log.error("Update failed", error);
      },
    },
  );
}
