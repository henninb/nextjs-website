import { useMutation, useQueryClient } from "@tanstack/react-query";
import Payment from "../model/Payment";
import Transaction from "../model/Transaction";

export const updatePayment = async (
  oldPayment: Payment,
  newPayment: Payment,
): Promise<Payment> => {
  const endpoint = `/api/payment/${oldPayment.paymentId}`;

  try {
    const response = await fetch(endpoint, {
      method: "PUT",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(newPayment),
    });

    if (!response.ok) {
      const errorBody = await response
        .json()
        .catch(() => ({ error: `HTTP error! Status: ${response.status}` }));
      const errorMessage =
        errorBody.error || `HTTP error! Status: ${response.status}`;
      console.error(`Failed to update payment: ${errorMessage}`);
      throw new Error(errorMessage);
    }

    return await response.json();
  } catch (error: any) {
    console.error(`An error occurred: ${error.message}`);
    throw error;
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

      // Minimal cascade: update linked transactions in source and destination accounts
      try {
        const paymentId = updatedPayment?.paymentId;
        const src = updatedPayment?.sourceAccount;
        const dst = updatedPayment?.destinationAccount;
        const txDate = updatedPayment?.transactionDate as any;

        const updateLinkedTxns = (
          accountNameOwner: string | undefined,
          sign: 1 | -1,
        ) => {
          if (!accountNameOwner) return;
          const key = ["accounts", accountNameOwner];
          const txns = queryClient.getQueryData<Transaction[]>(key);
          if (!txns || !paymentId) return;

          const updated = txns.map((t) => {
            const linked =
              typeof t.notes === "string" &&
              t.notes.includes(`paymentId:${paymentId}`);
            if (linked) {
              return {
                ...t,
                amount: sign * Number(updatedPayment.amount ?? 0),
                transactionDate: txDate,
              } as Transaction;
            }
            return t;
          });

          queryClient.setQueryData(key, updated);
        };

        // Source: cash outflow (negative). Destination: cash inflow (positive).
        updateLinkedTxns(src, -1);
        updateLinkedTxns(dst, 1);
      } catch (e: any) {
        console.error(
          `Payment cascade to transactions failed (non-fatal): ${
            e?.message ?? e
          }`,
        );
      }
    },
  });
}
