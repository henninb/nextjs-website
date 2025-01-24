//import { basicAuth } from "../Common";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { TransactionState } from "../model/TransactionState";
import Transaction from "../model/Transaction";

const dataTest: Transaction = {
  transactionId: 10544,
  guid: "299b36b1-a49f-43bc-aaa5-ba78352f716a",
  accountId: 1029,
  accountType: "credit",
  transactionType: "undefined",
  accountNameOwner: "barclay-cash_brian",
  transactionDate: new Date("2017-09-17"),
  description: "balance adjustment",
  category: "none",
  amount: 1.99,
  transactionState: "future",
  activeStatus: true,
  reoccurringType: "onetime",
  notes: "",
};

const getAccountKey = (accountNameOwner: string) => [
  "accounts",
  accountNameOwner,
];

const changeTransactionState = async (
  guid: string,
  newTransactionState: TransactionState,
): Promise<Transaction> => {
  const endpoint = `https://finance.lan/api/transaction/state/update/${guid}/${newTransactionState}`;
  try {
    const response = await fetch(endpoint, {
      method: "PUT",
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
    console.log("Error updating transaction state:", error.message);
    return dataTest;
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
      console.error(`Error occurred during mutation: ${error.message}`);
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
      // const newData = oldData.map((element) =>
      //   element.transactionState === response.transactionState
      //     ? { ...element, transactionState: response.transactionState }
      //     : element,
      // );

      queryClient.setQueryData(getAccountKey(accountNameOwner), newData);
    },
  });
}
