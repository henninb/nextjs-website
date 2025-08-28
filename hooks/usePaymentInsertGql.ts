import { useMutation, useQueryClient } from "@tanstack/react-query";
import { graphqlRequest } from "../utils/graphqlClient";
import Payment from "../model/Payment";

type InsertPaymentResult = {
  insertPayment: {
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

const INSERT_PAYMENT_MUTATION = /* GraphQL */ `
  mutation InsertPayment($input: PaymentInput!) {
    insertPayment(input: $input) {
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

export default function usePaymentInsertGql() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["insertPaymentGQL"],
    mutationFn: async (variables: { payload: Payment }) => {
      const p = variables.payload;
      const input = {
        sourceAccount: p.sourceAccount,
        destinationAccount: p.destinationAccount,
        transactionDate:
          p.transactionDate instanceof Date
            ? p.transactionDate.toISOString()
            : new Date(p.transactionDate).toISOString(),
        amount: p.amount,
        guidSource: p.guidSource ?? null,
        guidDestination: p.guidDestination ?? null,
        activeStatus: p.activeStatus,
      };
      const data = await graphqlRequest<InsertPaymentResult>({
        query: INSERT_PAYMENT_MUTATION,
        variables: { input },
      });
      const t = data.insertPayment;
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
    onSuccess: (newPayment) => {
      const key = ["paymentGQL"];
      const old = queryClient.getQueryData<Payment[]>(key) || [];
      queryClient.setQueryData(key, [newPayment, ...old]);
    },
  });
}
