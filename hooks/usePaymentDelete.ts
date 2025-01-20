import { useMutation, useQueryClient } from "@tanstack/react-query";
import Payment from "../model/Payment";
//import { basicAuth } from "../Common";

const deletePayment = async (payload: Payment): Promise<Payment> => {
  try {
    const endpoint =
      "https://finance.lan/api/payment/delete/" + payload.paymentId;

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
    console.error("Error deleting payment:", error);
    console.log("An error occurred:", error);
    return payload;
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
