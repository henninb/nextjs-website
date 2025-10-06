import { useMutation, useQueryClient } from "@tanstack/react-query";
import Category from "../model/Category";

export const updateCategory = async (
  oldCategory: Category,
  newCategory: Category,
): Promise<Category> => {
  const endpoint = `/api/category/${oldCategory.categoryName}`;
  try {
    const response = await fetch(endpoint, {
      method: "PUT",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(newCategory),
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
    console.error(`Error updating category: ${error.message}`);
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
