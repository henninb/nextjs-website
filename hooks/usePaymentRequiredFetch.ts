import { useQuery } from "@tanstack/react-query";
import PaymentRequired from "../model/PaymentRequired";
//import { basicAuth } from "../Common";

const dataTest = [
  {
    accountId: 2,
    accountNameOwner: "barclay-cash_brian",
    accountType: "credit",
    activeStatus: true,
    moniker: "0000",
    outstanding: 5000.75,
    future: 1000.0,
    cleared: 4000.75,
    validationDate: "2024-10-31",
  },
  {
    accountId: 4,
    accountNameOwner: "wellsfargo-cash_brian",
    accountType: "credit",
    activeStatus: true,
    moniker: "0000",
    outstanding: 5.75,
    future: 10.24,
    cleared: 4.75,
    validationDate: "2024-10-31",
  },
];

const fetchPaymentRequiredData = async (): Promise<PaymentRequired[]> => {
  try {
    const response = await fetch(
      "https://finance.lan/api/transaction/payment/required",
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
        console.log("404 error: Payment required data not found.");
      }
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.log("Error fetching payment required data:", error);
    return dataTest;
  }
};

export default function usePaymentFetch() {
  const queryResult = useQuery<PaymentRequired[], Error>({
    queryKey: ["payment_required"], // Make the key an array to support caching and refetching better
    queryFn: fetchPaymentRequiredData,
  });

  if (queryResult.isError) {
    console.error(
      "Error occurred while fetching payment_required data:",
      queryResult.error?.message,
    );
  }

  return queryResult;
}
