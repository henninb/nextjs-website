import { useMutation, useQueryClient } from "@tanstack/react-query";
import Transfer from "../model/Transfer";
//import { basicAuth } from "../Common";

const overRideTransferValues = (payload: Transfer) => {
  return {
    amount: payload?.amount,
    transactionDate: payload?.transactionDate,
    ...payload,
  };
};

const insertTransfer = async (payload: Transfer): Promise<Transfer> => {
  try {
    const endpoint = "/api/transfer/insert";
    const newPayload = overRideTransferValues(payload);

    //console.log("" + JSON.stringify(newPayload));
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        credentials: "include",
        //Authorization: basicAuth(),
      },
      body: JSON.stringify(newPayload),
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
