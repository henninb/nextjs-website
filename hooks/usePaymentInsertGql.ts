import { useMutation, useQueryClient } from "@tanstack/react-query";
import { graphqlRequest } from "../utils/graphqlClient";
import Payment from "../model/Payment";
import { createHookLogger } from "../utils/logger";
import { useAuth } from "../components/AuthProvider";

const log = createHookLogger("usePaymentInsertGql");

type CreatePaymentResult = {
  createPayment: {
    paymentId: number;
    owner?: string | null;
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

const CREATE_PAYMENT_MUTATION = /* GraphQL */ `
  mutation CreatePayment($payment: PaymentInput!) {
    createPayment(payment: $payment) {
      paymentId
      owner
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
  const { user } = useAuth();

  return useMutation({
    mutationKey: ["insertPaymentGQL"],
    mutationFn: async (variables: { payload: Payment }) => {
      const p = variables.payload;
      log.debug("Starting mutation", {
        sourceAccount: p.sourceAccount,
        destinationAccount: p.destinationAccount,
        amount: p.amount,
      });

      // Convert date to LocalDate format (YYYY-MM-DD) for backend compatibility
      const dateToLocalDate = (date: Date | string): string => {
        const d = date instanceof Date ? date : new Date(date);
        return d.toISOString().split("T")[0];
      };

      const payment = {
        sourceAccount: p.sourceAccount,
        destinationAccount: p.destinationAccount,
        transactionDate: dateToLocalDate(p.transactionDate),
        amount: p.amount,
        activeStatus: p.activeStatus,
        owner: user?.username || "",
      };

      console.log(
        "[usePaymentInsertGql] GraphQL payment payload:",
        JSON.stringify(payment),
      );
      const data = await graphqlRequest<CreatePaymentResult>({
        query: CREATE_PAYMENT_MUTATION,
        variables: { payment },
      });
      const t = data.createPayment;
      const mapped: Payment = {
        paymentId: t.paymentId,
        owner: t.owner ?? undefined,
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
    onSuccess: (newPayment) => {
      log.debug("Insert successful", { paymentId: newPayment.paymentId });
      const key = ["paymentGQL"];
      const old = queryClient.getQueryData<Payment[]>(key) || [];
      queryClient.setQueryData(key, [newPayment, ...old]);
    },
    onError: (error) => {
      log.error("Insert failed", error);
    },
  });
}
