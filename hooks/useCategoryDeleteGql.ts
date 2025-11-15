import { useMutation, useQueryClient } from "@tanstack/react-query";
import { graphqlRequest } from "../utils/graphqlClient";
import Category from "../model/Category";
import { createHookLogger } from "../utils/logger";

const log = createHookLogger("useCategoryDeleteGql");

type DeleteCategoryResult = {
  deleteCategory: boolean;
};

const DELETE_CATEGORY_MUTATION = /* GraphQL */ `
  mutation DeleteCategory($categoryName: String!) {
    deleteCategory(categoryName: $categoryName)
  }
`;

export default function useCategoryDeleteGql() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["deleteCategoryGQL"],
    mutationFn: async (category: Category) => {
      log.debug("Starting mutation", { categoryName: category.categoryName });
      const data = await graphqlRequest<DeleteCategoryResult>({
        query: DELETE_CATEGORY_MUTATION,
        variables: { categoryName: category.categoryName },
      });
      log.debug("Mutation successful");
      return {
        ok: data.deleteCategory,
        categoryName: category.categoryName,
      };
    },
    onSuccess: (_res, category) => {
      log.debug("Delete successful", { categoryName: category.categoryName });
      const key = ["categoryGQL"];
      const old = queryClient.getQueryData<Category[]>(key) || [];
      queryClient.setQueryData(
        key,
        old.filter((x) => x.categoryName !== category.categoryName),
      );
    },
    onError: (error) => {
      log.error("Delete failed", error);
    },
  });
}
