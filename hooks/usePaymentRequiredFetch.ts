import { useQuery } from "@tanstack/react-query";
import PaymentRequired from "../model/PaymentRequired";

const fetchPaymentRequiredData = async (): Promise<PaymentRequired[]> => {
  try {
    const response = await fetch("/api/account/payment/required", {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        console.log("404 error: Payment required data not found.");
      }
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error("Error fetching payment required data:", error);
    throw new Error(`Failed to fetch payment required data: ${error.message}`);
  }
};

export default function usePaymentFetch() {
  const queryResult = useQuery<PaymentRequired[], Error>({
    queryKey: ["payment_required"], // Make the key an array to support caching and refetching better
    queryFn: fetchPaymentRequiredData,
  });

  if (queryResult.isError) {
    console.log(
      "Error occurred while fetching payment_required data:",
      queryResult.error?.message,
    );
  }

  return queryResult;
}
