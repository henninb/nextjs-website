import { useMutation, useQueryClient } from "@tanstack/react-query";
import { graphqlRequest } from "../utils/graphqlClient";
import Transfer from "../model/Transfer";

type DeleteTransferResult = {
  deleteTransfer: {
    success: boolean;
    transferId?: number | null;
  };
};

const DELETE_TRANSFER_MUTATION = /* GraphQL */ `
  mutation DeleteTransfer($id: ID!) {
    deleteTransfer(id: $id) {
      success
      transferId
    }
  }
`;

export default function useTransferDeleteGql() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["deleteTransferGQL"],
    mutationFn: async (variables: { oldRow: Transfer }) => {
      const t = variables.oldRow;
      const data = await graphqlRequest<DeleteTransferResult>({
        query: DELETE_TRANSFER_MUTATION,
        variables: { id: t.transferId },
      });
      return { ok: data.deleteTransfer?.success ?? true, id: t.transferId };
    },
    onSuccess: (_res, variables) => {
      const key = ["transferGQL"];
      const old = queryClient.getQueryData<Transfer[]>(key) || [];
      queryClient.setQueryData(
        key,
        old.filter((x) => x.transferId !== variables.oldRow.transferId),
      );
    },
  });
}

