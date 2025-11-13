import { useQueryClient } from "@tanstack/react-query";
import Category from "../model/Category";
import { DataValidator } from "../utils/validation";
import { useStandardMutation } from "../utils/queryConfig";
import { fetchWithErrorHandling, parseResponse } from "../utils/fetchUtils";
import { HookValidator } from "../utils/hookValidation";
import { CacheUpdateStrategies, QueryKeys } from "../utils/cacheUtils";
import { createHookLogger } from "../utils/logger";

const log = createHookLogger("useCategoryInsert");

/**
 * Insert a new category via API
 * Validates input and sanitizes data before sending
 *
 * @param category - Category data to insert
 * @returns Newly created category or null
 */
export const insertCategory = async (
  category: Category,
): Promise<Category | null> => {
  // Validate category data
  const validatedData = HookValidator.validateInsert(
    category,
    DataValidator.validateCategory,
    "insertCategory",
  );

  log.debug("Inserting category", { categoryName: validatedData.categoryName });

  const endpoint = "/api/category";
  const response = await fetchWithErrorHandling(endpoint, {
    method: "POST",
    body: JSON.stringify(validatedData),
  });

  return parseResponse<Category>(response);
};

/**
 * Hook for inserting a new category
 * Automatically updates the category list cache on success
 *
 * @returns React Query mutation hook
 *
 * @example
 * ```typescript
 * const { mutate } = useCategoryInsert();
 * mutate({ category: newCategory });
 * ```
 */
export default function useCategoryInsert() {
  const queryClient = useQueryClient();

  return useStandardMutation(
    (variables: { category: Category }) => insertCategory(variables.category),
    {
      mutationKey: ["insertCategory"],
      onSuccess: (newCategory) => {
        if (newCategory) {
          log.debug("Category inserted successfully", {
            categoryName: newCategory.categoryName,
          });

          CacheUpdateStrategies.addToList(
            queryClient,
            QueryKeys.category(),
            newCategory,
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
