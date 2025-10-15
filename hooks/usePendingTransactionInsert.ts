import { useMutation, useQueryClient } from "@tanstack/react-query";
import PendingTransaction from "../model/PendingTransaction";

export const insertPendingTransaction = async (
  pendingTransaction: PendingTransaction,
): Promise<PendingTransaction | null> => {
  try {
    const endpoint = "/api/pending/transaction";
    console.log("Sending data: " + JSON.stringify(pendingTransaction));

    const response = await fetch(endpoint, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(pendingTransaction),
    });

    if (!response.ok) {
      let errorMessage = "";
      try {
        const errorBody = await response.json();
        if (errorBody && errorBody.response) {
          errorMessage = `${errorBody.response}`;
        } else {
          throw new Error("No error message returned.");
        }
      } catch (error) {
        console.log(`Failed to parse error response: ${error.message}`);
        throw new Error(`Failed to parse error response: ${error.message}`);
      }

      console.log(errorMessage || "Unknown error");
      throw new Error(errorMessage || "Unknown error");
    }

    return await response.json();
  } catch (error: any) {
    throw error;
  }
};

export default function usePendingTransactionInsert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables: { pendingTransaction: PendingTransaction }) =>
      insertPendingTransaction(variables.pendingTransaction),
    onError: (error: any) => {
      console.log(error || "An unknown error occurred.");
    },
    onSuccess: (newPendingTransaction) => {
      const oldData: PendingTransaction[] =
        queryClient.getQueryData(["pendingTransactions"]) || [];
      queryClient.setQueryData(
        ["pendingTransactions"],
        [newPendingTransaction, ...oldData],
      );
    },
  });
}
