import { useQuery } from "@tanstack/react-query";
import Description from "../model/Description";
import { useAuth } from "../components/AuthProvider";
//import { basicAuth } from "../Common";

const fetchDescriptionData = async (): Promise<Description[]> => {
  try {
    const response = await fetch("/api/description/select/active", {
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
        console.log("No descriptions found (404).");
        return []; // Return empty array for 404, meaning no descriptions
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error: any) {
    console.error("Error fetching description data:", error);
    throw new Error(`Failed to fetch description data: ${error.message}`);
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
