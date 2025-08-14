import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import Spinner from "../../../../components/Spinner";
import SnackbarBaseline from "../../../../components/SnackbarBaseline";
import ErrorDisplay from "../../../../components/ErrorDisplay";
import useTransactionByCategory from "../../../../hooks/useTransactionByCategoryFetch";
import useTransactionUpdate from "../../../../hooks/useTransactionUpdate";
import Transaction from "../../../../model/Transaction";
import { Link, Box } from "@mui/material";
import FinanceLayout from "../../../../layouts/FinanceLayout";
import { currencyFormat } from "../../../../components/Common";
import { useAuth } from "../../../../components/AuthProvider";

export default function TransactionsByCategory() {
  const [showSpinner, setShowSpinner] = useState(true);
  const [message, setMessage] = useState("");
  const [showSnackbar, setShowSnackbar] = useState<boolean>(false);
  const [paginationModel, setPaginationModel] = useState({
    pageSize: 50,
    page: 0,
  });

  const router = useRouter();
  const { categoryName }: any = router.query;

  const {
    data: fetchedTransactions,
    isSuccess: isTransactionsLoaded,
    isFetching: isFetchingTransactions,
    error: errorTransactions,
    refetch: refetchTransactions,
  } = useTransactionByCategory(categoryName);
  const { mutateAsync: updateTransaction } = useTransactionUpdate();
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (loading) {
      setShowSpinner(true);
    }
    if (!loading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [loading, isAuthenticated, router]);

  useEffect(() => {
    if (isFetchingTransactions) {
      setShowSpinner(true);
      return;
    }
    if (errorTransactions) {
      setShowSpinner(false);
      return;
    }
    if (isTransactionsLoaded) {
      setShowSpinner(false);
    }
  }, [isTransactionsLoaded, isFetchingTransactions, errorTransactions]);

  if (loading || (!loading && !isAuthenticated)) {
    return null;
  }

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
      renderCell: (params) => currencyFormat(params.value),
      editable: true,
    },
    { field: "activeStatus", headerName: "Status", width: 100, editable: true },
    { field: "notes", headerName: "Notes", width: 200, editable: true },
  ];

  return (
    <div>
      <FinanceLayout>
        <h2>{`${categoryName}`}</h2>
        {showSpinner ? (
          <Spinner />
        ) : (
          <div>
            {errorTransactions && (
              <ErrorDisplay
                error={errorTransactions}
                onRetry={() => refetchTransactions && refetchTransactions()}
              />
            )}
            <Box display="flex" justifyContent="center">
              <Box sx={{ width: "fit-content" }}>
                <DataGrid
                  rows={fetchedTransactions?.filter((row) => row != null) || []}
                  columns={columns}
                  getRowId={(row) =>
                    row.transactionId ??
                    `${row.accountNameOwner}-${row.transactionDate}-${row.description}-${row.amount}`
                  }
                  checkboxSelection={false}
                  rowSelection={false}
                  pagination
                  paginationModel={paginationModel}
                  onPaginationModelChange={(newModel) =>
                    setPaginationModel(newModel)
                  }
                  pageSizeOptions={[25, 50, 100]}
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
                      //return newRow;
                      return { ...newRow };
                    } catch (error) {
                      handleError(error, "Update Transaction failure.");
                      throw error;
                    }
                  }}
                  autoHeight
                />
              </Box>
            </Box>
            <SnackbarBaseline
              message={message}
              state={showSnackbar}
              handleSnackbarClose={handleSnackbarClose}
            />
          </div>
        )}
      </FinanceLayout>
    </div>
  );
}
