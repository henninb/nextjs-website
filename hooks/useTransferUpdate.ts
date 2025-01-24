import { useMutation, useQueryClient } from "@tanstack/react-query";
import Transfer from "../model/Transfer";
//import { basicAuth } from "../Common";

const updateTransfer = async (
  oldTransfer: Transfer,
  newTransfer: Transfer,
): Promise<Transfer> => {
  const endpoint = `https://finance.lan/api/transfer/update/${oldTransfer.transferId}`;
  try {
    const response = await fetch(endpoint, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        //Authorization: basicAuth(),
      },
      body: JSON.stringify({}),
    });

    if (response.status === 404) {
      console.log("Resource not found (404).");
    }

    if (!response.ok) {
      throw new Error(
        `Failed to update transfer state: ${response.statusText}`,
      );
    }

    return await response.json();
  } catch (error: any) {
    console.log("Error updating transfer state:", error.message);
    return newTransfer;
  }
};

export default function useTransferUpdate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["transferUpdate"],
    mutationFn: ({
      oldTransfer,
      newTransfer,
    }: {
      oldTransfer: Transfer;
      newTransfer: Transfer;
    }) => updateTransfer(oldTransfer, newTransfer),
    onError: (error: any) => {
      console.error(`Error occurred during mutation: ${error.message}`);
    },
    onSuccess: (updatedTransfer: Transfer) => {
      const oldData = queryClient.getQueryData<Transfer[]>(["transfer"]);
      if (oldData) {
        const newData = oldData.map((element) =>
          element.transferId === updatedTransfer.transferId
            ? { ...element, ...updatedTransfer }
            : element,
        );

        queryClient.setQueryData(["transfer"], newData);
      }
    },
  });
}
