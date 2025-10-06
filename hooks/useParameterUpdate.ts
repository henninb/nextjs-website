import { useMutation, useQueryClient } from "@tanstack/react-query";
import Parameter from "../model/Parameter";

export const updateParameter = async (
  oldParameter: Parameter,
  newParameter: Parameter,
): Promise<Parameter> => {
  const endpoint = `/api/parameter/${oldParameter.parameterId}`;
  try {
    const response = await fetch(endpoint, {
      method: "PUT",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(newParameter),
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

export default function useParameterUpdate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["parameterUpdate"],
    mutationFn: ({
      oldParameter,
      newParameter,
    }: {
      oldParameter: Parameter;
      newParameter: Parameter;
    }) => updateParameter(oldParameter, newParameter),
    onError: (error: any) => {
      console.log(`Error occurred during mutation: ${error.message}`);
    },
    onSuccess: (updatedParameter: Parameter) => {
      const oldData = queryClient.getQueryData<Parameter[]>(["parameter"]);
      if (oldData) {
        // Use a stable identifier (e.g., parameterId) for matching and updating
        const newData = oldData.map((element) =>
          element.parameterId === updatedParameter.parameterId
            ? { ...element, ...updatedParameter }
            : element,
        );

        queryClient.setQueryData(["parameter"], newData);
      }
    },
  });
}
