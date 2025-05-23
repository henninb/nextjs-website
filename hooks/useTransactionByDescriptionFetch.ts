import { useQuery } from "@tanstack/react-query";
import Transaction from "../model/Transaction";
//import { basicAuth } from "../Common";

const dataTest: Transaction[] = [
  {
    transactionId: 10544,
    guid: "299b36b1-a49f-43bc-aaa5-ba78352f716a",
    accountId: 1029,
    accountType: "credit",
    transactionType: "undefined",
    accountNameOwner: "bfe_brian",
    transactionDate: new Date("2017-09-17"),
    description: "balance adjustment",
    category: "test",
    amount: 1.99,
    transactionState: "outstanding",
    activeStatus: true,
    reoccurringType: "onetime",
    notes: "",
  },
  {
    transactionId: 10543,
    guid: "55dd8ccb-b51c-4c93-907e-95ed1d20705f",
    accountId: 1029,
    accountType: "credit",
    transactionType: "expense",
    accountNameOwner: "bfe_brian",
    transactionDate: new Date("2017-08-18"),
    description: "amazon.com",
    category: "test",
    amount: 0.99,
    transactionState: "cleared",
    activeStatus: true,
    reoccurringType: "onetime",
    notes: "egiftcard",
  },
  {
    transactionId: 10542,
    guid: "499cee31-ec4c-4f8a-b5b5-35ea9c9df9f4",
    accountId: 1029,
    accountType: "credit",
    transactionType: "undefined",
    accountNameOwner: "bfe_brian",
    transactionDate: new Date("2017-08-17"),
    description: "balance adjustment",
    category: "none",
    amount: -0.99,
    transactionState: "cleared",
    activeStatus: true,
    reoccurringType: "onetime",
    notes: "test",
  },
  {
    transactionId: 10541,
    guid: "6128e4be-932d-4da3-af3b-3c25e76a9de9",
    accountId: 1029,
    accountType: "credit",
    transactionType: "expense",
    accountNameOwner: "bfe_brian",
    transactionDate: new Date("2017-07-18"),
    description: "amazon.com",
    category: "none",
    amount: 0.99,
    transactionState: "cleared",
    activeStatus: true,
    reoccurringType: "onetime",
    notes: "",
  },
  {
    transactionId: 10540,
    guid: "798e8a7f-f615-46b1-aeba-b0b8f74e5d10",
    accountId: 1029,
    accountType: "credit",
    transactionType: "undefined",
    accountNameOwner: "bfe_brian",
    transactionDate: new Date("2017-07-17"),
    description: "balance adjustment",
    category: "none",
    amount: -0.99,
    transactionState: "cleared",
    activeStatus: true,
    reoccurringType: "onetime",
    notes: "",
  },
];

const fetchTransactionsByDescription = async (
  description: string,
): Promise<Transaction[] | null> => {
  try {
    const response = await fetch(
      `https://finance.bhenning.com/api/transaction/description/${description}`,
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
  } catch (error) {
    console.log("Error fetching transactionsByDescription data:", error);
    return dataTest; // Default fallback data on error
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
