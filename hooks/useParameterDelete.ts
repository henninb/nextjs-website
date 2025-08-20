import { useMutation, useQueryClient } from "@tanstack/react-query";
import Parameter from "../model/Parameter";

const deleteParameter = async (payload: Parameter): Promise<Parameter> => {
  try {
    const endpoint = `/api/parameter/delete/${payload.parameterName}`;

    const response = await fetch(endpoint, {
      method: "DELETE",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
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
  } catch (error) {
    console.log(`An error occurred: ${error.message}`);
    throw error;
  }
};

export default function useParameterDelete() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["deleteParameter"],
    //mutationFn: (variables: any) => deleteParameter(variables.payload),
    mutationFn: (variables: Parameter) => deleteParameter(variables),
    onError: (error) => {
      console.log("Mutation error:", error);
    },
    onSuccess: (response, variables) => {
      console.log("Delete was successful.", response);

      const oldData: any = queryClient.getQueryData(["parameter"]) || [];
      const newData = oldData.filter(
        (item: Parameter) => item.parameterName !== variables.parameterName,
      );
      queryClient.setQueryData(["parameter"], newData);
    },
  });
}
