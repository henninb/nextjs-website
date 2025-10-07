import { useMutation, useQueryClient } from "@tanstack/react-query";
import Payment from "../model/Payment";
import {
  DataValidator,
  hookValidators,
  ValidationError,
} from "../utils/validation";
import { formatDateForInput } from "../components/Common";

export const setupNewPayment = async (payload: Payment) => {
  // Note: guidSource and guidDestination must be explicitly null for backend validation
  // The backend will create the transactions and generate these values
  return {
    paymentId: 0,
    amount: payload?.amount,
    transactionDate: formatDateForInput(payload?.transactionDate),
    sourceAccount: payload.sourceAccount,
    destinationAccount: payload.destinationAccount,
    guidSource: null,
    guidDestination: null,
    activeStatus: true,
  };
};

export const insertPayment = async (payload: Payment): Promise<Payment> => {
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

    const endpoint = "/api/payment";
    const newPayload = await setupNewPayment(validation.validatedData);

    const response = await fetch(endpoint, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(newPayload),
    });

    if (!response.ok) {
      const errorBody = await response
        .json()
        .catch(() => ({ error: `HTTP error! Status: ${response.status}` }));
      const errorMessage =
        errorBody.error || `HTTP error! Status: ${response.status}`;
      console.error(`Failed to insert payment: ${errorMessage}`);
      throw new Error(errorMessage);
    }

    return await response.json();
  } catch (error) {
    console.error(`An error occurred: ${error.message}`);
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
      console.error(error ? error : "error is undefined.");
    },
    onSuccess: (newPayment) => {
      const oldData: any = queryClient.getQueryData(["payment"]) || [];
      queryClient.setQueryData(["payment"], [newPayment, ...oldData]);
    },
  });
}
