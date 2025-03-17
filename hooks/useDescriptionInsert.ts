import { useMutation, useQueryClient } from "@tanstack/react-query";
import Description from "../model/Description";
//import { basicAuth } from "../Common";

const insertDescription = async (
  descriptionName: string,
): Promise<Description> => {
  try {
    const endpoint = "/api/description/insert";
    const payload = { description: descriptionName, activeStatus: true };

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        credentials: "include",
        Accept: "application/json",
        //Authorization: basicAuth(),
      },
      body: JSON.stringify(payload),
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
  } catch (error: any) {
    console.log(`An error occurred: ${error.message}`);
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
