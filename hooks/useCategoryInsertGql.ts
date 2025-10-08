import { useMutation, useQueryClient } from "@tanstack/react-query";
import { graphqlRequest } from "../utils/graphqlClient";
import Category from "../model/Category";

type CreateCategoryResult = {
  createCategory: {
    categoryId: number;
    categoryName: string;
    activeStatus: boolean;
    categoryCount?: number | null;
    dateAdded?: string | null;
    dateUpdated?: string | null;
  };
};

const CREATE_CATEGORY_MUTATION = /* GraphQL */ `
  mutation CreateCategory($category: CategoryInput!) {
    createCategory(category: $category) {
      categoryId
      categoryName
      activeStatus
      categoryCount
      dateAdded
      dateUpdated
    }
  }
`;

export default function useCategoryInsertGql() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["insertCategoryGQL"],
    mutationFn: async (variables: { category: Category }) => {
      const c = variables.category;
      const category = {
        categoryName: c.categoryName,
        activeStatus: c.activeStatus,
      };
      const data = await graphqlRequest<CreateCategoryResult>({
        query: CREATE_CATEGORY_MUTATION,
        variables: { category },
      });
      const t = data.createCategory;
      const mapped: Category = {
        categoryId: t.categoryId,
        categoryName: t.categoryName,
        activeStatus: !!t.activeStatus,
        categoryCount: t.categoryCount ?? undefined,
        dateAdded: t.dateAdded ? new Date(t.dateAdded) : undefined,
        dateUpdated: t.dateUpdated ? new Date(t.dateUpdated) : undefined,
      };
      return mapped;
    },
    onSuccess: (newCategory) => {
      const key = ["categoryGQL"];
      const old = queryClient.getQueryData<Category[]>(key) || [];
      queryClient.setQueryData(key, [newCategory, ...old]);
    },
  });
}
