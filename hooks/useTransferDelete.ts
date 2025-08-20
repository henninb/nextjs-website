import { useMutation, useQueryClient } from "@tanstack/react-query";
import Transfer from "../model/Transfer";

const deleteTransfer = async (payload: Transfer): Promise<Transfer> => {
  try {
    const endpoint = `/api/transfer/delete/${payload.transferId}`;

    const response = await fetch(endpoint, {
      method: "DELETE",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
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

export default function useTransferDelete() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["deleteTransfer"],
    mutationFn: (variables: { oldRow: Transfer }) =>
      deleteTransfer(variables.oldRow),
    onError: (error) => {
      console.log(error ? error : "error is undefined.");
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
