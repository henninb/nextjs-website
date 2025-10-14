import { useMutation, useQueryClient } from "@tanstack/react-query";
import ValidationAmount from "../model/ValidationAmount";

export const updateValidationAmount = async (
  oldValidationAmount: ValidationAmount,
  newValidationAmount: ValidationAmount,
): Promise<ValidationAmount> => {
  const endpoint = `/api/validation/amount/${oldValidationAmount.validationId}`;
  try {
    const response = await fetch(endpoint, {
      method: "PUT",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(newValidationAmount),
    });

    if (!response.ok) {
      const errorBody = await response
        .json()
        .catch(() => ({ error: `HTTP error! Status: ${response.status}` }));
      const errorMessage =
        errorBody.error ||
        errorBody.errors?.join(", ") ||
        `HTTP error! Status: ${response.status}`;
      throw new Error(errorMessage);
    }

    return await response.json();
  } catch (error: any) {
    console.error(`Error updating validation amount: ${error.message}`);
    throw error;
  }
};

export default function useValidationAmountUpdate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["validationAmountUpdate"],
    mutationFn: ({
      oldValidationAmount,
      newValidationAmount,
    }: {
      oldValidationAmount: ValidationAmount;
      newValidationAmount: ValidationAmount;
    }) => updateValidationAmount(oldValidationAmount, newValidationAmount),
    onError: (error: any) => {
      console.error(`Error occurred during mutation: ${error.message}`);
    },
    onSuccess: (updatedValidationAmount: ValidationAmount, variables) => {
      // Invalidate all validation amount queries to refetch
      queryClient.invalidateQueries({ queryKey: ["validationAmount"] });
    },
  });
}
