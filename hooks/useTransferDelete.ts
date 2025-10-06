import { useMutation, useQueryClient } from "@tanstack/react-query";
import Transfer from "../model/Transfer";

export const deleteTransfer = async (payload: Transfer): Promise<Transfer> => {
  try {
    const endpoint = `/api/transfer/${payload.transferId}`;

    const response = await fetch(endpoint, {
      method: "DELETE",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      const errorBody = await response
        .json()
        .catch(() => ({ error: `HTTP error! Status: ${response.status}` }));
      const errorMessage =
        errorBody.error || `HTTP error! Status: ${response.status}`;
      console.error(`Failed to delete transfer: ${errorMessage}`);
      throw new Error(errorMessage);
    }

    return await response.json();
  } catch (error: any) {
    console.error(`An error occurred: ${error.message}`);
    throw error;
  }
};

export default function useTransferDelete() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["deleteTransfer"],
    mutationFn: (variables: { oldRow: Transfer }) =>
      deleteTransfer(variables.oldRow),
    onError: (error) => {
      console.error(error ? error : "error is undefined.");
    },
    onSuccess: (_response, variables) => {
      const oldData: any = queryClient.getQueryData(["transfer"]) || [];
      const newData = oldData.filter(
        (t: Transfer) => t.transferId !== variables.oldRow.transferId,
      );
      queryClient.setQueryData(["transfer"], newData);
    },
  });
}
