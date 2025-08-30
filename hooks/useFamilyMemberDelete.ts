import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FamilyMember } from "../model/FamilyMember";

export default function useFamilyMemberDelete() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { oldRow: FamilyMember }>({
    mutationFn: async ({ oldRow }) => {
      const response = await fetch(
        `/api/family-members/${oldRow.familyMemberId}`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) {
        throw new Error("Failed to delete family member");
      }
    },
    onSuccess: () => {
      // Invalidate family members queries to refresh the list
      queryClient.invalidateQueries({ queryKey: ["familyMembers"] });
    },
  });
}
