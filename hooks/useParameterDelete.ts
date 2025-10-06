import { useMutation, useQueryClient } from "@tanstack/react-query";
import Parameter from "../model/Parameter";

export const deleteParameter = async (
  payload: Parameter,
): Promise<Parameter | null> => {
  try {
    const endpoint = `/api/parameter/${payload.parameterName}`;

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
