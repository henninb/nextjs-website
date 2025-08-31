import { useQuery } from "@tanstack/react-query";
import { FamilyMember } from "../model/FamilyMember";
import { useAuth } from "../components/AuthProvider";

const fetchFamilyMembers = async (): Promise<FamilyMember[]> => {
  try {
    const response = await fetch("/api/family-members", {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        console.log("No family members found (404).");
        return [];
      }
      const errorDetails = await response.json().catch(() => ({}));
      throw new Error(
        `HTTP error! Status: ${response.status} Details: ${JSON.stringify(errorDetails)}`,
      );
    }

    return response.status !== 204 ? await response.json() : [];
  } catch (error: any) {
    console.error("Error fetching family members:", error);
    throw new Error(`Failed to fetch family members: ${error.message}`);
  }
};

export default function useFamilyMemberFetch() {
  const { isAuthenticated, loading } = useAuth();

  const queryResult = useQuery<FamilyMember[], Error>({
    queryKey: ["familyMembers"],
    queryFn: fetchFamilyMembers,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    retry: 1,
    enabled: !loading && isAuthenticated,
  });

  if (queryResult.isError) {
    console.log(
      "Error occurred while fetching family members:",
      queryResult.error?.message,
    );
  }

  return queryResult;
}
