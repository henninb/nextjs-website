import { useMutation, useQueryClient } from "@tanstack/react-query";
//import { basicAuth } from "../Common";
import Account from "../model/Account";

const updateAccount = async (
  oldRow: Account,
  newRow: Account,
): Promise<Account> => {
  try {
    let endpoint = `https://finance.bhenning.com/api/account/update/${oldRow.accountNameOwner}`;

    const response = await fetch(endpoint, {
      method: "PUT",
      credentials: "include",
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
    throw error;
  }
};

export default function useAccountUpdate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["updateAccount"],
    mutationFn: (variables: { oldRow: Account; newRow: Account }) =>
      updateAccount(variables.oldRow, variables.newRow),
    onError: (error: any) => {
      console.log(error ? error : "Error is undefined.");
    },
    onSuccess: (response: Account) => {
      const oldData: Account[] | undefined = queryClient.getQueryData([
        "account",
      ]);

      if (oldData) {
        // Use a stable identifier like accountId to find and update the account
        const newData = oldData.map((account) =>
          account.accountId === response.accountId ? response : account,
        );

        queryClient.setQueryData(["account"], newData);
      } else {
        // If no old data, initialize with the new response
        queryClient.setQueryData(["account"], [response]);
      }
    },
  });
}
