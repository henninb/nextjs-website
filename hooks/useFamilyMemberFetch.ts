import { useQuery } from "@tanstack/react-query";
import { FamilyMember } from "../model/FamilyMember";

export default function useFamilyMemberFetch() {
  return useQuery<FamilyMember[]>({
    queryKey: ["familyMembers"],
    queryFn: async () => {
      // TODO: Get current user dynamically from auth context
      // For now, using a placeholder endpoint
      const response = await fetch("/api/family-members/owner/current-user");

      if (!response.ok) {
        throw new Error("Failed to fetch family members");
      }

      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
  });
}
