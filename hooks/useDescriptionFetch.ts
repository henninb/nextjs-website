import { useQuery } from "@tanstack/react-query";
import Description from "../model/Description";
import { useAuth } from "../components/AuthProvider";

const fetchDescriptionData = async (): Promise<Description[]> => {
  try {
    const response = await fetch("/api/description/active", {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({ error: `HTTP error! Status: ${response.status}` }));
      const errorMessage = errorBody.error || errorBody.errors?.join(", ") || `HTTP error! Status: ${response.status}`;
      throw new Error(errorMessage);
    }

    return await response.json();
  } catch (error: any) {
    console.error("Error fetching description data:", error.message);
    throw error;
  }
};

export default function useDescriptionFetch() {
  const { isAuthenticated, loading } = useAuth();

  const queryResult = useQuery<Description[], Error>({
    queryKey: ["description"], // Make the key an array to support caching and refetching better
    queryFn: fetchDescriptionData,
    enabled: !loading && isAuthenticated,
  });

  if (queryResult.isError) {
    console.log(
      "Error occurred while fetching description data:",
      queryResult.error?.message,
    );
  }

  return queryResult;
}
