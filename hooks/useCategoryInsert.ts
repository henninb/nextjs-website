import { useMutation, useQueryClient } from "@tanstack/react-query";
import Category from "../model/Category";
import { DataValidator, hookValidators } from "../utils/validation";

export const insertCategory = async (
  category: Category,
): Promise<Category | null> => {
  try {
    // Validate and sanitize using shared validator
    const validation = hookValidators.validateApiPayload(
      category,
      DataValidator.validateCategory,
      "insertCategory",
    );

    if (!validation.isValid) {
      const errorMessages =
        validation.errors?.map((e) => e.message).join(", ") ||
        "Validation failed";
      throw new Error(`Category validation failed: ${errorMessages}`);
    }

    const endpoint = "/api/category";

    console.log("passed: " + JSON.stringify(category));

    const response = await fetch(endpoint, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(validation.validatedData),
    });

    if (!response.ok) {
      const errorBody = await response
        .json()
        .catch(() => ({ error: `HTTP error! Status: ${response.status}` }));
      const errorMessage =
        errorBody.error ||
        errorBody.errors?.join(", ") ||
        `HTTP error! Status: ${response.status}`;
      throw new Error(errorMessage);
    }

    return await response.json();
  } catch (error: any) {
    throw error;
  }
};

export default function useCategoryInsert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables: { category: Category }) =>
      insertCategory(variables.category),
    onError: (error: any) => {
      console.log(error || "An unknown error occurred.");
    },
    onSuccess: (newCategory) => {
      const oldData: Category[] = queryClient.getQueryData(["category"]) || [];
      queryClient.setQueryData(["category"], [newCategory, ...oldData]);
    },
  });
}
