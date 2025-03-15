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
    const endpoint = `https://finance.lan/api/transaction/delete/${payload.guid}`;

    //console.log(endpoint);
    //console.log(JSON.stringify(payload));
    const response = await fetch(endpoint, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        credentials: "include",
        //Authorization: `Basic ${btoa("username:password")}`, // Replace with dynamic basicAuth if needed
      },
    });

    if (!response.ok) {
      let errorMessage = "";

      try {
        const errorBody = await response.json();
        if (errorBody && errorBody.response) {
          errorMessage = `${errorBody.response}`;
        } else {
          console.log("No error message returned.");
          throw new Error("No error message returned.");
        }
      } catch (error) {
        console.log(`Failed to parse error response: ${error.message}`);
        throw new Error(`Failed to parse error response: ${error.message}`);
      }

      console.log(errorMessage || "cannot throw a null value");
      throw new Error(errorMessage || "cannot throw a null value");
    }

    return response.status !== 204 ? await response.json() : null;
  } catch (error) {
    console.log(`An error occurred: ${error.message}`);
    throw error;
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
      const accountKey = getAccountKey(variables.oldRow.accountNameOwner);
      const totalsKey = ["totals", variables.oldRow.accountNameOwner];

      // Remove the deleted transaction from the cache
      const oldData: [Transaction] | undefined =
        queryClient.getQueryData(accountKey);
      if (oldData) {
        const newData = oldData.filter(
          (t: Transaction) =>
            t.transactionId !== variables.oldRow.transactionId,
        );
        queryClient.setQueryData(accountKey, newData);
      } else {
        console.log("No data found for key:", accountKey);
      }

      // Invalidate the totals query to refetch updated totals
      queryClient.invalidateQueries({ queryKey: totalsKey });
    },
  });
}
