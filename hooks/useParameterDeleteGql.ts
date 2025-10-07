import { useMutation, useQueryClient } from "@tanstack/react-query";
import { graphqlRequest } from "../utils/graphqlClient";
import Parameter from "../model/Parameter";

type DeleteParameterResult = {
  deleteParameter: {
    success: boolean;
    parameterId?: number | null;
  };
};

const DELETE_PARAMETER_MUTATION = /* GraphQL */ `
  mutation DeleteParameter($id: ID!) {
    deleteParameter(id: $id) {
      success
      parameterId
    }
  }
`;

export default function useParameterDeleteGql() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["deleteParameterGQL"],
    mutationFn: async (variables: { oldRow: Parameter }) => {
      const p = variables.oldRow;
      const data = await graphqlRequest<DeleteParameterResult>({
        query: DELETE_PARAMETER_MUTATION,
        variables: { id: p.parameterId },
      });
      return { ok: data.deleteParameter?.success ?? true, id: p.parameterId };
    },
    onSuccess: (_res, variables) => {
      const key = ["parameterGQL"];
      const old = queryClient.getQueryData<Parameter[]>(key) || [];
      queryClient.setQueryData(
        key,
        old.filter((x) => x.parameterId !== variables.oldRow.parameterId),
      );
    },
  });
}
