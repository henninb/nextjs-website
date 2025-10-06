import { useQuery } from "@tanstack/react-query";
import Payment from "../model/Payment";

const fetchPaymentData = async (): Promise<Payment[]> => {
  try {
    const response = await fetch("/api/payment/active", {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      const errorBody = await response
        .json()
        .catch(() => ({ error: `HTTP error! Status: ${response.status}` }));
      const errorMessage =
        errorBody.error || `HTTP error! Status: ${response.status}`;
      console.error("Error fetching payment data:", errorMessage);
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error("Error fetching payment data:", error);
    throw error;
  }
};

export default function usePaymentFetch() {
  const queryResult = useQuery<Payment[], Error>({
    queryKey: ["payment"],
    queryFn: fetchPaymentData,
  });

  if (queryResult.isError) {
    console.error(
      "Error occurred while fetching payment data:",
      queryResult.error?.message,
    );
  }

  return queryResult;
}
