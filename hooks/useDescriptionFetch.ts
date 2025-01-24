import { useQuery } from "@tanstack/react-query";
import Description from "../model/Description";
//import { basicAuth } from "../Common";

const fetchDescriptionData = async (): Promise<Description[]> => {
  try {
    const response = await fetch(
      "https://finance.lan/api/description/select/active",
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
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.log("Error fetching description data:", error);
    return [
      {
        descriptionId: 1,
        descriptionName: "direct deposit",
        activeStatus: true,
      },
      {
        descriptionId: 2,
        descriptionName: "xfinity",
        activeStatus: true,
      },
    ];
  }
};

export default function useDescriptionFetch() {
  const queryResult = useQuery<Description[], Error>({
    queryKey: ["description"], // Make the key an array to support caching and refetching better
    queryFn: fetchDescriptionData,
  });

  if (queryResult.isError) {
    console.error(
      "Error occurred while fetching description data:",
      queryResult.error?.message,
    );
  }

  return queryResult;
}
