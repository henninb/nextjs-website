import { useMutation, useQueryClient } from "@tanstack/react-query";
import { graphqlRequest } from "../utils/graphqlClient";
import Description from "../model/Description";
import { createHookLogger } from "../utils/logger";

const log = createHookLogger("useDescriptionDeleteGql");

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
      log.debug("Starting mutation", {
        descriptionName: description.descriptionName,
      });
      const data = await graphqlRequest<DeleteDescriptionResult>({
        query: DELETE_DESCRIPTION_MUTATION,
        variables: { descriptionName: description.descriptionName },
      });
      log.debug("Mutation successful");
      return {
        ok: data.deleteDescription,
        descriptionName: description.descriptionName,
      };
    },
    onSuccess: (_res, description) => {
      log.debug("Delete successful", {
        descriptionName: description.descriptionName,
      });
      const key = ["descriptionGQL"];
      const old = queryClient.getQueryData<Description[]>(key) || [];
      queryClient.setQueryData(
        key,
        old.filter((x) => x.descriptionName !== description.descriptionName),
      );
    },
    onError: (error) => {
      log.error("Delete failed", error);
    },
  });
}
