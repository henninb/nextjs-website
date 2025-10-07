import { useQuery } from "@tanstack/react-query";
import { graphqlRequest } from "../utils/graphqlClient";
import Parameter from "../model/Parameter";

type ParametersQueryResult = {
  parameters: {
    parameterId: number;
    parameterName: string;
    parameterValue: string;
    activeStatus: boolean;
    dateAdded?: string | null;
    dateUpdated?: string | null;
  }[];
};

const PARAMETERS_QUERY = /* GraphQL */ `
  query Parameters {
    parameters {
      parameterId
      parameterName
      parameterValue
      activeStatus
      dateAdded
      dateUpdated
    }
  }
`;

export default function useParameterFetchGql() {
  return useQuery<Parameter[], Error>({
    queryKey: ["parameterGQL"],
    queryFn: async () => {
      const data = await graphqlRequest<ParametersQueryResult>({
        query: PARAMETERS_QUERY,
      });
      const mapped: Parameter[] = (data.parameters || []).map((p) => ({
        parameterId: p.parameterId,
        parameterName: p.parameterName,
        parameterValue: p.parameterValue,
        activeStatus: !!p.activeStatus,
        dateAdded: p.dateAdded ? new Date(p.dateAdded) : undefined,
        dateUpdated: p.dateUpdated ? new Date(p.dateUpdated) : undefined,
      }));
      return mapped;
    },
  });
}
