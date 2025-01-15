//import { basicAuth } from "../Common";
import { useMutation, useQueryClient } from "react-query";

const insertCategory = async (categoryName: any): Promise<any> => {
  try {
    const endpoint = "/api/category/insert";
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
        console.error("Resource not found (404).", await response.json());
        return {
          categoryId: Math.random(),
          categoryName: categoryName,
          activeStatus: true,
          dateAdded: new Date(),
          dateUpdated: new Date(),
        };
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error: any) {
    console.error("An error occurred:", error);
    throw error;
  }
};

export default function useCategoryInsert() {
  const queryClient = useQueryClient();

  return useMutation(
    ["insertCategory"],
    (variables: any) => insertCategory(variables.categoryName),
    {
      onError: (error: any) => {
        console.log(error ? error : "error is undefined.");
      },

      onSuccess: (response) => {
        const oldData: any = queryClient.getQueryData("category");
        const newData = [response, ...oldData];
        queryClient.setQueryData("category", newData);
      },
    }
  );
}