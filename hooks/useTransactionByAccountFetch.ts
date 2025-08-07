import { useQuery } from "@tanstack/react-query";
import Transaction from "../model/Transaction";
import { dummyTransactions } from "../data/dummyTransactions";
//import { basicAuth } from "../Common";

const fetchTransactionsByAccount = async (
  accountNameOwner: string,
): Promise<Transaction[] | null> => {
  try {
    const response = await fetch(
      `/api/transaction/account/select/${accountNameOwner}`,
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
        `Failed to fetch transactionsByAccount data: ${response.statusText}`,
      );
    }

    return response.status !== 204 ? await response.json() : null;
  } catch (error) {
    console.log("Error fetching transactionsByAccount data:", error);
    return dummyTransactions;
  }
};

export default function useTransactionByAccountFetch(accountNameOwner: string) {
  const queryResult = useQuery({
    queryKey: ["accounts", accountNameOwner],
    queryFn: () => fetchTransactionsByAccount(accountNameOwner),
    staleTime: 5 * 60 * 1000, // 5 minutes
    //cacheTime: 10 * 60 * 1000, // 10 minutes
    retry: 1,
  });
  if (queryResult.isError) {
    console.log(
      "Error occurred while fetching transaction data:",
      queryResult.error?.message,
    );
  }

  return queryResult;
}
