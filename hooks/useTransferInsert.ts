import { useMutation, useQueryClient } from "@tanstack/react-query";
import Transfer from "../model/Transfer";

export const overRideTransferValues = (payload: Transfer) => {
  return {
    amount: payload?.amount,
    transactionDate: payload?.transactionDate,
    ...payload,
  };
};

export const insertTransfer = async (payload: Transfer): Promise<Transfer> => {
  try {
    const endpoint = "/api/transfer";
    const newPayload = overRideTransferValues(payload);

    const response = await fetch(endpoint, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(newPayload),
    });

    if (!response.ok) {
      const errorBody = await response
        .json()
        .catch(() => ({ error: `HTTP error! Status: ${response.status}` }));
      const errorMessage =
        errorBody.error || `HTTP error! Status: ${response.status}`;
      console.error(`Failed to insert transfer: ${errorMessage}`);
      throw new Error(errorMessage);
    }

    return await response.json();
  } catch (error: any) {
    console.error(`An error occurred: ${error.message}`);
    throw error;
  }
};

export default function useTransferInsert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["insertTransfer"],
    mutationFn: (variables: { payload: Transfer }) =>
      insertTransfer(variables.payload),
    onError: (error) => {
      console.error(error ? error : "error is undefined.");
    },
    onSuccess: (newTransfer) => {
      const oldData: any = queryClient.getQueryData(["transfer"]) || [];
      queryClient.setQueryData(["transfer"], [newTransfer, ...oldData]);
    },
  });
}
