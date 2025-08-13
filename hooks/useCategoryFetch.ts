import { useQuery } from "@tanstack/react-query";
import Category from "../model/Category";
import { useAuth } from "../components/AuthProvider";
//import { basicAuth } from "../Common";

const fetchCategoryData = async (): Promise<Category[]> => {
  try {
    const response = await fetch("/api/category/select/active", {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        //Authorization: basicAuth(),
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        console.log("No categories found (404).");
        return []; // Return empty array for 404, meaning no categories
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error: any) {
    console.error("Error fetching category data:", error);
    throw new Error(`Failed to fetch category data: ${error.message}`);
  }
};

export default function useCategoryFetch() {
  const { isAuthenticated, loading } = useAuth();

  const queryResult = useQuery<Category[], Error>({
    queryKey: ["category"], // Make the key an array to support caching and refetching better
    queryFn: fetchCategoryData,
    enabled: !loading && isAuthenticated,
  });

  if (queryResult.isError) {
    console.log(
      "Error occurred while fetching category data:",
      queryResult.error?.message,
    );
  }

  return queryResult;
}
