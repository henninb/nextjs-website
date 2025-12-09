"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { GridColDef } from "@mui/x-data-grid";
import Spinner from "../../../../../components/Spinner";
import SnackbarBaseline from "../../../../../components/SnackbarBaseline";
import ErrorDisplay from "../../../../../components/ErrorDisplay";
import useTransactionByDescription from "../../../../../hooks/useTransactionByDescriptionFetch";
import useTransactionUpdate from "../../../../../hooks/useTransactionUpdate";
import Transaction from "../../../../../model/Transaction";
import { Link, Box, Stack, Chip, TextField } from "@mui/material";
import { currencyFormat } from "../../../../../components/Common";
import { useAuth } from "../../../../../components/AuthProvider";
import PageHeader from "../../../../../components/PageHeader";
import DataGridBase from "../../../../../components/DataGridBase";

export default function TransactionsByDescription({
  params,
}: {
  params: { descriptionName: string };
}) {
  const [showSpinner, setShowSpinner] = useState(true);
  const [snackbarMessage, setMessage] = useState("");
  const [showSnackbar, setShowSnackbar] = useState<boolean>(false);
  const [paginationModel, setPaginationModel] = useState({
    pageSize: 50,
    page: 0,
  });
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [stateFilter, setStateFilter] = useState<{
    cleared: boolean;
    outstanding: boolean;
    future: boolean;
  }>({ cleared: true, outstanding: true, future: true });

  const router = useRouter();
  const descriptionName = params.descriptionName;

  const {
    data: fetchedTransactions,
    isSuccess: isTransactionsLoaded,
    isFetching: isFetchingTransactions,
    error: errorTransactions,
    refetch: refetchTransactions,
  } = useTransactionByDescription(descriptionName);
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

  // Apply client-side filters and search - moved before early return to fix Rules of Hooks
  const filteredTransactions = useMemo(() => {
    if (!fetchedTransactions) return [];

    const q = searchQuery.trim().toLowerCase();
    const allowedStates = new Set(
      [
        stateFilter.cleared && "cleared",
        stateFilter.outstanding && "outstanding",
        stateFilter.future && "future",
      ].filter(Boolean) as string[],
    );
    return fetchedTransactions.filter((row) => {
      if (!row) return false;
      if (
        row.transactionState &&
        !allowedStates.has(row.transactionState as string)
      )
        return false;
      if (!q) return true;
      const haystack =
        `${row.accountNameOwner || ""} ${row.description || ""} ${row.category || ""} ${row.notes || ""}`.toLowerCase();
      if (haystack.includes(q)) return true;
      const amtStr = (row.amount ?? "").toString();
      return amtStr.includes(q);
    });
  }, [fetchedTransactions, searchQuery, stateFilter]);

  // Early return after all hooks
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
    {
      field: "transactionDate",
      headerName: "Transaction Date",
      type: "date",
      width: 100,
      headerAlign: "left",
      align: "left",
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
      headerAlign: "right",
      align: "right",
      renderCell: (params) => currencyFormat(params.value),
      editable: true,
    },
    { field: "activeStatus", headerName: "Status", width: 100, editable: true },
    { field: "notes", headerName: "Notes", width: 200, editable: true },
  ];

  // Early error state for consistency with other finance pages
  if (errorTransactions) {
    return (
      <>
        <h2>{`${descriptionName}`}</h2>
        <ErrorDisplay
          error={errorTransactions}
          onRetry={() => refetchTransactions && refetchTransactions()}
        />
      </>
    );
  }

  return (
    <div>
      <>
        <PageHeader
          title={`${descriptionName}`}
          actions={
            <Stack
              spacing={1.5}
              direction={{ xs: "column", sm: "row" }}
              sx={{ alignItems: "center" }}
            >
              <TextField
                size="small"
                label="Search"
                placeholder="Find by account, description, notes"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Stack direction="row" spacing={1}>
                <Chip
                  label="Cleared"
                  color={stateFilter.cleared ? "primary" : "default"}
                  variant={stateFilter.cleared ? "filled" : "outlined"}
                  onClick={() =>
                    setStateFilter((s) => ({ ...s, cleared: !s.cleared }))
                  }
                  size="small"
                />
                <Chip
                  label="Outstanding"
                  color={stateFilter.outstanding ? "primary" : "default"}
                  variant={stateFilter.outstanding ? "filled" : "outlined"}
                  onClick={() =>
                    setStateFilter((s) => ({
                      ...s,
                      outstanding: !s.outstanding,
                    }))
                  }
                  size="small"
                />
                <Chip
                  label="Future"
                  color={stateFilter.future ? "primary" : "default"}
                  variant={stateFilter.future ? "filled" : "outlined"}
                  onClick={() =>
                    setStateFilter((s) => ({ ...s, future: !s.future }))
                  }
                  size="small"
                />
              </Stack>
            </Stack>
          }
        />
        {showSpinner ? (
          <Spinner />
        ) : (
          <div>
            <Box display="flex" justifyContent="center">
              <Box sx={{ width: "fit-content" }}>
                <DataGridBase
                  rows={filteredTransactions}
                  columns={columns}
                  getRowId={(row) =>
                    row.transactionId ??
                    `${row.accountNameOwner}-${row.transactionDate}-${row.description}-${row.amount}`
                  }
                  checkboxSelection={false}
                  rowSelection={false}
                  paginationModel={paginationModel}
                  onPaginationModelChange={(newModel) =>
                    setPaginationModel(newModel)
                  }
                  pageSizeOptions={[25, 50, 100]}
                  hideFooter={filteredTransactions?.length < 25}
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
              </Box>
            </Box>
            <SnackbarBaseline
              message={snackbarMessage}
              state={showSnackbar}
              handleSnackbarClose={handleSnackbarClose}
            />
          </div>
        )}
      </>
    </div>
  );
}
