import { useMutation, useQueryClient } from "@tanstack/react-query";
import Category from "../model/Category";
import { getSecureHeaders } from "../utils/csrfUtils";
//import { basicAuth } from "../Common";

const insertCategory = async (category: Category): Promise<Category | null> => {
  try {
    const endpoint = "/api/category/insert";
    //const payload = { category: categoryName, activeStatus: true };

    console.log("passed: " + JSON.stringify(category));

    const headers = await getSecureHeaders({
      //Authorization: basicAuth(),
    });

    const response = await fetch(endpoint, {
      method: "POST",
      credentials: "include",
      headers,
      body: JSON.stringify(category),
    });

    if (!response.ok) {
      let errorMessage = "";

      try {
        // First try to parse as JSON
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const errorBody = await response.json();
          if (errorBody && errorBody.response) {
            errorMessage = `${errorBody.response}`;
          } else if (errorBody && errorBody.error) {
            errorMessage = `${errorBody.error}`;
          } else {
            errorMessage = "No error message returned.";
          }
        } else {
          // Handle plain text responses (like CSRF errors)
          errorMessage = await response.text();
        }
      } catch (error) {
        console.log(`Failed to parse error response: ${error.message}`);
        errorMessage = `Failed to parse error response: ${error.message}`;
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
