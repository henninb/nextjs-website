import { useQuery } from "@tanstack/react-query";
import Totals from "../model/Totals";
//import { basicAuth } from "../Common";

const fetchTotals = async (): Promise<Totals> => {
  try {
    const response = await fetch("https://finance.lan/api/account/totals", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        //Authorization: basicAuth(),
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        console.log("Resource not found (404).");
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.log("Error fetching totals data:", error);
    return {
      totalsFuture: -205.7,
      totalsCleared: 15287.53,
      totals: 152326.56,
      totalsOutstanding: 150.73,
    };
  }
};

export default function useTotalsFetch() {
  const queryResult = useQuery<any, Error>({
    queryKey: ["payment_required"], // Make the key an array to support caching and refetching better
    queryFn: fetchTotals,
  });

  if (queryResult.isError) {
    console.log(
      "Error occurred while fetching payment_required data:",
      queryResult.error?.message,
    );
  }

  return queryResult;
}
