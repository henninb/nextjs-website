import { useRouter } from "next/router";
import React, { useState, useEffect } from "react";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { Box, Button, IconButton, Tooltip } from "@mui/material";
import Spinner from "../../../../components/Spinner";
import SnackbarBaseline from "../../../../components/SnackbarBaseline";
import { currencyFormat, noNaN } from "../../../../components/Common";
import useTransactionByCategory from "../../../../hooks/useTransactionByCategoryFetch";
import useTotalsPerAccountFetch from "../../../../hooks/useTotalsPerAccountFetch";
import useTransactionUpdate from "../../../../hooks/useTransactionUpdate";
import Transaction from "../../../../model/Transaction";
import Link from "next/link";

export default function TransactionTable() {
  const [showSpinner, setShowSpinner] = useState(true);
  const [message, setMessage] = useState("");
  const [showSnackbar, setShowSnackbar] = useState<boolean>(false);

  const router = useRouter();
  const { categoryName }: any = router.query;

  const { data, isSuccess } = useTransactionByCategory(categoryName);
  const { mutateAsync: updateTransaction } = useTransactionUpdate();

  useEffect(() => {
    if (isSuccess) {
      setShowSpinner(false);
    }
  }, [isSuccess]);

  const handleSnackbarClose = () => setShowSnackbar(false);

  const handleError = (error: any, moduleName: string) => {
    const errorMessage = error.response
      ? `${moduleName}: ${error.response.status} - ${JSON.stringify(error.response.data)}`
      : `${moduleName}: Failure`;
    setMessage(errorMessage);
    setShowSnackbar(true);
  };

  const columns: GridColDef[] = [
    // { field: "transactionDate", headerName: "Transaction Date", type: "date", width: 100, editable: true },
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
      <h2>{`${categoryName}`}</h2>
      {showSpinner ? (
        <Spinner />
      ) : (
        <div>
          <DataGrid
            rows={data?.filter((row) => row != null) || []}
            columns={columns}
            getRowId={(row) => row.transactionId || 0}
            checkboxSelection={false}
            rowSelection={false}
            processRowUpdate={async (newRow: Transaction, oldRow: Transaction): Promise<Transaction> => {
              try {
                await updateTransaction({ newRow, oldRow });
                setMessage("Transaction updated successfully.");
                setShowSnackbar(true);
                return newRow;
              } catch (error) {
                handleError(error, "Update Transaction failure.");
                return oldRow;
              }
            }}
          />
          <SnackbarBaseline
            message={message}
            state={showSnackbar}
            handleSnackbarClose={handleSnackbarClose}
          />
        </div>
      )}
    </Box>
  );
}
