import { useQuery } from "@tanstack/react-query";
import Parameter from "../model/Parameter";

const fetchParameterData = async (): Promise<Parameter[]> => {
  try {
    const response = await fetch("/api/parameter/active", {
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
      throw new Error(
        errorBody.error || `HTTP error! Status: ${response.status}`,
      );
    }

    const data = await response.json();
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
