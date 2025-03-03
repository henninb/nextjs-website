import { useState, useEffect } from "react";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { Button, TextField, Typography, Box, Paper } from "@mui/material";
import Transaction from "../../../../model/Transaction";
import { ReoccurringType } from "../../../../model/ReoccurringType";
import { TransactionState } from "../../../../model/TransactionState";
import { AccountType } from "../../../../model/AccountType";
import { TransactionType } from "../../../../model/TransactionType";
import FinanceLayout from "../../../../layouts/FinanceLayout";
import usePendingTransactions from "../../../../hooks/usePendingTransactionFetch";
import Spinner from "../../../../components/Spinner";
import SnackbarBaseline from "../../../../components/SnackbarBaseline";
import useTransactionInsert from "../../../../hooks/useTransactionInsert";

export default function TransactionImporter() {
  const [inputText, setInputText] = useState("");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showSpinner, setShowSpinner] = useState(true);
  const [message, setMessage] = useState("");
  const [showSnackbar, setShowSnackbar] = useState<boolean>(false);
  //const [transactions, setTransactions] = useState<Transaction[]>([]);

  const {
    data: fetchedPendingTransactions,
    isSuccess: isPendingTransactionsLoaded,
    isFetching: isFetchingPendingTransactions,
    error: errorPendingTransactions,
  } = usePendingTransactions();

  const { mutateAsync: insertTransaction } = useTransactionInsert();

  useEffect(() => {
    if (isFetchingPendingTransactions) {
      setShowSpinner(true);
      return;
    }
    if (isPendingTransactionsLoaded) {
      setShowSpinner(false);
    }
  }, [isPendingTransactionsLoaded, isFetchingPendingTransactions]);

  useEffect(() => {
    if (isPendingTransactionsLoaded && fetchedPendingTransactions) {
      const transactionsWithGUID = fetchedPendingTransactions.map(
        (transaction) => ({
          ...transaction,
          guid: crypto.randomUUID(),
          reoccurringType: "onetime" as ReoccurringType,
          transactionState: "outstanding" as TransactionState,
          transactionType: "undefined" as TransactionType,
          category: "",
          accountType: "undefined" as AccountType,
          activeStatus: true,
          notes: "imported",
        }),
      );
      setTransactions(transactionsWithGUID);
    }
  }, [isPendingTransactionsLoaded, fetchedPendingTransactions]);

  const handleInsertTransaction = async (
    newData: Transaction,
  ): Promise<Transaction> => {
    try {
      const result = await insertTransaction({
        accountNameOwner: newData.accountNameOwner,
        newRow: newData,
        isFutureTransaction: false,
      });

      setMessage(`Transaction added successfully: ${JSON.stringify(result)}`);
      setShowSnackbar(true);

      return result;
    } catch (error) {
      handleError(error, "handleAddRow", false);
      if (
        !navigator.onLine ||
        (error.message && error.message.includes("Failed to fetch"))
      ) {
      }
      throw error;
    }
  };

  const handleSnackbarClose = () => setShowSnackbar(false);

  const handleError = (error: any, moduleName: string, throwIt: boolean) => {
    const errorMessage = error.message
      ? `${moduleName}: ${error.message}`
      : `${moduleName}: Failure`;

    setMessage(errorMessage);
    setShowSnackbar(true);

    console.error(errorMessage);

    if (throwIt) throw error;
  };

  const parseTransactions = () => {
    const lines = inputText.split("\n").filter((line) => line.trim() !== "");
    console.log(`Total lines found: ${lines.length}`);

    let failedCount = 0;

    const parsedTransactions = lines
      .map((line, index) => {
        const parts = line.match(/(\d{4}-\d{2}-\d{2})\s(.+)\s(-?\d+\.\d{2})/);
        if (!parts) {
          console.warn(`Failed to parse line ${index + 1}: "${line}"`);
          failedCount++;
          return null;
        }

        return {
          transactionDate: new Date(parts[1]),
          accountNameOwner: "testing_brian",
          reoccurringType: "onetime" as ReoccurringType,
          amount: parseFloat(parts[3]),
          transactionState: "outstanding" as TransactionState,
          transactionType: "undefined" as TransactionType,
          guid: crypto.randomUUID(),
          description: parts[2],
          category: "",
          accountType: "undefined" as AccountType,
          activeStatus: true,
          notes: "",
        } as Transaction;
      })
      .filter(Boolean) as Transaction[];

    console.log(
      `Successfully parsed transactions: ${parsedTransactions.length}`,
    );
    if (failedCount > 0) {
      console.warn(`Failed to parse ${failedCount} transaction(s).`);
    }

    setTransactions(parsedTransactions);
  };

  const approveTransaction = (id: string) => {
    setTransactions((prev: any) =>
      prev.map((t: any) =>
        t.guid === id ? { ...t, transactionState: "Approved" } : t,
      ),
    );
  };

  const columns_old: GridColDef[] = [
    {
      field: "transactionDate",
      headerName: "Date",
      width: 150,
      //valueGetter: (params: any) => params.value.toISOString().split("T")[0],
    },
    { field: "description", headerName: "Description", width: 250 },
    { field: "amount", headerName: "Amount", width: 120, type: "number" },
    { field: "transactionState", headerName: "State", width: 120 },
    {
      field: "actions",
      headerName: "Actions",
      width: 120,
      renderCell: (params) => (
        <Button
          variant="contained"
          color="primary"
          size="small"
          disabled={params.row.transactionState === "Approved"}
          onClick={() => approveTransaction(params.row.guid)}
        >
          Approve
        </Button>
      ),
    },
  ];

  const columns: GridColDef[] = [
    {
      field: "transactionDate",
      headerName: "Date",
      type: "date",
      width: 100,
      renderCell: (params) => {
        return params.value.toLocaleDateString("en-US");
      },
      valueGetter: (params: string) => {
        const utcDate = new Date(params);
        const localDate = new Date(
          utcDate.getTime() + utcDate.getTimezoneOffset() * 60000,
        );
        return localDate;
      },
      editable: true,
    },
    {
      field: "accountNameOwner",
      headerName: "Account",
      width: 200,
      editable: true,
      renderCell: (params) => <div>{params.value}</div>,
    },
    {
      field: "description",
      headerName: "Description",
      width: 225,
      editable: true,
      renderCell: (params) => <div>{params.value}</div>,
    },
    {
      field: "category",
      headerName: "Category",
      width: 150,
      editable: true,
    },
    {
      field: "amount",
      headerName: "Amount",
      type: "number",
      width: 90,
      renderCell: (params: any) =>
        params.value?.toLocaleString("en-US", {
          style: "currency",
          currency: "USD",
        }),
      editable: true,
      cellClassName: "nowrap",
    },
    {
      field: "transactionState",
      headerName: "transactionState",
      width: 275,
      editable: true,
    },
    {
      field: "transactionType",
      headerName: "Type",
      width: 180,
      renderCell: (params: any) => params.value || "undefined",
      editable: true,
    },
    {
      field: "reoccurringType",
      headerName: "Reoccur",
      width: 150,
      renderCell: (params: any) => params.value || "undefined",
      editable: true,
    },
    {
      field: "notes",
      headerName: "Notes",
      width: 180,
      editable: true,
    },

    {
      field: "actions",
      headerName: "Actions",
      width: 120,
      renderCell: (params) => (
        <Button
          variant="contained"
          color="primary"
          size="small"
          //disabled={params.row.transactionState === "Approved"}
          onClick={() => {
            console.log(params.row);
            handleInsertTransaction(params.row);
          }}
        >
          Approve
        </Button>
      ),
    },
  ];

  return (
    <div>
      <FinanceLayout>
        <Typography variant="h6">Paste Transactions</Typography>
        <TextField
          multiline
          fullWidth
          rows={6}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Enter transactions, e.g.\n2024-02-25 Coffee Shop -4.50\n2024-02-26 Salary 2000.00"
        />
        <Button variant="contained" sx={{ mt: 2 }} onClick={parseTransactions}>
          Submit
        </Button>

        {showSpinner ? (
          <Spinner />
        ) : (
          <div>
            <DataGrid
              rows={transactions}
              columns={columns}
              getRowId={(row) => row.guid}
            />
          </div>
        )}

        <SnackbarBaseline
          message={message}
          state={showSnackbar}
          handleSnackbarClose={handleSnackbarClose}
        />
      </FinanceLayout>
    </div>
  );
}
