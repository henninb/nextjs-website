import { useMutation, useQueryClient } from "@tanstack/react-query";
import { graphqlRequest } from "../utils/graphqlClient";
import Description from "../model/Description";
import { createHookLogger } from "../utils/logger";

const log = createHookLogger("useDescriptionUpdateGql");

type UpdateDescriptionResult = {
  updateDescription: {
    descriptionId: number;
    descriptionName: string;
    activeStatus: boolean;
    descriptionCount?: number | null;
    dateAdded?: string | null;
    dateUpdated?: string | null;
  };
};

const UPDATE_DESCRIPTION_MUTATION = /* GraphQL */ `
  mutation UpdateDescription(
    $description: DescriptionInput!
    $oldDescriptionName: String
  ) {
    updateDescription(
      description: $description
      oldDescriptionName: $oldDescriptionName
    ) {
      descriptionId
      descriptionName
      activeStatus
      descriptionCount
      dateAdded
      dateUpdated
    }
  }
`;

export default function useDescriptionUpdateGql() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["descriptionUpdateGQL"],
    mutationFn: async ({
      oldDescription,
      newDescription,
    }: {
      oldDescription: Description;
      newDescription: Description;
    }) => {
      // Normalize description name for GraphQL backend:
      // - Remove spaces (backend doesn't allow spaces)
      // - Convert to lowercase (backend auto-converts anyway)
      const normalizedName = newDescription.descriptionName
        .replace(/\s+/g, "")
        .toLowerCase()
        .trim();

      const normalizedOldName = oldDescription.descriptionName
        .replace(/\s+/g, "")
        .toLowerCase()
        .trim();

      // Check if this is a rename operation
      const isRename = normalizedOldName !== normalizedName;

      log.debug("Starting mutation", {
        descriptionId: oldDescription.descriptionId,
        isRename,
      });

      const description = {
        descriptionId:
          newDescription.descriptionId || oldDescription.descriptionId,
        descriptionName: normalizedName,
        activeStatus: newDescription.activeStatus,
      };

      const data = await graphqlRequest<UpdateDescriptionResult>({
        query: UPDATE_DESCRIPTION_MUTATION,
        variables: {
          description,
          oldDescriptionName: isRename ? normalizedOldName : null,
        },
      });
      const t = data.updateDescription;
      const mapped: Description = {
        descriptionId: t.descriptionId,
        descriptionName: t.descriptionName,
        activeStatus: !!t.activeStatus,
        descriptionCount: t.descriptionCount ?? undefined,
        dateAdded: t.dateAdded ? new Date(t.dateAdded) : undefined,
        dateUpdated: t.dateUpdated ? new Date(t.dateUpdated) : undefined,
      };
      log.debug("Mutation successful", {
        descriptionId: mapped.descriptionId,
      });
      return mapped;
    },
    onSuccess: (updatedDescription) => {
      log.debug("Update successful", {
        descriptionId: updatedDescription.descriptionId,
      });
      const key = ["descriptionGQL"];
      const old = queryClient.getQueryData<Description[]>(key);
      if (old) {
        queryClient.setQueryData(
          key,
          old.map((d) =>
            d.descriptionId === updatedDescription.descriptionId
              ? { ...d, ...updatedDescription }
              : d,
          ),
        );
      }
    },
    onError: (error) => {
      log.error("Update failed", error);
    },
  });
}
