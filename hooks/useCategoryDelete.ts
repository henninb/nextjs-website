import { useMutation, useQueryClient } from "@tanstack/react-query";
import Category from "../model/Category";

export const deleteCategory = async (
  payload: Category,
): Promise<Category | null> => {
  try {
    const endpoint = `/api/category/${payload.categoryName}`;

    const response = await fetch(endpoint, {
      method: "DELETE",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
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

    return response.status !== 204 ? await response.json() : null;
  } catch (error: any) {
    console.error(`Error deleting category: ${error.message}`);
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
