import { useMutation, useQueryClient } from "@tanstack/react-query";
//import { basicAuth } from "../Common";
import Account from "../model/Account";

const renameAccount = async (
  oldAccountName: string,
  newAccountName: string
): Promise<string> => {
  try {
    const endpoint = `https://finance.lan/api/account/rename?old=${encodeURIComponent(
      oldAccountName
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
        console.log("Resource not found (404).", await response.json());
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return newAccountName; // Return the new account name on success
  } catch (error: any) {
    console.error(`An error occurred: ${error.message}`);
    throw error;
  }
};

export default function useAccountRename() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["renameAccount"],
    mutationFn: (variables: { oldAccountName: string; newAccountName: string }) =>
      renameAccount(variables.oldAccountName, variables.newAccountName),
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
            : account
        );
        queryClient.setQueryData(["account"], newData);
      } else {
        console.warn("No cached data found for accounts.");
      }
    },
  });
}
