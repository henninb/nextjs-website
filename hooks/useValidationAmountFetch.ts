import { useQuery } from "@tanstack/react-query";
import { TransactionState } from "../model/TransactionState";
import ValidationAmount from "../model/ValidationAmount";
//import { basicAuth } from "../Common";

export const fetchValidationAmount = async (
  accountNameOwner: string,
): Promise<ValidationAmount> => {
  const endpoint = `https://finance.lan/api/validation/amount/select/${accountNameOwner}/cleared`;

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
        console.log("Resource not found (404)");
      }
      throw new Error(
        `Failed to fetch validation amount data: ${response.statusText}`,
      );
    }

    return response.json();
  } catch (error) {
    console.log("Error fetching validationAmount data:", error);
    return {
      validationId: Math.random(),
      validationDate: new Date(),
      accountId: 1,
      amount: 0.0,
      transactionState: "undefined" as TransactionState,
      activeStatus: false,
    };
  }
};

export default function useValidationAmountFetch(accountNameOwner: string) {
  const queryResult = useQuery({
    queryKey: ["validationAmount", accountNameOwner],
    queryFn: () => fetchValidationAmount(accountNameOwner),
  });

  if (queryResult.isError) {
    console.log(
      "Error occurred while fetching validationAmount data:",
      queryResult.error?.message,
    );
  }

  return queryResult;
}
