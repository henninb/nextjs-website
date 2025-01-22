import { useQuery } from "@tanstack/react-query";
//import { basicAuth } from "../Common";

const fetchTotalsPerAccount = async (
  accountNameOwner: string,
): Promise<any> => {
  try {
    const response = await fetch(
      "https://finance.lan/api/transaction/account/totals/" + accountNameOwner,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          //Authorization: basicAuth(),
        },
      },
    );

    if (!response.ok) {
      if (response.status === 404) {
        console.log("Account not found");
        return { totalsFuture: 25.45, totalsCleared: -25.45, totals: 0.0 }; // Default fallback data for 404
      }
      throw new Error(
        `Failed to fetch totalsPerAccount: ${response.statusText}`,
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.log("Error fetching totalsPerAccount data:", error);
    //throw new Error("Error fetching totalsPerAccount data:", error);
    return { totalsFuture: 25.45, totalsCleared: -25.45, totals: 0.0 }; // Default fallback data on error
  }
};

export default function useTotalsPerAccountFetch(accountNameOwner: string) {
  const queryResult = useQuery({
    queryKey: ["totals", accountNameOwner],
    queryFn: () => fetchTotalsPerAccount(accountNameOwner),
  });
  if (queryResult.isError) {
    console.error(
      "Error occurred while fetching account_totals data:",
      queryResult.error?.message,
    );
  }

  return queryResult;
}
