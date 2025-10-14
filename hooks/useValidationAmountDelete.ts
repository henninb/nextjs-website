import { useMutation, useQueryClient } from "@tanstack/react-query";
import ValidationAmount from "../model/ValidationAmount";

export const deleteValidationAmount = async (
  payload: ValidationAmount,
): Promise<ValidationAmount | null> => {
  try {
    const endpoint = `/api/validation/amount/${payload.validationId}`;

    const response = await fetch(endpoint, {
      method: "DELETE",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
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

    return response.status !== 204 ? await response.json() : null;
  } catch (error: any) {
    console.error(`Error deleting validation amount: ${error.message}`);
    throw error;
  }
};

export default function useValidationAmountDelete() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["deleteValidationAmount"],
    mutationFn: (variables: ValidationAmount) =>
      deleteValidationAmount(variables),
    onError: (error) => {
      console.info("Mutation error:", error);
    },
    onSuccess: (response, variables) => {
      console.log("Delete was successful.", response);

      // Invalidate all validation amount queries to refetch
      queryClient.invalidateQueries({ queryKey: ["validationAmount"] });
    },
  });
}
