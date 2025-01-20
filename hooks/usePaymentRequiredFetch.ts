import { useQuery } from "@tanstack/react-query";
import PaymentRequired from "../model/PaymentRequired";
//import { basicAuth } from "../Common";

const dataTest = [
  {
    accountNameOwner: "wfargo-cc_brian",
    accountType: "credit",
    moniker: "0000",
    future: 200.0,
    outstanding: 1500.25,
    cleared: 1300.25,
  },
  {
    accountNameOwner: "chase_susan",
    accountType: "credit",
    moniker: "0000",
    future: 1000.0,
    outstanding: 5000.75,
    cleared: 4000.75,
  },
  {
    accountNameOwner: "boa_michael",
    accountType: "credit",
    moniker: "0000",
    future: 0.0,
    outstanding: 0.0,
    cleared: 1.0,
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
        return dataTest; // You can return an empty array or any default value for a 404
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
