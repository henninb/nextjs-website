import { useMutation, useQueryClient } from "@tanstack/react-query";
import { graphqlRequest } from "../utils/graphqlClient";
import Parameter from "../model/Parameter";
import { createHookLogger } from "../utils/logger";

const log = createHookLogger("useParameterDeleteGql");

type DeleteParameterResult = {
  deleteParameter: boolean;
};

const DELETE_PARAMETER_MUTATION = /* GraphQL */ `
  mutation DeleteParameter($parameterId: ID!) {
    deleteParameter(parameterId: $parameterId)
  }
`;

export default function useParameterDeleteGql() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["deleteParameterGQL"],
    mutationFn: async (variables: { oldRow: Parameter }) => {
      const p = variables.oldRow;
      log.debug("Starting mutation", { parameterId: p.parameterId });
      const data = await graphqlRequest<DeleteParameterResult>({
        query: DELETE_PARAMETER_MUTATION,
        variables: { parameterId: p.parameterId },
      });
      log.debug("Mutation successful");
      return { ok: data.deleteParameter, id: p.parameterId };
    },
    onSuccess: (_res, variables) => {
      log.debug("Delete successful", { parameterId: variables.oldRow.parameterId });
      const key = ["parameterGQL"];
      const old = queryClient.getQueryData<Parameter[]>(key) || [];
      queryClient.setQueryData(
        key,
        old.filter((x) => x.parameterId !== variables.oldRow.parameterId),
      );
    },
    onError: (error) => {
      log.error("Delete failed", error);
    },
  });
}
