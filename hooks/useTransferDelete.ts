import { useMutation, useQueryClient } from "@tanstack/react-query";
import Transfer from "../model/Transfer";
//import { basicAuth } from "../Common";

const deleteTransfer = async (payload: Transfer): Promise<Transfer> => {
  try {
    const endpoint =
      "https://finance.lan/api/transfer/delete/" + payload.transferId;

    const response = await fetch(endpoint, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        //Authorization: basicAuth(),
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        console.log("Resource not found (404).", await response.json());
        return payload;
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error deleting transfer:", error);
    //return JSON.stringify(payload);
    console.log("An error occurred:", error);
    return payload;
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
