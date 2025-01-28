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
      
      // Ensure the index is based on guid instead of transactionId
      const updatedRow = variables.newRow;
      
      if (variables.oldRow.accountNameOwner === variables.newRow.accountNameOwner) {
        const dataUpdate = oldData.map((row: Transaction) =>
          row.guid === updatedRow.guid ? updatedRow : row
        );
    
        newData = [...dataUpdate];
    
        // Update totals if amounts have changed
        if (variables.oldRow.amount !== variables.newRow.amount) {
          const totals: any = queryClient.getQueryData(
            getTotalsKey(variables.newRow.accountNameOwner),
          );
          
          const oldTransactionStateKey = "totals" + variables.oldRow.transactionState;
          const newTransactionStateKey = "totals" + variables.newRow.transactionState;
          const difference = variables.newRow.amount - variables.oldRow.amount;
    
          totals.totals += difference;
    
          if (variables.newRow.transactionState === variables.oldRow.transactionState) {
            totals[newTransactionStateKey] += difference;
          } else {
            totals[oldTransactionStateKey] -= variables.oldRow.amount;
            totals[newTransactionStateKey] += variables.oldRow.amount + difference;
          }
    
          queryClient.setQueryData(
            getTotalsKey(variables.newRow.accountNameOwner),
            totals,
          );
        }
      } else {
        // If the account has changed, remove the old row
        const dataDelete = oldData.filter(
          (row: Transaction) => row.guid !== variables.oldRow.guid
        );
    
        newData = [...dataDelete];
    
        // Update totals if needed (subtract from old account totals)
        // Potentially handle adding to new account totals if necessary
      }
    
      // Set the updated data back to query client
      queryClient.setQueryData(
        getAccountKey(variables.oldRow.accountNameOwner),
        newData,
      );
    }
  });
}
