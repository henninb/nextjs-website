"use client";
import { getErrorMessage } from "../../../types";
import React, { useState, useEffect } from "react";
import { GridColDef } from "@mui/x-data-grid";
import {
  Box,
  Button,
  TextField,
  Typography,
  Autocomplete,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import CacheToggleCheckbox from "../../../components/CacheToggleCheckbox";
import EventRepeatIcon from "@mui/icons-material/EventRepeat";
import SnackbarBaseline from "../../../components/SnackbarBaseline";
import ErrorDisplay from "../../../components/ErrorDisplay";
import EmptyState from "../../../components/EmptyState";
import LoadingState from "../../../components/LoadingState";
import ContentContainer from "../../../components/ContentContainer";
import USDAmountInput from "../../../components/USDAmountInput";
import useFetchPayment from "../../../hooks/usePaymentFetch";
import usePaymentInsert from "../../../hooks/usePaymentInsert";
import usePaymentDelete from "../../../hooks/usePaymentDelete";
import Payment from "../../../model/Payment";
import useAccountFetch from "../../../hooks/useAccountFetch";
import useParameterFetch from "../../../hooks/useParameterFetch";
import Account from "../../../model/Account";
import usePaymentUpdate from "../../../hooks/usePaymentUpdate";
import PageHeader from "../../../components/PageHeader";
import DataGridBase from "../../../components/DataGridBase";
import ConfirmDialog from "../../../components/ConfirmDialog";
import FormDialog from "../../../components/FormDialog";
import BatchPaymentModal from "../../../components/BatchPaymentModal";
import {
  currencyFormat,
  normalizeTransactionDate,
  formatDateForInput,
  formatDateForDisplay,
} from "../../../components/Common";
import { useFinancePageState } from "../../../hooks/useFinancePageState";
import { useSpinnerEffect } from "../../../hooks/useSpinnerEffect";
import { useLocalStorageCache } from "../../../hooks/useLocalStorageCache";
import { modalTitles, modalBodies } from "../../../utils/modalMessages";
import { createDeleteColumn, createAccountLinkColumn } from "../../../utils/createDeleteColumn";
import { createProcessRowUpdate } from "../../../utils/createProcessRowUpdate";
import { validateAmountAndAccounts } from "../../../utils/validateTransfer";
import { z } from "zod";

const PaymentCacheSchema = z.object({
  transactionDate: z
    .union([z.string(), z.date()])
    .transform((v) => (typeof v === "string" ? new Date(v) : v)),
  destinationAccount: z.string().max(100),
  sourceAccount: z.string().max(100),
  activeStatus: z.boolean(),
  amount: z.number().finite(),
});

const LAST_PAYMENT_STORAGE_KEY = "finance_last_payment";
const PAYMENTS_CACHE_ENABLED_KEY = "finance_cache_enabled_payments";

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
  const {
    message,
    showSnackbar,
    snackbarSeverity,
    showSpinner,
    setShowSpinner,
    showModalAdd,
    setShowModalAdd,
    showModalDelete,
    setShowModalDelete,
    paginationModel,
    setPaginationModel,
    cacheEnabled,
    setCacheEnabled,
    isAuthenticated,
    loading,
    handleError,
    handleSuccess,
    handleSnackbarClose,
    setMessage,
    setShowSnackbar,
    setSnackbarSeverity,
  } = useFinancePageState(PAYMENTS_CACHE_ENABLED_KEY);

  const [showBatchModal, setShowBatchModal] = useState(false);
  const [paymentData, setPaymentData] = useState<Payment>(initialPaymentData);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [formErrors, setFormErrors] = useState<{
    amount?: string;
    accounts?: string;
  }>({});
  const [paymentMode, setPaymentMode] = useState<"payBill" | "balanceTransfer">(
    "payBill",
  );

  const {
    lastValue: lastSubmittedPayment,
    setLastValue: setLastSubmittedPayment,
    save: savePayment,
  } = useLocalStorageCache<Payment>({
    storageKey: LAST_PAYMENT_STORAGE_KEY,
    cacheEnabledKey: PAYMENTS_CACHE_ENABLED_KEY,
    schema: PaymentCacheSchema,
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

  useSpinnerEffect(
    setShowSpinner,
    isFetchingPayments || isFetchingAccounts || isFetchingParameters,
    isSuccessPayments && isSuccessAccounts && isSuccessParameters,
    loading,
    isAuthenticated,
  );

  const defaultPaymentMethod =
    fetchedParameters?.find(
      (param) => param.parameterName === "payment_account",
    )?.parameterValue || "";

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

  const handleAddRow = async (newData: Payment) => {
    const errs = validateAmountAndAccounts(newData?.amount, newData?.sourceAccount, newData?.destinationAccount);
    if (Object.keys(errs).length > 0) {
      setFormErrors(errs);
      setMessage(errs.accounts || errs.amount || "Validation failed");
      setSnackbarSeverity("error");
      setShowSnackbar(true);
      return;
    }

    try {
      await insertPayment({ payload: newData });
      if (cacheEnabled) {
        setLastSubmittedPayment(newData);
        savePayment(newData);
      }
      setShowModalAdd(false);
      const when = formatDateForDisplay(newData.transactionDate);
      handleSuccess(
        `Payment added: ${currencyFormat(newData.amount)} from ${newData.sourceAccount} to ${newData.destinationAccount} on ${when}.`,
      );
    } catch (error) {
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
    createAccountLinkColumn("sourceAccount", "Source Account"),
    createAccountLinkColumn("destinationAccount", "Destination Account"),
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
      valueFormatter: (params: number) => currencyFormat(params),
    },
    createDeleteColumn<Payment>((row) => {
      setSelectedPayment(row);
      setShowModalDelete(true);
    }),
  ];

  if (errorPayments || errorAccounts || errorParameters) {
    return (
      <>
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
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Payment Management"
        subtitle="Track and manage payments between accounts with automated transaction processing"
        actions={
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<EventRepeatIcon />}
              onClick={() => setShowBatchModal(true)}
            >
              Batch
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                setPaymentData(
                  cacheEnabled
                    ? lastSubmittedPayment || initialPaymentData
                    : initialPaymentData,
                );
                setFormErrors({});
                setPaymentMode("payBill");
                setShowModalAdd(true);
              }}
              sx={{ backgroundColor: "primary.main" }}
            >
              Add Payment
            </Button>
          </Box>
        }
      />
      {showSpinner ? (
        <LoadingState
          variant="card"
          message="Loading payments and accounts..."
        />
      ) : (
        <>
          <ContentContainer>
            {fetchedPayments && fetchedPayments.length > 0 ? (
              <DataGridBase
                rows={fetchedPayments?.filter((row) => row != null) || []}
                columns={columns}
                getRowId={(row: Payment) =>
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
                processRowUpdate={createProcessRowUpdate<Payment>(
                  (newRow, oldRow) => updatePayment({ oldPayment: oldRow, newPayment: newRow }),
                  `Payment updated.`,
                  "Update Payment failure.",
                  handleSuccess,
                  handleError,
                )}
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
                  setPaymentData(lastSubmittedPayment || initialPaymentData);
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
          </ContentContainer>
        </>
      )}

      <SnackbarBaseline
        message={message}
        state={showSnackbar}
        handleSnackbarClose={handleSnackbarClose}
        severity={snackbarSeverity}
      />

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

      <BatchPaymentModal
        open={showBatchModal}
        onClose={() => setShowBatchModal(false)}
        accounts={isSuccessAccounts ? fetchedAccounts : []}
        defaultSourceAccount={defaultPaymentMethod}
        onBatchSuccess={(count, total) =>
          handleSuccess(
            `Batch complete: ${count} payment${count !== 1 ? "s" : ""} totaling ${currencyFormat(total)} submitted.`,
          )
        }
        onBatchError={(error, msg) => handleError(error, msg, false)}
      />

      <FormDialog
        open={showModalAdd}
        onClose={() => setShowModalAdd(false)}
        onSubmit={() => paymentData && handleAddRow(paymentData)}
        title={modalTitles.addNew("payment")}
        submitText={
          paymentData?.amount !== null &&
          paymentData?.amount !== undefined &&
          parseFloat(String(paymentData.amount)) >= 0
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
            <ToggleButton value="balanceTransfer" aria-label="Balance Transfer">
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
          getOptionLabel={(account: Account) => account.accountNameOwner || ""}
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
          getOptionLabel={(account: Account) => account.accountNameOwner || ""}
          isOptionEqualToValue={(option, value) =>
            option.accountNameOwner === value?.accountNameOwner
          }
          value={
            paymentData.destinationAccount && isSuccessAccounts
              ? fetchedAccounts.find(
                  (account) =>
                    account.accountNameOwner === paymentData.destinationAccount,
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
            setPaymentData((prev: Payment) => ({
              ...prev,
              amount:
                typeof value === "string" ? parseFloat(value) || 0 : value,
            }));
          }}
          onBlur={() => {
            const currentValue = parseFloat(String(paymentData?.amount || ""));
            if (!isNaN(currentValue)) {
              setPaymentData((prev: Payment) => ({
                ...prev,
                amount: Number(currentValue.toFixed(2)),
              }));
            }
          }}
          fullWidth
          margin="normal"
          error={!!formErrors.amount}
          helperText={formErrors.amount}
        />
        <CacheToggleCheckbox
          checked={cacheEnabled}
          cacheEnabledKey={PAYMENTS_CACHE_ENABLED_KEY}
          cacheDataKey={LAST_PAYMENT_STORAGE_KEY}
          onChange={(checked) => {
            setCacheEnabled(checked);
            if (!checked) setLastSubmittedPayment(null);
          }}
        />
      </FormDialog>
    </>
  );
}
