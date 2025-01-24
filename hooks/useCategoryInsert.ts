import { useMutation, useQueryClient } from "@tanstack/react-query";
import Category from "../model/Category";
//import { basicAuth } from "../Common";

const insertCategory = async (categoryName: string): Promise<Category> => {
  try {
    const endpoint = "https://finance.lan/api/category/insert";
    const payload = { category: categoryName, activeStatus: true };

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        //Authorization: basicAuth(),
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      if (response.status === 404) {
        console.log("Resource not found (404).", await response.json());
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error: any) {
    console.log("An error occurred:", error);
    return {
      categoryId: Math.random(),
      categoryName: categoryName,
      activeStatus: true,
      dateAdded: new Date(),
      dateUpdated: new Date(),
    };
  }
};

export default function useCategoryInsert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables: { categoryName: string }) =>
      insertCategory(variables.categoryName),
    onError: (error: unknown) => {
      console.error(error || "An unknown error occurred.");
    },
    onSuccess: (newCategory) => {
      const oldData: Category[] = queryClient.getQueryData(["category"]) || [];
      queryClient.setQueryData(["category"], [newCategory, ...oldData]);
    },
  });
}
