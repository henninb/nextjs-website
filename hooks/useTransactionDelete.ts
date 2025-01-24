import { useMutation, useQueryClient } from "@tanstack/react-query";
import Transaction from "../model/Transaction";

const getAccountKey = (accountNameOwner: string) => [
  "accounts",
  accountNameOwner,
];

const deleteTransaction = async (
  payload: Transaction,
): Promise<Transaction> => {
  try {
    const endpoint =
      "https://finance.lan/api/transaction/delete/" + payload.guid;

    const response = await fetch(endpoint, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        //Authorization: `Basic ${btoa("username:password")}`, // Replace with dynamic basicAuth if needed
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        console.log("Resource not found (404).");
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.log("An error occurred:", error);
    return payload;
    //throw error;
  }
};

export default function useTransactionDelete() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["deleteTransaction"],
    mutationFn: (variables: { oldRow: Transaction }) =>
      deleteTransaction(variables.oldRow),
    onError: (error) => {
      console.log(error ? error : "error is undefined.");
    },
    onSuccess: (response, variables) => {
      //console.log("Fetching transactions for key:", ["accounts", variables.oldRow.accountNameOwner]);
      //console.log("Deleting transaction with key:", getAccountKey(variables.oldRow.accountNameOwner));
      const oldData: [Transaction] = queryClient.getQueryData(
        getAccountKey(variables.oldRow.accountNameOwner),
      );
      if (!oldData) {
        console.log(
          "No data found for key:",
          getAccountKey(variables.oldRow.accountNameOwner),
        );
        return;
      }

      const newData = oldData.filter(
        (t: Transaction) => t.transactionId !== variables.oldRow.transactionId,
      );
      queryClient.setQueryData(
        getAccountKey(variables.oldRow.accountNameOwner),
        newData,
      );
    },
  });
}
