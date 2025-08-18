import { useMutation, useQueryClient } from "@tanstack/react-query";
import Category from "../model/Category";
import { DataValidator, hookValidators } from "../utils/validation";
//import { basicAuth } from "../Common";

const insertCategory = async (category: Category): Promise<Category | null> => {
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

    const endpoint = "/api/category/insert";
    //const payload = { category: categoryName, activeStatus: true };

    console.log("passed: " + JSON.stringify(category));

    const response = await fetch(endpoint, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        //Authorization: basicAuth(),
      },
      body: JSON.stringify(validation.validatedData),
    });

    if (!response.ok) {
      let errorMessage = "";

      try {
        const errorBody = await response.json();
        if (errorBody && errorBody.response) {
          errorMessage = `${errorBody.response}`;
        } else {
          console.log("No error message returned.");
          throw new Error("No error message returned.");
        }
      } catch (error) {
        console.log(`Failed to parse error response: ${error.message}`);
        throw new Error(`Failed to parse error response: ${error.message}`);
      }

      console.log(errorMessage || "cannot throw a null value");
      throw new Error(errorMessage || "cannot throw a null value");
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
