//import { v4 as uuidv4 } from "uuid";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Transaction from "../model/Transaction";
import Totals from "../model/Totals";
//import { basicAuth } from "../Common";

export type TransactionInsertType = {
  accountNameOwner: string;
  newRow: Transaction;
  isFutureTransaction: boolean;
};

const getAccountKey = (accountNameOwner: string) => [
  "accounts",
  accountNameOwner,
];

const getTotalsKey = (accountNameOwner: string) => ["totals", accountNameOwner];

const setupNewTransaction = (
  payload: Transaction,
  accountNameOwner: string,
): Transaction => {
  return {
    guid: crypto.randomUUID(),
    transactionDate: payload.transactionDate,
    description: payload.description,
    category: payload.category || "undefined",
    notes: payload.notes || "",
    amount: payload.amount,
    dueDate: payload.dueDate || undefined,
    transactionType: payload.transactionType || "undefined",
    transactionState: payload.transactionState || "outstanding",
    activeStatus: true,
    accountType: payload.accountType || "undefined",
    reoccurringType: payload.reoccurringType || "onetime",
    accountNameOwner: accountNameOwner,
  };
};

const insertTransaction = async (
  accountNameOwner: string,
  payload: Transaction,
  isFutureTransaction: boolean,
): Promise<Transaction> => {
  let endpoint = "https://finance.lan/api/transaction/insert";
  if (isFutureTransaction) {
    endpoint = "https://finance.lan/api/transaction/future/insert";
  }

  const newPayload = setupNewTransaction(payload, accountNameOwner);

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        //Authorization: basicAuth(),
      },
      body: JSON.stringify(newPayload),
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
  } catch (error) {
    console.log(`An error occurred: ${error.message}`);
    throw error;
  }
};

export default function useTransactionInsert(accountNameOwner: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["insertTransaction"],
    mutationFn: (variables: TransactionInsertType) =>
      insertTransaction(
        accountNameOwner,
        variables.newRow,
        variables.isFutureTransaction,
      ),
    onError: (error: any) => {
      console.log(`Mutation error: ${error.message}`);
    },
    onSuccess: (response: Transaction) => {
      const oldData: Transaction[] =
        queryClient.getQueryData(getAccountKey(accountNameOwner)) || [];
      queryClient.setQueryData(getAccountKey(accountNameOwner), [
        response,
        ...oldData,
      ]);

      const oldTotals: Totals = queryClient.getQueryData(
        getTotalsKey(accountNameOwner),
      ) || {
        totals: 0,
        totalsFuture: 0,
        totalsCleared: 0,
        totalsOutstanding: 0,
      };

      const newTotals = { ...oldTotals };

      // Adjust totals based on transaction state
      newTotals.totals += response.amount;

      if (response.transactionState === "cleared") {
        newTotals.totalsCleared += response.amount;
      } else if (response.transactionState === "outstanding") {
        newTotals.totalsOutstanding += response.amount;
      } else if (response.transactionState === "future") {
        newTotals.totalsFuture += response.amount;
      } else {
        console.log("cannot adjust totals.");
      }

      queryClient.setQueryData(getTotalsKey(accountNameOwner), newTotals);
    },
  });
}
