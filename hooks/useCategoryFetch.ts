import { useQuery } from "@tanstack/react-query";
import Category from "../model/Category";
import { useAuth } from "../components/AuthProvider";

const fetchCategoryData = async (): Promise<Category[]> => {
  try {
    const response = await fetch("/api/category/active", {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
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

    return await response.json();
  } catch (error: any) {
    console.error("Error fetching category data:", error.message);
    throw error;
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
