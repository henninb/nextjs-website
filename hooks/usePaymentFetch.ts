import { useQuery } from "@tanstack/react-query";
import Payment from "../model/Payment";
//import { basicAuth } from "../Common";

const dataTest: Payment[] = [
  {
    paymentId: 2593,
    accountNameOwner: "rcard_brian",
    transactionDate: new Date("2024-09-24"),
    amount: 1.0,
    activeStatus: true,
  },
  {
    paymentId: 2595,
    accountNameOwner: "wellsfargo-cash_brian",
    transactionDate: new Date("2024-09-24"),
    amount: 1.0,
    activeStatus: true,
  },
  {
    paymentId: 2597,
    accountNameOwner: "chase_kari",
    transactionDate: new Date("2024-09-25"),
    amount: 1.5,
    activeStatus: true,
  },
  {
    paymentId: 2598,
    accountNameOwner: "boa_brian",
    transactionDate: new Date("2024-09-25"),
    amount: 2.0,
    activeStatus: true,
  },
  {
    paymentId: 2599,
    accountNameOwner: "citibank_brian",
    transactionDate: new Date("2024-09-26"),
    amount: 3.0,
    activeStatus: true,
  },
];

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
        return dataTest;
      }
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    // Uncomment the line below for debugging
    // console.debug(JSON.stringify(data));
    return data;
  } catch (error) {
    console.log("Error fetching payment data:", error);
    return dataTest;
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
