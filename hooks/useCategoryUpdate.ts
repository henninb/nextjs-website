//import { basicAuth } from "../Common";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Category from "../model/Category";

const updateCategory = async (
  oldCategory: Category,
  newCategory: Category,
): Promise<Category> => {
  const endpoint = `https://finance.lan/api/category/update/${oldCategory.categoryName}`;
  try {
    const response = await fetch(endpoint, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        //Authorization: basicAuth(),
      },
      body: JSON.stringify({}),
    });

    if (response.status === 404) {
      console.log("Resource not found (404).");
    }

    if (!response.ok) {
      throw new Error(
        `Failed to update transaction state: ${response.statusText}`,
      );
    }

    return await response.json();
  } catch (error: any) {
    console.log(`An error occurred: ${error.message}`);
    throw error;
  }
};

export default function useCategoryUpdate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["categoryUpdate"],
    mutationFn: ({
      oldCategory,
      newCategory,
    }: {
      oldCategory: Category;
      newCategory: Category;
    }) => updateCategory(oldCategory, newCategory),
    onError: (error: any) => {
      console.error(`Error occurred during mutation: ${error.message}`);
    },
    onSuccess: (updatedCategory: Category) => {
      const oldData = queryClient.getQueryData<Category[]>(["category"]);
      if (oldData) {
        // Use a stable identifier (e.g., categoryId) for matching and updating
        const newData = oldData.map((element) =>
          element.categoryId === updatedCategory.categoryId
            ? { ...element, ...updatedCategory }
            : element,
        );

        queryClient.setQueryData(["category"], newData);
      }
    },
    // onSuccess: (updatedCategory: Category) => {
    //   const oldData = queryClient.getQueryData<Category[]>(["category"]);
    //   if (oldData) {
    //     const newData = oldData.map((element) =>
    //       element.categoryName === updatedCategory.categoryName
    //         ? { ...element, ...updatedCategory }
    //         : element,
    //     );

    //     queryClient.setQueryData(["category"], newData);
    //   }
    // },
  });
}
