import { useMutation, useQueryClient } from "@tanstack/react-query";
import ValidationAmount from "../model/ValidationAmount";
//import { basicAuth } from "../Common";

const insertValidationAmount = async (
  accountNameOwner: string,
  payload: ValidationAmount,
): Promise<ValidationAmount | null> => {
  const endpoint = `https://finance.bhenning.com/api/validation/amount/insert/${accountNameOwner}`;

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        //Authorization: basicAuth(),
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      let errorMessage = "";

      try {
        const errorBody = await response.json();
        if (errorBody && errorBody.response) {
          errorMessage = `${errorBody.response}`;
        } else {
          console.log("No error message returned.");
          throw new Error("No error message returned.");
        }
      } catch (error) {
        console.log(`Failed to parse error response: ${error.message}`);
        throw new Error(`Failed to parse error response: ${error.message}`);
      }

      console.log(errorMessage || "cannot throw a null value");
      throw new Error(errorMessage || "cannot throw a null value");
    }

    return response.status !== 204 ? await response.json() : null;
  } catch (error) {
    console.log(`An error occurred: ${error}`);
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
      console.log("Error during mutation:", error);
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
