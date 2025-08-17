import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import {
  Box,
  Paper,
  Button,
  IconButton,
  Tooltip,
  Modal,
  Link,
  TextField,
  Typography,
  Autocomplete,
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
import {
  currencyFormat,
  normalizeTransactionDate,
  formatDateForInput,
  formatDateForDisplay,
} from "../../components/Common";
import { useAuth } from "../../components/AuthProvider";
import { modalTitles, modalBodies } from "../../utils/modalMessages";

const initialPaymentData: Payment = {
  paymentId: undefined,
  transactionDate: new Date(),
  accountNameOwner: "",
  destinationAccount: "",
  sourceAccount: "",
  activeStatus: true,
  amount: 0.0,
};

export default function Payments() {
  const [message, setMessage] = useState("");
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [showSpinner, setShowSpinner] = useState(true);
  const [showModalAdd, setShowModalAdd] = useState(false);
  const [paymentData, setPaymentData] = useState<Payment>(initialPaymentData);
  const [showModalDelete, setShowModalDelete] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [paginationModel, setPaginationModel] = useState({
    pageSize: 50,
    page: 0,
  });

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
        setMessage("Payment deleted successfully.");
        setShowSnackbar(true);
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
    setShowSnackbar(true);

    console.error(errorMessage);

    if (throwIt) throw error;
  };

  const handleAddRow = async (newData: Payment) => {
    try {
      //await insertPayment({ payload: newData });
      await insertPayment({
        payload: { ...newData, accountNameOwner: newData.destinationAccount },
      });
      setShowModalAdd(true);
      setMessage("Payment added successfully.");
      setShowSnackbar(true);
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
        <Tooltip title="delete this row">
          <IconButton
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
        <Box sx={{ mb: 3, textAlign: "center" }}>
          <Typography
            variant="h4"
            component="h1"
            sx={{ mb: 1, fontWeight: 600 }}
          >
            Payment Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Track and manage payments between accounts with automated
            transaction processing
          </Typography>
        </Box>
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
        <Box sx={{ mb: 3, textAlign: "center" }}>
          <Typography
            variant="h4"
            component="h1"
            sx={{ mb: 1, fontWeight: 600 }}
          >
            Payment Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Track and manage payments between accounts with automated
            transaction processing
          </Typography>
        </Box>
        {showSpinner ? (
          <LoadingState
            variant="card"
            message="Loading payments and accounts..."
          />
        ) : (
          <div>
            <Box display="flex" justifyContent="center" mb={2}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setShowModalAdd(true)}
                sx={{ backgroundColor: "primary.main" }}
              >
                Add Payment
              </Button>
            </Box>
            <Box display="flex" justifyContent="center">
              <Box sx={{ width: "100%", maxWidth: "1200px" }}>
                {fetchedPayments && fetchedPayments.length > 0 ? (
                  <DataGrid
                    rows={fetchedPayments?.filter((row) => row != null) || []}
                    columns={columns}
                    getRowId={(row) =>
                      row.paymentId ??
                      `${row.sourceAccount}-${row.destinationAccount}-${row.amount}-${row.transactionDate}`
                    }
                    checkboxSelection={false}
                    rowSelection={false}
                    pagination
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
                        setMessage("Payment updated successfully.");
                        setShowSnackbar(true);
                        return { ...newRow };
                      } catch (error) {
                        handleError(
                          error,
                          `Update Payment error: ${error}`,
                          false,
                        );
                        throw error;
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
                    onAction={() => setShowModalAdd(true)}
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
              />
            </div>
          </div>
        )}

        {/* Confirmation Delete Modal */}
        <Modal open={showModalDelete} onClose={() => setShowModalDelete(false)}>
          <Paper>
            <Typography variant="h6">{modalTitles.confirmDeletion}</Typography>
            <Typography>
              {modalBodies.confirmDeletion(
                "payment",
                selectedPayment?.paymentId ?? "",
              )}
            </Typography>
            <Box mt={2} display="flex" justifyContent="space-between">
              <Button
                variant="contained"
                color="primary"
                onClick={handleDeleteRow}
              >
                Delete
              </Button>
              <Button
                variant="outlined"
                color="secondary"
                onClick={() => setShowModalDelete(false)}
              >
                Cancel
              </Button>
            </Box>
          </Paper>
        </Modal>

        {/* Modal to Add or Edit */}
        <Modal open={showModalAdd} onClose={() => setShowModalAdd(false)}>
          <Paper>
            <Typography variant="h6">
              {modalTitles.addNew("payment")}
            </Typography>
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
                  ? fetchedAccounts.filter(
                      (account) => account.accountType === "debit",
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
                  ? fetchedAccounts.filter(
                      (account) => account.accountType === "credit",
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
            />
            <Button
              variant="contained"
              onClick={() => paymentData && handleAddRow(paymentData)}
            >
              {paymentData?.amount && parseFloat(String(paymentData.amount)) > 0
                ? `Pay ${currencyFormat(paymentData.amount)}`
                : "Add Payment"}
            </Button>
          </Paper>
        </Modal>
      </FinanceLayout>
    </div>
  );
}
