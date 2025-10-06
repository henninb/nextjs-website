import { useMutation, useQueryClient } from "@tanstack/react-query";
import Transfer from "../model/Transfer";

export const updateTransfer = async (
  oldTransfer: Transfer,
  newTransfer: Transfer,
): Promise<Transfer> => {
  const endpoint = `/api/transfer/${oldTransfer.transferId}`;
  try {
    const response = await fetch(endpoint, {
      method: "PUT",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(newTransfer),
    });

    if (!response.ok) {
      const errorBody = await response
        .json()
        .catch(() => ({ error: `HTTP error! Status: ${response.status}` }));
      const errorMessage =
        errorBody.error || `HTTP error! Status: ${response.status}`;
      console.error(`Failed to update transfer: ${errorMessage}`);
      throw new Error(errorMessage);
    }

    return await response.json();
  } catch (error: any) {
    console.error(`An error occurred: ${error.message}`);
    throw error;
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
