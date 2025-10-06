import { useQuery } from "@tanstack/react-query";
import Transfer from "../model/Transfer";

const fetchTransferData = async (): Promise<Transfer[]> => {
  try {
    const response = await fetch("/api/transfer/active", {
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
        errorBody.error || `HTTP error! Status: ${response.status}`;
      console.error("Error fetching transfer data:", errorMessage);
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error("Error fetching transfer data:", error);
    throw error;
  }
};

export default function useTransferFetch() {
  const queryResult = useQuery<Transfer[], Error>({
    queryKey: ["transfer"],
    queryFn: fetchTransferData,
  });

  if (queryResult.isError) {
    console.error(
      "Error occurred while fetching transfer data:",
      queryResult.error?.message,
    );
  }

  return queryResult;
}
