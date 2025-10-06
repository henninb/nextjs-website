import { useMutation, useQueryClient } from "@tanstack/react-query";
import Parameter from "../model/Parameter";

export const insertParameter = async (
  payload: Parameter,
): Promise<Parameter> => {
  try {
    const endpoint = "/api/parameter";

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

    return response.status !== 204 ? await response.json() : payload;
  } catch (error: any) {
    console.error(`An error occurred: ${error.message}`);
    throw error;
  }
};

export default function useParameterInsert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["insertParameter"],
    mutationFn: (variables: { payload: Parameter }) =>
      insertParameter(variables.payload),
    onError: (error) => {
      console.log(error ? error : "error is undefined.");
    },
    onSuccess: (newParameter) => {
      const oldData: any = queryClient.getQueryData(["parameter"]) || [];
      queryClient.setQueryData(["parameter"], [newParameter, ...oldData]);
    },
  });
}
