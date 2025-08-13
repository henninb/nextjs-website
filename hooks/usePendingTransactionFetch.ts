import { useQuery } from "@tanstack/react-query";
import PendingTransaction from "../model/PendingTransaction";

const fetchPendingTransactions = async (): Promise<PendingTransaction[]> => {
  try {
    const response = await fetch("/api/pending/transaction/all", {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        console.log("No pending transactions found (404).");
        return []; // Return empty array for 404, meaning no pending transactions
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error: any) {
    console.error("Error fetching pending transaction data:", error);
    throw new Error(
      `Failed to fetch pending transaction data: ${error.message}`,
    );
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
