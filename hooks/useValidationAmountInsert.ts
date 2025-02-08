import { useMutation, useQueryClient } from "@tanstack/react-query";
import ValidationAmount from "../model/ValidationAmount";
//import { basicAuth } from "../Common";

const insertValidationAmount = async (
  accountNameOwner: string,
  payload: ValidationAmount,
): Promise<ValidationAmount | null> => {
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

    return response.status !== 204 ? await response.json() : null;
  } catch (error) {
    // console.log(`An error occurred: ${error}`);
    // throw error;
    if (error instanceof TypeError && error.message === "Failed to fetch") {
      console.warn(
        "Network error: Unable to connect to finance.lan. The server may be down.",
      );
      //return null; // Return null instead of throwing an error to prevent crashes
      throw error;
    }
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
