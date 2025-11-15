import { useMutation, useQueryClient } from "@tanstack/react-query";
import { graphqlRequest } from "../utils/graphqlClient";
import Parameter from "../model/Parameter";
import { createHookLogger } from "../utils/logger";

const log = createHookLogger("useParameterUpdateGql");

type UpdateParameterResult = {
  updateParameter: {
    parameterId: number;
    parameterName: string;
    parameterValue: string;
    activeStatus: boolean;
    dateAdded?: string | null;
    dateUpdated?: string | null;
  };
};

const UPDATE_PARAMETER_MUTATION = /* GraphQL */ `
  mutation UpdateParameter($parameter: ParameterInput!) {
    updateParameter(parameter: $parameter) {
      parameterId
      parameterName
      parameterValue
      activeStatus
      dateAdded
      dateUpdated
    }
  }
`;

export default function useParameterUpdateGql() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["parameterUpdateGQL"],
    mutationFn: async ({
      oldParameter,
      newParameter,
    }: {
      oldParameter: Parameter;
      newParameter: Parameter;
    }) => {
      log.debug("Starting mutation", { parameterId: oldParameter.parameterId });
      const parameter = {
        parameterId: oldParameter.parameterId,
        parameterName: newParameter.parameterName,
        parameterValue: newParameter.parameterValue,
        activeStatus: newParameter.activeStatus,
      };
      const data = await graphqlRequest<UpdateParameterResult>({
        query: UPDATE_PARAMETER_MUTATION,
        variables: { parameter },
      });
      const t = data.updateParameter;
      const mapped: Parameter = {
        parameterId: t.parameterId,
        parameterName: t.parameterName,
        parameterValue: t.parameterValue,
        activeStatus: !!t.activeStatus,
        dateAdded: t.dateAdded ? new Date(t.dateAdded) : undefined,
        dateUpdated: t.dateUpdated ? new Date(t.dateUpdated) : undefined,
      };
      log.debug("Mutation successful", { parameterId: mapped.parameterId });
      return mapped;
    },
    onSuccess: (updatedParameter) => {
      log.debug("Update successful", { parameterId: updatedParameter.parameterId });
      const key = ["parameterGQL"];
      const old = queryClient.getQueryData<Parameter[]>(key);
      if (old) {
        queryClient.setQueryData(
          key,
          old.map((p) =>
            p.parameterId === updatedParameter.parameterId
              ? { ...p, ...updatedParameter }
              : p,
          ),
        );
      }
    },
    onError: (error) => {
      log.error("Update failed", error);
    },
  });
}
