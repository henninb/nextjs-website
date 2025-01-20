import { useQuery } from "@tanstack/react-query";
import Account from "../model/Account";
//import { basicAuth } from "../Common";

const dataTest: Account[] = [
  {
    accountId: 1,
    accountNameOwner: "wfargo_brian",
    accountType: "debit",
    activeStatus: true,
    moniker: "0000",
    outstanding: 1500.25,
    future: 200.0,
    cleared: 1300.25,
  },
  {
    accountId: 2,
    accountNameOwner: "barclay-cash_brian",
    accountType: "credit",
    activeStatus: true,
    moniker: "0000",
    outstanding: 5000.75,
    future: 1000.0,
    cleared: 4000.75,
  },
  {
    accountId: 3,
    accountNameOwner: "barclay-savings_brian",
    accountType: "debit",
    activeStatus: true,
    moniker: "0000",
    outstanding: 5000.75,
    future: 1000.0,
    cleared: 4000.75,
  },
  {
    accountId: 4,
    accountNameOwner: "wellsfargo-cash_brian",
    accountType: "credit",
    activeStatus: true,
    moniker: "0000",
    outstanding: 5000.75,
    future: 1000.0,
    cleared: 4000.75,
  },
];

const fetchAccountData = async (): Promise<Account[]> => {
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
        return dataTest; // Return mock data on 404
      }
      const errorDetails = await response.json();
      throw new Error(
        `HTTP error! Status: ${response.status} Details: ${JSON.stringify(errorDetails)}`,
      );
    }
    return await response.json();
  } catch (error) {
    console.log("Error fetching account data:", error);
    return dataTest; // Return mock data if there's an error
  }
};

export default function useAccountFetch() {
  const queryResult = useQuery<Account[], Error>({
    queryKey: ["account"], // Make the key an array to support caching and refetching better
    queryFn: fetchAccountData,
  });

  if (queryResult.isError) {
    console.error(
      "Error occurred while fetching account data:",
      queryResult.error?.message,
    );
  }

  return queryResult;
}
