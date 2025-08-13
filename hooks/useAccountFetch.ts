import { useQuery } from "@tanstack/react-query";
import Account from "../model/Account";
import { useAuth } from "../components/AuthProvider";
//import { basicAuth } from "../Common";

const fetchAccountData = async (): Promise<Account[] | null> => {
  try {
    const response = await fetch("/api/account/select/active", {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        // Uncomment and implement if authorization is required
        // "Authorization": basicAuth(),
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        console.log("No accounts found (404).");
        return []; // Return empty array for 404, meaning no accounts
      }
      const errorDetails = await response.json();
      throw new Error(
        `HTTP error! Status: ${response.status} Details: ${JSON.stringify(errorDetails)}`,
      );
    }

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
    //cacheTime: 10 * 60 * 1000, // 10 minutes
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
