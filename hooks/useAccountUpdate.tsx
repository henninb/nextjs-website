//import { basicAuth } from "../Common";
import { useMutation, useQueryClient } from "react-query";
import Account from "../model/Account";

const updateAccount = async (
  oldRow: Account,
  newRow: Account
): Promise<any> => {
  try {
    let endpoint = `/api/account/update/${oldRow.accountNameOwner}`;

    const response = await fetch(endpoint, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        //Authorization: basicAuth(),
      },
      body: JSON.stringify(newRow),
    });

    if (!response.ok) {
      if (response.status === 404) {
        console.error("Resource not found (404).", await response.json());
        return newRow; // React to 404 specifically
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error: any) {
    return { error: "An error occurred", details: error.message };
  }
};

export default function useAccountUpdate() {
  const queryClient = useQueryClient();

  return useMutation(
    ["updateAccount"],
    (variables: any) => updateAccount(variables.oldRow, variables.newRow),
    {
      onError: (error: any) => {
        console.log(error ? error : "error is undefined.");
      },

      onSuccess: (response: any) => {
        const oldData = queryClient.getQueryData<Account[]>("account");

        if (oldData) {
          // Combine the response with the existing data
          const newData = [response, ...oldData];
          queryClient.setQueryData("account", newData);
        } else {
          // If no old data, initialize with the new response
          queryClient.setQueryData("account", [response]);
        }
      },
    }
  );
}