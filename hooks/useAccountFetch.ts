import { useQuery } from "@tanstack/react-query";
import Account from "../model/Account";
import { useAuth } from "../components/AuthProvider";

const fetchAccountData = async (): Promise<Account[] | null> => {
  try {
    const response = await fetch("/api/account/active", {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      const errorDetails = await response.json();
      throw new Error(
        `HTTP error! Status: ${response.status} Details: ${JSON.stringify(errorDetails)}`,
      );
    }

    // Modern endpoint always returns 200 OK with empty array [] if no accounts
    return response.status !== 204 ? await response.json() : null;
  } catch (error: any) {
    console.error("Error fetching account data:", error);
    throw new Error(`Failed to fetch account data: ${error.message}`);
  }
};

export default function useAccountFetch() {
  const { isAuthenticated, loading } = useAuth();

  const queryResult = useQuery<Account[], Error>({
    queryKey: ["account"],
    queryFn: fetchAccountData,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
    enabled: !loading && isAuthenticated,
  });

  if (queryResult.isError) {
    console.log(
      "Error occurred while fetching account data:",
      queryResult.error?.message,
    );
  }

  return queryResult;
}
