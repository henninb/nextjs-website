import { useMutation, useQueryClient } from "@tanstack/react-query";
import { graphqlRequest } from "../utils/graphqlClient";
import Category from "../model/Category";

type UpdateCategoryResult = {
  updateCategory: {
    categoryId: number;
    categoryName: string;
    activeStatus: boolean;
    categoryCount?: number | null;
    dateAdded?: string | null;
    dateUpdated?: string | null;
  };
};

const UPDATE_CATEGORY_MUTATION = /* GraphQL */ `
  mutation UpdateCategory($category: CategoryInput!, $oldCategoryName: String) {
    updateCategory(category: $category, oldCategoryName: $oldCategoryName) {
      categoryId
      categoryName
      activeStatus
      categoryCount
      dateAdded
      dateUpdated
    }
  }
`;

export default function useCategoryUpdateGql() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["categoryUpdateGQL"],
    mutationFn: async ({
      oldCategory,
      newCategory,
    }: {
      oldCategory: Category;
      newCategory: Category;
    }) => {
      // Normalize category name for GraphQL backend:
      // - Remove spaces (backend doesn't allow spaces)
      // - Convert to lowercase (backend auto-converts anyway)
      const normalizedName = newCategory.categoryName
        .replace(/\s+/g, "")
        .toLowerCase()
        .trim();

      const normalizedOldName = oldCategory.categoryName
        .replace(/\s+/g, "")
        .toLowerCase()
        .trim();

      // Check if this is a rename operation
      const isRename = normalizedOldName !== normalizedName;

      const category = {
        categoryId: newCategory.categoryId || oldCategory.categoryId,
        categoryName: normalizedName,
        activeStatus: newCategory.activeStatus,
      };

      const data = await graphqlRequest<UpdateCategoryResult>({
        query: UPDATE_CATEGORY_MUTATION,
        variables: {
          category,
          oldCategoryName: isRename ? normalizedOldName : null,
        },
      });
      const t = data.updateCategory;
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
    onSuccess: (updatedCategory) => {
      const key = ["categoryGQL"];
      const old = queryClient.getQueryData<Category[]>(key);
      if (old) {
        queryClient.setQueryData(
          key,
          old.map((c) =>
            c.categoryId === updatedCategory.categoryId
              ? { ...c, ...updatedCategory }
              : c,
          ),
        );
      }
    },
  });
}
