//import { basicAuth } from "../Common";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Description from "../model/Description";

const updateDescription = async (
  oldDescription: Description,
  newDescription: Description,
): Promise<Description> => {
  const endpoint = `https://finance.bhenning.com/api/description/update/${oldDescription.descriptionName}`;
  try {
    const response = await fetch(endpoint, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        credentials: "include",
        //Authorization: basicAuth(),
      },
      body: JSON.stringify(newDescription),
    });

    if (response.status === 404) {
      console.log("Resource not found (404).");
    }

    if (!response.ok) {
      throw new Error(
        `Failed to update transaction state: ${response.statusText}`,
      );
    }

    return await response.json();
  } catch (error: any) {
    console.log(`An error occurred: ${error.message}`);
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
