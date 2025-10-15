import { useMutation, useQueryClient } from "@tanstack/react-query";
import Account from "../model/Account";
import {
  DataValidator,
  hookValidators,
  ValidationError,
} from "../utils/validation";

export const setupNewAccount = (payload: Account) => {
  return {
    cleared: 0.0,
    future: 0.0,
    outstanding: 0.0,
    dateClosed: new Date(0), // January 1, 1970 to indicate "not closed"
    dateAdded: new Date(),
    dateUpdated: new Date(),
    validationDate: new Date(0),
    ...payload,
    activeStatus: true, // Always force activeStatus to true for new accounts
  };
};

export const insertAccount = async (
  payload: Account,
): Promise<Account | null> => {
  try {
    // Validate and sanitize the account data
    const validation = hookValidators.validateApiPayload(
      payload,
      DataValidator.validateAccount,
      "insertAccount",
    );

    if (!validation.isValid) {
      const errorMessages =
        validation.errors?.map((err) => err.message).join(", ") ||
        "Validation failed";
      throw new Error(`Account validation failed: ${errorMessages}`);
    }

    const endpoint = "/api/account";
    const newPayload = setupNewAccount(validation.validatedData);

    console.log(
      "Inserting account for:",
      validation.validatedData.accountNameOwner,
    );

    const response = await fetch(endpoint, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(newPayload),
    });

    if (!response.ok) {
      let errorMessage = "";

      try {
        const errorBody = await response.json();
        if (errorBody && errorBody.response) {
          errorMessage = `${errorBody.response}`;
        } else {
          console.log("No error message returned.");
          errorMessage = "No error message returned.";
        }
      } catch (error) {
        console.log(`Failed to parse error response: ${error.message}`);
        errorMessage = `Failed to parse error response: ${error.message}`;
      }

      console.log(errorMessage || "cannot throw a null value");
      throw new Error(errorMessage || "cannot throw a null value");
    }

    return response.status !== 204 ? await response.json() : null;
  } catch (error: any) {
    console.log(`An error occurred: ${error.message}`);
    throw error;
  }
};

export default function useAccountInsert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["insertAccount"],
    mutationFn: (variables: { payload: Account }) =>
      insertAccount(variables.payload),
    onError: (error: Error) => {
      console.log(error ? error : "Error is undefined.");
    },
    onSuccess: (response: Account) => {
      const oldData: Account[] | undefined = queryClient.getQueryData([
        "account",
      ]);
      const newData = oldData ? [response, ...oldData] : [response];
      queryClient.setQueryData(["account"], newData);
    },
  });
}
