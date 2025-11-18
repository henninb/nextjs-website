import { useMutation, useQueryClient } from "@tanstack/react-query";
import { graphqlRequest } from "../utils/graphqlClient";
import Transfer from "../model/Transfer";
import { createHookLogger } from "../utils/logger";

const log = createHookLogger("useTransferInsertGql");

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

      const transfer = {
        sourceAccount: p.sourceAccount,
        destinationAccount: p.destinationAccount,
        transactionDate: dateToLocalDate(p.transactionDate),
        amount: p.amount,
        activeStatus: p.activeStatus,
      };

      console.log("[useTransferInsertGql] GraphQL transfer payload:", JSON.stringify(transfer));
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
      log.debug("Mutation successful", { transferId: mapped.transferId });
      return mapped;
    },
    onSuccess: (newTransfer) => {
      log.debug("Insert successful", { transferId: newTransfer.transferId });
      // Keep GraphQL list in sync
      const key = ["transferGQL"];
      const old = queryClient.getQueryData<Transfer[]>(key) || [];
      queryClient.setQueryData(key, [newTransfer, ...old]);
    },
    onError: (error) => {
      log.error("Insert failed", error);
    },
  });
}
