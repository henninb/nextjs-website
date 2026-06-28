"use client";
import { getErrorMessage } from "../../../types";
import React, { useState, useEffect } from "react";
import { GridColDef } from "@mui/x-data-grid";
import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  TextField,
  Typography,
  Autocomplete,
  ToggleButton,
  ToggleButtonGroup,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Paper,
  Divider,
  IconButton,
  Tooltip,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
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
import Transaction from "../../../model/Transaction";
import useAccountFetch from "../../../hooks/useAccountFetch";
import useParameterFetch from "../../../hooks/useParameterFetch";
import Account from "../../../model/Account";
import { isAssetAccount, isLiabilityAccount } from "../../../model/AccountTypeUtils";
import usePaymentUpdate from "../../../hooks/usePaymentUpdate";
import PageHeader from "../../../components/PageHeader";
import DataGridBase from "../../../components/DataGridBase";
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
import { modalTitles } from "../../../utils/modalMessages";
import { createAccountLinkColumn } from "../../../utils/createDeleteColumn";
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
  const [linkedTransactions, setLinkedTransactions] = useState<{
    source: Transaction | null;
    destination: Transaction | null;
  }>({ source: null, destination: null });
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

  const handleDeleteClick = (row: Payment) => {
    setSelectedPayment(row);
    // Derive linked transaction details from the payment record — no API call needed
    setLinkedTransactions({
      source: row.guidSource
        ? ({
            guid: row.guidSource,
            accountNameOwner: row.sourceAccount,
            description: "payment",
            amount: -Math.abs(row.amount),
            transactionDate: row.transactionDate,
          } as Transaction)
        : null,
      destination: row.guidDestination
        ? ({
            guid: row.guidDestination,
            accountNameOwner: row.destinationAccount,
            description: "payment",
            amount: -Math.abs(row.amount),
            transactionDate: row.transactionDate,
          } as Transaction)
        : null,
    });
    setShowModalDelete(true);
  };

  const handleDeleteRow = async () => {
    if (!selectedPayment) return;
    try {
      // Backend (PaymentService.deleteById) handles cascade: deletes payment then both linked transactions
      await deletePayment({ oldRow: selectedPayment });
      const when = formatDateForDisplay(selectedPayment.transactionDate);
      const amt = currencyFormat(selectedPayment.amount);
      handleSuccess(
        `Deleted payment: ${amt} from ${selectedPayment.sourceAccount} to ${selectedPayment.destinationAccount} on ${when} and 2 linked transactions.`,
      );
    } catch (error) {
      handleError(error, `Delete payment error: ${error}`, false);
    } finally {
      setShowModalDelete(false);
      setSelectedPayment(null);
      setLinkedTransactions({ source: null, destination: null });
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
    {
      field: "",
      headerName: "Actions",
      width: 100,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Tooltip title="Delete this payment and its linked transactions">
          <IconButton
            aria-label="Delete this payment and its linked transactions"
            onClick={() => handleDeleteClick(params.row as Payment)}
          >
            <DeleteIcon />
          </IconButton>
        </Tooltip>
      ),
    },
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

      <Dialog
        open={showModalDelete}
        onClose={() => {
          setShowModalDelete(false);
          setSelectedPayment(null);
          setLinkedTransactions({ source: null, destination: null });
        }}
        maxWidth="sm"
        fullWidth
        transitionDuration={0}
      >
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <WarningAmberIcon color="error" />
          Cascade Delete Confirmation
        </DialogTitle>
        <DialogContent>
          <>
            <Alert severity="error" sx={{ mb: 2 }}>
              The following <strong>3 records</strong> will be permanently deleted. This action cannot be undone.
            </Alert>

              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>
                Payment Record (1)
              </Typography>
              <Paper variant="outlined" sx={{ p: 1.5, mb: 2 }}>
                <Box sx={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "2px 12px", fontSize: "0.875rem" }}>
                  <Typography variant="caption" color="text.secondary">ID</Typography>
                  <Typography variant="body2">{selectedPayment?.paymentId}</Typography>
                  <Typography variant="caption" color="text.secondary">Date</Typography>
                  <Typography variant="body2">{selectedPayment ? formatDateForDisplay(selectedPayment.transactionDate) : ""}</Typography>
                  <Typography variant="caption" color="text.secondary">From</Typography>
                  <Typography variant="body2">{selectedPayment?.sourceAccount}</Typography>
                  <Typography variant="caption" color="text.secondary">To</Typography>
                  <Typography variant="body2">{selectedPayment?.destinationAccount}</Typography>
                  <Typography variant="caption" color="text.secondary">Amount</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedPayment ? currencyFormat(selectedPayment.amount) : ""}</Typography>
                </Box>
              </Paper>

              <Divider sx={{ my: 1.5 }} />

              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>
                Linked Transaction Records (2)
              </Typography>

              {linkedTransactions.source || linkedTransactions.destination ? (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                  {linkedTransactions.source && (
                    <Paper variant="outlined" sx={{ p: 1.5 }}>
                      <Typography variant="caption" color="primary" sx={{ fontWeight: 600, display: "block", mb: 0.5 }}>
                        Withdrawal Transaction
                      </Typography>
                      <Box sx={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "2px 12px", fontSize: "0.875rem" }}>
                        <Typography variant="caption" color="text.secondary">Account</Typography>
                        <Typography variant="body2">{linkedTransactions.source.accountNameOwner}</Typography>
                        <Typography variant="caption" color="text.secondary">Description</Typography>
                        <Typography variant="body2">{linkedTransactions.source.description}</Typography>
                        <Typography variant="caption" color="text.secondary">Amount</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{currencyFormat(linkedTransactions.source.amount)}</Typography>
                        <Typography variant="caption" color="text.secondary">Date</Typography>
                        <Typography variant="body2">{formatDateForDisplay(linkedTransactions.source.transactionDate)}</Typography>
                        <Typography variant="caption" color="text.secondary">GUID</Typography>
                        <Typography variant="body2" sx={{ fontFamily: "monospace", fontSize: "0.75rem", wordBreak: "break-all" }}>{linkedTransactions.source.guid}</Typography>
                      </Box>
                    </Paper>
                  )}
                  {linkedTransactions.destination && (
                    <Paper variant="outlined" sx={{ p: 1.5 }}>
                      <Typography variant="caption" color="success.main" sx={{ fontWeight: 600, display: "block", mb: 0.5 }}>
                        Deposit Transaction
                      </Typography>
                      <Box sx={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "2px 12px", fontSize: "0.875rem" }}>
                        <Typography variant="caption" color="text.secondary">Account</Typography>
                        <Typography variant="body2">{linkedTransactions.destination.accountNameOwner}</Typography>
                        <Typography variant="caption" color="text.secondary">Description</Typography>
                        <Typography variant="body2">{linkedTransactions.destination.description}</Typography>
                        <Typography variant="caption" color="text.secondary">Amount</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{currencyFormat(linkedTransactions.destination.amount)}</Typography>
                        <Typography variant="caption" color="text.secondary">Date</Typography>
                        <Typography variant="body2">{formatDateForDisplay(linkedTransactions.destination.transactionDate)}</Typography>
                        <Typography variant="caption" color="text.secondary">GUID</Typography>
                        <Typography variant="body2" sx={{ fontFamily: "monospace", fontSize: "0.75rem", wordBreak: "break-all" }}>{linkedTransactions.destination.guid}</Typography>
                      </Box>
                    </Paper>
                  )}
                </Box>
              ) : (
                <Paper variant="outlined" sx={{ p: 1.5 }}>
                  <Box sx={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "2px 12px" }}>
                    <Typography variant="caption" color="text.secondary">Withdrawal Account</Typography>
                    <Typography variant="body2">{selectedPayment?.sourceAccount}</Typography>
                    <Typography variant="caption" color="text.secondary">Withdrawal GUID</Typography>
                    <Typography variant="body2" sx={{ fontFamily: "monospace", fontSize: "0.75rem", wordBreak: "break-all" }}>{selectedPayment?.guidSource ?? "—"}</Typography>
                    <Typography variant="caption" color="text.secondary">Deposit Account</Typography>
                    <Typography variant="body2">{selectedPayment?.destinationAccount}</Typography>
                    <Typography variant="caption" color="text.secondary">Deposit GUID</Typography>
                    <Typography variant="body2" sx={{ fontFamily: "monospace", fontSize: "0.75rem", wordBreak: "break-all" }}>{selectedPayment?.guidDestination ?? "—"}</Typography>
                  </Box>
                </Paper>
              )}
          </>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            variant="outlined"
            onClick={() => {
              setShowModalDelete(false);
              setSelectedPayment(null);
              setLinkedTransactions({ source: null, destination: null });
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDeleteRow}
          >
            Delete All 3 Records
          </Button>
        </DialogActions>
      </Dialog>

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
                    ? isAssetAccount(account.accountType)
                    : isLiabilityAccount(account.accountType),
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
                  (account) => isLiabilityAccount(account.accountType),
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
        <FormControlLabel
          control={
            <Checkbox
              checked={paymentData.activeStatus ?? true}
              onChange={(e) =>
                setPaymentData((prev) => ({
                  ...prev,
                  activeStatus: e.target.checked,
                }))
              }
            />
          }
          label="Active"
          sx={{ mt: 1 }}
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
