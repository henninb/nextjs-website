import { useMutation, useQueryClient } from "@tanstack/react-query";
import Payment from "../model/Payment";

export const deletePayment = async (payload: Payment): Promise<Payment> => {
  try {
    const endpoint = `/api/payment/${payload.paymentId}`;

    const response = await fetch(endpoint, {
      method: "DELETE",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      const errorBody = await response
        .json()
        .catch(() => ({ error: `HTTP error! Status: ${response.status}` }));
      const errorMessage =
        errorBody.error || `HTTP error! Status: ${response.status}`;
      console.error(`Failed to delete payment: ${errorMessage}`);
      throw new Error(errorMessage);
    }

    return await response.json();
  } catch (error) {
    console.error(`An error occurred: ${error.message}`);
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
      console.error(error ? error : "error is undefined.");
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
