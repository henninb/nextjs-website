import { useQuery } from "react-query";
//import { basicAuth } from "../Common";

const fetchCategoryData = async (): Promise<any> => {
  try {
    const response = await fetch("/api/category/select/active", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        //Authorization: basicAuth(),
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        console.log("Resource not found (404).");
        return [
          {
            categoryId: Math.random(),
            categoryName: 'test1',
            activeStatus: true,
          },
          {
            categoryId: Math.random(),
            categoryName: 'test2',
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
        categoryName: 'test1',
        activeStatus: true,
      },
      {
        categoryId: Math.random(),
        categoryName: 'test2',
        activeStatus: true,
      },
    ];
  }
};

export default function useCategoryFetch() {
  return useQuery("category", () => fetchCategoryData(), {
    onError: (error: any) => {
      console.log(error ? error : "error is undefined.");
      console.log(error.message ? error.message : "error.message is undefined.");
    },
  });
}
