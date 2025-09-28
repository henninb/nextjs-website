import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { GridColDef } from "@mui/x-data-grid";
import {
  Box,
  Button,
  IconButton,
  Tooltip,
  Link,
  TextField,
  Autocomplete,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import FinanceLayout from "../../layouts/FinanceLayout";
import PageHeader from "../../components/PageHeader";
import DataGridBase from "../../components/DataGridBase";
import ConfirmDialog from "../../components/ConfirmDialog";
import FormDialog from "../../components/FormDialog";
import LoadingState from "../../components/LoadingState";
import EmptyState from "../../components/EmptyState";
import ErrorDisplay from "../../components/ErrorDisplay";
import SnackbarBaseline from "../../components/SnackbarBaseline";
import USDAmountInput from "../../components/USDAmountInput";
import { useAuth } from "../../components/AuthProvider";
import {
  currencyFormat,
  normalizeTransactionDate,
  formatDateForInput,
  formatDateForDisplay,
} from "../../components/Common";

import Payment from "../../model/Payment";
import Account from "../../model/Account";

import usePaymentFetchGql from "../../hooks/usePaymentFetchGql";
import usePaymentInsertGql from "../../hooks/usePaymentInsertGql";
import usePaymentDeleteGql from "../../hooks/usePaymentDeleteGql";
import usePaymentUpdateGql from "../../hooks/usePaymentUpdateGql";
import useAccountFetchGql from "../../hooks/useAccountFetchGql";

export default function PaymentsNextGen() {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();

  const [message, setMessage] = useState("");
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [showSpinner, setShowSpinner] = useState(true);
  const [showModalAdd, setShowModalAdd] = useState(false);
  const [showModalDelete, setShowModalDelete] = useState(false);
  const [paginationModel, setPaginationModel] = useState({
    pageSize: 50,
    page: 0,
  });

  const [paymentData, setPaymentData] = useState<Payment>({
    paymentId: 0,
    sourceAccount: "",
    destinationAccount: "",
    transactionDate: new Date(),
    amount: 0,
    guidSource: "",
    guidDestination: "",
    activeStatus: true,
  });
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);

  const {
    data: fetchedAccounts,
    isSuccess: isSuccessAccounts,
    isFetching: isFetchingAccounts,
    error: errorAccounts,
    refetch: refetchAccounts,
  } = useAccountFetchGql();
  const {
    data: fetchedPayments,
    isSuccess: isSuccessPayments,
    isFetching: isFetchingPayments,
    error: errorPayments,
    refetch: refetchPayments,
  } = usePaymentFetchGql();

  const { mutateAsync: insertPayment } = usePaymentInsertGql();
  const { mutateAsync: deletePayment } = usePaymentDeleteGql();
  const { mutateAsync: updatePayment } = usePaymentUpdateGql();

  const paymentsToDisplay = fetchedPayments?.filter((row) => row != null) || [];

  useEffect(() => {
    if (loading) setShowSpinner(true);
    if (!loading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [loading, isAuthenticated, router]);

  useEffect(() => {
    if (
      isFetchingAccounts ||
      isFetchingPayments ||
      loading ||
      (!loading && !isAuthenticated)
    ) {
      setShowSpinner(true);
      return;
    }
    if (isSuccessPayments && isSuccessAccounts) {
      setShowSpinner(false);
    }
  }, [
    isSuccessPayments,
    isSuccessAccounts,
    errorPayments,
    errorAccounts,
    isFetchingAccounts,
    isFetchingPayments,
    loading,
    isAuthenticated,
  ]);

  const handleDeleteRow = async () => {
    if (selectedPayment) {
      try {
        await deletePayment({ oldRow: selectedPayment });
        const when = formatDateForDisplay(selectedPayment.transactionDate);
        const amt = currencyFormat(selectedPayment.amount);
        setMessage(
          `Payment deleted: ${amt} from ${selectedPayment.sourceAccount} to ${selectedPayment.destinationAccount} on ${when}.`,
        );
        setShowSnackbar(true);
      } catch (error: any) {
        handleError(error, `Delete Payment error: ${error}`, false);
      } finally {
        setShowModalDelete(false);
        setSelectedPayment(null);
      }
    }
  };

  const handleError = (error: any, moduleName: string, throwIt: boolean) => {
    const errorMessage = error?.message
      ? `${moduleName}: ${error.message}`
      : `${moduleName}: Failure`;
    setMessage(errorMessage);
    setShowSnackbar(true);
    console.error(errorMessage);
    if (throwIt) throw error;
  };

  const handleAddRow = async (newData: Payment) => {
    try {
      await insertPayment({ payload: newData });
      const when = formatDateForDisplay(newData.transactionDate);
      setMessage(
        `Payment added: ${currencyFormat(newData.amount)} from ${newData.sourceAccount} to ${newData.destinationAccount} on ${when}.`,
      );
      setShowSnackbar(true);
      setShowSpinner(false);
      setShowModalAdd(false);
      setPaymentData({
        paymentId: 0,
        sourceAccount: newData.sourceAccount,
        destinationAccount: newData.destinationAccount,
        transactionDate: newData.transactionDate,
        amount: 0,
        guidSource: "",
        guidDestination: "",
        activeStatus: true,
      });
    } catch (error: any) {
      handleError(error, `Add Payment error: ${error}`, false);
    }
  };

  const columns: GridColDef[] = [
    {
      field: "transactionDate",
      headerName: "Date",
      flex: 0.8,
      minWidth: 120,
      headerAlign: "left",
      align: "left",
      renderCell: (params) => formatDateForDisplay(params.value),
      valueGetter: (params: string) => normalizeTransactionDate(params),
    },
    {
      field: "sourceAccount",
      headerName: "Source Account",
      flex: 2,
      minWidth: 200,
      renderCell: (params) => (
        <Link href={`/finance/transactions/${params.row.sourceAccount}`}>
          {params.value}
        </Link>
      ),
    },
    {
      field: "destinationAccount",
      headerName: "Destination Account",
      flex: 2,
      minWidth: 200,
      renderCell: (params) => (
        <Link href={`/finance/transactions/${params.row.destinationAccount}`}>
          {params.value}
        </Link>
      ),
    },
    {
      field: "amount",
      headerName: "Amount",
      flex: 0.6,
      minWidth: 120,
      headerAlign: "right",
      align: "right",
      editable: true,
      renderCell: (params) => currencyFormat(params.value),
    },
    {
      field: "",
      headerName: "Actions",
      width: 100,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Tooltip title="Delete this row">
          <IconButton
            aria-label="Delete this row"
            onClick={() => {
              setSelectedPayment(params.row);
              setShowModalDelete(true);
            }}
          >
            <DeleteIcon />
          </IconButton>
        </Tooltip>
      ),
    },
  ];

  if (errorPayments || errorAccounts) {
    return (
      <FinanceLayout>
        <PageHeader
          title="Payment Management (Next‑Gen)"
          subtitle="GraphQL-powered payments between accounts"
        />
        <ErrorDisplay
          error={errorPayments || errorAccounts}
          variant="card"
          showRetry
          onRetry={() => {
            if (errorPayments) refetchPayments();
            if (errorAccounts) refetchAccounts();
          }}
        />
      </FinanceLayout>
    );
  }

  return (
    <div>
      <FinanceLayout>
        <PageHeader
          title="Payment Management (Next‑Gen)"
          subtitle="GraphQL-powered payments between accounts"
          actions={
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setShowModalAdd(true)}
            >
              Add Payment
            </Button>
          }
        />
        {showSpinner ? (
          <LoadingState
            variant="card"
            message="Loading payments and accounts..."
          />
        ) : paymentsToDisplay && paymentsToDisplay.length > 0 ? (
          <Box display="flex" justifyContent="center">
            <Box sx={{ width: "100%", maxWidth: "1200px" }}>
              <DataGridBase
                rows={paymentsToDisplay}
                columns={columns}
                getRowId={(row: any) =>
                  row.paymentId ??
                  `${row.sourceAccount}-${row.destinationAccount}-${row.amount}-${row.transactionDate}`
                }
                checkboxSelection={false}
                rowSelection={false}
                paginationModel={paginationModel}
                onPaginationModelChange={(m) => setPaginationModel(m)}
                pageSizeOptions={[25, 50, 100]}
                processRowUpdate={async (
                  newRow: Payment,
                  oldRow: Payment,
                ): Promise<Payment> => {
                  if (JSON.stringify(newRow) === JSON.stringify(oldRow))
                    return oldRow;
                  try {
                    await updatePayment({
                      oldPayment: oldRow,
                      newPayment: newRow,
                    });
                    const when = formatDateForDisplay(newRow.transactionDate);
                    setMessage(
                      `Payment updated: ${currencyFormat(newRow.amount)} from ${newRow.sourceAccount} to ${newRow.destinationAccount} on ${when}.`,
                    );
                    setShowSnackbar(true);
                    return { ...newRow };
                  } catch (error: any) {
                    handleError(error, `Update Payment error: ${error}`, false);
                    return oldRow;
                  }
                }}
                autoHeight
                disableColumnResize={false}
                sx={{
                  "& .MuiDataGrid-cell": {
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  },
                }}
              />
            </Box>
          </Box>
        ) : (
          <EmptyState
            title="No Payments Found"
            message="No payments have been recorded yet. Create your first payment to get started."
            actionLabel="Add Payment"
            onAction={() => setShowModalAdd(true)}
            variant="create"
            dataType="payments"
          />
        )}

        <ConfirmDialog
          open={showModalDelete}
          title="Delete Payment?"
          message={`Are you sure you want to delete payment ${selectedPayment?.paymentId ?? ""}? This cannot be undone.`}
          onClose={() => setShowModalDelete(false)}
          onConfirm={handleDeleteRow}
          confirmText="Delete"
          cancelText="Cancel"
        />

        <SnackbarBaseline
          message={message}
          state={showSnackbar}
          handleSnackbarClose={() => setShowSnackbar(false)}
          severity="success"
        />

        <FormDialog
          open={showModalAdd}
          onClose={() => setShowModalAdd(false)}
          onSubmit={() => handleAddRow(paymentData)}
          title={
            paymentData?.amount && parseFloat(String(paymentData.amount)) > 0
              ? `Pay ${currencyFormat(paymentData.amount)}`
              : "Add Payment"
          }
          submitText={
            paymentData?.amount && parseFloat(String(paymentData.amount)) > 0
              ? `Pay ${currencyFormat(paymentData.amount)}`
              : "Add Payment"
          }
        >
          <TextField
            label="Transaction Date"
            fullWidth
            margin="normal"
            type="date"
            value={formatDateForInput(
              paymentData?.transactionDate || new Date(),
            )}
            onChange={(e) => {
              const normalizedDate = normalizeTransactionDate(e.target.value);
              setPaymentData((prev: any) => ({
                ...prev,
                transactionDate: normalizedDate,
              }));
            }}
            slotProps={{ inputLabel: { shrink: true } }}
          />

          <Autocomplete
            options={(fetchedAccounts || []).filter(
              (a) => a.accountType.toLowerCase() === "debit",
            )}
            getOptionLabel={(a: Account) => a.accountNameOwner || ""}
            isOptionEqualToValue={(o, v) =>
              o.accountNameOwner === v?.accountNameOwner
            }
            value={
              paymentData.sourceAccount && isSuccessAccounts
                ? (fetchedAccounts || []).find(
                    (a) => a.accountNameOwner === paymentData.sourceAccount,
                  ) || null
                : null
            }
            onChange={(_e, newValue: Account | null) =>
              setPaymentData((prev) => ({
                ...prev,
                sourceAccount: newValue ? newValue.accountNameOwner : "",
              }))
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Source Account"
                fullWidth
                margin="normal"
                placeholder="Select a source account"
              />
            )}
          />

          <Autocomplete
            options={(fetchedAccounts || []).filter(
              (a) => a.accountType.toLowerCase() === "credit",
            )}
            getOptionLabel={(a: Account) => a.accountNameOwner || ""}
            isOptionEqualToValue={(o, v) =>
              o.accountNameOwner === v?.accountNameOwner
            }
            value={
              paymentData.destinationAccount && isSuccessAccounts
                ? (fetchedAccounts || []).find(
                    (a) =>
                      a.accountNameOwner === paymentData.destinationAccount,
                  ) || null
                : null
            }
            onChange={(_e, newValue: Account | null) =>
              setPaymentData((prev) => ({
                ...prev,
                destinationAccount: newValue ? newValue.accountNameOwner : "",
              }))
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Destination Account"
                fullWidth
                margin="normal"
                placeholder="Select a destination account"
              />
            )}
          />

          <USDAmountInput
            label="Amount"
            value={paymentData?.amount ? paymentData.amount : ""}
            onChange={(value) =>
              setPaymentData((prev: any) => ({ ...prev, amount: value }))
            }
            onBlur={() => {
              const currentValue = parseFloat(
                String(paymentData?.amount || ""),
              );
              if (!isNaN(currentValue)) {
                setPaymentData((prev: any) => ({
                  ...prev,
                  amount: Number(currentValue.toFixed(2)),
                }));
              }
            }}
            fullWidth
            margin="normal"
          />
        </FormDialog>
      </FinanceLayout>
    </div>
  );
}
