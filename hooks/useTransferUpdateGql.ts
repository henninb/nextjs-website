import { useMutation, useQueryClient } from "@tanstack/react-query";
import { graphqlRequest } from "../utils/graphqlClient";
import Transfer from "../model/Transfer";
import { createHookLogger } from "../utils/logger";

const log = createHookLogger("useTransferUpdateGql");

type UpdateTransferResult = {
  updateTransfer: {
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

const UPDATE_TRANSFER_MUTATION = /* GraphQL */ `
  mutation UpdateTransfer($id: ID!, $transfer: TransferInput!) {
    updateTransfer(id: $id, transfer: $transfer) {
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

export default function useTransferUpdateGql() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["transferUpdateGQL"],
    mutationFn: async ({
      oldTransfer,
      newTransfer,
    }: {
      oldTransfer: Transfer;
      newTransfer: Transfer;
    }) => {
      log.debug("Starting mutation", { transferId: oldTransfer.transferId });
      const input = {
        sourceAccount: newTransfer.sourceAccount,
        destinationAccount: newTransfer.destinationAccount,
        transactionDate:
          newTransfer.transactionDate instanceof Date
            ? newTransfer.transactionDate.toISOString()
            : new Date(newTransfer.transactionDate).toISOString(),
        amount: newTransfer.amount,
        activeStatus: newTransfer.activeStatus,
      };
      const data = await graphqlRequest<UpdateTransferResult>({
        query: UPDATE_TRANSFER_MUTATION,
        variables: { id: oldTransfer.transferId, transfer: input },
      });
      const t = data.updateTransfer;
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
      log.debug("Mutation successful", { transferId: mapped.transferId });
      return mapped;
    },
    onSuccess: (updatedTransfer) => {
      log.debug("Update successful", { transferId: updatedTransfer.transferId });
      const key = ["transferGQL"];
      const old = queryClient.getQueryData<Transfer[]>(key);
      if (old) {
        queryClient.setQueryData(
          key,
          old.map((t) =>
            t.transferId === updatedTransfer.transferId
              ? { ...t, ...updatedTransfer }
              : t,
          ),
        );
      }
    },
    onError: (error) => {
      log.error("Update failed", error);
    },
  });
}
