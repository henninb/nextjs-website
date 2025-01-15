//import { basicAuth } from "../Common";
import { useMutation, useQueryClient } from "react-query";

const deleteAccount = async (payload: any): Promise<any> => {
  try {
    const endpoint = `/api/account/delete/${payload.accountNameOwner}`;

    const response = await fetch(endpoint, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        //Authorization: basicAuth(),
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        console.log("Resource not found (404).", await response.json());
        return payload; // React to 404 specifically
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error: any) {
    return { error: "An error occurred", details: error.message };
  }
};

export default function useAccountDelete() {
  const queryClient = useQueryClient();

  return useMutation(
    ["deleteAccount"],
    (variables: any) => deleteAccount(variables.oldRow),
    {
      onError: (error: any) => {
        console.log(error ? error : "error is undefined.");
      },

      onSuccess: (response, variables) => {
        const oldData: any = queryClient.getQueryData("account");
        const newData = oldData.filter(
          (t: any) => t.accountId !== variables.oldRow.accountId
        );
        queryClient.setQueryData("account", newData);
      },
    }
  );
}