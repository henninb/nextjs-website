import { useMutation, useQueryClient } from "@tanstack/react-query";
import Payment from "../model/Payment";
//import { basicAuth } from "../Common";

const deletePayment = async (payload: Payment): Promise<Payment> => {
  try {
    const endpoint = `https://finance.lan/api/payment/delete/${payload.paymentId}`;

    const response = await fetch(endpoint, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        credentials: "include",
        //Authorization: basicAuth(),
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

export default function usePaymentDelete() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["deletePayment"],
    mutationFn: (variables: { oldRow: Payment }) =>
      deletePayment(variables.oldRow),
    onError: (error) => {
      console.log(error ? error : "error is undefined.");
    },
    onSuccess: (_response, variables) => {
      const oldData: any = queryClient.getQueryData(["payment"]) || [];
      const newData = oldData.filter(
        (t: Payment) => t.paymentId !== variables.oldRow.paymentId,
      );
      queryClient.setQueryData(["payment"], newData);
    },
  });
}
