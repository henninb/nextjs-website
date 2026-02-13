import { useMutation, useQueryClient } from "@tanstack/react-query";
import { graphqlRequest } from "../utils/graphqlClient";
import Parameter from "../model/Parameter";
import { createHookLogger } from "../utils/logger";
import { useAuth } from "../components/AuthProvider";

const log = createHookLogger("useParameterInsertGql");

type CreateParameterResult = {
  createParameter: {
    parameterId: number;
    owner?: string | null;
    parameterName: string;
    parameterValue: string;
    activeStatus: boolean;
    dateAdded?: string | null;
    dateUpdated?: string | null;
  };
};

const CREATE_PARAMETER_MUTATION = /* GraphQL */ `
  mutation CreateParameter($parameter: ParameterInput!) {
    createParameter(parameter: $parameter) {
      parameterId
      owner
      parameterName
      parameterValue
      activeStatus
      dateAdded
      dateUpdated
    }
  }
`;

export default function useParameterInsertGql() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationKey: ["insertParameterGQL"],
    mutationFn: async (variables: { payload: Parameter }) => {
      if (!user?.username) {
        throw new Error("User must be logged in to insert a parameter");
      }
      const p = variables.payload;
      log.debug("Starting mutation", { parameterName: p.parameterName });
      const parameter = {
        parameterName: p.parameterName,
        parameterValue: p.parameterValue,
        activeStatus: p.activeStatus ?? true,
        owner: user.username,
      };
      const data = await graphqlRequest<CreateParameterResult>({
        query: CREATE_PARAMETER_MUTATION,
        variables: { parameter },
      });
      const t = data.createParameter;
      const mapped: Parameter = {
        parameterId: t.parameterId,
        owner: t.owner ?? undefined,
        parameterName: t.parameterName,
        parameterValue: t.parameterValue,
        activeStatus: !!t.activeStatus,
        dateAdded: t.dateAdded ? new Date(t.dateAdded) : undefined,
        dateUpdated: t.dateUpdated ? new Date(t.dateUpdated) : undefined,
      };
      log.debug("Mutation successful", { parameterId: mapped.parameterId });
      return mapped;
    },
    onSuccess: (newParameter) => {
      log.debug("Insert successful", { parameterId: newParameter.parameterId });
      const key = ["parameterGQL"];
      const old = queryClient.getQueryData<Parameter[]>(key) || [];
      queryClient.setQueryData(key, [newParameter, ...old]);
    },
    onError: (error) => {
      log.error("Insert failed", error);
    },
  });
}
