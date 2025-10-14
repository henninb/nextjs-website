import { useMutation, useQueryClient } from "@tanstack/react-query";
import { graphqlRequest } from "../utils/graphqlClient";
import Payment from "../model/Payment";

type DeletePaymentResult = {
  deletePayment: boolean;
};

const DELETE_PAYMENT_MUTATION = /* GraphQL */ `
  mutation DeletePayment($id: ID!) {
    deletePayment(id: $id)
  }
`;

export default function usePaymentDeleteGql() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["deletePaymentGQL"],
    mutationFn: async (variables: { oldRow: Payment }) => {
      const p = variables.oldRow;
      const data = await graphqlRequest<DeletePaymentResult>({
        query: DELETE_PAYMENT_MUTATION,
        variables: { id: p.paymentId },
      });
      return { ok: data.deletePayment ?? true, id: p.paymentId };
    },
    onSuccess: (_res, variables) => {
      const key = ["paymentGQL"];
      const old = queryClient.getQueryData<Payment[]>(key) || [];
      queryClient.setQueryData(
        key,
        old.filter((x) => x.paymentId !== variables.oldRow.paymentId),
      );
    },
  });
}
