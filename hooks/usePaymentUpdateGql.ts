import { useMutation, useQueryClient } from "@tanstack/react-query";
import { graphqlRequest } from "../utils/graphqlClient";
import Payment from "../model/Payment";

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
  mutation UpdatePayment($id: ID!, $input: PaymentUpdateInput!) {
    updatePayment(id: $id, input: $input) {
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
      const input = {
        sourceAccount: newPayment.sourceAccount,
        destinationAccount: newPayment.destinationAccount,
        transactionDate:
          newPayment.transactionDate instanceof Date
            ? newPayment.transactionDate.toISOString()
            : new Date(newPayment.transactionDate).toISOString(),
        amount: newPayment.amount,
        activeStatus: newPayment.activeStatus,
      };
      const data = await graphqlRequest<UpdatePaymentResult>({
        query: UPDATE_PAYMENT_MUTATION,
        variables: { id: oldPayment.paymentId, input },
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
      return mapped;
    },
    onSuccess: (updatedPayment) => {
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
  });
}
