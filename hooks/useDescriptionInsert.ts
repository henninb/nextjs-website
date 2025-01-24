import { useMutation, useQueryClient } from "@tanstack/react-query";
import Description from "../model/Description";
//import { basicAuth } from "../Common";

const insertDescription = async (
  descriptionName: string,
): Promise<Description> => {
  try {
    const endpoint = "https://finance.lan/api/description/insert";
    const payload = { description: descriptionName, activeStatus: true };

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        //Authorization: basicAuth(),
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      if (response.status === 404) {
        console.error("Resource not found (404).");
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error: any) {
    console.log("Error occurred:", error);
    //throw error;
    return {
      descriptionId: Math.random(),
      descriptionName: descriptionName,
      activeStatus: true,
      dateAdded: new Date(),
      dateUpdated: new Date(),
    };
  }
};

export default function useDescriptionInsert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables: { descriptionName: string }) =>
      insertDescription(variables.descriptionName),
    onError: (error: unknown) => {
      console.error(error || "An unknown error occurred.");
    },
    onSuccess: (newDescription) => {
      const oldData: Description[] =
        queryClient.getQueryData(["description"]) || [];
      queryClient.setQueryData(["description"], [newDescription, ...oldData]);
    },
  });
}
