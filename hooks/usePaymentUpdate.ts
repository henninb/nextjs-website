import { useMutation, useQueryClient } from "@tanstack/react-query";
import Payment from "../model/Payment";
import Transaction from "../model/Transaction";

const updatePayment = async (
  oldPayment: Payment,
  newPayment: Payment,
): Promise<Payment> => {
  const endpoint = `/api/payment/update/${oldPayment.paymentId}`;

  // Debug: Check if token cookie exists
  const tokenCookie =
    typeof window !== "undefined"
      ? document.cookie.split("; ").find((row) => row.startsWith("token="))
      : null;
  console.log(`Attempting to update payment at: ${endpoint}`);
  console.log(
    `Token cookie exists: ${!!tokenCookie}`,
    tokenCookie ? "Found - will be sent via credentials" : "Missing",
  );

  try {
    const response = await fetch(endpoint, {
      method: "PUT",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      // Build payload that satisfies validation but signals changes correctly
      body: JSON.stringify({
        // Always include valid values for required validation fields
        sourceAccount: oldPayment.sourceAccount,
        destinationAccount: oldPayment.destinationAccount,
        guidSource: oldPayment.guidSource,
        guidDestination: oldPayment.guidDestination,
        activeStatus: oldPayment.activeStatus,

        // Send actual values for fields being updated, or use current values to preserve them
        transactionDate:
          newPayment.transactionDate &&
          new Date(newPayment.transactionDate).toDateString() !==
            new Date(oldPayment.transactionDate).toDateString()
            ? new Date(newPayment.transactionDate).toISOString().split("T")[0]
            : new Date(oldPayment.transactionDate).toISOString().split("T")[0], // Current date to preserve

        amount:
          newPayment.amount !== undefined &&
          Number(newPayment.amount) !== Number(oldPayment.amount)
            ? Number(newPayment.amount)
            : Number(oldPayment.amount), // Current amount to preserve
      }),
    });

    console.log(
      `Payment update response status: ${response.status} ${response.statusText}`,
    );

    if (response.status === 404) {
      console.log("Resource not found (404).");
      return newPayment; // Return fallback data for 404
    }

    if (!response.ok) {
      const errorBody = await response.text();
      console.log(
        `Payment update failed - Status: ${response.status}, StatusText: ${response.statusText}, Body: ${errorBody}`,
      );

      if (response.status === 409) {
        throw new Error(
          `A payment with the same account, date, and amount already exists. Please use a different date or amount.`,
        );
      }

      throw new Error(
        `Failed to update payment state: ${response.statusText} (Status: ${response.status})`,
      );
    }

    return await response.json();
  } catch (error: any) {
    console.log(`An error occurred: ${error.message}`);
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
      console.log(`Error occurred during mutation: ${error.message}`);
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
        console.log(
          `Payment cascade to transactions failed (non-fatal): ${
            e?.message ?? e
          }`,
        );
      }
    },
  });
}
