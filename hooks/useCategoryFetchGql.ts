import { useQuery } from "@tanstack/react-query";
import { graphqlRequest } from "../utils/graphqlClient";
import Category from "../model/Category";
import { useAuth } from "../components/AuthProvider";

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
  const { isAuthenticated, loading } = useAuth();

  return useQuery<Category[], Error>({
    queryKey: ["categoryGQL"],
    queryFn: async () => {
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
      return mapped;
    },
    enabled: !loading && isAuthenticated,
  });
}
