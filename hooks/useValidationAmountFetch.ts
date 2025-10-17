import { useQuery } from "@tanstack/react-query";
import { TransactionState } from "../model/TransactionState";
import ValidationAmount from "../model/ValidationAmount";
import { useAuth } from "../components/AuthProvider";

export const fetchValidationAmount = async (
  accountNameOwner: string,
): Promise<ValidationAmount> => {
  // Modern endpoint with query parameters for filtering
  const endpoint = `/api/validation/amount/active?accountNameOwner=${encodeURIComponent(accountNameOwner)}&transactionState=cleared`;

  try {
    const response = await fetch(endpoint, {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        console.log("Resource not found (404)");
        // Gracefully handle 404 by returning zero values so UI can render
        const zeroValidation: ValidationAmount = {
          validationId: 0,
          // Use epoch date (1970-01-01) as default when no validation data exists
          validationDate: new Date("1970-01-01"),
          amount: 0,
          transactionState: "cleared",
          activeStatus: true,
        };
        return zeroValidation;
      }
      throw new Error(
        `Failed to fetch validation amount data: ${response.statusText}`,
      );
    }

    const data = await response.json();

    // Modern endpoint returns an array, extract the first (latest) item
    if (Array.isArray(data) && data.length > 0) {
      return data[0];
    }

    // If empty array, return zero values
    const zeroValidation: ValidationAmount = {
      validationId: 0,
      validationDate: new Date("1970-01-01"),
      amount: 0,
      transactionState: "cleared",
      activeStatus: true,
    };
    return zeroValidation;
  } catch (error: any) {
    console.error("Error fetching validation amount data:", error);
    throw new Error(`Failed to fetch validation amount data: ${error.message}`);
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
