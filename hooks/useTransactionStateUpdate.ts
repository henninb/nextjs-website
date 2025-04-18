//import { basicAuth } from "../Common";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { TransactionState } from "../model/TransactionState";
import Transaction from "../model/Transaction";

const getAccountKey = (accountNameOwner: string) => [
  "accounts",
  accountNameOwner,
];

const changeTransactionState = async (
  guid: string,
  newTransactionState: TransactionState,
): Promise<Transaction> => {
  const endpoint = `https://finance.bhenning.com/api/transaction/state/update/${guid}/${newTransactionState}`;
  try {
    const response = await fetch(endpoint, {
      method: "PUT",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        //Authorization: basicAuth(),
      },
      body: JSON.stringify({}),
    });

    if (response.status === 404) {
      console.log("Resource not found (404).");
    }

    if (!response.ok) {
      throw new Error(
        `Failed to update transaction state: ${response.statusText}`,
      );
    }

    return await response.json();
  } catch (error: any) {
    console.log(`An error occurred: ${error.message}`);
    throw error;
  }
};

export default function useTransactionStateUpdate(accountNameOwner: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["transactionState"],
    mutationFn: (variables: {
      guid: string;
      transactionState: TransactionState;
    }) => changeTransactionState(variables.guid, variables.transactionState),
    onError: (error: any) => {
      console.log(`Error occurred during mutation: ${error.message}`);
    },
    onSuccess: (response: Transaction) => {
      const oldData: Transaction[] =
        queryClient.getQueryData(getAccountKey(accountNameOwner)) || [];
      const newData = oldData.map((element) => {
        console.log(
          `Processing element with transactionState: ${element.transactionState} and response.transactionState: ${response.transactionState}`,
        );
        return element.transactionState === response.transactionState
          ? { ...element, transactionState: response.transactionState }
          : element;
      });

      queryClient.setQueryData(getAccountKey(accountNameOwner), newData);
    },
  });
}
