import { useMutation, useQueryClient } from "@tanstack/react-query";
import Description from "../model/Description";
//import { basicAuth } from "../Common";

const deleteDescription = async (
  oldRow: Description,
): Promise<Description | null> => {
  try {
    const endpoint = `/api/description/delete/${oldRow.descriptionName}`;

    const response = await fetch(endpoint, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        credentials: "include",
        // Uncomment and modify if authentication is required
        // Authorization: basicAuth(),
      },
    });

    if (!response.ok) {
      let errorMessage = "";

      try {
        const errorBody = await response.json();
        if (errorBody && errorBody.response) {
          errorMessage = `${errorBody.response}`;
        } else {
          console.log("No error message returned.");
          throw new Error("No error message returned.");
        }
      } catch (error) {
        console.log(`Failed to parse error response: ${error.message}`);
        throw new Error(`Failed to parse error response: ${error.message}`);
      }

      console.log(errorMessage || "cannot throw a null value");
      throw new Error(errorMessage || "cannot throw a null value");
    }

    return response.status !== 204 ? await response.json() : null;
    //return await response.json();
  } catch (error) {
    // if (error instanceof TypeError && error.message === "Failed to fetch") {
    //   console.warn("Network error: Unable to connect to finance.lan. The server may be down.");
    //   //return null; // Return null instead of throwing an error to prevent crashes
    //   throw error;
    // }
    //throw new Error("error");
    //throw new Error(`Delete request failed: ${error.message}`);
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
