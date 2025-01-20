import { v4 as uuidv4 } from "uuid";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Transaction from "../model/Transaction";
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

const setupNewTransaction = (
  payload: Transaction,
  accountNameOwner: string,
): Transaction => {
  return {
    guid: uuidv4(),
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
): Promise<any> => {
  let endpoint = "https://finance.lan/api/transaction/insert";
  if (isFutureTransaction) {
    endpoint = "/transaction/future/insert";
    console.log("Will insert futureTransaction");
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
      if (response.status === 404) {
        console.log("Endpoint not found:", endpoint);
        //throw new Error("Resource not found (404)");
        return payload;
      }
      throw new Error(`Failed to insert transaction: ${response.statusText}`);
    }

    const data = await response.json();
    console.log("Response data:", JSON.stringify(data));
    return data;
  } catch (error) {
    console.log("Error inserting transaction:", error);
    // throw error; // Allow react-query to handle it
    return payload;
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
      console.error(`Mutation error: ${error.message}`);
    },
    onSuccess: (response: Transaction) => {
      const oldData: Transaction[] =
        queryClient.getQueryData(getAccountKey(accountNameOwner)) || [];
      const newData = [response, ...oldData];
      queryClient.setQueryData(getAccountKey(accountNameOwner), newData);
    },
  });
}
