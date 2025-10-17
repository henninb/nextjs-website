import { useQuery } from "@tanstack/react-query";
import ValidationAmount from "../model/ValidationAmount";
import { useAuth } from "../components/AuthProvider";

export const fetchAllValidationAmounts = async (
  accountNameOwner: string,
): Promise<ValidationAmount[]> => {
  // Modern endpoint with query parameters for filtering
  const endpoint = `/api/validation/amount/active?accountNameOwner=${encodeURIComponent(accountNameOwner)}&transactionState=cleared`;

  try {
    const response = await fetch(endpoint, {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        console.log("Resource not found (404)");
        // Gracefully handle 404 by returning empty array
        return [];
      }
      throw new Error(
        `Failed to fetch validation amounts: ${response.statusText}`,
      );
    }

    const data = await response.json();
    // Modern endpoint always returns an array
    return Array.isArray(data) ? data : [];
  } catch (error: any) {
    console.error("Error fetching validation amounts:", error);
    throw new Error(`Failed to fetch validation amounts: ${error.message}`);
  }
};

export default function useValidationAmountsFetchAll(accountNameOwner: string) {
  const { isAuthenticated, loading } = useAuth();

  const queryResult = useQuery({
    queryKey: ["validationAmount", accountNameOwner, "all"],
    queryFn: () => fetchAllValidationAmounts(accountNameOwner),
    enabled: !loading && isAuthenticated && !!accountNameOwner,
  });

  if (queryResult.isError) {
    console.log(
      "Error occurred while fetching validation amounts:",
      queryResult.error?.message,
    );
  }

  return queryResult;
}
