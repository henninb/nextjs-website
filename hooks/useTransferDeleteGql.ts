import { useMutation, useQueryClient } from "@tanstack/react-query";
import { graphqlRequest } from "../utils/graphqlClient";
import Transfer from "../model/Transfer";
import { createHookLogger } from "../utils/logger";

const log = createHookLogger("useTransferDeleteGql");

type DeleteTransferResult = {
  deleteTransfer: boolean;
};

const DELETE_TRANSFER_MUTATION = /* GraphQL */ `
  mutation DeleteTransfer($id: ID!) {
    deleteTransfer(id: $id)
  }
`;

export default function useTransferDeleteGql() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["deleteTransferGQL"],
    mutationFn: async (variables: { oldRow: Transfer }) => {
      const t = variables.oldRow;
      log.debug("Starting mutation", { transferId: t.transferId });
      const data = await graphqlRequest<DeleteTransferResult>({
        query: DELETE_TRANSFER_MUTATION,
        variables: { id: t.transferId },
      });
      log.debug("Mutation successful");
      return { ok: data.deleteTransfer ?? true, id: t.transferId };
    },
    onSuccess: (_res, variables) => {
      log.debug("Delete successful", {
        transferId: variables.oldRow.transferId,
      });
      const key = ["transferGQL"];
      const old = queryClient.getQueryData<Transfer[]>(key) || [];
      queryClient.setQueryData(
        key,
        old.filter((x) => x.transferId !== variables.oldRow.transferId),
      );
    },
    onError: (error) => {
      log.error("Delete failed", error);
    },
  });
}
