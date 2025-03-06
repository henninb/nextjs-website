import { useQuery } from "@tanstack/react-query";
import Payment from "../model/Payment";
import { dummyPayments } from "../data/dummyPayments";
//import { basicAuth } from "../Common";

const fetchPaymentData = async (): Promise<Payment[]> => {
  try {
    const response = await fetch("https://finance.lan/api/payment/select", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        //Authorization: basicAuth(),
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        console.log("Data not found (404)");
      }
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    // Uncomment the line below for debugging
    // console.debug(JSON.stringify(data));
    return data;
  } catch (error) {
    console.log("Error fetching payment data:", error);
    return dummyPayments;
  }
};

export default function usePaymentFetch() {
  const queryResult = useQuery<Payment[], Error>({
    queryKey: ["payment"],
    queryFn: fetchPaymentData,
  });

  if (queryResult.isError) {
    console.log(
      "Error occurred while fetching payment data:",
      queryResult.error?.message,
    );
  }

  return queryResult;
}
