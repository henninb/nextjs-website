"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import TextField from "@mui/material/TextField";
import {
  Box,
  Button,
  IconButton,
  Typography,
  Tooltip,
  Stack,
  Chip,
} from "@mui/material";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Autocomplete from "@mui/material/Autocomplete";
import Spinner from "../../../../components/Spinner";
import SnackbarBaseline from "../../../../components/SnackbarBaseline";
import ErrorDisplay from "../../../../components/ErrorDisplay";
import EmptyState from "../../../../components/EmptyState";
import LoadingState from "../../../../components/LoadingState";
import USDAmountInput from "../../../../components/USDAmountInput";
import useTransactionByAccountFetchPaged from "../../../../hooks/useTransactionByAccountFetchPaged";
import useTransactionUpdate from "../../../../hooks/useTransactionUpdate";
import useTransactionInsert from "../../../../hooks/useTransactionInsert";
import useTransactionDelete from "../../../../hooks/useTransactionDelete";
import useTotalsPerAccountFetch from "../../../../hooks/useTotalsPerAccountFetch";
import useValidationAmountFetch from "../../../../hooks/useValidationAmountFetch";
import useValidationAmountInsert from "../../../../hooks/useValidationAmountInsert";
import useAccountFetch from "../../../../hooks/useAccountFetch";
import useCategoryFetch from "../../../../hooks/useCategoryFetch";
import useDescriptionFetch from "../../../../hooks/useDescriptionFetch";
import useAccountUsageTracking from "../../../../hooks/useAccountUsageTracking";
import { AccountType } from "../../../../model/AccountType";
import Transaction from "../../../../model/Transaction";
import Account from "../../../../model/Account";
import { TransactionState } from "../../../../model/TransactionState";
import { TransactionType } from "../../../../model/TransactionType";
import { ReoccurringType } from "../../../../model/ReoccurringType";
import ValidationAmount from "../../../../model/ValidationAmount";
import DeleteIcon from "@mui/icons-material/DeleteRounded";
import AddIcon from "@mui/icons-material/AddRounded";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import SwapVert from "@mui/icons-material/SwapVert";
import {
  currencyFormat,
  noNaN,
  normalizeTransactionDate,
  formatDateForInput,
  formatDateForDisplay,
  formatDateTimeForDisplay,
} from "../../../../components/Common";
import PageHeader from "../../../../components/PageHeader";
import DataGridBase from "../../../../components/DataGridBase";
import ConfirmDialog from "../../../../components/ConfirmDialog";
import FormDialog from "../../../../components/FormDialog";
import Totals from "../../../../model/Totals";
import StatCard from "../../../../components/StatCard";
import StatCardSkeleton from "../../../../components/StatCardSkeleton";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import EventNoteIcon from "@mui/icons-material/EventNote";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import PendingActionsIcon from "@mui/icons-material/PendingActions";
import ChecklistIcon from "@mui/icons-material/Checklist";
import Fade from "@mui/material/Fade";
import Grow from "@mui/material/Grow";
import TransactionFilterBar, {
  TransactionFilters,
} from "../../../../components/TransactionFilterBar";
import TransactionCard from "../../../../components/TransactionCard";
import TransactionCardSkeleton from "../../../../components/TransactionCardSkeleton";
import ViewToggle from "../../../../components/ViewToggle";

import { useAuth } from "../../../../components/AuthProvider";
import { useUI } from "../../../../contexts/UIContext";
import { useTheme } from "@mui/material/styles";
import { generateSecureUUID } from "../../../../utils/security/secureUUID";
import { modalTitles, modalBodies } from "../../../../utils/modalMessages";

export default function TransactionsByAccount({
  params,
}: {
  params: { accountNameOwner: string };
}) {
  const [showSpinner, setShowSpinner] = useState(true);
  const [message, setMessage] = useState("");
  const [showSnackbar, setShowSnackbar] = useState<boolean>(false);
  const [snackbarSeverity, setSnackbarSeverity] = useState<
    "error" | "warning" | "info" | "success"
  >("info");
  const [showModalMove, setShowModalMove] = useState<boolean>(false);
  const [showModalAdd, setShowModalAdd] = useState<boolean>(false);
  const [showModalClone, setShowModalClone] = useState<boolean>(false);
  const [showModalDelete, setShowModalDelete] = useState(false);
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);
  const [originalRow, setOriginalRow] = useState<Transaction | null>(null);
  const [paginationModel, setPaginationModel] = useState({
    pageSize: 50,
    page: 0,
  });

  const [selectedTotal, setSelectedTotal] = useState<number | null>(null);

  // View state for grid/table toggle
  const [view, setView] = useState<"grid" | "table">("table");

  // Local UI filters/search
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [transactionFilters, setTransactionFilters] =
    useState<TransactionFilters>({
      states: new Set(["cleared", "outstanding", "future"]),
      types: new Set(["expense", "income", "transfer", "undefined"]),
      reoccurring: new Set([
        "onetime",
        "monthly",
        "annually",
        "bi_annually",
        "fortnightly",
        "quarterly",
        "undefined",
      ]),
      dateRange: {
        start: null,
        end: null,
        preset: "all",
      },
      amountRange: {
        min: -10000,
        max: 10000,
      },
    });

  const [rowSelectionModel, setRowSelectionModel] = useState<
    Array<string | number>
  >([]);

  const router = useRouter();
  const accountNameOwner = params.accountNameOwner;
  const validAccountNameOwner =
    typeof accountNameOwner === "string" ? accountNameOwner : "";

  const {
    data: transactionPage,
    isSuccess: isSuccessTransactions,
    isLoading: isFetchingTransactions,
    isError: isErrorTransactions,
    error: errorTransactions,
    refetch: refetchTransactions,
  } = useTransactionByAccountFetchPaged(
    validAccountNameOwner,
    paginationModel.page,
    paginationModel.pageSize,
  );

  // Extract transactions from paginated response - memoize to avoid infinite re-renders
  const fetchedTransactions = useMemo(
    () => transactionPage?.content || [],
    [transactionPage],
  );
  const {
    data: fetchedTotals,
    isSuccess: isSuccessTotals,
    isLoading: isFetchingTotals,
    isError: isErrorTotals,
    error: errorTotals,
    refetch: refetchTotals,
  } = useTotalsPerAccountFetch(validAccountNameOwner);
  const {
    data: fetchedValidationData,
    isSuccess: isSuccessValidationTotals,
    isLoading: isFetchingValidationTotals,
    isError: isErrorValidationTotals,
    error: errorValidationTotals,
    refetch: refetchValidationData,
  } = useValidationAmountFetch(validAccountNameOwner);
  const {
    data: fetchedAccounts,
    isSuccess: isSuccessAccounts,
    isLoading: isFetchingAccounts,
    isError: isErrorAccounts,
    error: errorAccounts,
    refetch: refetchAccounts,
  } = useAccountFetch();

  const initialTransactionData: Transaction = useMemo(() => {
    // Determine accountType from the current account
    const currentAccount = fetchedAccounts?.find(
      (account) => account.accountNameOwner === validAccountNameOwner,
    );
    const accountType = currentAccount?.accountType || ("debit" as AccountType);

    return {
      transactionDate: new Date(),
      accountNameOwner: validAccountNameOwner,
      reoccurringType: "onetime" as ReoccurringType,
      amount: 0.0,
      transactionState: "outstanding" as TransactionState,
      transactionType: undefined as unknown as TransactionType, // Default to undefined - will be set intentionally by user
      guid: "pending-uuid", // Will be replaced with server-generated UUID
      description: "",
      category: "",
      accountType: accountType,
      activeStatus: true,
      notes: "",
    };
  }, [validAccountNameOwner, fetchedAccounts]);

  const [transactionData, setTransactionData] = useState<Transaction>(
    initialTransactionData,
  );

  // Update transactionData when accounts are loaded or accountNameOwner changes
  useEffect(() => {
    if (fetchedAccounts && validAccountNameOwner) {
      const currentAccount = fetchedAccounts.find(
        (account) => account.accountNameOwner === validAccountNameOwner,
      );
      if (currentAccount) {
        setTransactionData((prev) => ({
          ...prev,
          accountType: currentAccount.accountType,
          accountNameOwner: validAccountNameOwner,
        }));
      }
    }
  }, [fetchedAccounts, validAccountNameOwner]);
  const { trackAccountVisit } = useAccountUsageTracking();
  const {
    data: fetchedCategories,
    isSuccess: isSuccessCategories,
    isLoading: isFetchingCategories,
    isError: isErrorCategories,
    error: errorCategories,
    refetch: refetchCategories,
  } = useCategoryFetch();
  const {
    data: fetchedDescriptions,
    isSuccess: isSuccessDescriptions,
    isLoading: isFetchingDescriptions,
    isError: isErrorDescriptions,
    error: errorDescriptions,
    refetch: refetchDescriptions,
  } = useDescriptionFetch();

  const { mutateAsync: updateTransaction } = useTransactionUpdate();
  const { mutateAsync: deleteTransaction } = useTransactionDelete();
  const { mutateAsync: insertTransaction } = useTransactionInsert();
  const { mutateAsync: insertValidationAmount } = useValidationAmountInsert();

  const transactionStates = ["outstanding", "future", "cleared"];
  const { isAuthenticated, loading } = useAuth();
  const { uiMode } = useUI();
  const theme = useTheme();

  useEffect(() => {
    const selectedIds = rowSelectionModel || [];
    if (!selectedIds || selectedIds.length === 0) {
      setSelectedTotal(null);
      return;
    }
    const selectedRows =
      fetchedTransactions?.filter(
        (r) => r?.transactionId && selectedIds.includes(r.transactionId),
      ) || [];
    const total = selectedRows.reduce((sum, r) => sum + (r.amount ?? 0), 0);
    setSelectedTotal(total);
  }, [rowSelectionModel, fetchedTransactions]);

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
      isFetchingTransactions ||
      isFetchingTotals ||
      isFetchingValidationTotals ||
      isFetchingAccounts ||
      isFetchingCategories ||
      isFetchingDescriptions ||
      loading ||
      (!loading && !isAuthenticated)
    ) {
      setShowSpinner(true);
      return;
    }

    if (
      isSuccessTransactions &&
      isSuccessTotals &&
      isSuccessValidationTotals &&
      isSuccessAccounts &&
      isSuccessCategories &&
      isSuccessDescriptions
    ) {
      setShowSpinner(false);
    }
  }, [
    isFetchingTransactions,
    isFetchingTotals,
    isFetchingValidationTotals,
    isFetchingAccounts,
    isFetchingCategories,
    isFetchingDescriptions,
    isSuccessTransactions,
    isSuccessTotals,
    isSuccessValidationTotals,
    isSuccessAccounts,
    isSuccessCategories,
    isSuccessDescriptions,
    loading,
    isAuthenticated,
  ]);

  useEffect(() => {
    if (validAccountNameOwner && isSuccessTransactions) {
      trackAccountVisit(validAccountNameOwner);
    }
  }, [validAccountNameOwner, isSuccessTransactions, trackAccountVisit]);

  const handleSnackbarClose = useCallback(() => setShowSnackbar(false), []);

  const handleError = useCallback(
    (error: any, moduleName: string, throwIt: boolean) => {
      const errorMessage = error.message
        ? `${moduleName}: ${error.message}`
        : `${moduleName}: Failure`;

      setMessage(errorMessage);
      setSnackbarSeverity("error");
      setShowSnackbar(true);

      console.error(errorMessage);

      if (throwIt) throw error;
    },
    [],
  );

  const handleSuccess = useCallback((successMessage: string) => {
    setMessage(successMessage);
    setSnackbarSeverity("success");
    setShowSnackbar(true);
  }, []);

  // Calculate amount bounds from actual data
  const amountBounds = useMemo(() => {
    if (!fetchedTransactions || fetchedTransactions.length === 0) {
      return { min: -10000, max: 10000 };
    }
    const amounts = fetchedTransactions
      .map((t) => t.amount ?? 0)
      .filter((a) => !isNaN(a));
    return {
      min: Math.floor(Math.min(...amounts, 0)),
      max: Math.ceil(Math.max(...amounts, 0)),
    };
  }, [fetchedTransactions]);

  const handleClearFilters = useCallback(() => {
    setSearchQuery("");
    setTransactionFilters({
      states: new Set(["cleared", "outstanding", "future"]),
      types: new Set(["expense", "income", "transfer", "undefined"]),
      reoccurring: new Set([
        "onetime",
        "monthly",
        "annually",
        "bi_annually",
        "fortnightly",
        "quarterly",
        "undefined",
      ]),
      dateRange: {
        start: null,
        end: null,
        preset: "all",
      },
      amountRange: amountBounds,
    });
  }, [amountBounds]);

  const handleInsertNewValidationData = async (
    accountNameOwner: string,
    transactionState: TransactionState,
  ) => {
    // Round to 2 decimal places to ensure proper precision
    const clearedAmount = fetchedTotals?.totalsCleared ?? 0;
    const roundedAmount = Math.round(clearedAmount * 100) / 100;

    // Find the account to get the accountId
    const currentAccount = fetchedAccounts?.find(
      (account) => account.accountNameOwner === accountNameOwner,
    );

    if (!currentAccount) {
      handleError(
        new Error("Account not found"),
        `Account not found: ${accountNameOwner}`,
        false,
      );
      return;
    }

    const payload: ValidationAmount = {
      validationId: 0,
      accountId: currentAccount.accountId,
      activeStatus: true,
      amount: roundedAmount,
      transactionState: transactionState,
      validationDate: new Date(),
    };

    try {
      await insertValidationAmount({
        accountNameOwner: accountNameOwner,
        payload: payload,
      });
      handleSuccess(`ValidationAmount inserted successfully`);
    } catch (error) {
      handleError(
        error,
        `Insert ValidationAmount failure: ${error.message}`,
        false,
      );
    }
  };

  const handleMoveRow = async (
    oldTransaction: Transaction,
    newTransaction: Transaction,
  ) => {
    try {
      await updateTransaction({
        newRow: newTransaction,
        oldRow: oldTransaction,
      });
      setOriginalRow(null);
      setSelectedTransaction(null);
      setShowModalMove(false);
      handleSuccess(`Transaction moved successfully.`);
    } catch (error) {
      handleError(error, `Move Transaction failure: ${error}`, false);
    }
  };

  const handleDeleteRow = async () => {
    if (selectedTransaction) {
      try {
        await deleteTransaction({ oldRow: selectedTransaction });
        handleSuccess(`Transaction deleted successfully.`);
      } catch (error) {
        handleError(error, `Delete Transaction failure: ${error}`, false);
      } finally {
        setShowModalDelete(false);
        setSelectedTransaction(null);
      }
    }
  };

  const handleCloneRow = async (): Promise<void> => {
    try {
      // Generate a secure UUID from the server before cloning
      const uuidResponse = await fetch("/api/uuid/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!uuidResponse.ok) {
        throw new Error(`UUID generation failed: ${uuidResponse.status}`);
      }

      const { uuid } = await uuidResponse.json();

      const result = await insertTransaction({
        accountNameOwner: validAccountNameOwner,
        newRow: {
          ...selectedTransaction,
          accountNameOwner: validAccountNameOwner,
          guid: uuid, // Use the server-generated UUID
        } as Transaction,
        isFutureTransaction: true,
        isImportTransaction: false,
      });

      handleSuccess(`Transaction cloned successfully.`);
    } catch (error) {
      handleError(error, `handleCloneRow error: ${error}`, false);
      throw error;
    }
  };

  const handleAddRow = async (newData: Transaction): Promise<Transaction | null> => {
    try {
      // Generate a secure UUID from the server before inserting
      const uuidResponse = await fetch("/api/uuid/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!uuidResponse.ok) {
        throw new Error(`UUID generation failed: ${uuidResponse.status}`);
      }

      const { uuid } = await uuidResponse.json();

      // Replace the pending UUID with the server-generated one
      const transactionWithUuid = {
        ...newData,
        accountNameOwner: validAccountNameOwner,
        guid: uuid,
      };

      const result = await insertTransaction({
        accountNameOwner: validAccountNameOwner,
        newRow: transactionWithUuid,
        isFutureTransaction: false,
        isImportTransaction: false,
      });
      console.log(`Transaction added successfully: ${JSON.stringify(result)}`);
      handleSuccess(`Transaction added successfully.`);

      return result;
    } catch (error) {
      handleError(error, "Add Transaction", false);
      if (
        !navigator.onLine ||
        (error.message && error.message.includes("Failed to fetch"))
      ) {
        console.log("Network error detected");
      }
      // Don't re-throw the error - handle it gracefully with snackbar
      return null;
    }
  };

  const columns: GridColDef[] = useMemo(
    () => [
      {
        field: "transactionDate",
        headerName: "Date",
        type: "date",
        flex: 0.6,
        minWidth: 100,
        headerAlign: "left",
        align: "left",
        renderCell: (params) => {
          return formatDateForDisplay(params.value);
        },
        valueGetter: (params: string) => {
          return normalizeTransactionDate(params);
        },
        editable: true,
      },
      {
        field: "description",
        headerName: "Description",
        flex: 1.5,
        minWidth: 150,
        editable: true,
        renderCell: (params) => <div>{params.value}</div>,
      },
      {
        field: "category",
        headerName: "Category",
        flex: 1,
        minWidth: 120,
        editable: true,
      },
      {
        field: "amount",
        headerName: "Amount",
        type: "number",
        flex: 0.6,
        minWidth: 90,
        headerAlign: "right",
        align: "right",
        renderCell: (params: any) => currencyFormat(params.value),
        editable: true,
        cellClassName: "nowrap",
      },
      {
        field: "transactionState",
        headerName: "State",
        flex: 1.2,
        minWidth: 180,
        renderCell: (params: any) => {
          const handleStateChange = async (newState: TransactionState) => {
            try {
              const updatedRow = { ...params.row, transactionState: newState };
              await updateTransaction({
                newRow: updatedRow,
                oldRow: params.row,
              });
              handleSuccess("Transaction state updated successfully.");
            } catch (error) {
              handleError(error, "Failed to update transaction state.", false);
            }
          };

          return (
            <Box display="flex" alignItems="center">
              {transactionStates.map((state: any) => {
                let IconComponent: any;
                let tooltipText: any;

                // Map states to icons and tooltips
                if (state === "cleared") {
                  IconComponent = CheckCircleIcon;
                  tooltipText = "Cleared";
                } else if (state === "outstanding") {
                  IconComponent = AccessTimeIcon;
                  tooltipText = "Outstanding";
                } else if (state === "future") {
                  IconComponent = EventNoteIcon;
                  tooltipText = "Future";
                }

                return (
                  <Tooltip key={state} title={tooltipText}>
                    <IconButton
                      size="small"
                      style={{
                        color:
                          params.row.transactionState === state
                            ? theme.palette.primary.main // Use theme primary color for modern UI
                            : "rgba(255, 255, 255, 1)", // White color for inactive state
                      }}
                      onClick={() => handleStateChange(state)}
                    >
                      <IconComponent fontSize="small" />
                    </IconButton>
                  </Tooltip>
                );
              })}
            </Box>
          );
        },
      },
      {
        field: "transactionType",
        headerName: "Type",
        flex: 0.8,
        minWidth: 100,
        renderCell: (params: any) => params.value || "undefined",
      },
      {
        field: "reoccurringType",
        headerName: "Reoccur",
        flex: 0.8,
        minWidth: 120,
        type: "singleSelect",
        valueOptions: [
          { value: "onetime", label: "One-Time" },
          { value: "weekly", label: "Weekly" },
          { value: "fortnightly", label: "Fortnightly" },
          { value: "monthly", label: "Monthly" },
          { value: "quarterly", label: "Quarterly" },
          { value: "bi_annually", label: "Bi-Annually" },
          { value: "annually", label: "Annually" },
        ],
        editable: true,
        renderCell: (params: any) => {
          const valueMap: Record<string, string> = {
            onetime: "One-Time",
            weekly: "Weekly",
            fortnightly: "Fortnightly",
            monthly: "Monthly",
            quarterly: "Quarterly",
            bi_annually: "Bi-Annually",
            annually: "Annually",
          };
          return valueMap[params.value] || params.value || "undefined";
        },
      },
      {
        field: "notes",
        headerName: "Notes",
        flex: 1.2,
        minWidth: 120,
        editable: true,
      },
      {
        field: "",
        headerName: "Actions",
        sortable: false,
        filterable: false,
        width: 120,
        renderCell: (params) => {
          return (
            <div>
              <Tooltip title="Clone this row">
                <IconButton
                  size="small"
                  aria-label="Clone this row"
                  onClick={() => {
                    setSelectedTransaction(params.row);
                    setShowModalClone(true);
                  }}
                >
                  <ContentCopyIcon fontSize="small" />
                </IconButton>
              </Tooltip>

              <Tooltip title="Move this row to another account">
                <IconButton
                  size="small"
                  aria-label="Move this row"
                  onClick={() => {
                    setSelectedTransaction(params.row);
                    setOriginalRow(params.row);
                    setShowModalMove(true);
                  }}
                >
                  <SwapVert fontSize="small" />
                </IconButton>
              </Tooltip>

              <Tooltip title="Delete this row">
                <IconButton
                  size="small"
                  aria-label="Delete this row"
                  onClick={() => {
                    setSelectedTransaction(params.row);
                    setShowModalDelete(true);
                  }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </div>
          );
        },
      },
    ],
    [updateTransaction, handleError],
  );

  // Update filter amount range when data changes
  useEffect(() => {
    setTransactionFilters((prev) => ({
      ...prev,
      amountRange: amountBounds,
    }));
  }, [amountBounds]);

  // Apply client-side filters and search on the current page
  // Note: With server-side pagination, this only filters the current page of results
  const filteredTransactions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return (fetchedTransactions || []).filter((row) => {
      if (!row) return false;

      // State filter
      if (!transactionFilters.states.has(row.transactionState)) return false;

      // Type filter
      const rowType = row.transactionType || ("undefined" as any);
      if (!transactionFilters.types.has(rowType)) return false;

      // Reoccurring filter
      if (!transactionFilters.reoccurring.has(row.reoccurringType))
        return false;

      // Date range filter
      if (
        transactionFilters.dateRange.start ||
        transactionFilters.dateRange.end
      ) {
        const transactionDate = new Date(row.transactionDate);
        if (transactionFilters.dateRange.start) {
          if (transactionDate < transactionFilters.dateRange.start)
            return false;
        }
        if (transactionFilters.dateRange.end) {
          if (transactionDate > transactionFilters.dateRange.end) return false;
        }
      }

      // Amount range filter
      const amount = row.amount ?? 0;
      if (
        amount < transactionFilters.amountRange.min ||
        amount > transactionFilters.amountRange.max
      ) {
        return false;
      }

      // Search query filter
      if (!q) return true;
      const haystack =
        `${row.description || ""} ${row.category || ""} ${row.notes || ""}`.toLowerCase();
      if (haystack.includes(q)) return true;
      // Also allow search by simple date string and amount
      const dateStr = formatDateForDisplay(row.transactionDate)
        ?.toString()
        .toLowerCase();
      if (dateStr && dateStr.includes(q)) return true;
      const amtStr = (row.amount ?? "").toString();
      return amtStr.includes(q);
    });
  }, [fetchedTransactions, searchQuery, transactionFilters]);

  // Handle error states first
  if (
    isErrorTransactions ||
    isErrorTotals ||
    isErrorValidationTotals ||
    isErrorAccounts ||
    isErrorCategories ||
    isErrorDescriptions
  ) {
    return (
      <>
        <PageHeader
          title={validAccountNameOwner || "Account Transactions"}
          subtitle="View and manage all transactions for this account. Track balances, edit transactions, and monitor account activity."
        />
        <ErrorDisplay
          error={
            errorTransactions ||
            errorTotals ||
            errorValidationTotals ||
            errorAccounts ||
            errorCategories ||
            errorDescriptions
          }
          variant="card"
          showRetry={true}
          onRetry={() => {
            if (errorTransactions) refetchTransactions();
            if (errorTotals) refetchTotals();
            if (errorValidationTotals) refetchValidationData();
            if (errorAccounts) refetchAccounts();
            if (errorCategories) refetchCategories();
            if (errorDescriptions) refetchDescriptions();
          }}
        />
      </>
    );
  }

  return (
    <div>
      <>
        <PageHeader
          title={validAccountNameOwner || "Account Transactions"}
          subtitle="View and manage all transactions for this account. Track balances, edit transactions, and monitor account activity."
          actions={
            <Stack
              direction="row"
              spacing={2}
              alignItems="center"
              flexWrap="wrap"
            >
              <Fade in={true} timeout={600}>
                <Box>
                  <ViewToggle view={view} onChange={setView} />
                </Box>
              </Fade>
              <Fade in={true} timeout={650}>
                <Button
                  onClick={() =>
                    handleInsertNewValidationData(
                      validAccountNameOwner,
                      "cleared",
                    )
                  }
                  variant="contained"
                  sx={{ backgroundColor: "primary.main" }}
                  suppressHydrationWarning
                >
                  {fetchedValidationData?.amount
                    ? currencyFormat(fetchedValidationData.amount)
                    : "$0.00"}
                  {" - "}
                  {fetchedValidationData?.validationDate
                    ? formatDateTimeForDisplay(
                        fetchedValidationData.validationDate,
                      )
                    : "No Date"}
                </Button>
              </Fade>
              <Fade in={true} timeout={700}>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setShowModalAdd(true)}
                  sx={{ backgroundColor: "primary.main" }}
                >
                  Add Transaction
                </Button>
              </Fade>
            </Stack>
          }
        />
        {showSpinner ? (
          <Box sx={{ mb: 4 }}>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2, 1fr)",
                  md: "repeat(4, 1fr)",
                },
                gap: 2,
                maxWidth: "1400px",
                margin: "0 auto",
                mb: 3,
              }}
            >
              {/* Show 4 skeleton cards while loading */}
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
            </Box>

            {/* Show grid view skeletons if grid view is active */}
            {view === "grid" ? (
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    sm: "repeat(2, 1fr)",
                    md: "repeat(3, 1fr)",
                  },
                  gap: 3,
                  maxWidth: "1400px",
                  margin: "0 auto",
                  pb: 4,
                }}
              >
                {[...Array(6)].map((_, i) => (
                  <TransactionCardSkeleton key={i} />
                ))}
              </Box>
            ) : (
              <LoadingState
                variant="card"
                message="Loading account transactions..."
              />
            )}
          </Box>
        ) : (
          <div>
            {/* Stat Cards Section */}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2, 1fr)",
                  md:
                    selectedTotal !== null
                      ? "repeat(5, 1fr)"
                      : "repeat(4, 1fr)",
                },
                gap: 2,
                maxWidth: "1400px",
                margin: "0 auto",
                mb: 4,
              }}
            >
              {/* Total Card */}
              <Grow in={true} timeout={700}>
                <Box>
                  <StatCard
                    icon={<AccountBalanceWalletIcon />}
                    label="Total"
                    value={currencyFormat(noNaN(fetchedTotals?.totals ?? 0))}
                    color="primary"
                  />
                </Box>
              </Grow>

              {/* Cleared Card */}
              <Grow in={true} timeout={800}>
                <Box>
                  <StatCard
                    icon={<CheckCircleIcon />}
                    label="Cleared"
                    value={currencyFormat(
                      noNaN(fetchedTotals?.totalsCleared ?? 0),
                    )}
                    color="success"
                  />
                </Box>
              </Grow>

              {/* Outstanding Card */}
              <Grow in={true} timeout={900}>
                <Box>
                  <StatCard
                    icon={<PendingActionsIcon />}
                    label="Outstanding"
                    value={currencyFormat(
                      noNaN(fetchedTotals?.totalsOutstanding ?? 0),
                    )}
                    color="warning"
                  />
                </Box>
              </Grow>

              {/* Future Card */}
              <Grow in={true} timeout={1000}>
                <Box>
                  <StatCard
                    icon={<EventNoteIcon />}
                    label="Future"
                    value={currencyFormat(
                      noNaN(fetchedTotals?.totalsFuture ?? 0),
                    )}
                    color="info"
                  />
                </Box>
              </Grow>

              {/* Selected Card - Only show when rows are selected */}
              {selectedTotal !== null && (
                <Grow in={true} timeout={1100}>
                  <Box>
                    <StatCard
                      icon={<ChecklistIcon />}
                      label="Selected"
                      value={currencyFormat(noNaN(selectedTotal))}
                      color="secondary"
                      highlighted={true}
                    />
                  </Box>
                </Grow>
              )}
            </Box>

            {/* Transaction Filter Bar - Filters current page only with server-side pagination */}
            <Fade in={true} timeout={500}>
              <Box>
                <TransactionFilterBar
                  searchTerm={searchQuery}
                  onSearchChange={setSearchQuery}
                  activeFilters={transactionFilters}
                  onFilterChange={setTransactionFilters}
                  onClearFilters={handleClearFilters}
                  resultCount={filteredTransactions?.length}
                  totalCount={fetchedTransactions?.length}
                  amountBounds={amountBounds}
                />
              </Box>
            </Fade>

            <div>
              <Box display="flex" justifyContent="center">
                <Box sx={{ width: "100%", maxWidth: "1400px" }}>
                  {filteredTransactions && filteredTransactions.length > 0 ? (
                    <>
                      {/* Table View */}
                      {view === "table" && (
                        <DataGridBase
                          rows={filteredTransactions}
                          columns={columns}
                          getRowId={(row: any) => row.transactionId || 0}
                          checkboxSelection={true}
                          rowSelection={true}
                          paginationModel={paginationModel}
                          paginationMode="server"
                          rowCount={transactionPage?.totalElements || 0}
                          onPaginationModelChange={(newModel) => {
                            setPaginationModel(newModel);
                          }}
                          pageSizeOptions={[25, 50, 100]}
                          disableColumnFilter
                          disableColumnMenu
                          disableVirtualization={false}
                          autoHeight
                          disableColumnResize={false}
                          sx={{
                            "& .MuiDataGrid-cell": {
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            },
                          }}
                          // Server-side sorting is handled by the API
                          // initialState={{
                          //   sorting: {
                          //     sortModel: [{ field: "transactionDate", sort: "desc" }],
                          //   },
                          // }}
                          processRowUpdate={async (
                            newRow: Transaction,
                            oldRow: Transaction,
                          ): Promise<Transaction> => {
                            if (
                              JSON.stringify(newRow) === JSON.stringify(oldRow)
                            ) {
                              return oldRow;
                            }
                            try {
                              await updateTransaction({
                                newRow: newRow,
                                oldRow: oldRow,
                              });
                              handleSuccess(
                                "Transaction updated successfully.",
                              );
                              return { ...newRow };
                            } catch (error) {
                              handleError(
                                error,
                                "Update Transaction failure.",
                                false,
                              );
                              return oldRow;
                            }
                          }}
                          disableRowSelectionOnClick={true}
                          rowSelectionModel={rowSelectionModel}
                          onRowSelectionModelChange={setRowSelectionModel}
                        />
                      )}

                      {/* Grid View */}
                      {view === "grid" && (
                        <Box
                          sx={{
                            display: "grid",
                            gridTemplateColumns: {
                              xs: "1fr",
                              sm: "repeat(2, 1fr)",
                              md: "repeat(3, 1fr)",
                            },
                            gap: 3,
                            pb: 4,
                          }}
                        >
                          {filteredTransactions.map((transaction, index) => (
                            <Fade
                              key={transaction.transactionId || index}
                              in={true}
                              timeout={600 + index * 100}
                            >
                              <Box>
                                <TransactionCard
                                  transaction={transaction}
                                  onClone={(t) => {
                                    setSelectedTransaction(t);
                                    setShowModalClone(true);
                                  }}
                                  onMove={(t) => {
                                    setSelectedTransaction(t);
                                    setOriginalRow(t);
                                    setShowModalMove(true);
                                  }}
                                  onDelete={(t) => {
                                    setSelectedTransaction(t);
                                    setShowModalDelete(true);
                                  }}
                                  onStateChange={async (t, newState) => {
                                    try {
                                      const updatedRow = {
                                        ...t,
                                        transactionState: newState,
                                      };
                                      await updateTransaction({
                                        newRow: updatedRow,
                                        oldRow: t,
                                      });
                                      handleSuccess(
                                        "Transaction state updated successfully.",
                                      );
                                    } catch (error) {
                                      handleError(
                                        error,
                                        "Failed to update transaction state.",
                                        false,
                                      );
                                    }
                                  }}
                                  selected={
                                    transaction.transactionId
                                      ? rowSelectionModel.includes(
                                          transaction.transactionId,
                                        )
                                      : false
                                  }
                                  onSelect={(transactionId) => {
                                    setRowSelectionModel((prev) => {
                                      if (prev.includes(transactionId)) {
                                        return prev.filter(
                                          (id) => id !== transactionId,
                                        );
                                      } else {
                                        return [...prev, transactionId];
                                      }
                                    });
                                  }}
                                />
                              </Box>
                            </Fade>
                          ))}
                        </Box>
                      )}
                    </>
                  ) : (
                    <EmptyState
                      title="No Transactions Found"
                      message="This account doesn't have any transactions yet. Create your first transaction to get started."
                      dataType="transactions"
                      variant="create"
                      actionLabel="Add Transaction"
                      onAction={() => setShowModalAdd(true)}
                      onRefresh={() => {
                        refetchTransactions();
                        refetchTotals();
                        refetchValidationData();
                      }}
                    />
                  )}
                </Box>
              </Box>
            </div>

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
          open={showModalClone}
          onClose={() => setShowModalClone(false)}
          onConfirm={handleCloneRow}
          title={modalTitles.confirmClone}
          message={modalBodies.confirmClone(
            "transaction",
            selectedTransaction?.guid ?? "",
          )}
          confirmText="Clone"
          cancelText="Cancel"
        />

        <ConfirmDialog
          open={showModalDelete}
          onClose={() => setShowModalDelete(false)}
          onConfirm={handleDeleteRow}
          title={modalTitles.confirmDeletion}
          message={modalBodies.confirmDeletion(
            "transaction",
            selectedTransaction?.guid ?? "",
          )}
          confirmText="Delete"
          cancelText="Cancel"
        />

        <FormDialog
          open={showModalAdd}
          onClose={() => {
            setShowModalAdd(false);
            setTransactionData(initialTransactionData);
          }}
          onSubmit={async () => {
            if (transactionData) {
              const result = await handleAddRow(transactionData);
              if (result) {
                setShowModalAdd(false);
                setTransactionData(initialTransactionData);
              }
            }
          }}
          title={modalTitles.addNew("transaction")}
          submitText="Add"
        >
          <TextField
            label="Transaction Date"
            fullWidth
            margin="normal"
            type="date"
            value={formatDateForInput(
              transactionData?.transactionDate || new Date(),
            )}
            onChange={(e) => {
              const normalizedDate = normalizeTransactionDate(e.target.value);
              setTransactionData((prev: any) => ({
                ...prev,
                transactionDate: normalizedDate,
              }));
            }}
            slotProps={{
              inputLabel: { shrink: true },
            }}
          />

          <Autocomplete
            freeSolo
            options={
              isSuccessDescriptions
                ? fetchedDescriptions.map((d) => d.descriptionName)
                : []
            }
            value={transactionData?.description || ""}
            onChange={(_, newValue) =>
              setTransactionData((prev) => ({
                ...prev,
                description: newValue || "",
              }))
            }
            onBlur={() => {
              if (transactionData?.description === "") {
                setTransactionData((prev) => ({
                  ...prev,
                  description: "", // Ensure an empty description is updated
                }));
              }
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Description"
                fullWidth
                margin="normal"
                onChange={(e) => {
                  const newDescription = e.target.value;
                  setTransactionData((prev) => ({
                    ...prev,
                    description: newDescription,
                  }));
                }}
              />
            )}
          />
          <Autocomplete
            freeSolo
            options={
              isSuccessCategories
                ? fetchedCategories.map((c) => c.categoryName)
                : []
            }
            value={transactionData?.category || ""}
            onChange={(_, newValue) =>
              setTransactionData((prev) => ({
                ...prev,
                category: newValue || "",
              }))
            }
            onBlur={() => {
              if (transactionData?.category === "") {
                setTransactionData((prev) => ({
                  ...prev,
                  category: "", // Ensure an empty category is updated
                }));
              }
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Category"
                fullWidth
                margin="normal"
                onChange={(e) => {
                  const newCategory = e.target.value;
                  setTransactionData((prev) => ({
                    ...prev,
                    category: newCategory,
                  }));
                }}
              />
            )}
          />

          <USDAmountInput
            label="Amount ($)"
            value={transactionData?.amount ? transactionData.amount : ""}
            onChange={(value) => {
              setTransactionData((prev: any) => ({
                ...prev,
                amount: value,
              }));
            }}
            onBlur={() => {
              // Format the value when user leaves the field
              const currentAmount = parseFloat(
                String(transactionData?.amount || ""),
              );
              if (!isNaN(currentAmount) && currentAmount !== 0) {
                const formattedValue = currentAmount.toFixed(2);
                setTransactionData((prev: any) => ({
                  ...prev,
                  amount: formattedValue,
                }));
              }
            }}
            fullWidth
            margin="normal"
            helperText="Enter positive or negative amounts (e.g., -123.45, 67.89)"
            error={
              transactionData?.amount !== undefined &&
              isNaN(Number(transactionData?.amount))
            }
          />

          <Select
            label="Transaction State"
            value={transactionData?.transactionState || ""}
            onChange={(e) =>
              setTransactionData((prev: any) => ({
                ...prev,
                transactionState: e.target.value,
              }))
            }
            fullWidth
          >
            {transactionStates.map((state) => (
              <MenuItem key={state} value={state}>
                {state}
              </MenuItem>
            ))}
          </Select>

          <Select
            label="Reoccurring Type"
            value={transactionData?.reoccurringType || "onetime"}
            onChange={(e) =>
              setTransactionData((prev: any) => ({
                ...prev,
                reoccurringType: e.target.value,
              }))
            }
            fullWidth
          >
            <MenuItem value="onetime">One-Time</MenuItem>
            <MenuItem value="weekly">Weekly</MenuItem>
            <MenuItem value="fortnightly">Fortnightly</MenuItem>
            <MenuItem value="monthly">Monthly</MenuItem>
            <MenuItem value="quarterly">Quarterly</MenuItem>
            <MenuItem value="bi_annually">Bi-Annually</MenuItem>
            <MenuItem value="annually">Annually</MenuItem>
          </Select>

          <Select
            label="Transaction Type"
            value={transactionData?.transactionType || ""}
            onChange={(e) =>
              setTransactionData((prev: any) => ({
                ...prev,
                transactionType: e.target.value,
              }))
            }
            fullWidth
            style={{ marginTop: 16 }}
          >
            <MenuItem value="">Undefined</MenuItem>
            <MenuItem value="expense">Expense</MenuItem>
            <MenuItem value="income">Income</MenuItem>
            <MenuItem value="transfer">Transfer</MenuItem>
          </Select>

          <TextField
            label="Notes"
            value={transactionData?.notes || ""}
            onChange={(e) =>
              setTransactionData((prev: any) => ({
                ...prev,
                notes: e.target.value,
              }))
            }
            fullWidth
            margin="normal"
            multiline
            rows={3}
          />
        </FormDialog>

        <FormDialog
          open={showModalMove}
          onClose={() => setShowModalMove(false)}
          onSubmit={() =>
            originalRow &&
            selectedTransaction &&
            handleMoveRow(originalRow, selectedTransaction)
          }
          title={modalTitles.confirmMove}
          submitText="Save"
        >
          <Typography variant="body2" color="text.secondary">
            {modalBodies.confirmMove(
              "transaction",
              selectedTransaction?.guid ?? "",
            )}
          </Typography>
          <Autocomplete
            options={
              isSuccessAccounts && isSuccessTransactions && selectedTransaction
                ? fetchedAccounts.filter(
                    (account) =>
                      account.accountType === selectedTransaction.accountType,
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
              selectedTransaction?.accountNameOwner && isSuccessAccounts
                ? fetchedAccounts.find(
                    (account) =>
                      account.accountNameOwner ===
                      selectedTransaction.accountNameOwner,
                  ) || null
                : null
            }
            onChange={(event, newValue) =>
              setSelectedTransaction((prev) =>
                prev
                  ? {
                      ...prev,
                      accountNameOwner: newValue ? newValue.accountNameOwner : "",
                      accountId: newValue ? newValue.accountId : 0,
                    }
                  : null,
              )
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="New AccountNameOwner"
                fullWidth
                margin="normal"
                placeholder="Select a new account..."
              />
            )}
          />
        </FormDialog>
      </>
    </div>
  );
}
