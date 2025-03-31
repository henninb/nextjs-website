import { useQuery } from "@tanstack/react-query";
import PendingTransaction from "../model/PendingTransaction";
import { dummyPendingTransactions } from "../data/dummyPendingTransactions";

const fetchPendingTransactions = async (): Promise<PendingTransaction[]> => {
  try {
    const response = await fetch(
      "https://finance.bhenning.com/api/pending/transaction/all",
      {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      },
    );

    if (!response.ok) {
      if (response.status === 404) {
        console.log("No pending transactions found (404).");
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.log("Error fetching pending transactions:", error);
    //return []; // Return an empty array in case of error
    return dummyPendingTransactions
  }
};

export default function usePendingTransactions() {
  const queryResult = useQuery<PendingTransaction[], Error>({
    queryKey: ["pendingTransactions"], // Key for caching and refetching
    queryFn: fetchPendingTransactions,
  });

  if (queryResult.isError) {
    console.log(
      "Error occurred while fetching pending transactions:",
      queryResult.error?.message,
    );
  }

  return queryResult;
}
