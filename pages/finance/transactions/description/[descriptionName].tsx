import { useRouter } from "next/router";
import React, { useState, useEffect } from "react";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import Spinner from "../../../../components/Spinner";
import SnackbarBaseline from "../../../../components/SnackbarBaseline";
import useTransactionByDescription from "../../../../hooks/useTransactionByDescriptionFetch";
import useTransactionUpdate from "../../../../hooks/useTransactionUpdate";
import Transaction from "../../../../model/Transaction";
import { Box } from "@mui/material";
import Link from "next/link";

export default function TransactionsByDescription() {
  const [showSpinner, setShowSpinner] = useState(true);
  const [snackbarMessage, setMessage] = useState("");
  const [showSnackbar, setShowSnackbar] = useState<boolean>(false);

  const router = useRouter();
  const { descriptionName }: any = router.query;

  const {
    data: fetchedTransactions,
    isSuccess: isTransactionsLoaded,
    error: errorTransactions,
  } = useTransactionByDescription(descriptionName);
  const { mutateAsync: updateTransaction } = useTransactionUpdate();

  useEffect(() => {
    if (isTransactionsLoaded) {
      setShowSpinner(false);
    }
  }, [isTransactionsLoaded]);

  const handleSnackbarClose = () => setShowSnackbar(false);

  const handleError = (error: any, moduleName: string) => {
    const errorMessage = error.response
      ? `${moduleName}: ${error.response.status} - ${JSON.stringify(error.response.data)}`
      : `${moduleName}: Failure`;
    setMessage(errorMessage);
    setShowSnackbar(true);
  };

  const columns: GridColDef[] = [
    {
      field: "transactionDate",
      headerName: "Transaction Date",
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
      width: 180,
      editable: true,
      renderCell: (params) => {
        return (
          <Link href={`/finance/transactions/${params.row.accountNameOwner}`}>
            {params.value}
          </Link>
        );
      },
    },
    {
      field: "description",
      headerName: "Description",
      width: 180,
      editable: true,
    },
    { field: "category", headerName: "Category", width: 150, editable: true },
    {
      field: "amount",
      headerName: "Amount",
      type: "number",
      width: 90,
      editable: true,
    },
    { field: "activeStatus", headerName: "Status", width: 100, editable: true },
    { field: "notes", headerName: "Notes", width: 200, editable: true },
  ];

  return (
    <Box>
      <h2>{`${descriptionName}`}</h2>
      {showSpinner ? (
        <Spinner />
      ) : (
        <div>
          <DataGrid
            rows={fetchedTransactions?.filter((row) => row != null) || []}
            columns={columns}
            getRowId={(row) => row.transactionId || 0}
            checkboxSelection={false}
            rowSelection={false}
            processRowUpdate={async (
              newRow: Transaction,
              oldRow: Transaction,
            ): Promise<Transaction> => {
              if (JSON.stringify(newRow) === JSON.stringify(oldRow)) {
                return oldRow;
              }
              try {
                await updateTransaction({ newRow, oldRow });
                setMessage("Transaction updated successfully.");
                setShowSnackbar(true);
                return { ...newRow };
              } catch (error) {
                handleError(error, "Update Transaction failure.");
                throw error;
              }
            }}
          />
          <SnackbarBaseline
            message={snackbarMessage}
            state={showSnackbar}
            handleSnackbarClose={handleSnackbarClose}
          />
        </div>
      )}
    </Box>
  );
}
