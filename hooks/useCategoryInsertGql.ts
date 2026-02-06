import { useMutation, useQueryClient } from "@tanstack/react-query";
import { graphqlRequest } from "../utils/graphqlClient";
import Category from "../model/Category";
import { createHookLogger } from "../utils/logger";

const log = createHookLogger("useCategoryInsertGql");

type CreateCategoryResult = {
  createCategory: {
    categoryId: number;
    owner?: string | null;
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
      owner
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
      // Normalize category name for GraphQL backend:
      // - Remove spaces (backend doesn't allow spaces)
      // - Convert to lowercase (backend auto-converts anyway)
      const normalizedName = c.categoryName
        .replace(/\s+/g, "")
        .toLowerCase()
        .trim();

      log.debug("Starting mutation", { categoryName: normalizedName });
      const category = {
        categoryName: normalizedName,
        activeStatus: c.activeStatus,
      };
      const data = await graphqlRequest<CreateCategoryResult>({
        query: CREATE_CATEGORY_MUTATION,
        variables: { category },
      });
      const t = data.createCategory;
      const mapped: Category = {
        categoryId: t.categoryId,
        owner: t.owner ?? undefined,
        categoryName: t.categoryName,
        activeStatus: !!t.activeStatus,
        categoryCount: t.categoryCount ?? undefined,
        dateAdded: t.dateAdded ? new Date(t.dateAdded) : undefined,
        dateUpdated: t.dateUpdated ? new Date(t.dateUpdated) : undefined,
      };
      log.debug("Mutation successful", { categoryId: mapped.categoryId });
      return mapped;
    },
    onSuccess: (newCategory) => {
      log.debug("Insert successful", { categoryId: newCategory.categoryId });
      const key = ["categoryGQL"];
      const old = queryClient.getQueryData<Category[]>(key) || [];
      queryClient.setQueryData(key, [newCategory, ...old]);
    },
    onError: (error) => {
      log.error("Insert failed", error);
    },
  });
}
