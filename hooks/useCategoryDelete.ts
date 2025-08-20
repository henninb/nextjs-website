import { useMutation, useQueryClient } from "@tanstack/react-query";
import Category from "../model/Category";

const deleteCategory = async (payload: Category): Promise<Category | null> => {
  try {
    const endpoint = `/api/category/delete/${payload.categoryName}`;

    const response = await fetch(endpoint, {
      method: "DELETE",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
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

    return response.status !== 204 ? await response.json() : null;
  } catch (error) {
    throw error;
  }
};

export default function useCategoryDelete() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["deleteCategory"],
    mutationFn: (variables: Category) => deleteCategory(variables),
    onError: (error) => {
      console.info("Mutation error:", error);
    },
    onSuccess: (response, variables) => {
      console.log("Delete was successful.", response);

      const oldData: any = queryClient.getQueryData(["category"]) || [];
      const newData = oldData.filter(
        (item: Category) => item.categoryName !== variables.categoryName,
      );
      queryClient.setQueryData(["category"], newData);
    },
  });
}
