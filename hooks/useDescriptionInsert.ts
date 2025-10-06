import { useMutation, useQueryClient } from "@tanstack/react-query";
import Description from "../model/Description";
import { DataValidator, hookValidators } from "../utils/validation";

export const insertDescription = async (
  descriptionName: string,
): Promise<Description> => {
  try {
    // Validate and sanitize via shared validator
    const validation = hookValidators.validateApiPayload(
      { descriptionName, activeStatus: true },
      DataValidator.validateDescription,
      "insertDescription",
    );
    if (!validation.isValid) {
      const errorMessages =
        validation.errors?.map((e) => e.message).join(", ") ||
        "Validation failed";
      throw new Error(`Description validation failed: ${errorMessages}`);
    }
    const endpoint = "/api/description";
    const payload = validation.validatedData;

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
      const errorBody = await response.json().catch(() => ({ error: `HTTP error! Status: ${response.status}` }));
      const errorMessage = errorBody.error || errorBody.errors?.join(", ") || `HTTP error! Status: ${response.status}`;
      throw new Error(errorMessage);
    }

    return response.status !== 204 ? await response.json() : null;
  } catch (error: any) {
    console.error(`An error occurred: ${error.message}`);
    throw error;
  }
};

export default function useDescriptionInsert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables: { descriptionName: string }) =>
      insertDescription(variables.descriptionName),
    onError: (error: unknown) => {
      console.log(error || "An unknown error occurred.");
    },
    onSuccess: (newDescription) => {
      const oldData: Description[] =
        queryClient.getQueryData(["description"]) || [];
      queryClient.setQueryData(["description"], [newDescription, ...oldData]);
    },
  });
}
