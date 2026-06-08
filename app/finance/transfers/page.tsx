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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
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
import SnackbarBaseline from "../../../components/SnackbarBaseline";
import ErrorDisplay from "../../../components/ErrorDisplay";
import EmptyState from "../../../components/EmptyState";
import LoadingState from "../../../components/LoadingState";
import ContentContainer from "../../../components/ContentContainer";
import USDAmountInput from "../../../components/USDAmountInput";
import useFetchTransfer from "../../../hooks/useTransferFetch";
import useTransferInsert from "../../../hooks/useTransferInsert";
import useTransferDelete from "../../../hooks/useTransferDelete";
import useTransactionDelete from "../../../hooks/useTransactionDelete";
import Transfer from "../../../model/Transfer";
import Transaction from "../../../model/Transaction";
import useAccountFetch from "../../../hooks/useAccountFetch";
import Account from "../../../model/Account";
import useTransferUpdate from "../../../hooks/useTransferUpdate";
import PageHeader from "../../../components/PageHeader";
import DataGridBase from "../../../components/DataGridBase";
import FormDialog from "../../../components/FormDialog";
import {
  currencyFormat,
  normalizeTransactionDate,
  formatDateForInput,
  formatDateForDisplay,
} from "../../../components/Common";
import { useFinancePageState } from "../../../hooks/useFinancePageState";
import { useSpinnerEffect } from "../../../hooks/useSpinnerEffect";
import { useLocalStorageCache } from "../../../hooks/useLocalStorageCache";
import { createAccountLinkColumn } from "../../../utils/createDeleteColumn";
import { modalTitles } from "../../../utils/modalMessages";
import { createProcessRowUpdate } from "../../../utils/createProcessRowUpdate";
import { validateAmountAndAccounts } from "../../../utils/validateTransfer";
import { fetchWithErrorHandling, parseResponse } from "../../../utils/fetchUtils";
import { InputSanitizer } from "../../../utils/validation/sanitization";
import { z } from "zod";

const TransferCacheSchema = z.object({
  transactionDate: z
    .union([z.string(), z.date()])
    .transform((v) => (typeof v === "string" ? new Date(v) : v)),
  sourceAccount: z.string().max(100),
  destinationAccount: z.string().max(100),
  activeStatus: z.boolean(),
  amount: z.number().finite(),
});

const LAST_TRANSFER_STORAGE_KEY = "finance_last_transfer";
const TRANSFERS_CACHE_ENABLED_KEY = "finance_cache_enabled_transfers";

const initialTransferData: Transfer = {
  transferId: 0,
  sourceAccount: "",
  destinationAccount: "",
  transactionDate: new Date(),
  amount: 0.0,
  activeStatus: true,
};

export default function Transfers() {
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
  } = useFinancePageState(TRANSFERS_CACHE_ENABLED_KEY);

  const [formErrors, setFormErrors] = useState<{
    amount?: string;
    accounts?: string;
  }>({});
  const [transferData, setTransferData] =
    useState<Transfer>(initialTransferData);
  const [selectedTransfer, setSelectedTransfer] = useState<Transfer | null>(null);
  const [linkedTransactions, setLinkedTransactions] = useState<{
    source: Transaction | null;
    destination: Transaction | null;
  }>({ source: null, destination: null });
  const [isFetchingLinked, setIsFetchingLinked] = useState(false);
  const [availableSourceAccounts, setAvailableSourceAccounts] = useState<Account[]>([]);
  const [availableDestinationAccounts, setAvailableDestinationAccounts] =
    useState<Account[]>([]);
  const [selectedSourceAccount, setSelectedSourceAccount] =
    useState<Account | null>(null);
  const [selectedDestinationAccount, setSelectedDestinationAccount] =
    useState<Account | null>(null);

  const {
    lastValue: lastSubmittedTransfer,
    setLastValue: setLastSubmittedTransfer,
    save: saveTransfer,
  } = useLocalStorageCache<Transfer>({
    storageKey: LAST_TRANSFER_STORAGE_KEY,
    cacheEnabledKey: TRANSFERS_CACHE_ENABLED_KEY,
    schema: TransferCacheSchema,
  });

  const { mutateAsync: insertTransfer } = useTransferInsert();
  const { mutateAsync: deleteTransfer } = useTransferDelete();
  const { mutateAsync: updateTransfer } = useTransferUpdate();
  const { mutateAsync: deleteTransaction } = useTransactionDelete();

  const {
    data: fetchedAccounts,
    isSuccess: isSuccessAccounts,
    isFetching: isFetchingAccounts,
    error: errorAccounts,
    refetch: refetchAccounts,
  } = useAccountFetch();
  const {
    data: fetchedTransfers,
    isSuccess: isSuccessTransfers,
    isFetching: isFetchingTransfers,
    error: errorTransfers,
    refetch: refetchTransfers,
  } = useFetchTransfer();

  const transfersToDisplay =
    fetchedTransfers?.filter((row) => row != null) || [];

  useSpinnerEffect(
    setShowSpinner,
    isFetchingAccounts || isFetchingTransfers,
    isSuccessTransfers && isSuccessAccounts,
    loading,
    isAuthenticated,
  );

  useEffect(() => {
    if (isSuccessAccounts) {
      setAvailableSourceAccounts(
        fetchedAccounts.filter((account) => account.accountType === "debit"),
      );
      setAvailableDestinationAccounts(
        fetchedAccounts.filter((account) => account.accountType === "debit"),
      );
    }
  }, [isSuccessAccounts, fetchedAccounts]);

  useEffect(() => {
    if (selectedSourceAccount) {
      setAvailableDestinationAccounts(
        (fetchedAccounts || []).filter(
          (account) =>
            account.accountType === "debit" &&
            account.accountNameOwner !== selectedSourceAccount.accountNameOwner,
        ),
      );
    } else if (isSuccessAccounts) {
      setAvailableDestinationAccounts(
        (fetchedAccounts || []).filter(
          (account) => account.accountType === "debit",
        ),
      );
    }
  }, [selectedSourceAccount, isSuccessAccounts, fetchedAccounts]);

  useEffect(() => {
    if (selectedDestinationAccount) {
      setAvailableSourceAccounts(
        (fetchedAccounts || []).filter(
          (account) =>
            account.accountType === "debit" &&
            account.accountNameOwner !==
              selectedDestinationAccount.accountNameOwner,
        ),
      );
    } else if (isSuccessAccounts) {
      setAvailableSourceAccounts(
        (fetchedAccounts || []).filter(
          (account) => account.accountType === "debit",
        ),
      );
    }
  }, [selectedDestinationAccount, isSuccessAccounts, fetchedAccounts]);

  const handleSourceAccountChange = (
    _event: React.SyntheticEvent,
    newValue: Account | null,
  ) => {
    setSelectedSourceAccount(newValue);
    setTransferData((prev) => ({
      ...prev,
      sourceAccount: newValue ? newValue.accountNameOwner : "",
    }));
  };

  const handleDestinationAccountChange = (
    _event: React.SyntheticEvent,
    newValue: Account | null,
  ) => {
    setSelectedDestinationAccount(newValue);
    setTransferData((prev) => ({
      ...prev,
      destinationAccount: newValue ? newValue.accountNameOwner : "",
    }));
  };

  const handleDeleteClick = async (row: Transfer) => {
    setSelectedTransfer(row);
    setLinkedTransactions({ source: null, destination: null });
    setShowModalDelete(true);

    if (row.guidSource && row.guidDestination) {
      setIsFetchingLinked(true);
      try {
        const sanitizedSource = InputSanitizer.sanitizeGuid(row.guidSource);
        const sanitizedDest = InputSanitizer.sanitizeGuid(row.guidDestination);
        const [sourceRes, destRes] = await Promise.all([
          fetchWithErrorHandling(`/api/transaction/${sanitizedSource}`),
          fetchWithErrorHandling(`/api/transaction/${sanitizedDest}`),
        ]);
        const [sourceTx, destTx] = await Promise.all([
          parseResponse<Transaction>(sourceRes),
          parseResponse<Transaction>(destRes),
        ]);
        setLinkedTransactions({ source: sourceTx, destination: destTx });
      } catch {
        setLinkedTransactions({ source: null, destination: null });
      } finally {
        setIsFetchingLinked(false);
      }
    }
  };

  const handleDeleteRow = async () => {
    if (!selectedTransfer) return;
    try {
      // Delete transfer first — t_transfer holds FK references to t_transaction guids, so transactions cannot be deleted while the transfer row exists
      await deleteTransfer({ oldRow: selectedTransfer });

      if (linkedTransactions.source) {
        await deleteTransaction({ oldRow: linkedTransactions.source });
      }
      if (linkedTransactions.destination) {
        await deleteTransaction({ oldRow: linkedTransactions.destination });
      }

      const when = formatDateForDisplay(selectedTransfer.transactionDate);
      const amt = currencyFormat(selectedTransfer.amount);
      const txCount = [linkedTransactions.source, linkedTransactions.destination].filter(Boolean).length;
      const txSuffix = txCount > 0 ? ` and ${txCount} linked transaction${txCount !== 1 ? "s" : ""}` : "";
      handleSuccess(
        `Deleted transfer: ${amt} from ${selectedTransfer.sourceAccount} to ${selectedTransfer.destinationAccount} on ${when}${txSuffix}.`,
      );
    } catch (error) {
      handleError(error, `Cascade delete error: ${error}`, false);
    } finally {
      setShowModalDelete(false);
      setSelectedTransfer(null);
      setLinkedTransactions({ source: null, destination: null });
      setIsFetchingLinked(false);
    }
  };

  const handleAddRow = async (newData: Transfer) => {
    const errs = validateAmountAndAccounts(newData?.amount, newData?.sourceAccount, newData?.destinationAccount);
    if (Object.keys(errs).length > 0) {
      setFormErrors(errs);
      setMessage(errs.accounts || errs.amount || "Validation failed");
      setSnackbarSeverity("error");
      setShowSnackbar(true);
      return;
    }

    try {
      const insertThisValue: Transfer = {
        transferId: 0,
        sourceAccount: newData.sourceAccount,
        destinationAccount: newData.destinationAccount,
        transactionDate: newData.transactionDate,
        amount: newData.amount,
        activeStatus: newData.activeStatus,
      };
      await insertTransfer({ payload: insertThisValue });
      if (cacheEnabled) {
        setLastSubmittedTransfer(newData);
        saveTransfer(newData);
      }
      setShowModalAdd(false);
      const when = formatDateForDisplay(newData.transactionDate);
      handleSuccess(
        `Transferred ${currencyFormat(newData.amount)} from ${newData.sourceAccount} to ${newData.destinationAccount} on ${when}.`,
      );
      setFormErrors({});
    } catch (error) {
      handleError(error, `Add Transfer error: ${error}`, false);
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
      renderCell: (params) => {
        return formatDateForDisplay(params.value);
      },
      valueGetter: (params: string) => {
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
        <Tooltip title="Delete this transfer and its linked transactions">
          <IconButton
            aria-label="Delete this transfer and its linked transactions"
            onClick={() => handleDeleteClick(params.row as Transfer)}
          >
            <DeleteIcon />
          </IconButton>
        </Tooltip>
      ),
    },
  ];

  if (errorTransfers || errorAccounts) {
    return (
      <>
        <PageHeader
          title="Transfer Management"
          subtitle="Move funds between accounts with automated transaction creation and tracking"
        />
        <ErrorDisplay
          error={errorTransfers || errorAccounts}
          variant="card"
          showRetry={true}
          onRetry={() => {
            if (errorTransfers) refetchTransfers();
            if (errorAccounts) refetchAccounts();
          }}
        />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Transfer Management"
        subtitle="Move funds between accounts with automated transaction creation and tracking"
        actions={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setTransferData(
                cacheEnabled
                  ? lastSubmittedTransfer || initialTransferData
                  : initialTransferData,
              );
              setFormErrors({});
              setSelectedSourceAccount(null);
              setSelectedDestinationAccount(null);
              setShowModalAdd(true);
            }}
            sx={{ backgroundColor: "primary.main" }}
          >
            Add Transfer
          </Button>
        }
      />
      {showSpinner ? (
        <LoadingState
          variant="card"
          message="Loading transfers and accounts..."
        />
      ) : (
        <>
          <ContentContainer>
            {transfersToDisplay && transfersToDisplay.length > 0 ? (
              <DataGridBase
                rows={transfersToDisplay}
                columns={columns}
                getRowId={(row: Transfer) =>
                  row.transferId ??
                  `${row.sourceAccount}-${row.destinationAccount}-${row.amount}-${row.transactionDate}`
                }
                checkboxSelection={false}
                rowSelection={false}
                paginationModel={paginationModel}
                onPaginationModelChange={(newModel) =>
                  setPaginationModel(newModel)
                }
                pageSizeOptions={[25, 50, 100]}
                processRowUpdate={createProcessRowUpdate<Transfer>(
                  (newRow, oldRow) => updateTransfer({ oldTransfer: oldRow, newTransfer: newRow }),
                  "Transfer updated.",
                  "Update Transfer failure.",
                  handleSuccess,
                  handleError,
                )}
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
            ) : (
              <EmptyState
                title="No Transfers Found"
                message="No transfers have been created yet. Create your first transfer to move funds between accounts."
                dataType="transfers"
                variant="create"
                actionLabel="Add Transfer"
                onAction={() => {
                  setTransferData(
                    lastSubmittedTransfer || initialTransferData,
                  );
                  setFormErrors({});
                  setSelectedSourceAccount(null);
                  setSelectedDestinationAccount(null);
                  setShowModalAdd(true);
                }}
                onRefresh={() => {
                  refetchTransfers();
                  refetchAccounts();
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
          setSelectedTransfer(null);
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
          {isFetchingLinked ? (
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, py: 2 }}>
              <CircularProgress size={20} />
              <Typography variant="body2">Looking up linked transaction records...</Typography>
            </Box>
          ) : (
            <>
              <Alert severity="error" sx={{ mb: 2 }}>
                The following <strong>3 records</strong> will be permanently deleted. This action cannot be undone.
              </Alert>

              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>
                Transfer Record (1)
              </Typography>
              <Paper variant="outlined" sx={{ p: 1.5, mb: 2 }}>
                <Box sx={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "2px 12px", fontSize: "0.875rem" }}>
                  <Typography variant="caption" color="text.secondary">ID</Typography>
                  <Typography variant="body2">{selectedTransfer?.transferId}</Typography>
                  <Typography variant="caption" color="text.secondary">Date</Typography>
                  <Typography variant="body2">{selectedTransfer ? formatDateForDisplay(selectedTransfer.transactionDate) : ""}</Typography>
                  <Typography variant="caption" color="text.secondary">From</Typography>
                  <Typography variant="body2">{selectedTransfer?.sourceAccount}</Typography>
                  <Typography variant="caption" color="text.secondary">To</Typography>
                  <Typography variant="body2">{selectedTransfer?.destinationAccount}</Typography>
                  <Typography variant="caption" color="text.secondary">Amount</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedTransfer ? currencyFormat(selectedTransfer.amount) : ""}</Typography>
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
                    <Typography variant="body2">{selectedTransfer?.sourceAccount}</Typography>
                    <Typography variant="caption" color="text.secondary">Withdrawal GUID</Typography>
                    <Typography variant="body2" sx={{ fontFamily: "monospace", fontSize: "0.75rem", wordBreak: "break-all" }}>{selectedTransfer?.guidSource ?? "—"}</Typography>
                    <Typography variant="caption" color="text.secondary">Deposit Account</Typography>
                    <Typography variant="body2">{selectedTransfer?.destinationAccount}</Typography>
                    <Typography variant="caption" color="text.secondary">Deposit GUID</Typography>
                    <Typography variant="body2" sx={{ fontFamily: "monospace", fontSize: "0.75rem", wordBreak: "break-all" }}>{selectedTransfer?.guidDestination ?? "—"}</Typography>
                  </Box>
                </Paper>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            variant="outlined"
            onClick={() => {
              setShowModalDelete(false);
              setSelectedTransfer(null);
              setLinkedTransactions({ source: null, destination: null });
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            disabled={isFetchingLinked}
            onClick={handleDeleteRow}
          >
            Delete All 3 Records
          </Button>
        </DialogActions>
      </Dialog>

      <FormDialog
        open={showModalAdd}
        onClose={() => setShowModalAdd(false)}
        onSubmit={() => transferData && handleAddRow(transferData)}
        title={modalTitles.addNew("transfer")}
        submitText={
          transferData?.amount !== null &&
          transferData?.amount !== undefined &&
          parseFloat(String(transferData.amount)) >= 0
            ? `Transfer ${currencyFormat(transferData.amount)}`
            : "Add Transfer"
        }
      >
        <TextField
          label="Transaction Date"
          fullWidth
          margin="normal"
          type="date"
          value={formatDateForInput(
            transferData?.transactionDate || new Date(),
          )}
          onChange={(e) => {
            const normalizedDate = normalizeTransactionDate(e.target.value);
            setTransferData((prev: Transfer) => ({
              ...prev,
              transactionDate: normalizedDate,
            }));
          }}
          slotProps={{
            inputLabel: { shrink: true },
          }}
        />

        <Autocomplete
          options={availableSourceAccounts}
          getOptionLabel={(account: Account) => account.accountNameOwner || ""}
          isOptionEqualToValue={(option, value) =>
            option.accountNameOwner === value?.accountNameOwner
          }
          value={selectedSourceAccount}
          onChange={handleSourceAccountChange}
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
          options={availableDestinationAccounts}
          getOptionLabel={(account: Account) => account.accountNameOwner || ""}
          isOptionEqualToValue={(option, value) =>
            option.accountNameOwner === value?.accountNameOwner
          }
          value={selectedDestinationAccount}
          onChange={handleDestinationAccountChange}
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
          value={transferData?.amount ? transferData.amount : ""}
          onChange={(value) => {
            setTransferData((prev: Transfer) => ({
              ...prev,
              amount:
                typeof value === "string" ? parseFloat(value) || 0 : value,
            }));
            if (formErrors.amount) {
              setFormErrors((prev) => ({ ...prev, amount: undefined }));
            }
          }}
          onBlur={() => {
            const currentValue = parseFloat(String(transferData?.amount || ""));
            if (!isNaN(currentValue)) {
              setTransferData((prev: Transfer) => ({
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
        {formErrors.accounts && (
          <Typography color="error" variant="caption" sx={{ mt: 1 }}>
            {formErrors.accounts}
          </Typography>
        )}
        <CacheToggleCheckbox
          checked={cacheEnabled}
          cacheEnabledKey={TRANSFERS_CACHE_ENABLED_KEY}
          cacheDataKey={LAST_TRANSFER_STORAGE_KEY}
          onChange={(checked) => {
            setCacheEnabled(checked);
            if (!checked) setLastSubmittedTransfer(null);
          }}
        />
      </FormDialog>
    </>
  );
}
