import { useQuery } from "@tanstack/react-query";
import Payment from "../model/Payment";

const fetchPaymentData = async (): Promise<Payment[]> => {
  try {
    const response = await fetch("/api/payment/select", {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        console.log("No payments found (404).");
        return []; // Return empty array for 404, meaning no payments
      }
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();

    return data;
  } catch (error: any) {
    console.error("Error fetching payment data:", error);
    throw new Error(`Failed to fetch payment data: ${error.message}`);
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
