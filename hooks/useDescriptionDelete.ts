import { useMutation, useQueryClient } from "@tanstack/react-query";
import Description from "../model/Description";

export const deleteDescription = async (
  oldRow: Description,
): Promise<Description | null> => {
  try {
    const endpoint = `/api/description/${oldRow.descriptionName}`;

    const response = await fetch(endpoint, {
      method: "DELETE",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
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
    console.error(`An error occurred: ${error.message}`);
    throw error;
  }
};

export default function useDescriptionDelete() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["deleteDescription"],
    mutationFn: (variables: Description) => deleteDescription(variables),
    onError: (error: any) => {
      console.warn("Mutation error:", error);
    },
    onSuccess: (response, variables) => {
      console.log("Delete was successful.", response);

      const oldData: any = queryClient.getQueryData(["description"]) || [];
      const newData = oldData.filter(
        (item: Description) =>
          item.descriptionName !== variables.descriptionName,
      );
      queryClient.setQueryData(["description"], newData);
    },
  });
}
