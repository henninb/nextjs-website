import { useMutation, useQueryClient } from "@tanstack/react-query";
import Account from "../model/Account";
//import { basicAuth } from "../Common";

const deleteAccount = async (payload: Account): Promise<Account | null> => {
  try {
    const endpoint = `https://finance.lan/api/account/delete/${payload.accountNameOwner}`;

    const response = await fetch(endpoint, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        credentials: "include",
        //Authorization: basicAuth(),
      },
    });

    if (!response.ok) {
      let errorMessage = "";

      try {
        const errorBody = await response.json();
        if (errorBody && errorBody.response) {
          errorMessage = `${errorBody.response}`;
        } else {
          console.log("No error message returned.");
          throw new Error("No error message returned.");
        }
      } catch (error) {
        console.log(`Failed to parse error response: ${error.message}`);
        throw new Error(`Failed to parse error response: ${error.message}`);
      }

      console.log(errorMessage || "cannot throw a null value");
      throw new Error(errorMessage || "cannot throw a null value");
    }

    return response.status !== 204 ? await response.json() : null;
  } catch (error: any) {
    console.log(`An error occurred: ${error.message}`);
    throw error;
  }
};

export default function useAccountDelete() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["deleteAccount"],
    mutationFn: (variables: { oldRow: Account }) =>
      deleteAccount(variables.oldRow),
    onError: (error: any) => {
      console.log(error ? error : "Error is undefined.");
    },
    onSuccess: (response, variables) => {
      const oldData: Account[] | undefined = queryClient.getQueryData([
        "account",
      ]);
      if (oldData) {
        const newData: Account[] = oldData.filter(
          (t: Account) => t.accountId !== variables.oldRow.accountId,
        );
        queryClient.setQueryData(["account"], newData);
      }
    },
  });
}
