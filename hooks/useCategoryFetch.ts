import { useQuery } from "@tanstack/react-query";
import Category from "../model/Category";
//import { basicAuth } from "../Common";

const fetchCategoryData = async (): Promise<Category[]> => {
  try {
    const response = await fetch(
      "https://finance.lan/api/category/select/active",
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          //Authorization: basicAuth(),
        },
      },
    );

    if (!response.ok) {
      if (response.status === 404) {
        console.log("Resource not found (404).");
        return [
          {
            categoryId: Math.random(),
            categoryName: "test1",
            activeStatus: true,
          },
          {
            categoryId: Math.random(),
            categoryName: "test2",
            activeStatus: true,
          },
        ];
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.log("Error fetching category data:", error);
    return [
      {
        categoryId: Math.random(),
        categoryName: "test1",
        activeStatus: true,
      },
      {
        categoryId: Math.random(),
        categoryName: "test2",
        activeStatus: true,
      },
    ];
  }
};

export default function useCategoryFetch() {
  const queryResult = useQuery<Category[], Error>({
    queryKey: ["category"], // Make the key an array to support caching and refetching better
    queryFn: fetchCategoryData,
  });

  if (queryResult.isError) {
    console.error(
      "Error occurred while fetching category data:",
      queryResult.error?.message,
    );
  }

  return queryResult;
}
