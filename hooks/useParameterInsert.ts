import { useMutation, useQueryClient } from "@tanstack/react-query";
import Parameter from "../model/Parameter";
//import { basicAuth } from "../Common";

const insertParameter = async (payload: Parameter): Promise<Parameter> => {
  try {
    const endpoint = "https://finance.lan/api/parm/insert";

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        //Authorization: basicAuth(),
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      if (response.status === 404) {
        console.error("Resource not found (404).", await response.json());
        return {
          parameterId: Math.random(), // Generate unique ID
          parameterName: payload.parameterName,
          parameterValue: payload.parameterValue,
          activeStatus: true,
        };
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("An error occurred:", error);
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
