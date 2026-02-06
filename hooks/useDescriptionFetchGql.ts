import { graphqlRequest } from "../utils/graphqlClient";
import Description from "../model/Description";
import { useAuthenticatedQuery } from "../utils/queryConfig";
import { createHookLogger } from "../utils/logger";

const log = createHookLogger("useDescriptionFetchGql");

type DescriptionsQueryResult = {
  descriptions: {
    descriptionId: number;
    owner?: string | null;
    descriptionName: string;
    activeStatus: boolean;
    descriptionCount?: number | null;
    dateAdded?: string | null;
    dateUpdated?: string | null;
  }[];
};

const DESCRIPTIONS_QUERY = /* GraphQL */ `
  query Descriptions {
    descriptions {
      descriptionId
      owner
      descriptionName
      activeStatus
      descriptionCount
      dateAdded
      dateUpdated
    }
  }
`;

export default function useDescriptionFetchGql() {
  const queryResult = useAuthenticatedQuery(["descriptionGQL"], async () => {
    log.debug("Starting GraphQL query");
    const data = await graphqlRequest<DescriptionsQueryResult>({
      query: DESCRIPTIONS_QUERY,
    });
    const mapped: Description[] = (data.descriptions || []).map((d) => ({
      descriptionId: d.descriptionId,
      owner: d.owner ?? undefined,
      descriptionName: d.descriptionName,
      activeStatus: !!d.activeStatus,
      descriptionCount: d.descriptionCount ?? undefined,
      dateAdded: d.dateAdded ? new Date(d.dateAdded) : undefined,
      dateUpdated: d.dateUpdated ? new Date(d.dateUpdated) : undefined,
    }));
    log.debug("Query successful", { count: mapped.length });
    return mapped;
  });

  if (queryResult.isError) {
    log.error("Query failed", queryResult.error);
  }

  return queryResult;
}
