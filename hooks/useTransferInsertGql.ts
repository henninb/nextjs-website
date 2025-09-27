import { useMutation, useQueryClient } from "@tanstack/react-query";
import { graphqlRequest } from "../utils/graphqlClient";
import Transfer from "../model/Transfer";
import { generateSecureUUID, isValidUUID } from "../utils/security/secureUUID";

type InsertTransferResult = {
  insertTransfer: {
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

const INSERT_TRANSFER_MUTATION = /* GraphQL */ `
  mutation InsertTransfer($input: TransferInput!) {
    insertTransfer(input: $input) {
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

      // Ensure guidSource and guidDestination are valid UUIDs
      let guidSource: string | null = null;
      let guidDestination: string | null = null;

      if (p.guidSource && isValidUUID(p.guidSource)) {
        guidSource = p.guidSource;
      } else if (p.guidSource) {
        guidSource = await generateSecureUUID();
      } else {
        guidSource = await generateSecureUUID();
      }

      if (p.guidDestination && isValidUUID(p.guidDestination)) {
        guidDestination = p.guidDestination;
      } else if (p.guidDestination) {
        guidDestination = await generateSecureUUID();
      } else {
        guidDestination = await generateSecureUUID();
      }

      const input = {
        sourceAccount: p.sourceAccount,
        destinationAccount: p.destinationAccount,
        transactionDate:
          p.transactionDate instanceof Date
            ? p.transactionDate.toISOString()
            : new Date(p.transactionDate).toISOString(),
        amount: p.amount,
        guidSource,
        guidDestination,
        activeStatus: p.activeStatus,
      };
      const data = await graphqlRequest<InsertTransferResult>({
        query: INSERT_TRANSFER_MUTATION,
        variables: { input },
      });
      const t = data.insertTransfer;
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
