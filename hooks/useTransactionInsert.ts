//import { v4 as uuidv4 } from "uuid";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Transaction from "../model/Transaction";
import Totals from "../model/Totals";
import {
  DataValidator,
  hookValidators,
  ValidationError,
} from "../utils/validation";
import { generateSecureUUID } from "../utils/security/secureUUID";
//import { basicAuth } from "../Common";

export type TransactionInsertType = {
  accountNameOwner: string;
  newRow: Transaction;
  isFutureTransaction: boolean;
  isImportTransaction: boolean;
};

const getAccountKey = (accountNameOwner: string) => [
  "accounts",
  accountNameOwner,
];

const getTotalsKey = (accountNameOwner: string) => ["totals", accountNameOwner];

const setupNewTransaction = async (
  payload: Transaction,
  accountNameOwner: string,
): Promise<Transaction> => {
  // Generate secure UUID server-side
  const secureGuid = await generateSecureUUID();

  return {
    guid: secureGuid, // Now using secure server-side generation
    transactionDate: payload.transactionDate,
    description: payload.description,
    category: payload.category || "",
    notes: payload.notes || "",
    amount: payload.amount,
    dueDate: payload.dueDate || undefined,
    transactionType: payload.transactionType || "expense",
    transactionState: payload.transactionState || "outstanding",
    activeStatus: true,
    accountType: payload.accountType || "debit",
    reoccurringType: payload.reoccurringType || "onetime",
    accountNameOwner: payload.accountNameOwner || "",
  };
};

const insertTransaction = async (
  accountNameOwner: string,
  payload: Transaction,
  isFutureTransaction: boolean,
  isImportTransaction: boolean,
): Promise<Transaction> => {
  // Validate and sanitize the transaction data
  const validation = hookValidators.validateApiPayload(
    payload,
    DataValidator.validateTransaction,
    "insertTransaction",
  );

  if (!validation.isValid) {
    const errorMessages =
      validation.errors?.map((err) => err.message).join(", ") ||
      "Validation failed";
    throw new Error(`Transaction validation failed: ${errorMessages}`);
  }

  let endpoint = "/api/transaction/insert";
  if (isFutureTransaction) {
    endpoint = "/api/transaction/future/insert";
  }

  const newPayload = await setupNewTransaction(
    validation.validatedData,
    accountNameOwner,
  );

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
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

export default function useTransactionInsert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["insertTransaction"],
    mutationFn: (variables: TransactionInsertType) =>
      insertTransaction(
        variables.newRow.accountNameOwner,
        variables.newRow,
        variables.isFutureTransaction,
        variables.isImportTransaction,
      ),
    onError: (error: any) => {
      console.log(`Mutation error: ${error.message}`);
    },
    onSuccess: (response: Transaction, variables: TransactionInsertType) => {
      if (!variables.isImportTransaction) {
        const oldData: Transaction[] =
          queryClient.getQueryData(getAccountKey(response.accountNameOwner)) ||
          [];
        queryClient.setQueryData(getAccountKey(response.accountNameOwner), [
          response,
          ...oldData,
        ]);

        const oldTotals: Totals = queryClient.getQueryData(
          getTotalsKey(response.accountNameOwner),
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

        queryClient.setQueryData(
          getTotalsKey(response.accountNameOwner),
          newTotals,
        );
      }
    },
  });
}
