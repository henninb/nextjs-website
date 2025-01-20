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
    const endpoint = "https://finance.lan/api/payment/insert";
    const newPayload = setupNewPayment(payload);

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
        //   paymentId: Math.random(), // Generate unique ID
        //   accountNameOwner: payload.accountNameOwner,
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
      const oldData: any = queryClient.getQueryData(["paymnet"]) || [];
      queryClient.setQueryData(["payment"], [newPayment, ...oldData]);
    },
  });
}
