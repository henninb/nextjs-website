import { useMutation, useQueryClient } from "@tanstack/react-query";
import Category from "../model/Category";
//import { basicAuth } from "../Common";

const insertCategory = async (
  category: Category,
): Promise<Category | null> => {
  try {
    const endpoint = "https://finance.lan/api/category/insert";
    //const payload = { category: categoryName, activeStatus: true };

    console.log("passed: " + JSON.stringify(category))

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        //Authorization: basicAuth(),
      },
      body: JSON.stringify(category),
    });

    if (!response.ok) {
      if (response.status === 404) {
        console.log("Resource not found (404).", await response.json());
      }
      throw new Error(`HTTP error! status: ${response.status}`);
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
