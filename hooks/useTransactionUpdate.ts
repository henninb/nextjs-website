import { useMutation, useQueryClient } from "@tanstack/react-query";
import Transaction from "../model/Transaction";
import Totals from "../model/Totals";
import { UpdateTransactionOptions } from "../model/UpdateTransactionOptions";

export const getTotalsKey = (accountNameOwner: string) => [
  "totals",
  accountNameOwner,
];

export const getAccountKey = (accountNameOwner: string) => [
  "accounts",
  accountNameOwner,
];

export const isValidGuid = (guid) => {
  // Validate against a UUID format (e.g., UUID v4)
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(guid);
};

export const sanitizeGuid = (guid) => {
  if (!isValidGuid(guid)) {
    throw new Error("Invalid GUID provided");
  }
  return encodeURIComponent(guid); // Escape the GUID for safe use in URLs
};

export const updateTransaction = async (
  newData: Transaction,
  oldData: Transaction,
  options?: UpdateTransactionOptions,
): Promise<Transaction> => {
  try {
    const sanitizedGuid = sanitizeGuid(oldData.guid);

    const endpoint = `/api/transaction/${sanitizedGuid}`;

    if (newData.receiptImage !== undefined) {
      newData["receiptImage"].image = newData["receiptImage"].image.replace(
        /^data:image\/[a-z]+;base64,/,
        "",
      );
    }
    console.log("newData:" + JSON.stringify(newData));

    const response = await fetch(endpoint, {
      method: "PUT",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
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
    onError: (error: any) => {
      // Type the error
      console.log(error ? error : "error is undefined.");
    },

    onSuccess: (response, variables) => {
      const oldAccountKey = getAccountKey(variables.oldRow.accountNameOwner);
      const newAccountKey = getAccountKey(variables.newRow.accountNameOwner);
      const oldTotalsKey = getTotalsKey(variables.oldRow.accountNameOwner);
      const newTotalsKey = getTotalsKey(variables.newRow.accountNameOwner);

      const updatedRow = variables.newRow;
      const oldData = queryClient.getQueryData(oldAccountKey) as Transaction[];

      if (
        variables.oldRow.accountNameOwner === variables.newRow.accountNameOwner
      ) {
        // Same account update
        const newData = oldData.map((row: Transaction) =>
          row.guid === updatedRow.guid ? updatedRow : row,
        );

        // *** KEY CHANGE: Clone the existing totals or create a new one ***
        let totals: Totals = {
          ...(queryClient.getQueryData(oldTotalsKey) || {
            totals: 0,
            totalsFuture: 0,
            totalsCleared: 0,
            totalsOutstanding: 0,
          }),
        };

        const difference = variables.newRow.amount - variables.oldRow.amount;

        if (variables.oldRow.amount !== variables.newRow.amount) {
          totals.totals += difference;
          if (variables.oldRow.transactionState === "future") {
            totals.totalsFuture += difference;
          } else if (variables.oldRow.transactionState === "cleared") {
            totals.totalsCleared += difference;
          } else if (variables.oldRow.transactionState === "outstanding") {
            totals.totalsOutstanding += difference;
          }
        }

        if (
          variables.oldRow.transactionState !==
          variables.newRow.transactionState
        ) {
          const amount = variables.newRow.amount;

          // Deduct from old state
          if (variables.oldRow.transactionState === "future") {
            totals.totalsFuture -= amount;
          } else if (variables.oldRow.transactionState === "cleared") {
            totals.totalsCleared -= amount;
          } else if (variables.oldRow.transactionState === "outstanding") {
            totals.totalsOutstanding -= amount;
          }

          // Add to new state
          if (variables.newRow.transactionState === "future") {
            totals.totalsFuture += amount;
          } else if (variables.newRow.transactionState === "cleared") {
            totals.totalsCleared += amount;
          } else if (variables.newRow.transactionState === "outstanding") {
            totals.totalsOutstanding += amount;
          }
        }

        queryClient.setQueryData(oldTotalsKey, totals);
        queryClient.setQueryData(oldAccountKey, newData); // Update transactions
      } else {
        // Different account update
        const newData = oldData.filter(
          (row: Transaction) => row.guid !== variables.oldRow.guid,
        );

        let oldTotals: Totals = {
          ...(queryClient.getQueryData(oldTotalsKey) || {
            totals: 0,
            totalsFuture: 0,
            totalsCleared: 0,
            totalsOutstanding: 0,
          }),
        };

        if (oldTotals) {
          const amount = variables.oldRow.amount;

          if (variables.oldRow.transactionState === "future") {
            oldTotals.totalsFuture -= amount;
          } else if (variables.oldRow.transactionState === "cleared") {
            oldTotals.totalsCleared -= amount;
          } else if (variables.oldRow.transactionState === "outstanding") {
            oldTotals.totalsOutstanding -= amount;
          }

          oldTotals.totals -= variables.oldRow.amount;
          queryClient.setQueryData(oldTotalsKey, oldTotals);
        }

        // For destination account, we need to invalidate both transactions and totals
        // because we don't have the complete current state to do accurate calculations
        queryClient.invalidateQueries({ queryKey: newAccountKey });
        queryClient.invalidateQueries({ queryKey: newTotalsKey });
        queryClient.setQueryData(oldAccountKey, newData); // Update transactions
      }
    },
  });
}
