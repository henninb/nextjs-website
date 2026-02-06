import { useMutation, useQueryClient } from "@tanstack/react-query";
import { graphqlRequest } from "../utils/graphqlClient";
import Description from "../model/Description";
import { createHookLogger } from "../utils/logger";
import { useAuth } from "../components/AuthProvider";

const log = createHookLogger("useDescriptionInsertGql");

type CreateDescriptionResult = {
  createDescription: {
    descriptionId: number;
    owner?: string | null;
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
      owner
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
  const { user } = useAuth();

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

      log.debug("Starting mutation", { descriptionName: normalizedName });
      const description = {
        descriptionName: normalizedName,
        activeStatus: d.activeStatus,
        owner: user?.username || "",
      };
      const data = await graphqlRequest<CreateDescriptionResult>({
        query: CREATE_DESCRIPTION_MUTATION,
        variables: { description },
      });
      const t = data.createDescription;
      const mapped: Description = {
        descriptionId: t.descriptionId,
        owner: t.owner ?? undefined,
        descriptionName: t.descriptionName,
        activeStatus: !!t.activeStatus,
        descriptionCount: t.descriptionCount ?? undefined,
        dateAdded: t.dateAdded ? new Date(t.dateAdded) : undefined,
        dateUpdated: t.dateUpdated ? new Date(t.dateUpdated) : undefined,
      };
      log.debug("Mutation successful", { descriptionId: mapped.descriptionId });
      return mapped;
    },
    onSuccess: (newDescription) => {
      log.debug("Insert successful", {
        descriptionId: newDescription.descriptionId,
      });
      const key = ["descriptionGQL"];
      const old = queryClient.getQueryData<Description[]>(key) || [];
      queryClient.setQueryData(key, [newDescription, ...old]);
    },
    onError: (error) => {
      log.error("Insert failed", error);
    },
  });
}
