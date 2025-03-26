import { useMutation, useQueryClient } from "@tanstack/react-query";
import Payment from "../model/Payment";
//import { basicAuth } from "../Common";

const setupNewPayment = (payload: Payment) => {
  return {
    accountNameOwner: payload?.accountNameOwner,
    amount: payload?.amount,
    transactionDate: payload?.transactionDate,
  };
};

const insertPayment = async (payload: Payment): Promise<Payment> => {
  try {
    const endpoint = "https://finance.bhenning.com/api/payment/insert";
    const newPayload = setupNewPayment(payload);

    const response = await fetch(endpoint, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
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

export default function usePaymentInsert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["insertPayment"],
    mutationFn: (variables: { payload: Payment }) =>
      insertPayment(variables.payload),
    onError: (error) => {
      console.log(error ? error : "error is undefined.");
    },
    onSuccess: (newPayment) => {
      const oldData: any = queryClient.getQueryData(["payment"]) || [];
      queryClient.setQueryData(["payment"], [newPayment, ...oldData]);
    },
  });
}
