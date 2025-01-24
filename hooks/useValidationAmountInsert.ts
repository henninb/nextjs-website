import { useMutation, useQueryClient } from "@tanstack/react-query";
import ValidationAmount from "../model/ValidationAmount";
import { TransactionState } from "../model/TransactionState";
//import { basicAuth } from "../Common";

const insertValidationAmount = async (
  accountNameOwner: string,
  payload: ValidationAmount,
): Promise<ValidationAmount> => {
  const endpoint = `https://finance.lan/api/validation/amount/insert/${accountNameOwner}`;

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        //Authorization: basicAuth(),
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      if (response.status === 404) {
        console.log("Resource not found (404)");
      }
      throw new Error(
        `Failed to insert validation amount: ${response.statusText}`,
      );
    }

    return response.json();
  } catch (error) {
    console.log("An error occurred while inserting validation amount:", error);
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

export default function useValidationAmountInsert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["insertValidationAmount"],
    mutationFn: (variables: {
      accountNameOwner: string;
      payload: ValidationAmount;
    }) => insertValidationAmount(variables.accountNameOwner, variables.payload),
    onError: (error: unknown) => {
      console.error("Error during mutation:", error);
    },
    onSuccess: (response: ValidationAmount, variables) => {
      console.log("Mutation successful:", JSON.stringify(response));
      queryClient.setQueryData(
        ["validationAmount", variables.accountNameOwner],
        response,
      );
    },
  });
}
