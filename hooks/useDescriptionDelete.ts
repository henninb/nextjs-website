import { useMutation, useQueryClient } from "@tanstack/react-query";
import Description from "../model/Description";
//import { basicAuth } from "../Common";

const deleteDescription = async (oldRow: Description): Promise<Description> => {
  try {
    const endpoint = `https://finance.lan/api/description/delete/${oldRow.descriptionName}`;

    const response = await fetch(endpoint, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        // Uncomment and modify if authentication is required
        // Authorization: basicAuth(),
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        console.log("Description not found (404). Check the description name.");
      }
      throw new Error(`An error occurred: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.log("Error in deleteDescription:", error);
    return oldRow;
  }
};

export default function useDescriptionDelete() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["deleteDescription"],
    mutationFn: (variables: Description) => deleteDescription(variables),
    onError: (error) => {
      console.error("Mutation error:", error);
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
