import { useMutation, useQueryClient } from "@tanstack/react-query";
import { graphqlRequest } from "../utils/graphqlClient";
import Transfer from "../model/Transfer";

type CreateTransferResult = {
  createTransfer: {
    transferId: number;
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

const CREATE_TRANSFER_MUTATION = /* GraphQL */ `
  mutation CreateTransfer($transfer: TransferInput!) {
    createTransfer(transfer: $transfer) {
      transferId
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

export default function useTransferInsertGql() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["insertTransferGQL"],
    mutationFn: async (variables: { payload: Transfer }) => {
      const p = variables.payload;
      const transfer = {
        sourceAccount: p.sourceAccount,
        destinationAccount: p.destinationAccount,
        transactionDate:
          p.transactionDate instanceof Date
            ? p.transactionDate.toISOString()
            : new Date(p.transactionDate).toISOString(),
        amount: p.amount,
        activeStatus: p.activeStatus,
      };
      const data = await graphqlRequest<CreateTransferResult>({
        query: CREATE_TRANSFER_MUTATION,
        variables: { transfer },
      });
      const t = data.createTransfer;
      const mapped: Transfer = {
        transferId: t.transferId,
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
    onSuccess: (newTransfer) => {
      // Keep GraphQL list in sync
      const key = ["transferGQL"];
      const old = queryClient.getQueryData<Transfer[]>(key) || [];
      queryClient.setQueryData(key, [newTransfer, ...old]);
    },
  });
}
