import { useMutation, useQueryClient } from "@tanstack/react-query";
import Transaction from "../model/Transaction";
import { UpdateTransactionOptions } from "../model/UpdateTransactionOptions";
//import { basicAuth } from "../Common";

const getTotalsKey = (accountNameOwner: string) => ["totals", accountNameOwner];

const getAccountKey = (accountNameOwner: string) => [
  "accounts",
  accountNameOwner,
];

const isValidGuid = (guid) => {
  // Validate against a UUID format (e.g., UUID v4)
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(guid);
};

const sanitizeGuid = (guid) => {
  if (!isValidGuid(guid)) {
    throw new Error("Invalid GUID provided");
  }
  return encodeURIComponent(guid); // Escape the GUID for safe use in URLs
};

const updateTransaction = async (
  newData: Transaction,
  oldData: Transaction,
  options?: UpdateTransactionOptions,
): Promise<Transaction> => {
  try {
    const sanitizedGuid = sanitizeGuid(oldData.guid);

    const endpoint = `https://finance.lan/api/transaction/update/${sanitizedGuid}`;

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
    console.log(`An error occurred: ${error.message}`);
    throw error;
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
      const oldAccountKey = getAccountKey(variables.oldRow.accountNameOwner);
      const newAccountKey = getAccountKey(variables.newRow.accountNameOwner);
      const oldTotalsKey = ["totals", variables.oldRow.accountNameOwner];
      const newTotalsKey = ["totals", variables.newRow.accountNameOwner];

      const updatedRow = variables.newRow;
      const oldData: any = queryClient.getQueryData(oldAccountKey);
      let newData: any;

      // Case 1: Updating transaction in the same account
      if (variables.oldRow.accountNameOwner === variables.newRow.accountNameOwner) {
        newData = oldData.map((row: Transaction) =>
          row.guid === updatedRow.guid ? updatedRow : row
        );

        //const totals: any = queryClient.getQueryData(oldTotalsKey);
        const totals: any = queryClient.getQueryData(oldTotalsKey) || {};

// Ensure all buckets exist
totals.totalsFuture = totals.totalsFuture ?? 0;
totals.totalsCleared = totals.totalsCleared ?? 0;
totals.totalsOutstanding = totals.totalsOutstanding ?? 0;

        // If only amount changed, update correct bucket
        if (variables.oldRow.amount !== variables.newRow.amount) {
          const difference = variables.newRow.amount - variables.oldRow.amount;

          if (variables.oldRow.transactionState === 'future') {
            totals.totalsFuture += difference;
          } else if (variables.oldRow.transactionState === 'cleared') {
            totals.totalsCleared += difference;
          } else if (variables.oldRow.transactionState === 'outstanding') {
            totals.totalsOutstanding += difference;
          }
        }

        // If transaction state changed, move between buckets
        if (variables.oldRow.transactionState !== variables.newRow.transactionState) {
          const amount = variables.newRow.amount;

          // Remove from old bucket
          if (variables.oldRow.transactionState === 'future') {
            totals.totalsFuture -= amount;
          } else if (variables.oldRow.transactionState === 'cleared') {
            totals.totalsCleared -= amount;
          } else if (variables.oldRow.transactionState === 'outstanding') {
            totals.totalsOutstanding -= amount;
          }

          // Add to new bucket
          if (variables.newRow.transactionState === 'future') {
            totals.totalsFuture += amount;
          } else if (variables.newRow.transactionState === 'cleared') {
            totals.totalsCleared += amount;
          } else if (variables.newRow.transactionState === 'outstanding') {
            totals.totalsOutstanding += amount;
          }
        }

        queryClient.setQueryData(oldTotalsKey, totals);
      } else {
        // Case 2: Transaction moved to a different account
        newData = oldData.filter((row: Transaction) => row.guid !== variables.oldRow.guid);

        // Remove from old account totals
        const oldTotals: any = queryClient.getQueryData(oldTotalsKey);
        if (oldTotals) {
          const amount = variables.oldRow.amount;

          if (variables.oldRow.transactionState === 'future') {
            oldTotals.totalsFuture -= amount;
          } else if (variables.oldRow.transactionState === 'cleared') {
            oldTotals.totalsCleared -= amount;
          } else if (variables.oldRow.transactionState === 'outstanding') {
            oldTotals.totalsOutstanding -= amount;
          }

          // Subtract from the old account's total
oldTotals.totals -= variables.oldRow.amount;

          queryClient.setQueryData(oldTotalsKey, oldTotals);
        }

        // Add to new account
        const newAccountData: any = queryClient.getQueryData(newAccountKey) || [];
        queryClient.setQueryData(newAccountKey, [...newAccountData, updatedRow]);

        // const newTotals: any = queryClient.getQueryData(newTotalsKey) || {
        //   totals: 0,
        //   totalsFuture: 0,
        //   totalsCleared: 0,
        //   totalsOutstanding: 0,
        // };
        const newTotals: any = queryClient.getQueryData(newTotalsKey) || {};

// Ensure all buckets exist
newTotals.totalsFuture = newTotals.totalsFuture ?? 0;
newTotals.totalsCleared = newTotals.totalsCleared ?? 0;
newTotals.totalsOutstanding = newTotals.totalsOutstanding ?? 0;

        if (variables.newRow.transactionState === 'future') {
          newTotals.totalsFuture += variables.newRow.amount;
        } else if (variables.newRow.transactionState === 'cleared') {
          newTotals.totalsCleared += variables.newRow.amount;
        } else if (variables.newRow.transactionState === 'outstanding') {
          newTotals.totalsOutstanding += variables.newRow.amount;
        }

        queryClient.setQueryData(newTotalsKey, newTotals);
      }

      // Set updated transaction data
      queryClient.setQueryData(oldAccountKey, newData);
    },
  });
}


// export default function useTransactionUpdate() {
//   const queryClient = useQueryClient();

//   return useMutation({
//     mutationKey: ["updateTransaction"],
//     mutationFn: (variables: {
//       newRow: Transaction;
//       oldRow: Transaction;
//       options?: UpdateTransactionOptions;
//     }) => updateTransaction(variables.newRow, variables.oldRow),
//     onError: (error) => {
//       console.log(error ? error : "error is undefined.");
//     },

//     onSuccess: (response, variables) => {
//       const accountKey = getAccountKey(variables.oldRow.accountNameOwner);
//       const totalsKey = ["totals", variables.oldRow.accountNameOwner];
//       const updatedRow = variables.newRow;

//       const oldData: any = queryClient.getQueryData(accountKey);
//       let newData: any;

//       if (variables.oldRow.accountNameOwner === variables.newRow.accountNameOwner) {
//         // Update the transaction in the same account
//         const dataUpdate = oldData.map((row: Transaction) =>
//           row.guid === updatedRow.guid ? updatedRow : row
//         );
//         newData = [...dataUpdate];

//         // Update totals if amounts have changed
//         if (variables.oldRow.amount !== variables.newRow.amount) {
//           const totals: any = queryClient.getQueryData(totalsKey);

//           const difference = variables.newRow.amount - variables.oldRow.amount;

//           // Update general totals
//           totals.totals += difference;

//           // Update totals based on transaction states
//           if (variables.newRow.transactionState === 'future') {
//             totals.totalsFuture += difference;
//             totals.totalsCleared -= difference; // Remove from cleared if state changes
//           } else if (variables.newRow.transactionState === 'cleared') {
//             totals.totalsCleared += difference;
//             totals.totalsFuture -= difference; // Remove from future if state changes
//           } else if (variables.newRow.transactionState === 'outstanding') {
//             totals.totalsOutstanding += difference;
//             totals.totalsFuture -= difference; // Remove from future if state changes
//           }

//           queryClient.setQueryData(totalsKey, totals);
//         }
//       } else {
//         // If the account has changed, remove the old row and add to the new account
//         const oldAccountData = oldData.filter(
//           (row: Transaction) => row.guid !== variables.oldRow.guid
//         );

//         // Remove the old transaction from the old account's totals
//         const oldTotals: any = queryClient.getQueryData(
//           ["totals", variables.oldRow.accountNameOwner]
//         );
//         if (oldTotals) {
//           const oldDifference = variables.oldRow.amount;

//           oldTotals.totals -= oldDifference;

//           if (variables.oldRow.transactionState === 'future') {
//             oldTotals.totalsFuture -= oldDifference;
//           } else if (variables.oldRow.transactionState === 'cleared') {
//             oldTotals.totalsCleared -= oldDifference;
//           }

//           queryClient.setQueryData(
//             ["totals", variables.oldRow.accountNameOwner],
//             oldTotals
//           );
//         }

//         // Update new account's data and totals
//         const newAccountData : any = queryClient.getQueryData(
//           getAccountKey(variables.newRow.accountNameOwner)
//         ) || [];
//         const newAccountDataWithUpdatedTransaction = [
//           ...newAccountData,
//           updatedRow,
//         ];
//         queryClient.setQueryData(
//           getAccountKey(variables.newRow.accountNameOwner),
//           newAccountDataWithUpdatedTransaction
//         );

//         // Update totals for the new account
//         const newTotals: any = queryClient.getQueryData(
//           ["totals", variables.newRow.accountNameOwner]
//         ) || { totals: 0, totalsFuture: 0, totalsCleared: 0 };

//         newTotals.totals += variables.newRow.amount;

//         if (variables.newRow.transactionState === 'future') {
//           newTotals.totalsFuture += variables.newRow.amount;
//         } else if (variables.newRow.transactionState === 'cleared') {
//           newTotals.totalsCleared += variables.newRow.amount;
//         } else if (variables.newRow.transactionState === 'outstanding') {
//           newTotals.totalsOutstanding += variables.newRow.amount;
//         }

//         queryClient.setQueryData(
//           ["totals", variables.newRow.accountNameOwner],
//           newTotals
//         );

//         newData = oldAccountData;
//       }

//       // Set the updated data back to the query client
//       queryClient.setQueryData(accountKey, newData);
//     },
//   });
// }

// export default function useTransactionUpdate() {
//   const queryClient = useQueryClient();

//   return useMutation({
//     mutationKey: ["updateTransaction"],
//     mutationFn: (variables: {
//       newRow: Transaction;
//       oldRow: Transaction;
//       options?: UpdateTransactionOptions;
//     }) => updateTransaction(variables.newRow, variables.oldRow),
//     onError: (error) => {
//       console.log(error ? error : "error is undefined.");
//     },

//     onSuccess: (response, variables) => {
//       const oldData: any = queryClient.getQueryData(
//         getAccountKey(variables.oldRow.accountNameOwner),
//       );
//       const accountKey = getAccountKey(variables.oldRow.accountNameOwner);
//       const totalsKey = ["totals", variables.oldRow.accountNameOwner];

//       let newData: any;
//       const updatedRow = variables.newRow;

//       if (variables.oldRow.accountNameOwner === variables.newRow.accountNameOwner) {
//         // Update the transaction within the same account
//         const dataUpdate = oldData.map((row: Transaction) =>
//           row.guid === updatedRow.guid ? updatedRow : row,
//         );
//         newData = [...dataUpdate];

//         // Update totals if amounts have changed
//         if (variables.oldRow.amount !== variables.newRow.amount) {
//           const totals: any = queryClient.getQueryData(totalsKey);

//           const difference = variables.newRow.amount - variables.oldRow.amount;

//           // Update totals object based on transaction state
//           totals.totals += difference;
//           const transactionStateKey = "totals" + variables.newRow.transactionState;

//           totals[transactionStateKey] += difference;

//           queryClient.setQueryData(totalsKey, totals);
//         }
//       } else {
//         // If the account has changed, remove the old transaction from the old account
//         const dataDelete = oldData.filter((row: Transaction) => row.guid !== variables.oldRow.guid);
//         newData = [...dataDelete];

//         // Subtract from old account totals
//         const oldTotals: any = queryClient.getQueryData(
//           ["totals", variables.oldRow.accountNameOwner],
//         );
//         if (oldTotals) {
//           const oldDifference = variables.oldRow.amount;
//           oldTotals.totals -= oldDifference;
//           const oldTransactionStateKey = "totals" + variables.oldRow.transactionState;
//           oldTotals[oldTransactionStateKey] -= oldDifference;

//           queryClient.setQueryData(
//             ["totals", variables.oldRow.accountNameOwner],
//             oldTotals,
//           );
//         }

//         // Add to new account totals
//         const newTotals: any = queryClient.getQueryData(
//           ["totals", variables.newRow.accountNameOwner],
//         ) || { totals: 0.0, totalsFuture: 0.0, totalsCleared: 0.0 };

//         const newDifference = variables.newRow.amount;
//         newTotals.totals += newDifference;
//         const newTransactionStateKey = "totals" + variables.newRow.transactionState;
//         newTotals[newTransactionStateKey] += newDifference;

//         queryClient.setQueryData(
//           ["totals", variables.newRow.accountNameOwner],
//           newTotals,
//         );

//         // Add the transaction to the new account's data
//         const newAccountData: any = queryClient.getQueryData(
//           getAccountKey(variables.newRow.accountNameOwner),
//         ) || [];
//         const updatedNewAccountData = [...newAccountData, updatedRow];

//         queryClient.setQueryData(
//           getAccountKey(variables.newRow.accountNameOwner),
//           updatedNewAccountData,
//         );
//       }

//       // Set the updated data back to query client for the old account
//       queryClient.setQueryData(accountKey, newData);
//     },
//   });
// }

// // export default function useTransactionUpdate() {
// //   const queryClient = useQueryClient();

// //   return useMutation({
// //     mutationKey: ["updateTransaction"],
// //     mutationFn: (variables: {
// //       newRow: Transaction;
// //       oldRow: Transaction;
// //       options?: UpdateTransactionOptions;
// //     }) => updateTransaction(variables.newRow, variables.oldRow),
// //     onError: (error) => {
// //       console.log(error ? error : "error is undefined.");
// //     },

// //     onSuccess: (response, variables) => {
// //       const accountKey = getAccountKey(variables.oldRow.accountNameOwner);
// //       const totalsKeyOld = ["totals", variables.oldRow.accountNameOwner];
// //       const totalsKeyNew = ["totals", variables.newRow.accountNameOwner];

// //       // Fetch the existing data for the account
// //       const oldData: [Transaction] | undefined = queryClient.getQueryData(accountKey);
// //       if (!oldData) {
// //         console.log("No data found for account:", accountKey);
// //         return;
// //       }

// //       // Update the transaction data
// //       const newData = oldData.map((row: Transaction) =>
// //         row.guid === variables.oldRow.guid ? variables.newRow : row,
// //       );

// //       // Update the data in the query cache
// //       queryClient.setQueryData(accountKey, newData);

// //       // Handle totals updates if the amount has changed
// //       if (variables.oldRow.amount !== variables.newRow.amount) {
// //         // Update totals for the old account (subtract the old amount)
// //         const totalsOld: any = queryClient.getQueryData(totalsKeyOld);
// //         if (totalsOld) {
// //           const oldAmount = variables.oldRow.amount;
// //           totalsOld.totals -= oldAmount;
// //           const oldTransactionStateKey = "totals" + variables.oldRow.transactionState;
// //           totalsOld[oldTransactionStateKey] -= oldAmount;

// //           queryClient.setQueryData(totalsKeyOld, totalsOld);
// //         }

// //         // Update totals for the new account (add the new amount)
// //         const totalsNew: any = queryClient.getQueryData(totalsKeyNew);
// //         if (totalsNew) {
// //           const newAmount = variables.newRow.amount;
// //           totalsNew.totals += newAmount;
// //           const newTransactionStateKey = "totals" + variables.newRow.transactionState;
// //           totalsNew[newTransactionStateKey] = (totalsNew[newTransactionStateKey] || 0) + newAmount;

// //           queryClient.setQueryData(totalsKeyNew, totalsNew);
// //         }
// //       } else if (variables.oldRow.accountNameOwner !== variables.newRow.accountNameOwner) {
// //         // Handle account switch
// //         const oldTotals: any = queryClient.getQueryData(totalsKeyOld);
// //         if (oldTotals) {
// //           const oldAmount = variables.oldRow.amount;
// //           oldTotals.totals -= oldAmount;
// //           const oldTransactionStateKey = "totals" + variables.oldRow.transactionState;
// //           oldTotals[oldTransactionStateKey] -= oldAmount;

// //           queryClient.setQueryData(totalsKeyOld, oldTotals);
// //         }

// //         const newTotals: any = queryClient.getQueryData(totalsKeyNew);
// //         if (newTotals) {
// //           const newAmount = variables.newRow.amount;
// //           newTotals.totals += newAmount;
// //           const newTransactionStateKey = "totals" + variables.newRow.transactionState;
// //           newTotals[newTransactionStateKey] = (newTotals[newTransactionStateKey] || 0) + newAmount;

// //           queryClient.setQueryData(totalsKeyNew, newTotals);
// //         }
// //       }
// //     },
// //   });
// // }


// // export default function useTransactionUpdate() {
// //   const queryClient = useQueryClient();

// //   return useMutation({
// //     mutationKey: ["updateTransaction"],
// //     mutationFn: (variables: {
// //       newRow: Transaction;
// //       oldRow: Transaction;
// //       options?: UpdateTransactionOptions;
// //     }) => updateTransaction(variables.newRow, variables.oldRow),
// //     onError: (error) => {
// //       console.log(error ? error : "error is undefined.");
// //     },

// //     onSuccess: (response, variables) => {
// //       const oldData: any = queryClient.getQueryData(
// //         getAccountKey(variables.oldRow.accountNameOwner),
// //       );

// //       let newData: any;

// //       const accountKey = getAccountKey(variables.oldRow.accountNameOwner);
// //       const totalsKey = ["totals", variables.oldRow.accountNameOwner];

// //       // Ensure the index is based on guid instead of transactionId
// //       const updatedRow = variables.newRow;

// //       if (
// //         variables.oldRow.accountNameOwner === variables.newRow.accountNameOwner
// //       ) {
// //         const dataUpdate = oldData.map((row: Transaction) =>
// //           row.guid === updatedRow.guid ? updatedRow : row,
// //         );

// //         newData = [...dataUpdate];

// //         // Update totals if amounts have changed
// //         if (variables.oldRow.amount !== variables.newRow.amount) {
// //           const totals: any = queryClient.getQueryData(
// //             getTotalsKey(variables.newRow.accountNameOwner),
// //           );

// //           const oldTransactionStateKey =
// //             "totals" + variables.oldRow.transactionState;
// //           const newTransactionStateKey =
// //             "totals" + variables.newRow.transactionState;
// //           const difference = variables.newRow.amount - variables.oldRow.amount;

// //           totals.totals += difference;

// //           if (
// //             variables.newRow.transactionState ===
// //             variables.oldRow.transactionState
// //           ) {
// //             totals[newTransactionStateKey] += difference;
// //           } else {
// //             totals[oldTransactionStateKey] -= variables.oldRow.amount;
// //             totals[newTransactionStateKey] +=
// //               variables.oldRow.amount + difference;
// //           }

// //           queryClient.setQueryData(
// //             getTotalsKey(variables.newRow.accountNameOwner),
// //             totals,
// //           );
// //         }
// //       } else {
// //         // If the account has changed, remove the old row
// //         const dataDelete = oldData.filter(
// //           (row: Transaction) => row.guid !== variables.oldRow.guid,
// //         );

// //         newData = [...dataDelete];

// //         // Update totals if needed (subtract from old account totals)
// //         // Potentially handle adding to new account totals if necessary
// //       }

// //       // Set the updated data back to query client
// //       queryClient.setQueryData(
// //         getAccountKey(variables.oldRow.accountNameOwner),
// //         newData,
// //       );
// //     },
// //   });
// // }
