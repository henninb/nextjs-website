import { useMutation, useQueryClient } from "@tanstack/react-query";
import Transfer from "../model/Transfer";
//import { basicAuth } from "../Common";

const overRideTransferValues = (payload: Transfer) => {
  return {
    amount: payload?.amount,
    transactionDate: payload?.transactionDate,
  };
};

const insertTransfer = async (payload: Transfer): Promise<Transfer> => {
  try {
    const endpoint = "https://finance.lan/api/transfer/insert";
    const newPayload = overRideTransferValues(payload);

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        //Authorization: basicAuth(),
      },
      body: JSON.stringify(newPayload),
    });

    if (!response.ok) {
      if (response.status === 404) {
        console.error("Resource not found (404).", await response.json());
        return payload;
        // return {
        //   transferId: Math.random(), // Generate unique ID
        //   sourceAccount: payload.sourceAccount,
        //   destinationAccount: payload.destinationAccount,
        //   transactionDate: payload.transactionDate,
        //   amount: payload.amount,
        //   activeStatus: true,
        // };
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.log("An error occurred:", error);
    //throw error;
    return payload;
  }
};

export default function useTransferInsert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["insertTransfer"],
    mutationFn: (variables: { payload: Transfer }) =>
      insertTransfer(variables.payload),
    onError: (error) => {
      console.log(error ? error : "error is undefined.");
    },
    onSuccess: (newTransfer) => {
      const oldData: any = queryClient.getQueryData(["transfer"]) || [];
      queryClient.setQueryData(["transfer"], [newTransfer, ...oldData]);
    },
  });
}
