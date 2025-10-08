import { useMutation, useQueryClient } from "@tanstack/react-query";
import { graphqlRequest } from "../utils/graphqlClient";
import Category from "../model/Category";

type DeleteCategoryResult = {
  deleteCategory: {
    success: boolean;
    categoryName?: string | null;
  };
};

const DELETE_CATEGORY_MUTATION = /* GraphQL */ `
  mutation DeleteCategory($categoryName: String!) {
    deleteCategory(categoryName: $categoryName) {
      success
      categoryName
    }
  }
`;

export default function useCategoryDeleteGql() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["deleteCategoryGQL"],
    mutationFn: async (category: Category) => {
      const data = await graphqlRequest<DeleteCategoryResult>({
        query: DELETE_CATEGORY_MUTATION,
        variables: { categoryName: category.categoryName },
      });
      return {
        ok: data.deleteCategory?.success ?? true,
        categoryName: category.categoryName,
      };
    },
    onSuccess: (_res, category) => {
      const key = ["categoryGQL"];
      const old = queryClient.getQueryData<Category[]>(key) || [];
      queryClient.setQueryData(
        key,
        old.filter((x) => x.categoryName !== category.categoryName),
      );
    },
  });
}
