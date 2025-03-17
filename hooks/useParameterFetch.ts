import { useQuery } from "@tanstack/react-query";
import Parameter from "../model/Parameter";
import { dummyParameters } from "../data/dummyParameters";
//import { basicAuth } from "../Common";

const fetchParameterData = async (): Promise<Parameter[]> => {
  try {
    const response = await fetch("/api/parameter/select/active", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        credentials: "include",
        //Authorization: basicAuth(),
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        console.log("Data not found (404)");
      }
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    // Uncomment the line below for debugging
    // console.debug(JSON.stringify(data));
    return data;
  } catch (error) {
    console.log("Error fetching parameters data:", error);
    return dummyParameters;
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
