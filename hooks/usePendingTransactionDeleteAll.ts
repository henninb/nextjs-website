import { useMutation, useQueryClient } from "@tanstack/react-query";

const deleteAllPendingTransactions = async (): Promise<void> => {
  try {
    const endpoint =
      "https://finance.bhenning.com/api/pending/transaction/delete/all";
    console.log("Deleting all pending transactions");

    const response = await fetch(endpoint, {
      method: "DELETE",
      credentials: "include",
      //   headers: {
      //     "Accept": "application/json",
      //   },
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

export default function usePendingTransactionDeleteAll() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteAllPendingTransactions,
    onError: (error: any) => {
      console.log(error || "An unknown error occurred.");
    },
    onSuccess: () => {
      // Update the query cache. Here we clear out the pending transactions.
      queryClient.setQueryData(["pendingTransactions"], []);
    },
  });
}
