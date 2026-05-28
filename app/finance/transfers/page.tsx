"use client";
import { getErrorMessage } from "../../../types";
import React, { useState, useEffect } from "react";
import { GridColDef } from "@mui/x-data-grid";
import { Box, Button, TextField, Typography, Autocomplete } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
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
import Transfer from "../../../model/Transfer";
import useAccountFetch from "../../../hooks/useAccountFetch";
import Account from "../../../model/Account";
import useTransferUpdate from "../../../hooks/useTransferUpdate";
import PageHeader from "../../../components/PageHeader";
import DataGridBase from "../../../components/DataGridBase";
import ConfirmDialog from "../../../components/ConfirmDialog";
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
import { modalTitles, modalBodies } from "../../../utils/modalMessages";
import { createDeleteColumn, createAccountLinkColumn } from "../../../utils/createDeleteColumn";
import { createProcessRowUpdate } from "../../../utils/createProcessRowUpdate";
import { validateAmountAndAccounts } from "../../../utils/validateTransfer";
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

  const handleDeleteRow = async () => {
    if (selectedTransfer) {
      try {
        await deleteTransfer({ oldRow: selectedTransfer });
        const when = formatDateForDisplay(selectedTransfer.transactionDate);
        const amt = currencyFormat(selectedTransfer.amount);
        handleSuccess(
          `Transfer deleted: ${amt} from ${selectedTransfer.sourceAccount} to ${selectedTransfer.destinationAccount} on ${when}.`,
        );
      } catch (error) {
        handleError(error, `Delete Transfer error: ${error}`, false);
      } finally {
        setShowModalDelete(false);
        setSelectedTransfer(null);
      }
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
    createDeleteColumn<Transfer>((row) => {
      setSelectedTransfer(row);
      setShowModalDelete(true);
    }),
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

      <ConfirmDialog
        open={showModalDelete}
        onClose={() => setShowModalDelete(false)}
        onConfirm={handleDeleteRow}
        title={modalTitles.confirmDeletion}
        message={modalBodies.confirmDeletion(
          "transfer",
          selectedTransfer?.transferId ?? "",
        )}
        confirmText="Delete"
        cancelText="Cancel"
      />

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
