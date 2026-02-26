"use client";
import { getErrorMessage } from "../../../types";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { GridColDef } from "@mui/x-data-grid";
import {
  Box,
  Button,
  IconButton,
  Tooltip,
  Link,
  TextField,
  Autocomplete,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import FinanceLayout from "../../../layouts/FinanceLayout";
import PageHeader from "../../../components/PageHeader";
import DataGridBase from "../../../components/DataGridBase";
import ConfirmDialog from "../../../components/ConfirmDialog";
import FormDialog from "../../../components/FormDialog";
import LoadingState from "../../../components/LoadingState";
import EmptyState from "../../../components/EmptyState";
import ErrorDisplay from "../../../components/ErrorDisplay";
import SnackbarBaseline from "../../../components/SnackbarBaseline";
import USDAmountInput from "../../../components/USDAmountInput";
import { useAuth } from "../../../components/AuthProvider";
import {
  currencyFormat,
  normalizeTransactionDate,
  formatDateForInput,
  formatDateForDisplay,
} from "../../../components/Common";

import Transfer from "../../../model/Transfer";
import Account from "../../../model/Account";

import useTransferFetchGql from "../../../hooks/useTransferFetchGql";
import useTransferInsertGql from "../../../hooks/useTransferInsertGql";
import useTransferDeleteGql from "../../../hooks/useTransferDeleteGql";
import useTransferUpdateGql from "../../../hooks/useTransferUpdateGql";
import useAccountFetchGql from "../../../hooks/useAccountFetchGql";

const LAST_TRANSFER_STORAGE_KEY = "finance_last_transfer_next";
const TRANSFERS_NEXT_CACHE_ENABLED_KEY = "finance_cache_enabled_transfers_next";

const initialTransferData: Transfer = {
  transferId: 0,
  sourceAccount: "",
  destinationAccount: "",
  transactionDate: new Date(),
  amount: 0,
  guidSource: "",
  guidDestination: "",
  activeStatus: true,
};

// Helper functions for localStorage operations
const getLastTransferFromStorage = (): Transfer | null => {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(LAST_TRANSFER_STORAGE_KEY);
    if (!stored) return null;
    const parsed = JSON.parse(stored);
    // Convert stored date string back to Date object
    if (parsed.transactionDate) {
      parsed.transactionDate = new Date(parsed.transactionDate);
    }
    return parsed;
  } catch (error) {
    console.error("Error reading last transfer from localStorage:", error);
    return null;
  }
};

const saveLastTransferToStorage = (transfer: Transfer): void => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LAST_TRANSFER_STORAGE_KEY, JSON.stringify(transfer));
  } catch (error) {
    console.error("Error saving last transfer to localStorage:", error);
  }
};

export default function TransfersNextGen() {
  console.log("🔧 TRANSFERS NEXT-GEN COMPONENT LOADED - DEBUG VERSION");
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

  const [transferData, setTransferData] =
    useState<Transfer>(initialTransferData);

  const [selectedTransfer, setSelectedTransfer] = useState<Transfer | null>(
    null,
  );

  const [lastSubmittedTransfer, setLastSubmittedTransfer] =
    useState<Transfer | null>(null);
  const [cacheEnabled, setCacheEnabled] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(TRANSFERS_NEXT_CACHE_ENABLED_KEY) === "true";
  });

  // Initialize last transfer from localStorage on mount (only if cache is enabled)
  useEffect(() => {
    if (localStorage.getItem(TRANSFERS_NEXT_CACHE_ENABLED_KEY) === "true") {
      const storedTransfer = getLastTransferFromStorage();
      if (storedTransfer) {
        setLastSubmittedTransfer(storedTransfer);
      }
    }
  }, []);
  const [availableSourceAccounts, setAvailableSourceAccounts] = useState<
    Account[]
  >([]);
  const [availableDestinationAccounts, setAvailableDestinationAccounts] =
    useState<Account[]>([]);
  const [selectedSourceAccount, setSelectedSourceAccount] =
    useState<Account | null>(null);
  const [selectedDestinationAccount, setSelectedDestinationAccount] =
    useState<Account | null>(null);

  const {
    data: fetchedAccounts,
    isSuccess: isSuccessAccounts,
    isFetching: isFetchingAccounts,
    error: errorAccounts,
    refetch: refetchAccounts,
  } = useAccountFetchGql();
  const {
    data: fetchedTransfers,
    isSuccess: isSuccessTransfers,
    isFetching: isFetchingTransfers,
    error: errorTransfers,
    refetch: refetchTransfers,
  } = useTransferFetchGql();

  const { mutateAsync: insertTransfer } = useTransferInsertGql();
  const { mutateAsync: deleteTransfer } = useTransferDeleteGql();
  const { mutateAsync: updateTransfer } = useTransferUpdateGql();

  const transfersToDisplay =
    fetchedTransfers?.filter((row) => row != null) || [];

  useEffect(() => {
    if (loading) {
      setShowSpinner(true);
    }
    if (!loading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [loading, isAuthenticated, router]);

  useEffect(() => {
    if (
      isFetchingAccounts ||
      isFetchingTransfers ||
      loading ||
      (!loading && !isAuthenticated)
    ) {
      setShowSpinner(true);
      return;
    }
    if (isSuccessTransfers && isSuccessAccounts) {
      setShowSpinner(false);
    }
  }, [
    isSuccessTransfers,
    isSuccessAccounts,
    errorTransfers,
    errorAccounts,
    isFetchingAccounts,
    isFetchingTransfers,
    loading,
    isAuthenticated,
  ]);

  useEffect(() => {
    console.log("[TransfersNextGen] Account fetch effect triggered:", {
      isSuccessAccounts,
      isFetchingAccounts,
      errorAccounts: errorAccounts?.message,
      fetchedAccountsLength: fetchedAccounts?.length,
      fetchedAccounts,
    });

    if (isSuccessAccounts && fetchedAccounts) {
      const allAccountTypes = fetchedAccounts.map((a) => ({
        name: a.accountNameOwner,
        type: a.accountType,
      }));
      const uniqueAccountTypes = [
        ...new Set(fetchedAccounts.map((a) => a.accountType)),
      ];

      console.log("[TransfersNextGen] Account type analysis:", {
        totalAccounts: fetchedAccounts.length,
        uniqueAccountTypes,
        sampleAccountTypes: allAccountTypes.slice(0, 10),
        firstFewAccounts: fetchedAccounts.slice(0, 3),
      });

      // Filter for debit accounts only (case-insensitive for GraphQL/REST API compatibility)
      const debitAccounts = fetchedAccounts.filter(
        (a) => a.accountType.toLowerCase() === "debit",
      );
      console.log("[TransfersNextGen] Account filtering results:", {
        totalAccounts: fetchedAccounts.length,
        debitAccountsLength: debitAccounts.length,
        uniqueAccountTypes,
        sampleAccountTypes: allAccountTypes.slice(0, 5),
      });
      setAvailableSourceAccounts(debitAccounts);
      setAvailableDestinationAccounts(debitAccounts);
    } else if (errorAccounts) {
      console.error("[TransfersNextGen] Account fetch error:", {
        error: errorAccounts,
        message: errorAccounts.message,
        stack: errorAccounts.stack,
      });
    }
  }, [isSuccessAccounts, fetchedAccounts, errorAccounts, isFetchingAccounts]);

  useEffect(() => {
    if (selectedSourceAccount) {
      setAvailableDestinationAccounts(
        (fetchedAccounts || []).filter(
          (a) =>
            a.accountType.toLowerCase() === "debit" &&
            a.accountNameOwner !== selectedSourceAccount.accountNameOwner,
        ),
      );
    } else if (isSuccessAccounts) {
      setAvailableDestinationAccounts(
        (fetchedAccounts || []).filter(
          (a) => a.accountType.toLowerCase() === "debit",
        ),
      );
    }
  }, [selectedSourceAccount, isSuccessAccounts, fetchedAccounts]);

  useEffect(() => {
    if (selectedDestinationAccount) {
      setAvailableSourceAccounts(
        (fetchedAccounts || []).filter(
          (a) =>
            a.accountType.toLowerCase() === "debit" &&
            a.accountNameOwner !== selectedDestinationAccount.accountNameOwner,
        ),
      );
    } else if (isSuccessAccounts) {
      setAvailableSourceAccounts(
        (fetchedAccounts || []).filter(
          (a) => a.accountType.toLowerCase() === "debit",
        ),
      );
    }
  }, [selectedDestinationAccount, isSuccessAccounts, fetchedAccounts]);

  // Reset selected accounts when modal is closed
  useEffect(() => {
    if (!showModalAdd) {
      setSelectedSourceAccount(null);
      setSelectedDestinationAccount(null);
    }
  }, [showModalAdd]);

  const handleSourceAccountChange = (
    _e: React.SyntheticEvent,
    newValue: Account | null,
  ) => {
    setSelectedSourceAccount(newValue);
    setTransferData((prev) => ({
      ...prev,
      sourceAccount: newValue ? newValue.accountNameOwner : "",
    }));
  };

  const handleDestinationAccountChange = (
    _e: React.SyntheticEvent,
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
        setMessage(
          `Transfer deleted: ${amt} from ${selectedTransfer.sourceAccount} to ${selectedTransfer.destinationAccount} on ${when}.`,
        );
        setShowSnackbar(true);
      } catch (error: unknown) {
        handleError(error, `Delete Transfer error: ${error}`, false);
      } finally {
        setShowModalDelete(false);
        setSelectedTransfer(null);
      }
    }
  };

  const handleError = (
    error: unknown,
    moduleName: string,
    throwIt: boolean,
  ) => {
    const errorMessage = `${moduleName}: ${getErrorMessage(error)}`;
    setMessage(errorMessage);
    setShowSnackbar(true);
    console.error(errorMessage);
    if (throwIt) throw error;
  };

  const handleAddRow = async (newData: Transfer) => {
    try {
      await insertTransfer({ payload: newData });
      if (cacheEnabled) {
        setLastSubmittedTransfer(newData);
        saveLastTransferToStorage(newData);
      }
      const when = formatDateForDisplay(newData.transactionDate);
      setMessage(
        `Transferred ${currencyFormat(newData.amount)} from ${newData.sourceAccount} to ${newData.destinationAccount} on ${when}.`,
      );
      setShowSnackbar(true);
      setShowSpinner(false);
      setShowModalAdd(false);
    } catch (error: unknown) {
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
              setSelectedTransfer(params.row);
              setShowModalDelete(true);
            }}
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
          title="Transfer Management (Next‑Gen)"
          subtitle="GraphQL-powered transfers between accounts"
        />
        <ErrorDisplay
          error={errorTransfers || errorAccounts}
          variant="card"
          showRetry
          onRetry={() => {
            if (errorTransfers) refetchTransfers();
            if (errorAccounts) refetchAccounts();
          }}
        />
      </>
    );
  }

  return (
    <div>
      <>
        <PageHeader
          title="Transfer Management (Next‑Gen)"
          subtitle="GraphQL-powered transfers between accounts"
          actions={
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                setTransferData(cacheEnabled ? (lastSubmittedTransfer || initialTransferData) : initialTransferData);
                setSelectedSourceAccount(null);
                setSelectedDestinationAccount(null);
                setShowModalAdd(true);
              }}
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
        ) : transfersToDisplay && transfersToDisplay.length > 0 ? (
          <Box display="flex" justifyContent="center">
            <Box sx={{ width: "100%", maxWidth: "1200px" }}>
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
                onPaginationModelChange={(m) => setPaginationModel(m)}
                pageSizeOptions={[25, 50, 100]}
                processRowUpdate={async (
                  newRow: Transfer,
                  oldRow: Transfer,
                ): Promise<Transfer> => {
                  if (JSON.stringify(newRow) === JSON.stringify(oldRow))
                    return oldRow;
                  try {
                    await updateTransfer({
                      oldTransfer: oldRow,
                      newTransfer: newRow,
                    });
                    const when = formatDateForDisplay(newRow.transactionDate);
                    setMessage(
                      `Transfer updated: ${currencyFormat(newRow.amount)} from ${newRow.sourceAccount} to ${newRow.destinationAccount} on ${when}.`,
                    );
                    setShowSnackbar(true);
                    return { ...newRow };
                  } catch (error: unknown) {
                    handleError(
                      error,
                      `Update Transfer error: ${error}`,
                      false,
                    );
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
            title="No Transfers Found"
            message="Create your first transfer to move funds between accounts."
            actionLabel="Add Transfer"
            onAction={() => {
              setTransferData(cacheEnabled ? (lastSubmittedTransfer || initialTransferData) : initialTransferData);
              setSelectedSourceAccount(null);
              setSelectedDestinationAccount(null);
              setShowModalAdd(true);
            }}
            variant="create"
            dataType="transfers"
          />
        )}

        <ConfirmDialog
          open={showModalDelete}
          title="Delete Transfer?"
          message={`Are you sure you want to delete transfer ${selectedTransfer?.transferId ?? ""}? This cannot be undone.`}
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
          onSubmit={() => handleAddRow(transferData)}
          title={
            transferData?.amount !== null &&
            transferData?.amount !== undefined &&
            parseFloat(String(transferData.amount)) >= 0
              ? `Transfer ${currencyFormat(transferData.amount)}`
              : "Add Transfer"
          }
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
              setTransferData((prev: any) => ({
                ...prev,
                transactionDate: normalizedDate,
              }));
            }}
            slotProps={{ inputLabel: { shrink: true } }}
          />

          <Autocomplete
            options={availableSourceAccounts}
            getOptionLabel={(a: Account) => a.accountNameOwner || ""}
            isOptionEqualToValue={(o, v) =>
              o.accountNameOwner === v?.accountNameOwner
            }
            value={selectedSourceAccount}
            onChange={handleSourceAccountChange}
            renderInput={(params) => {
              console.log("[TransfersNextGen] Source Autocomplete render:", {
                availableSourceAccountsLength: availableSourceAccounts.length,
                availableSourceAccounts,
                selectedSourceAccount,
              });
              return (
                <TextField
                  {...params}
                  label="Source Account"
                  fullWidth
                  margin="normal"
                  placeholder="Select a source account"
                />
              );
            }}
          />

          <Autocomplete
            options={availableDestinationAccounts}
            getOptionLabel={(a: Account) => a.accountNameOwner || ""}
            isOptionEqualToValue={(o, v) =>
              o.accountNameOwner === v?.accountNameOwner
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
            onChange={(value) =>
              setTransferData((prev: Transfer) => ({
                ...prev,
                amount:
                  typeof value === "string" ? parseFloat(value) || 0 : value,
              }))
            }
            onBlur={() => {
              const currentValue = parseFloat(
                String(transferData?.amount || ""),
              );
              if (!isNaN(currentValue)) {
                setTransferData((prev: Transfer) => ({
                  ...prev,
                  amount: Number(currentValue.toFixed(2)),
                }));
              }
            }}
            fullWidth
            margin="normal"
          />
          <Box mt={2}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={cacheEnabled}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setCacheEnabled(checked);
                    if (typeof window !== "undefined") {
                      localStorage.setItem(TRANSFERS_NEXT_CACHE_ENABLED_KEY, String(checked));
                      if (!checked) {
                        setLastSubmittedTransfer(null);
                        localStorage.removeItem(LAST_TRANSFER_STORAGE_KEY);
                      }
                    }
                  }}
                  size="small"
                />
              }
              label="Remember field data"
            />
          </Box>
        </FormDialog>
      </>
    </div>
  );
}
