import { useQuery } from "react-query";
//import { basicAuth } from "../Common";

const fetchTotals = async (): Promise<any> => {
  try {
    const response = await fetch("/api/account/totals", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        //Authorization: basicAuth(),
      },
    });

    if (!response.ok) {
        if (response.status === 404) {
            console.log("Resource not found (404).", await response.json());
            return {
                "totalsFuture": "-205.70",
                "totalsCleared": "15287.53",
                "totals": "152326.56",
                "totalsOutstanding": "150.73"
              };
        }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.log("Error fetching totals data:", error);
    return {
      "totalsFuture": "-205.70",
      "totalsCleared": "15287.53",
      "totals": "152326.56",
      "totalsOutstanding": "150.73"
    };
  }
};

export default function useTotalsFetch() {
  return useQuery(["all_totals"], () => fetchTotals(), {
    onError: (error: any) => {
      console.log(error ? error : "error is undefined.");
    },
  });
}