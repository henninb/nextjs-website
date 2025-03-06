import { useQuery } from "@tanstack/react-query";
import Account from "../model/Account";
import { dummyAccounts } from "../data/dummyAccounts";
//import { basicAuth } from "../Common";

const fetchAccountData = async (): Promise<Account[] | null> => {
  try {
    const response = await fetch(
      "https://finance.lan/api/account/select/active",
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          // Uncomment and implement if authorization is required
          // "Authorization": basicAuth(),
        },
      },
    );

    if (!response.ok) {
      if (response.status === 404) {
        console.log("Resource not found (404).", await response.json());
        //return dataTest; // Return mock data on 404
      }
      const errorDetails = await response.json();
      throw new Error(
        `HTTP error! Status: ${response.status} Details: ${JSON.stringify(errorDetails)}`,
      );
    }

    return response.status !== 204 ? await response.json() : null;
  } catch (error: any) {
    console.log("Error fetching account data:", error);
    return dummyAccounts;
  }
};

export default function useAccountFetch() {
  const queryResult = useQuery<Account[], Error>({
    queryKey: ["account"],
    queryFn: fetchAccountData,
    staleTime: 5 * 60 * 1000, // 5 minutes
    //cacheTime: 10 * 60 * 1000, // 10 minutes
    retry: 1,
  });

  if (queryResult.isError) {
    console.log(
      "Error occurred while fetching account data:",
      queryResult.error?.message,
    );
  }

  return queryResult;
}
