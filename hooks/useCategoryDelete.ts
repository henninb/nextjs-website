import { useMutation, useQueryClient } from "@tanstack/react-query";
import Category from "../model/Category";
//import { basicAuth } from "../Common";

const deleteCategory = async (payload: Category): Promise<Category> => {
  try {
    const endpoint = `https://finance.lan/api/category/delete/${payload.categoryName}`;

    const response = await fetch(endpoint, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        //Authorization: basicAuth(),
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        console.log("Category not found (404). Check the category name.");
      }
      throw new Error(`An error occurred: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.log("Error in deleteCategory:", error);
    return payload;
  }
};

export default function useCategoryDelete() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["deleteCategory"],
    mutationFn: (variables: Category) => deleteCategory(variables),
    onError: (error) => {
      console.error("Mutation error:", error);
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
