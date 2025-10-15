import { useMutation, useQueryClient } from "@tanstack/react-query";
import PendingTransaction from "../model/PendingTransaction";

const deletePendingTransaction = async (id: number): Promise<void> => {
  try {
    const endpoint = `/api/pending/transaction/${id}`;
    console.log(`Deleting pending transaction with id: ${id}`);

    const response = await fetch(endpoint, {
      method: "DELETE",
      credentials: "include",
      // headers can be added here if needed
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
      } catch (error: any) {
        console.log(`Failed to parse error response: ${error.message}`);
        throw new Error(`Failed to parse error response: ${error.message}`);
      }
      console.log(errorMessage || "Unknown error");
      throw new Error(errorMessage || "Unknown error");
    }

    // No content is expected on success (HTTP 204)
    return;
  } catch (error: any) {
    throw error;
  }
};

export default function usePendingTransactionDelete() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deletePendingTransaction(id),
    onError: (error: any) => {
      console.log(error || "An unknown error occurred.");
    },
    onSuccess: (_, id: number) => {
      // Remove the deleted transaction from the cache if it exists
      queryClient.setQueryData(["pendingTransactions"], (oldData: any) => {
        if (!oldData) return oldData;
        return oldData.filter(
          (transaction: PendingTransaction) =>
            transaction.pendingTransactionId !== id,
        );
      });
    },
  });
}
