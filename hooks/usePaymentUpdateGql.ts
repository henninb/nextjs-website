import { useMutation, useQueryClient } from "@tanstack/react-query";
import { graphqlRequest } from "../utils/graphqlClient";
import Payment from "../model/Payment";
import { createHookLogger } from "../utils/logger";

const log = createHookLogger("usePaymentUpdateGql");

type UpdatePaymentResult = {
  updatePayment: {
    paymentId: number;
    sourceAccount: string;
    destinationAccount: string;
    transactionDate: string;
    amount: number;
    guidSource?: string | null;
    guidDestination?: string | null;
    activeStatus: boolean;
    dateAdded?: string | null;
    dateUpdated?: string | null;
  };
};

const UPDATE_PAYMENT_MUTATION = /* GraphQL */ `
  mutation UpdatePayment($id: ID!, $payment: PaymentInput!) {
    updatePayment(id: $id, payment: $payment) {
      paymentId
      sourceAccount
      destinationAccount
      transactionDate
      amount
      guidSource
      guidDestination
      activeStatus
      dateAdded
      dateUpdated
    }
  }
`;

export default function usePaymentUpdateGql() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["paymentUpdateGQL"],
    mutationFn: async ({
      oldPayment,
      newPayment,
    }: {
      oldPayment: Payment;
      newPayment: Payment;
    }) => {
      log.debug("Starting mutation", { paymentId: oldPayment.paymentId });

      // Convert date to LocalDate format (YYYY-MM-DD) for backend compatibility
      const dateToLocalDate = (date: Date | string): string => {
        const d = date instanceof Date ? date : new Date(date);
        return d.toISOString().split("T")[0];
      };

      const input = {
        sourceAccount: newPayment.sourceAccount,
        destinationAccount: newPayment.destinationAccount,
        transactionDate: dateToLocalDate(newPayment.transactionDate),
        amount: newPayment.amount,
        activeStatus: newPayment.activeStatus,
      };

      console.log("[usePaymentUpdateGql] GraphQL payment update payload:", JSON.stringify(input));
      const data = await graphqlRequest<UpdatePaymentResult>({
        query: UPDATE_PAYMENT_MUTATION,
        variables: { id: oldPayment.paymentId, payment: input },
      });
      const t = data.updatePayment;
      const mapped: Payment = {
        paymentId: t.paymentId,
        sourceAccount: t.sourceAccount,
        destinationAccount: t.destinationAccount,
        transactionDate: new Date(t.transactionDate),
        amount: t.amount,
        guidSource: t.guidSource ?? undefined,
        guidDestination: t.guidDestination ?? undefined,
        activeStatus: !!t.activeStatus,
        dateAdded: t.dateAdded ? new Date(t.dateAdded) : undefined,
        dateUpdated: t.dateUpdated ? new Date(t.dateUpdated) : undefined,
      };
      log.debug("Mutation successful", { paymentId: mapped.paymentId });
      return mapped;
    },
    onSuccess: (updatedPayment) => {
      log.debug("Update successful", { paymentId: updatedPayment.paymentId });
      const key = ["paymentGQL"];
      const old = queryClient.getQueryData<Payment[]>(key);
      if (old) {
        queryClient.setQueryData(
          key,
          old.map((p) =>
            p.paymentId === updatedPayment.paymentId
              ? { ...p, ...updatedPayment }
              : p,
          ),
        );
      }
    },
    onError: (error) => {
      log.error("Update failed", error);
    },
  });
}
