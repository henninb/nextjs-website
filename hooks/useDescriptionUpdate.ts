//import { basicAuth } from "../Common";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Description from "../model/Description";

const updateDescription = async (
  oldDescription: Description,
  newDescription: Description,
): Promise<Description> => {
  const endpoint = `https://finance.lan/api/description/update/${oldDescription.descriptionName}`;
  try {
    const response = await fetch(endpoint, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        //Authorization: basicAuth(),
      },
      body: JSON.stringify({}),
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
    console.log("Error updating transaction state:", error.message);
    return newDescription; // Return fallback data on error
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
      console.error(`Error occurred during mutation: ${error.message}`);
    },
    onSuccess: (updatedDescription: Description) => {
      const oldData = queryClient.getQueryData<Description[]>(["description"]);
      if (oldData) {
        const newData = oldData.map((element: Description) =>
          element.descriptionName === updatedDescription.descriptionName
            ? { ...element, ...updatedDescription }
            : element,
        );

        queryClient.setQueryData(["description"], newData);
      }
    },
  });
}
