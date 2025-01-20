import { useMutation, useQueryClient } from "@tanstack/react-query";
import Parameter from "../model/Parameter";
//import { basicAuth } from "../Common";

const deleteParameter = async (payload: Parameter): Promise<Parameter> => {
  try {
    const endpoint = `https://finance.lan/api/parm/delete/${payload.parameterName}`;

    const response = await fetch(endpoint, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        //Authorization: basicAuth(),
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        console.log("Parameter not found (404). Check the parameter name.");
        return payload;
      }
      throw new Error(`An error occurred: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.log("Error in deleteParameter:", error);
    return payload;
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
        (item: any) => item.parameterName !== variables.oldRow.parameterName,
      );
      queryClient.setQueryData(["parameter"], newData);
    },
  });
}
