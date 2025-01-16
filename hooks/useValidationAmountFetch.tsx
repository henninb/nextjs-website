import { useQuery } from "@tanstack/react-query";
import { TransactionState } from "../model/TransactionState";
//import { basicAuth } from "../Common";

const dataTest = [
  {
    validationId: Math.random(),
    validationDate: new Date(),
    accountId: 1,
    amount: 0.0,
    transactionState: "undefined" as TransactionState,
    activeStatus: false
  }
];

const fetchValidationAmountData = async (
  accountNameOwner: string
): Promise<any> => {
  const endpoint = `/api/validation/amount/select/${accountNameOwner}/cleared`;

  try {
    const response = await fetch(endpoint, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        //Authorization: basicAuth(),
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        console.error("Resource not found (404)");
        //throw new Error("Resource not found (404)");
        return dataTest
      }
      throw new Error(`Failed to fetch validation amount data: ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    console.error("Error fetching validationAmount data:", error);
    //return dataTest; // Return fallback data
    return   {
      validationId: Math.random(),
      validationDate: new Date(),
      accountId: 1,
      amount: 0.0,
      transactionState: "undefined" as TransactionState,
      activeStatus: false
    }
  }
};

export default function useValidationAmountFetch(accountNameOwner: string) {
    const queryResult = useQuery({
    queryKey: ["validationAmount", accountNameOwner],
    queryFn: () => fetchValidationAmountData(accountNameOwner),
  });

  if (queryResult.isError) {
    console.error("Error occurred while fetching validationAmount data:", queryResult.error?.message);
  }

  return queryResult;
}