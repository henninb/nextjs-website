import { useQuery } from "@tanstack/react-query";
import Totals from "../model/Totals";
//import { basicAuth } from "../Common";

const fetchTotalsPerAccount = async (
  accountNameOwner: string,
): Promise<Totals> => {
  try {
    const response = await fetch(
      "/api/transaction/account/totals/" + accountNameOwner,
      {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      },
    );

    if (!response.ok) {
      if (response.status === 404) {
        console.log("Resource not found (404).");
      }
      throw new Error(
        `Failed to fetch totalsPerAccount: ${response.statusText}`,
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.log("Error fetching totalsPerAccount data:", error);
    return {
      totalsOutstanding: 1.0,
      totalsFuture: 25.45,
      totalsCleared: -25.45,
      totals: 0.0,
    };
  }
};

export default function useTotalsPerAccountFetch(accountNameOwner: string) {
  const queryResult = useQuery({
    queryKey: ["totals", accountNameOwner],
    queryFn: () => fetchTotalsPerAccount(accountNameOwner),
  });
  if (queryResult.isError) {
    console.log(
      "Error occurred while fetching account_totals data:",
      queryResult.error?.message,
    );
  }

  return queryResult;
}
