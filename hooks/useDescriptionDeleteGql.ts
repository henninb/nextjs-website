import { useMutation, useQueryClient } from "@tanstack/react-query";
import { graphqlRequest } from "../utils/graphqlClient";
import Description from "../model/Description";

type DeleteDescriptionResult = {
  deleteDescription: boolean;
};

const DELETE_DESCRIPTION_MUTATION = /* GraphQL */ `
  mutation DeleteDescription($descriptionName: String!) {
    deleteDescription(descriptionName: $descriptionName)
  }
`;

export default function useDescriptionDeleteGql() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["deleteDescriptionGQL"],
    mutationFn: async (description: Description) => {
      const data = await graphqlRequest<DeleteDescriptionResult>({
        query: DELETE_DESCRIPTION_MUTATION,
        variables: { descriptionName: description.descriptionName },
      });
      return {
        ok: data.deleteDescription,
        descriptionName: description.descriptionName,
      };
    },
    onSuccess: (_res, description) => {
      const key = ["descriptionGQL"];
      const old = queryClient.getQueryData<Description[]>(key) || [];
      queryClient.setQueryData(
        key,
        old.filter((x) => x.descriptionName !== description.descriptionName),
      );
    },
  });
}
