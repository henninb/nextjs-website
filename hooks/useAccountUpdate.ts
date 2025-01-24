import { useMutation, useQueryClient } from "@tanstack/react-query";
//import { basicAuth } from "../Common";
import Account from "../model/Account";

const updateAccount = async (
  oldRow: Account,
  newRow: Account,
): Promise<Account> => {
  try {
    let endpoint = `https://finance.lan/api/account/update/${oldRow.accountNameOwner}`;

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
        console.log("Resource not found (404).", await response.json());
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error: any) {
    console.log(`An error occurred: ${error.message}`);
    return newRow;
  }
};

export default function useAccountUpdate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["updateAccount"],
    mutationFn: (variables: { oldRow: Account; newRow: Account }) =>
      updateAccount(variables.oldRow, variables.newRow),
    onError: (error: any) => {
      console.error(error ? error : "Error is undefined.");
    },
    onSuccess: (response: Account) => {
      const oldData: Account[] | undefined = queryClient.getQueryData([
        "account",
      ]);

      if (oldData) {
        // Update the existing data with the response
        const newData = oldData.map((account) =>
          account.accountNameOwner === response.accountNameOwner
            ? response
            : account,
        );
        queryClient.setQueryData(["account"], newData);
      } else {
        // If no old data, initialize with the new response
        queryClient.setQueryData(["account"], [response]);
      }
    },
  });
}
