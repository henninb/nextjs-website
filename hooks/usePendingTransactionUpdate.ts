import { useMutation, useQueryClient } from "@tanstack/react-query";
import PendingTransaction from "../model/PendingTransaction";

// Async function to update a pending transaction
const updatePendingTransaction = async (
  oldPendingTransaction: PendingTransaction,
  newPendingTransaction: PendingTransaction,
): Promise<PendingTransaction> => {
  const endpoint = `/api/pending/transaction/update/${oldPendingTransaction.pendingTransactionId}`;
  try {
    const response = await fetch(endpoint, {
      method: "PUT",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(newPendingTransaction),
    });

    if (response.status === 404) {
      console.log("Resource not found (404).");
    }

    if (!response.ok) {
      throw new Error(
        `Failed to update pending transaction: ${response.statusText}`,
      );
    }

    return await response.json();
  } catch (error: any) {
    console.log(`An error occurred: ${error.message}`);
    throw error;
  }
};

export default function usePendingTransactionUpdate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["pendingTransactionUpdate"],
    mutationFn: ({
      oldPendingTransaction,
      newPendingTransaction,
    }: {
      oldPendingTransaction: PendingTransaction;
      newPendingTransaction: PendingTransaction;
    }) =>
      updatePendingTransaction(oldPendingTransaction, newPendingTransaction),
    onError: (error: any) => {
      console.log(`Error occurred during mutation: ${error.message}`);
    },
    onSuccess: (updatedPendingTransaction: PendingTransaction) => {
      const oldData = queryClient.getQueryData<PendingTransaction[]>([
        "pendingTransactions",
      ]);
      if (oldData) {
        // Use a stable identifier (e.g., pendingTransactionId) for matching and updating
        const newData = oldData.map((element) =>
          element.pendingTransactionId ===
          updatedPendingTransaction.pendingTransactionId
            ? { ...element, ...updatedPendingTransaction }
            : element,
        );
        queryClient.setQueryData(["pendingTransactions"], newData);
      }
    },
  });
}
