import { useState } from "react";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { Button, TextField, Typography, Box, Paper } from "@mui/material";
import Transaction from "../../../../model/Transaction";
import { ReoccurringType } from "../../../../model/ReoccurringType";
import { TransactionState } from "../../../../model/TransactionState";
import { AccountType } from "../../../../model/AccountType";
import { TransactionType } from "../../../../model/TransactionType";
import FinanceLayout from "../../../../layouts/FinanceLayout";

export default function TransactionImporter() {
//const TransactionImporter = () => {
  const [inputText, setInputText] = useState("");
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const parseTransactions = () => {
    const lines = inputText.split("\n").filter((line) => line.trim() !== "");
    const parsedTransactions = lines
      .map((line) => {
        const parts = line.match(/(\d{4}-\d{2}-\d{2})\s(.+)\s(-?\d+\.\d{2})/);
        if (!parts) return null;

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
      field: "description",
      headerName: "Description",
      width: 180,
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
          disabled={params.row.transactionState === "Approved"}
          onClick={() => approveTransaction(params.row.guid)}
        >
          Approve
        </Button>
      ),
    },

  ];

  return (
    <Box sx={{ p: 3 }}>
      <FinanceLayout>
      <Typography variant="h6">Paste Transactions</Typography>
      <TextField
        multiline
        fullWidth
        rows={4}
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        placeholder="Enter transactions, e.g.\n2024-02-25 Coffee Shop -4.50\n2024-02-26 Salary 2000.00"
      />
      <Button variant="contained" sx={{ mt: 2 }} onClick={parseTransactions}>
        Submit
      </Button>
      <Paper sx={{ height: 400, width: "100%", mt: 2 }}>
        <DataGrid
          rows={transactions}
          columns={columns}
          getRowId={(row) => row.guid}
        />
      </Paper>
      </FinanceLayout>
    </Box>
  );
};

//export default TransactionImporter;
