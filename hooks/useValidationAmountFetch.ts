import { useQuery } from "@tanstack/react-query";
import { TransactionState } from "../model/TransactionState";
import ValidationAmount from "../model/ValidationAmount";
import { dummyValidationAmount } from "../data/dummyValidationAmount";
import { useAuth } from "../components/AuthProvider";
//import { basicAuth } from "../Common";

export const fetchValidationAmount = async (
  accountNameOwner: string,
): Promise<ValidationAmount> => {
  const endpoint = `/api/validation/amount/select/${accountNameOwner}/cleared`;

  try {
    const response = await fetch(endpoint, {
      method: "GET",
      credentials: "include",
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
    return dummyValidationAmount;
  }
};

export default function useValidationAmountFetch(accountNameOwner: string) {
  const { isAuthenticated, loading } = useAuth();

  const queryResult = useQuery({
    queryKey: ["validationAmount", accountNameOwner],
    queryFn: () => fetchValidationAmount(accountNameOwner),
    enabled: !loading && isAuthenticated && !!accountNameOwner,
  });

  if (queryResult.isError) {
    console.log(
      "Error occurred while fetching validationAmount data:",
      queryResult.error?.message,
    );
  }

  return queryResult;
}
