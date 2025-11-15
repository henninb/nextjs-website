import { graphqlRequest } from "../utils/graphqlClient";
import Parameter from "../model/Parameter";
import { usePublicQuery } from "../utils/queryConfig";
import { createHookLogger } from "../utils/logger";

const log = createHookLogger("useParameterFetchGql");

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
  const queryResult = usePublicQuery(
    ["parameterGQL"],
    async () => {
      log.debug("Starting GraphQL query");
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
      log.debug("Query successful", { count: mapped.length });
      return mapped;
    },
  );

  if (queryResult.isError) {
    log.error("Query failed", queryResult.error);
  }

  return queryResult;
}
