//import { basicAuth } from "../Common";
import { useQuery } from "react-query";

const dataTest = [{"totalsFuture":25.45,"totalsCleared":-25.45,"totals":0.00}];

const fetchTotalsPerAccount = async (accountNameOwner: any): Promise<any> => {
  try {
    const response = await fetch(
      "/api/transaction/account/totals/" + accountNameOwner,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          //Authorization: basicAuth(),
        },
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        console.log("Account not found");
        return {"totalsFuture":25.45,"totalsCleared":-25.45,"totals":0.00} // Default fallback data for 404
      }
      throw new Error(`Failed to fetch totalsPerAccount: ${response.statusText}`);
    }

    const data = await response.json();
    return data;

  } catch (error) {
    console.log("Error fetching totalsPerAccount data:", error);
    return  {"totalsFuture":25.45,"totalsCleared":-25.45,"totals":0.00} // Default fallback data on error
  }
};

export default function useTotalsPerAccountFetch(accountNameOwner: any) {
  return useQuery(
    ["totals", accountNameOwner],
    () => fetchTotalsPerAccount(accountNameOwner),
    {
      onError: (error: Error) => {
        console.log(error ? error.message : "Error is undefined.");
      },
    }
  );
}