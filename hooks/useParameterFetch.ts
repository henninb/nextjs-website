import { useQuery } from "@tanstack/react-query";
import Parameter from "../model/Parameter";

const fetchParameterData = async (): Promise<Parameter[]> => {
  try {
    const response = await fetch("/api/parameter/select/active", {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        console.log("No parameters found (404).");
        return []; // Return empty array for 404, meaning no parameters
      }
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    // Uncomment the line below for debugging

    return data;
  } catch (error: any) {
    console.error("Error fetching parameter data:", error);
    throw new Error(`Failed to fetch parameter data: ${error.message}`);
  }
};

export default function useParameterFetch() {
  const queryResult = useQuery<Parameter[], Error>({
    queryKey: ["parameter"], // Make the key an array to support caching and refetching better
    queryFn: fetchParameterData,
  });

  if (queryResult.isError) {
    console.log(
      "Error occurred while fetching parameter data:",
      queryResult.error?.message,
    );
  }

  return queryResult;
}
