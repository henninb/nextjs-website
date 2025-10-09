import { useQuery } from "@tanstack/react-query";
import { graphqlRequest } from "../utils/graphqlClient";
import Description from "../model/Description";
import { useAuth } from "../components/AuthProvider";

type DescriptionsQueryResult = {
  descriptions: {
    descriptionId: number;
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
      descriptionName
      activeStatus
      descriptionCount
      dateAdded
      dateUpdated
    }
  }
`;

export default function useDescriptionFetchGql() {
  const { isAuthenticated, loading } = useAuth();

  return useQuery<Description[], Error>({
    queryKey: ["descriptionGQL"],
    queryFn: async () => {
      const data = await graphqlRequest<DescriptionsQueryResult>({
        query: DESCRIPTIONS_QUERY,
      });
      const mapped: Description[] = (data.descriptions || []).map((d) => ({
        descriptionId: d.descriptionId,
        descriptionName: d.descriptionName,
        activeStatus: !!d.activeStatus,
        descriptionCount: d.descriptionCount ?? undefined,
        dateAdded: d.dateAdded ? new Date(d.dateAdded) : undefined,
        dateUpdated: d.dateUpdated ? new Date(d.dateUpdated) : undefined,
      }));
      return mapped;
    },
    enabled: !loading && isAuthenticated,
  });
}
