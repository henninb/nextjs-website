import { useMutation, useQueryClient } from "@tanstack/react-query";
import Parameter from "../model/Parameter";
//import { basicAuth } from "../Common";

const insertParameter = async (payload: Parameter): Promise<Parameter> => {
  try {
    const response = await fetch("https://finance.lan/api/parameter/insert", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      try {
        const errorBody = await response.json();
        throw new Error(errorBody.response || "Unknown error occurred");
      } catch {
        throw new Error("Failed to parse error response");
      }
    }

    return await response.json();
  } catch (error) {
    console.error("Error in insertParameter:", error.message);
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
