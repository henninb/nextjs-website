import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { GridColDef } from "@mui/x-data-grid";
import {
  Box,
  Button,
  IconButton,
  Tooltip,
  Link,
  TextField,
  Typography,
  Autocomplete,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import Spinner from "../../components/Spinner";
import SnackbarBaseline from "../../components/SnackbarBaseline";
import ErrorDisplay from "../../components/ErrorDisplay";
import EmptyState from "../../components/EmptyState";
import LoadingState from "../../components/LoadingState";
import USDAmountInput from "../../components/USDAmountInput";
import useFetchPayment from "../../hooks/usePaymentFetch";
import usePaymentInsert from "../../hooks/usePaymentInsert";
import usePaymentDelete from "../../hooks/usePaymentDelete";
import Payment from "../../model/Payment";
import useAccountFetch from "../../hooks/useAccountFetch";
import useParameterFetch from "../../hooks/useParameterFetch";
import Account from "../../model/Account";
import usePaymentUpdate from "../../hooks/usePaymentUpdate";
import FinanceLayout from "../../layouts/FinanceLayout";
import PageHeader from "../../components/PageHeader";
import DataGridBase from "../../components/DataGridBase";
import ConfirmDialog from "../../components/ConfirmDialog";
import FormDialog from "../../components/FormDialog";
import {
  currencyFormat,
  normalizeTransactionDate,
  formatDateForInput,
  formatDateForDisplay,
} from "../../components/Common";
import { useAuth } from "../../components/AuthProvider";
import { modalTitles, modalBodies } from "../../utils/modalMessages";

const initialPaymentData: Payment = {
  paymentId: 0,
  transactionDate: new Date(),
  destinationAccount: "",
  sourceAccount: "",
  activeStatus: true,
  amount: 0.0,
  guidSource: undefined,
  guidDestination: undefined,
};

export default function Payments() {
  const [message, setMessage] = useState("");
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [snackbarSeverity, setSnackbarSeverity] = useState<
    "error" | "warning" | "info" | "success"
  >("info");
  const [showSpinner, setShowSpinner] = useState(true);
  const [showModalAdd, setShowModalAdd] = useState(false);
  const [paymentData, setPaymentData] = useState<Payment>(initialPaymentData);
  const [showModalDelete, setShowModalDelete] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [paginationModel, setPaginationModel] = useState({
    pageSize: 50,
    page: 0,
  });
  const [formErrors, setFormErrors] = useState<{
    amount?: string;
    accounts?: string;
  }>({});
  const [paymentMode, setPaymentMode] = useState<"payBill" | "balanceTransfer">(
    "payBill",
  );

  const {
    data: fetchedPayments,
    isSuccess: isSuccessPayments,
    isFetching: isFetchingPayments,
    error: errorPayments,
    refetch: refetchPayments,
  } = useFetchPayment();
  const {
    data: fetchedAccounts,
    isSuccess: isSuccessAccounts,
    isFetching: isFetchingAccounts,
    error: errorAccounts,
    refetch: refetchAccounts,
  } = useAccountFetch();

  const {
    data: fetchedParameters,
    isSuccess: isSuccessParameters,
    isFetching: isFetchingParameters,
    error: errorParameters,
    refetch: refetchParameters,
  } = useParameterFetch();

  const { mutateAsync: insertPayment } = usePaymentInsert();
  const { mutateAsync: deletePayment } = usePaymentDelete();
  const { mutateAsync: updatePayment } = usePaymentUpdate();
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [loading, isAuthenticated, router]);

  useEffect(() => {
    if (
      isFetchingPayments ||
      isFetchingAccounts ||
      isFetchingParameters ||
      loading ||
      (!loading && !isAuthenticated)
    ) {
      setShowSpinner(true);
      return;
    }
    if (isSuccessPayments && isSuccessAccounts && isSuccessParameters) {
      setShowSpinner(false);
    }
  }, [
    isSuccessPayments,
    isSuccessAccounts,
    isSuccessParameters,
    errorPayments,
    errorAccounts,
    errorParameters,
    isFetchingPayments,
    isFetchingAccounts,
    isFetchingParameters,
    loading,
    isAuthenticated,
  ]);

  const defaultPaymentMethod =
    fetchedParameters?.find(
      (param) => param.parameterName === "payment_account",
    )?.parameterValue || "";

  // Set default sourceAccount when modal opens if not already set.
  useEffect(() => {
    if (
      showModalAdd &&
      defaultPaymentMethod &&
      isSuccessAccounts &&
      fetchedAccounts.length > 0 &&
      paymentData.sourceAccount === ""
    ) {
      setPaymentData((prev) => ({
        ...prev,
        sourceAccount: defaultPaymentMethod,
      }));
    }
  }, [
    showModalAdd,
    defaultPaymentMethod,
    isSuccessAccounts,
    fetchedAccounts,
    paymentData.sourceAccount,
  ]);

  const handleDeleteRow = async () => {
    if (selectedPayment) {
      try {
        await deletePayment({ oldRow: selectedPayment });
        const when = formatDateForDisplay(selectedPayment.transactionDate);
        const amt = currencyFormat(selectedPayment.amount);
        handleSuccess(
          `Payment deleted: ${amt} from ${selectedPayment.sourceAccount} to ${selectedPayment.destinationAccount} on ${when}.`,
        );
      } catch (error) {
        handleError(error, `Delete Payment error: ${error}`, false);
      } finally {
        setShowModalDelete(false);
        setSelectedPayment(null);
      }
    }
  };

  const handleSnackbarClose = () => {
    setShowSnackbar(false);
  };

  const handleError = (error: any, moduleName: string, throwIt: boolean) => {
    const errorMessage = error.message
      ? `${moduleName}: ${error.message}`
      : `${moduleName}: Failure`;

    setMessage(errorMessage);
    setSnackbarSeverity("error");
    setShowSnackbar(true);

    console.error(errorMessage);

    if (throwIt) throw error;
  };

  const handleSuccess = (successMessage: string) => {
    setMessage(successMessage);
    setSnackbarSeverity("success");
    setShowSnackbar(true);
  };

  const handleAddRow = async (newData: Payment) => {
    // UI validations: amount > 0 and source != destination
    const errs: { amount?: string; accounts?: string } = {};
    const amt = parseFloat(String(newData?.amount ?? 0));
    if (isNaN(amt) || amt <= 0) {
      errs.amount = "Amount must be greater than zero";
    }
    if (
      newData?.sourceAccount &&
      newData?.destinationAccount &&
      newData.sourceAccount === newData.destinationAccount
    ) {
      errs.accounts = "Source and destination must be different";
    }
    if (Object.keys(errs).length > 0) {
      setFormErrors(errs);
      setMessage(errs.accounts || errs.amount || "Validation failed");
      setSnackbarSeverity("error");
      setShowSnackbar(true);
      return;
    }

    try {
      await insertPayment({ payload: newData });
      setShowModalAdd(false);
      const when = formatDateForDisplay(newData.transactionDate);
      handleSuccess(
        `Payment added: ${currencyFormat(newData.amount)} from ${newData.sourceAccount} to ${newData.destinationAccount} on ${when}.`,
      );
    } catch (error) {
      handleError(error, `Add Payment error: ${error}`, false);
      if (
        !navigator.onLine ||
        (error.message && error.message.includes("Failed to fetch"))
      ) {
        // Handle offline error if needed.
      }
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
      editable: true,
      renderCell: (params) => {
        return formatDateForDisplay(params.value);
      },
      renderEditCell: (params) => {
        const value = params.value ? formatDateForInput(params.value) : "";
        return (
          <TextField
            type="date"
            value={value}
            onChange={(event) => {
              const newValue = event.target.value;
              const normalizedDate = normalizeTransactionDate(newValue);
              params.api.setEditCellValue({
                id: params.id,
                field: params.field,
                value: normalizedDate,
              });
            }}
            slotProps={{
              inputLabel: { shrink: true },
            }}
          />
        );
      },
      valueGetter: (params) => {
        return normalizeTransactionDate(params);
      },
    },
    {
      field: "sourceAccount",
      headerName: "Source Account",
      flex: 2,
      minWidth: 200,
      renderCell: (params) => {
        return (
          <Link href={`/finance/transactions/${params.value}`}>
            {params.value}
          </Link>
        );
      },
    },
    {
      field: "destinationAccount",
      headerName: "Destination Account",
      flex: 2,
      minWidth: 200,
      renderCell: (params) => {
        return (
          <Link href={`/finance/transactions/${params.value}`}>
            {params.value}
          </Link>
        );
      },
    },
    {
      field: "amount",
      headerName: "Amount",
      flex: 0.6,
      minWidth: 120,
      type: "number",
      headerAlign: "right",
      align: "right",
      editable: true,
      renderEditCell: (params) => {
        const value = params.value || "";
        return (
          <TextField
            type="number"
            value={value}
            onChange={(event) => {
              const newValue = event.target.value;
              let parsedValue = newValue === "" ? null : parseFloat(newValue);

              if (parsedValue !== null) {
                parsedValue = parseFloat(parsedValue.toFixed(2));
              }
              params.api.setEditCellValue({
                id: params.id,
                field: params.field,
                value: parsedValue,
              });
            }}
          />
        );
      },
      valueFormatter: (params: any) => currencyFormat(params),
    },
    {
      field: "",
      headerName: "Actions",
      width: 100,
      sortable: false,
      filterable: false,
      renderCell: (params: any) => (
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

  // Handle error states first
  if (errorPayments || errorAccounts || errorParameters) {
    return (
      <FinanceLayout>
        <PageHeader
          title="Payment Management"
          subtitle="Track and manage payments between accounts with automated transaction processing"
        />
        <ErrorDisplay
          error={errorPayments || errorAccounts || errorParameters}
          variant="card"
          showRetry={true}
          onRetry={() => {
            if (errorPayments) refetchPayments();
            if (errorAccounts) refetchAccounts();
            if (errorParameters) refetchParameters();
          }}
        />
      </FinanceLayout>
    );
  }

  return (
    <div>
      <FinanceLayout>
        <PageHeader
          title="Payment Management"
          subtitle="Track and manage payments between accounts with automated transaction processing"
          actions={
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                setPaymentData(initialPaymentData);
                setFormErrors({});
                setPaymentMode("payBill");
                setShowModalAdd(true);
              }}
              sx={{ backgroundColor: "primary.main" }}
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
        ) : (
          <div>
            <Box display="flex" justifyContent="center">
              <Box sx={{ width: "100%", maxWidth: "1200px" }}>
                {fetchedPayments && fetchedPayments.length > 0 ? (
                  <DataGridBase
                    rows={fetchedPayments?.filter((row) => row != null) || []}
                    columns={columns}
                    getRowId={(row: any) =>
                      row.paymentId ??
                      `${row.sourceAccount}-${row.destinationAccount}-${row.amount}-${row.transactionDate}`
                    }
                    checkboxSelection={false}
                    rowSelection={false}
                    paginationModel={paginationModel}
                    onPaginationModelChange={(newModel) =>
                      setPaginationModel(newModel)
                    }
                    pageSizeOptions={[25, 50, 100]}
                    autoHeight
                    disableColumnResize={false}
                    processRowUpdate={async (
                      newRow: Payment,
                      oldRow: Payment,
                    ): Promise<Payment> => {
                      if (JSON.stringify(newRow) === JSON.stringify(oldRow)) {
                        return oldRow;
                      }

                      try {
                        await updatePayment({
                          oldPayment: oldRow,
                          newPayment: newRow,
                        });
                        const when = formatDateForDisplay(
                          newRow.transactionDate,
                        );
                        handleSuccess(
                          `Payment updated: ${currencyFormat(newRow.amount)} from ${newRow.sourceAccount} to ${newRow.destinationAccount} on ${when}.`,
                        );
                        return { ...newRow };
                      } catch (error) {
                        handleError(
                          error,
                          `Update Payment error: ${error}`,
                          false,
                        );
                        return oldRow;
                      }
                    }}
                    sx={{
                      "& .MuiDataGrid-cell": {
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      },
                    }}
                  />
                ) : (
                  <EmptyState
                    title="No Payments Found"
                    message="No payments have been recorded yet. Create your first payment to get started."
                    dataType="payments"
                    variant="create"
                    actionLabel="Add Payment"
                    onAction={() => {
                      setPaymentData(initialPaymentData);
                      setFormErrors({});
                      setPaymentMode("payBill");
                      setShowModalAdd(true);
                    }}
                    onRefresh={() => {
                      refetchPayments();
                      refetchAccounts();
                      refetchParameters();
                    }}
                  />
                )}
              </Box>
            </Box>
            <div>
              <SnackbarBaseline
                message={message}
                state={showSnackbar}
                handleSnackbarClose={handleSnackbarClose}
                severity={snackbarSeverity}
              />
            </div>
          </div>
        )}
        <ConfirmDialog
          open={showModalDelete}
          onClose={() => setShowModalDelete(false)}
          onConfirm={handleDeleteRow}
          title={modalTitles.confirmDeletion}
          message={modalBodies.confirmDeletion(
            "payment",
            selectedPayment?.paymentId ?? "",
          )}
          confirmText="Delete"
          cancelText="Cancel"
        />

        <FormDialog
          open={showModalAdd}
          onClose={() => setShowModalAdd(false)}
          onSubmit={() => paymentData && handleAddRow(paymentData)}
          title={modalTitles.addNew("payment")}
          submitText={
            paymentData?.amount && parseFloat(String(paymentData.amount)) > 0
              ? `Pay ${currencyFormat(paymentData.amount)}`
              : "Add Payment"
          }
        >
          <Box sx={{ mb: 2, mt: 1 }}>
            <Typography variant="body2" sx={{ mb: 1, color: "text.secondary" }}>
              Payment Type
            </Typography>
            <ToggleButtonGroup
              value={paymentMode}
              exclusive
              onChange={(event, newMode) => {
                if (newMode !== null) {
                  setPaymentMode(newMode);
                  setPaymentData((prev) => ({
                    ...prev,
                    sourceAccount: "",
                    destinationAccount: "",
                  }));
                }
              }}
              fullWidth
              size="small"
            >
              <ToggleButton value="payBill" aria-label="Pay Bill">
                Pay Bill
              </ToggleButton>
              <ToggleButton
                value="balanceTransfer"
                aria-label="Balance Transfer"
              >
                Balance Transfer
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>
          <TextField
            label="Transaction Date"
            fullWidth
            margin="normal"
            type="date"
            value={formatDateForInput(paymentData.transactionDate)}
            onChange={(e) => {
              const normalizedDate = normalizeTransactionDate(e.target.value);
              setPaymentData((prev) => ({
                ...prev,
                transactionDate: normalizedDate,
              }));
            }}
            slotProps={{
              inputLabel: { shrink: true },
            }}
          />
          <Autocomplete
            options={
              isSuccessAccounts
                ? fetchedAccounts.filter((account) =>
                    paymentMode === "payBill"
                      ? account.accountType === "debit"
                      : account.accountType === "credit",
                  )
                : []
            }
            getOptionLabel={(account: Account) =>
              account.accountNameOwner || ""
            }
            isOptionEqualToValue={(option, value) =>
              option.accountNameOwner === value?.accountNameOwner
            }
            value={
              isSuccessAccounts
                ? fetchedAccounts.find(
                    (account) =>
                      account.accountNameOwner === paymentData.sourceAccount,
                  ) || null
                : null
            }
            onChange={(event, newValue) =>
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
                placeholder="Select or search an account"
              />
            )}
          />
          <Autocomplete
            options={
              isSuccessAccounts
                ? fetchedAccounts.filter((account) =>
                    paymentMode === "payBill"
                      ? account.accountType === "credit"
                      : account.accountType === "credit",
                  )
                : []
            }
            getOptionLabel={(account: Account) =>
              account.accountNameOwner || ""
            }
            isOptionEqualToValue={(option, value) =>
              option.accountNameOwner === value?.accountNameOwner
            }
            value={
              paymentData.destinationAccount && isSuccessAccounts
                ? fetchedAccounts.find(
                    (account) =>
                      account.accountNameOwner ===
                      paymentData.destinationAccount,
                  ) || null
                : null
            }
            onChange={(event, newValue) =>
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
                placeholder="Select or search an account"
              />
            )}
          />
          <USDAmountInput
            label="Amount"
            value={paymentData?.amount ? paymentData.amount : ""}
            onChange={(value) => {
              setPaymentData((prev: any) => ({
                ...prev,
                amount: value,
              }));
            }}
            onBlur={() => {
              // Format amount properly on blur
              const currentValue = parseFloat(
                String(paymentData?.amount || ""),
              );
              if (!isNaN(currentValue)) {
                setPaymentData((prev: any) => ({
                  ...prev,
                  amount: currentValue.toFixed(2),
                }));
              }
            }}
            fullWidth
            margin="normal"
            error={!!formErrors.amount}
            helperText={formErrors.amount}
          />
        </FormDialog>
      </FinanceLayout>
    </div>
  );
}
