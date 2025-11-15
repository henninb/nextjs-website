import { graphqlRequest } from "../utils/graphqlClient";
import Category from "../model/Category";
import { useAuthenticatedQuery } from "../utils/queryConfig";
import { createHookLogger } from "../utils/logger";

const log = createHookLogger("useCategoryFetchGql");

type CategoriesQueryResult = {
  categories: {
    categoryId: number;
    categoryName: string;
    activeStatus: boolean;
    categoryCount?: number | null;
    dateAdded?: string | null;
    dateUpdated?: string | null;
  }[];
};

const CATEGORIES_QUERY = /* GraphQL */ `
  query Categories {
    categories {
      categoryId
      categoryName
      activeStatus
      categoryCount
      dateAdded
      dateUpdated
    }
  }
`;

export default function useCategoryFetchGql() {
  const queryResult = useAuthenticatedQuery(
    ["categoryGQL"],
    async () => {
      log.debug("Starting GraphQL query");
      const data = await graphqlRequest<CategoriesQueryResult>({
        query: CATEGORIES_QUERY,
      });
      const mapped: Category[] = (data.categories || []).map((c) => ({
        categoryId: c.categoryId,
        categoryName: c.categoryName,
        activeStatus: !!c.activeStatus,
        categoryCount: c.categoryCount ?? undefined,
        dateAdded: c.dateAdded ? new Date(c.dateAdded) : undefined,
        dateUpdated: c.dateUpdated ? new Date(c.dateUpdated) : undefined,
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
