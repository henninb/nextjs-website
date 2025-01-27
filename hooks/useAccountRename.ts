import { useMutation, useQueryClient } from "@tanstack/react-query";
//import { basicAuth } from "../Common";
import Account from "../model/Account";

const renameAccount = async (
  oldAccountName: string,
  newAccountName: string,
): Promise<string> => {
  try {
    const endpoint = `https://finance.lan/api/account/rename?old=${encodeURIComponent(
      oldAccountName,
    )}&new=${encodeURIComponent(newAccountName)}`;

    const response = await fetch(endpoint, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        // Authorization: basicAuth(), // Uncomment if authentication is required
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        console.log("Resource not found (404).");
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return newAccountName; // Return the new account name on success
  } catch (error: any) {
    console.log(`An error occurred: ${error.message}`);
    //throw error;
    return newAccountName;
    // return  {
    //   "accountId": 1,
    //   "accountNameOwner": "wfargo-savings_brian",
    //   "accountType": "debit",
    //   "activeStatus": true,
    //   "moniker": "0000",
    //   "outstanding": 1500.25,
    //   "future": 200.0,
    //   "cleared": 1300.25,
    //   "validationDate": "2024-10-31"
    // }
  }
};

export default function useAccountRename() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["renameAccount"],
    mutationFn: (variables: {
      oldAccountName: string;
      newAccountName: string;
    }) => renameAccount(variables.oldAccountName, variables.newAccountName),
    onError: (error: any) => {
      console.error(error ? error : "Error is undefined.");
    },
    onSuccess: (newAccountName: string, variables) => {
      const { oldAccountName } = variables;
      const oldData = queryClient.getQueryData<Account[]>(["account"]);

      if (oldData) {
        // Update the data with the renamed account
        const newData = oldData.map((account) =>
          account.accountNameOwner === oldAccountName
            ? { ...account, accountNameOwner: newAccountName }
            : account,
        );
        queryClient.setQueryData(["account"], newData);
      } else {
        console.warn("No cached data found for accounts.");
      }
    },
  });
}
