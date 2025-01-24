import { useMutation, useQueryClient } from "@tanstack/react-query";
import Payment from "../model/Payment";
//import { basicAuth } from "../Common";

const updatePayment = async (
  oldPayment: Payment,
  newPayment: Payment,
): Promise<Payment> => {
  const endpoint = `https://finance.lan/api/payment/update/${oldPayment.paymentId}`;
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
      return newPayment; // Return fallback data for 404
    }

    if (!response.ok) {
      if (response.status === 404) {
        console.log("404 error: data not found.");
      }
      throw new Error(`Failed to update payment state: ${response.statusText}`);
    }

    return await response.json();
  } catch (error: any) {
    console.log("Error updating payment state:", error.message);
    return newPayment; // Return fallback data on error
  }
};

export default function usePaymentUpdate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["paymentUpdate"],
    mutationFn: ({
      oldPayment,
      newPayment,
    }: {
      oldPayment: Payment;
      newPayment: Payment;
    }) => updatePayment(oldPayment, newPayment),
    onError: (error: any) => {
      console.error(`Error occurred during mutation: ${error.message}`);
    },
    onSuccess: (updatedPayment: Payment) => {
      const oldData = queryClient.getQueryData<Payment[]>(["payment"]);
      if (oldData) {
        const newData = oldData.map((element) =>
          element.paymentId === updatedPayment.paymentId
            ? { ...element, ...updatedPayment }
            : element,
        );

        queryClient.setQueryData(["payment"], newData);
      }
    },
  });
}
