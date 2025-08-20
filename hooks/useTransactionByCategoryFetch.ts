import { useQuery } from "@tanstack/react-query";
import Transaction from "../model/Transaction";

const fetchTransactionsByCategory = async (
  categoryName: string,
): Promise<Transaction[] | null> => {
  try {
    const response = await fetch(`/api/transaction/category/${categoryName}`, {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        console.log("Resource not found (404).");
      }
      throw new Error(
        `Failed to fetch transactionsByCategory data: ${response.statusText}`,
      );
    }

    return response.status !== 204 ? await response.json() : null;
  } catch (error: any) {
    console.error("Error fetching transaction by category data:", error);
    throw new Error(
      `Failed to fetch transaction by category data: ${error.message}`,
    );
  }
};

export default function useTransactionByCategoryFetch(
  accountNameOwner: string,
) {
  const queryResult = useQuery({
    queryKey: ["categories", accountNameOwner],
    queryFn: () => fetchTransactionsByCategory(accountNameOwner),
  });
  if (queryResult.isError) {
    console.log(
      "Error occurred while fetching transaction data:",
      queryResult.error?.message,
    );
  }

  return queryResult;
}
