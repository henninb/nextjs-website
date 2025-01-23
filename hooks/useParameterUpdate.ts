//import { basicAuth } from "../Common";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Parameter from "../model/Parameter";

const updateParameter = async (
  oldParameter: Parameter,
  newParameter: Parameter,
): Promise<Parameter> => {
  const endpoint = `https://finance.lan/api/parm/update/${oldParameter.parameterName}`;
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
      return newParameter; // Return fallback data for 404
    }

    if (!response.ok) {
      throw new Error(
        `Failed to update transaction state: ${response.statusText}`,
      );
    }

    return await response.json();
  } catch (error: any) {
    console.log("Error updating transaction state:", error.message);
    return newParameter; // Return fallback data on error
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
      console.error(`Error occurred during mutation: ${error.message}`);
    },
    onSuccess: (updatedParameter: Parameter) => {
      const oldData = queryClient.getQueryData<Parameter[]>(["parameter"]);
      if (oldData) {
        const newData = oldData.map((element) =>
          element.parameterName === updatedParameter.parameterName
            ? { ...element, ...updatedParameter }
            : element,
        );

        queryClient.setQueryData(["parameter"], newData);
      }
    },
  });
}
