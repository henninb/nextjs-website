import { useQuery } from "@tanstack/react-query";
import Transfer from "../model/Transfer";
//import { basicAuth } from "../Common";

const fetchTransferData = async (): Promise<Transfer[]> => {
  try {
    const response = await fetch(
      "https://finance.bhenning.com/api/transfer/select",
      {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          //Authorization: basicAuth(),
        },
      },
    );

    if (!response.ok) {
      if (response.status === 404) {
        console.log("Resource not found (404)");
      }
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    // Uncomment the line below for debugging
    // console.debug(JSON.stringify(data));
    return data;
  } catch (error) {
    console.log("Error fetching transfer data:", error);
    throw error;
  }
};

export default function useTransferFetch() {
  const queryResult = useQuery<Transfer[], Error>({
    queryKey: ["transfer"],
    queryFn: fetchTransferData,
  });

  if (queryResult.isError) {
    console.log(
      "Error occurred while fetching transfer data:",
      queryResult.error?.message,
    );
  }

  return queryResult;
}
