import { useMutation, useQueryClient } from "@tanstack/react-query";
import { graphqlRequest } from "../utils/graphqlClient";
import Parameter from "../model/Parameter";

type CreateParameterResult = {
  createParameter: {
    parameterId: number;
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

  return useMutation({
    mutationKey: ["insertParameterGQL"],
    mutationFn: async (variables: { payload: Parameter }) => {
      const p = variables.payload;
      const parameter = {
        parameterName: p.parameterName,
        parameterValue: p.parameterValue,
        activeStatus: p.activeStatus ?? true,
      };
      const data = await graphqlRequest<CreateParameterResult>({
        query: CREATE_PARAMETER_MUTATION,
        variables: { parameter },
      });
      const t = data.createParameter;
      const mapped: Parameter = {
        parameterId: t.parameterId,
        parameterName: t.parameterName,
        parameterValue: t.parameterValue,
        activeStatus: !!t.activeStatus,
        dateAdded: t.dateAdded ? new Date(t.dateAdded) : undefined,
        dateUpdated: t.dateUpdated ? new Date(t.dateUpdated) : undefined,
      };
      return mapped;
    },
    onSuccess: (newParameter) => {
      const key = ["parameterGQL"];
      const old = queryClient.getQueryData<Parameter[]>(key) || [];
      queryClient.setQueryData(key, [newParameter, ...old]);
    },
  });
}
