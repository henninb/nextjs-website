import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FamilyMember, FamilyMemberCreateRequest } from "../model/FamilyMember";

export default function useFamilyMemberInsert() {
  const queryClient = useQueryClient();

  return useMutation<
    FamilyMember,
    Error,
    { payload: FamilyMemberCreateRequest }
  >({
    mutationFn: async ({ payload }) => {
      const response = await fetch("/api/family-members", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Failed to create family member");
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate family members queries to refresh the list
      queryClient.invalidateQueries({ queryKey: ["familyMembers"] });
    },
  });
}
