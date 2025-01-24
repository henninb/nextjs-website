import { useMutation, useQueryClient } from "@tanstack/react-query";
import Transaction from "../model/Transaction";
import { UpdateTransactionOptions } from "../model/UpdateTransactionOptions";
//import { basicAuth } from "../Common";

const getTotalsKey = (accountNameOwner: string) => ["totals", accountNameOwner];

const getAccountKey = (accountNameOwner: string) => [
  "accounts",
  accountNameOwner,
];

// type UpdateTransactionOptions = {
//   isStateUpdate?: boolean; // Add this option
// };

const updateTransaction = async (
  newData: Transaction,
  oldData: Transaction,
  options?: UpdateTransactionOptions,
): Promise<Transaction> => {
  try {
    const endpoint =
      "https://finance.lan/api/transaction/update/" + oldData.guid;

    if (newData.receiptImage !== undefined) {
      newData["receiptImage"].image = newData["receiptImage"].image.replace(
        /^data:image\/[a-z]+;base64,/,
        "",
      );
    }
    console.log("newData:" + JSON.stringify(newData));

    const response = await fetch(endpoint, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        //Authorization: basicAuth(),
      },
      body: JSON.stringify(newData),
    });

    if (!response.ok) {
      if (response.status === 404) {
        console.log("Resource not found (404).");
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.log("Error updating transaction:", error);
    return newData;
  }
};

export default function useTransactionUpdate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["updateTransaction"],
    mutationFn: (variables: {
      newRow: Transaction;
      oldRow: Transaction;
      options?: UpdateTransactionOptions;
    }) => updateTransaction(variables.newRow, variables.oldRow),
    onError: (error) => {
      console.log(error ? error : "error is undefined.");
    },
    onSuccess: (response, variables) => {
      const oldData: any = queryClient.getQueryData(
        getAccountKey(variables.oldRow.accountNameOwner),
      );
      let newData: any;
      if (
        variables.oldRow.accountNameOwner === variables.newRow.accountNameOwner
      ) {
        const dataUpdate = [...oldData];
        const index: any = variables.oldRow.transactionId;
        dataUpdate[index] = variables.newRow;
        newData = [...dataUpdate];
        //TODO: update accountTotals if amounts are different
        if (variables.oldRow.amount !== variables.newRow.amount) {
          const totals: any = queryClient.getQueryData(
            getTotalsKey(variables.newRow.accountNameOwner),
          );
          const oldTransactionStateKey =
            "totals" + variables.oldRow.transactionState;
          const newTransactionStateKey =
            "totals" + variables.newRow.transactionState;
          const difference = variables.newRow.amount - variables.oldRow.amount;
          totals.totals += difference;
          if (
            variables.newRow.transactionState ===
            variables.oldRow.transactionState
          ) {
            totals[newTransactionStateKey] += difference;
            queryClient.setQueryData(
              getTotalsKey(variables.newRow.accountNameOwner),
              totals,
            );
          } else {
            totals[oldTransactionStateKey] =
              totals[oldTransactionStateKey] - variables.oldRow.amount;
            totals[newTransactionStateKey] =
              totals[newTransactionStateKey] +
              variables.oldRow.amount +
              difference;
            console.log(JSON.stringify(totals));
            queryClient.setQueryData(
              getTotalsKey(variables.newRow.accountNameOwner),
              totals,
            );
          }
        }
      } else {
        const dataDelete = [...oldData];
        const index: any = variables.oldRow.transactionId;
        dataDelete.splice(index, 1);
        newData = [...dataDelete];
        //TODO: add to other accountNameOwner list
        //TODO: update accountTotals (subtract)
      }

      queryClient.setQueryData(
        getAccountKey(variables.oldRow.accountNameOwner),
        newData,
      );
    },
  });
}
