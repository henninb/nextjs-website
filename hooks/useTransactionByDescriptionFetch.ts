import { useQuery } from "@tanstack/react-query";
import Transaction from "../model/Transaction";
//import { basicAuth } from "../Common";

const fetchTransactionsByDescription = async (
  description: string,
): Promise<Transaction[] | null> => {
  try {
    const response = await fetch(
      `/api/transaction/description/${description}`,
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
        console.log("Resource not found (404).");
      }
      throw new Error(
        `Failed to fetch transactionsByDescription data: ${response.statusText}`,
      );
    }

    return response.status !== 204 ? await response.json() : null;
  } catch (error: any) {
    console.error("Error fetching transaction by description data:", error);
    throw new Error(
      `Failed to fetch transaction by description data: ${error.message}`,
    );
  }
};

export default function useTransactionByDescriptionFetch(
  accountNameOwner: string,
) {
  const queryResult = useQuery({
    queryKey: ["descriptions", accountNameOwner],
    queryFn: () => fetchTransactionsByDescription(accountNameOwner),
  });
  if (queryResult.isError) {
    console.log(
      "Error occurred while fetching transaction data:",
      queryResult.error?.message,
    );
  }

  return queryResult;
}
