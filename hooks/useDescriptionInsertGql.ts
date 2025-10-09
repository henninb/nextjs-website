import { useMutation, useQueryClient } from "@tanstack/react-query";
import { graphqlRequest } from "../utils/graphqlClient";
import Description from "../model/Description";

type CreateDescriptionResult = {
  createDescription: {
    descriptionId: number;
    descriptionName: string;
    activeStatus: boolean;
    descriptionCount?: number | null;
    dateAdded?: string | null;
    dateUpdated?: string | null;
  };
};

const CREATE_DESCRIPTION_MUTATION = /* GraphQL */ `
  mutation CreateDescription($description: DescriptionInput!) {
    createDescription(description: $description) {
      descriptionId
      descriptionName
      activeStatus
      descriptionCount
      dateAdded
      dateUpdated
    }
  }
`;

export default function useDescriptionInsertGql() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["insertDescriptionGQL"],
    mutationFn: async (variables: { description: Description }) => {
      const d = variables.description;
      // Normalize description name for GraphQL backend:
      // - Remove spaces (backend doesn't allow spaces)
      // - Convert to lowercase (backend auto-converts anyway)
      const normalizedName = d.descriptionName
        .replace(/\s+/g, "")
        .toLowerCase()
        .trim();

      const description = {
        descriptionName: normalizedName,
        activeStatus: d.activeStatus,
      };
      const data = await graphqlRequest<CreateDescriptionResult>({
        query: CREATE_DESCRIPTION_MUTATION,
        variables: { description },
      });
      const t = data.createDescription;
      const mapped: Description = {
        descriptionId: t.descriptionId,
        descriptionName: t.descriptionName,
        activeStatus: !!t.activeStatus,
        descriptionCount: t.descriptionCount ?? undefined,
        dateAdded: t.dateAdded ? new Date(t.dateAdded) : undefined,
        dateUpdated: t.dateUpdated ? new Date(t.dateUpdated) : undefined,
      };
      return mapped;
    },
    onSuccess: (newDescription) => {
      const key = ["descriptionGQL"];
      const old = queryClient.getQueryData<Description[]>(key) || [];
      queryClient.setQueryData(key, [newDescription, ...old]);
    },
  });
}
