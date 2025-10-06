import { useMutation, useQueryClient } from "@tanstack/react-query";
import ValidationAmount from "../model/ValidationAmount";

const insertValidationAmount = async (
  accountNameOwner: string,
  payload: ValidationAmount,
): Promise<ValidationAmount> => {
  const endpoint = `/api/validation/amount`;

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorBody = await response
        .json()
        .catch(() => ({ error: `HTTP error! Status: ${response.status}` }));
      const errorMessage =
        errorBody.error || `HTTP error! Status: ${response.status}`;
      console.error(`Failed to insert validation amount: ${errorMessage}`);
      throw new Error(errorMessage);
    }

    return await response.json();
  } catch (error: any) {
    console.error(`An error occurred: ${error.message}`);
    throw error;
  }
};

export default function useValidationAmountInsert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["insertValidationAmount"],
    mutationFn: (variables: {
      accountNameOwner: string;
      payload: ValidationAmount;
    }) => insertValidationAmount(variables.accountNameOwner, variables.payload),
    onError: (error: any) => {
      console.error("Error during mutation:", error);
    },
    onSuccess: (response: ValidationAmount, variables) => {
      queryClient.setQueryData(
        ["validationAmount", variables.accountNameOwner],
        response,
      );
    },
  });
}
