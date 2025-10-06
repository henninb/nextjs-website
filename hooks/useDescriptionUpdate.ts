import { useMutation, useQueryClient } from "@tanstack/react-query";
import Description from "../model/Description";

export const updateDescription = async (
  oldDescription: Description,
  newDescription: Description,
): Promise<Description> => {
  const endpoint = `/api/description/${oldDescription.descriptionName}`;
  try {
    const response = await fetch(endpoint, {
      method: "PUT",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(newDescription),
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({ error: `HTTP error! Status: ${response.status}` }));
      const errorMessage = errorBody.error || errorBody.errors?.join(", ") || `HTTP error! Status: ${response.status}`;
      throw new Error(errorMessage);
    }

    return await response.json();
  } catch (error: any) {
    console.error(`An error occurred: ${error.message}`);
    throw error;
  }
};

export default function useDescriptionUpdate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["descriptionUpdate"],
    mutationFn: ({
      oldDescription,
      newDescription,
    }: {
      oldDescription: Description;
      newDescription: Description;
    }) => updateDescription(oldDescription, newDescription),
    onError: (error: any) => {
      console.log(`Error occurred during mutation: ${error.message}`);
    },
    onSuccess: (updatedDescription: Description) => {
      const oldData = queryClient.getQueryData<Description[]>(["description"]);
      if (oldData) {
        // Use a stable identifier (e.g., categoryId) for matching and updating
        const newData = oldData.map((element) =>
          element.descriptionId === updatedDescription.descriptionId
            ? { ...element, ...updatedDescription }
            : element,
        );

        queryClient.setQueryData(["description"], newData);
      }
    },
  });
}
