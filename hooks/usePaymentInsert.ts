import { useMutation, useQueryClient } from "@tanstack/react-query";
import Payment from "../model/Payment";
import {
  DataValidator,
  hookValidators,
  ValidationError,
} from "../utils/validation";
import { getSecureHeaders } from "../utils/csrfUtils";
//import { basicAuth } from "../Common";

const setupNewPayment = (payload: Payment) => {
  return {
    accountNameOwner: payload?.accountNameOwner,
    amount: payload?.amount,
    transactionDate: payload?.transactionDate,
    sourceAccount: payload.sourceAccount,
    destinationAccount: payload.destinationAccount,
  };
};

const insertPayment = async (payload: Payment): Promise<Payment> => {
  try {
    // Validate and sanitize the payment data
    const validation = hookValidators.validateApiPayload(
      payload,
      DataValidator.validatePayment,
      "insertPayment",
    );

    if (!validation.isValid) {
      const errorMessages =
        validation.errors?.map((err) => err.message).join(", ") ||
        "Validation failed";
      throw new Error(`Payment validation failed: ${errorMessages}`);
    }

    const endpoint = "/api/payment/insert";
    const newPayload = setupNewPayment(validation.validatedData);

    const headers = await getSecureHeaders({
      Accept: "application/json",
      //Authorization: basicAuth(),
    });

    const response = await fetch(endpoint, {
      method: "POST",
      credentials: "include",
      headers,
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
  } catch (error) {
    console.log(`An error occurred: ${error.message}`);
    throw error;
  }
};

export default function usePaymentInsert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["insertPayment"],
    mutationFn: (variables: { payload: Payment }) =>
      insertPayment(variables.payload),
    onError: (error) => {
      console.log(error ? error : "error is undefined.");
    },
    onSuccess: (newPayment) => {
      const oldData: any = queryClient.getQueryData(["payment"]) || [];
      queryClient.setQueryData(["payment"], [newPayment, ...oldData]);
    },
  });
}
