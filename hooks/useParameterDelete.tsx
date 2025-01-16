import { useMutation, useQueryClient } from "@tanstack/react-query";
import Parameter from "../model/Parameter";
//import { basicAuth } from "../Common";


const deleteParameter = async (payload: Parameter): Promise<Parameter> => {
  try {
    const endpoint = `/api/parm/delete/${payload.parameterName}`;

    const response = await fetch(endpoint, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        //Authorization: basicAuth(),
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("Parameter not found (404). Check the parameter name.");
      }
      throw new Error(`An error occurred: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error in deleteParameter:", error);
    throw error;
  }
};

export default function useParameterDelete() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["deleteParameter"],
    mutationFn: (variables: any) => deleteParameter(variables.oldRow),
    onError: (error) => {
      console.error("Mutation error:", error);
    },
    onSuccess: (response, variables) => {
      console.log("Delete was successful.", response);

      const oldData: any = queryClient.getQueryData(["parameter"]) || [];
      const newData = oldData.filter(
        (item) => item.parameterName !== variables.oldRow.parameterName
      );
      queryClient.setQueryData(["parameter"], newData);
    },
  });
}
