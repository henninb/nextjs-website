import { useQuery } from "@tanstack/react-query";
import Transfer from "../model/Transfer";

const fetchTransferData = async (): Promise<Transfer[]> => {
  try {
    const response = await fetch("/api/transfer/select", {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        console.log("No transfers found (404).");
        return []; // Return empty array for 404, meaning no transfers
      }
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();

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
