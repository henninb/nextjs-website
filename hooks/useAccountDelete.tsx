import { useMutation, useQueryClient } from '@tanstack/react-query';
import Account from "../model/Account";
//import { basicAuth } from "../Common";

const deleteAccount = async (payload: Account): Promise<Account> => {
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
    //return { error: "An error occurred", details: error.message };
    throw new Error(`An error occurred: ${error.message}`);
  }
};

export default function useAccountDelete() {
  const queryClient = useQueryClient();

  return useMutation(
    {
      mutationKey: ['deleteAccount'],
      mutationFn: (variables: { oldRow: Account }) => deleteAccount(variables.oldRow),
      onError: (error: any) => {
        console.error(error ? error : 'Error is undefined.');
      },
      onSuccess: (response, variables) => {
        const oldData: Account[] | undefined = queryClient.getQueryData(['account']);
        if (oldData) {
          const newData = oldData.filter(
            (t: Account) => t.accountId !== variables.oldRow.accountId
          );
          queryClient.setQueryData(['account'], newData);
        }
      },
    }
  );
}