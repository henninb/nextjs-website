"use client";
import { getErrorMessage } from "../../../../types";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DataGrid, GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import {
  Button,
  TextField,
  Typography,
  Box,
  Paper,
  IconButton,
  Autocomplete,
  Chip,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Alert,
  List,
  ListItem,
  ListItemText,
  Collapse,
  Tooltip,
  Link,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import HelpIcon from "@mui/icons-material/Help";
import CheckIcon from "@mui/icons-material/Check";
import DeleteIcon from "@mui/icons-material/Delete";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import CircularProgress from "@mui/material/CircularProgress";
import Transaction from "../../../../model/Transaction";
import { ReoccurringType } from "../../../../model/ReoccurringType";
import { TransactionState } from "../../../../model/TransactionState";
import { AccountType } from "../../../../model/AccountType";
import { TransactionType } from "../../../../model/TransactionType";
import usePendingTransactions from "../../../../hooks/usePendingTransactionFetch";
import Spinner from "../../../../components/Spinner";
import SnackbarBaseline from "../../../../components/SnackbarBaseline";
import ErrorDisplay from "../../../../components/ErrorDisplay";
import LoadingState from "../../../../components/LoadingState";
import ConfirmDialog from "../../../../components/ConfirmDialog";
import useTransactionInsert from "../../../../hooks/useTransactionInsert";
import { currencyFormat } from "../../../../components/Common";
import usePendingTransactionDeleteAll from "../../../../hooks/usePendingTransactionDeleteAll";
import usePendingTransactionDelete from "../../../../hooks/usePendingTransactionDelete";
import PendingTransaction from "../../../../model/PendingTransaction";
import usePendingTransactionUpdate from "../../../../hooks/usePendingTransactionUpdate";
import useAccountFetch from "../../../../hooks/useAccountFetch";
import { useAuth } from "../../../../components/AuthProvider";
import { generateSecureUUID } from "../../../../utils/security/secureUUID";
import { getCategoryFromDescription } from "../../../../utils/categoryMapping";
import { getCategoryWithAI } from "../../../../utils/ai/categorization";
import AICategoryBadge from "../../../../components/AICategoryBadge";
import useCategoryFetch from "../../../../hooks/useCategoryFetch";

export default function TransactionImporter() {
  const [inputText, setInputText] = useState("");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoadingTable, setIsLoadingTable] = useState(true); // Loading state for table only
  const [message, setMessage] = useState("");
  const [showSnackbar, setShowSnackbar] = useState<boolean>(false);
  const [accountFilter, setAccountFilter] = useState<string>(""); // For filtering by account
  const [showFormatHelp, setShowFormatHelp] = useState(false);
  const [formatErrors, setFormatErrors] = useState<string[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [loadingRows, setLoadingRows] = useState<Set<string>>(new Set()); // Track loading rows by guid
  const [isInitialLoad, setIsInitialLoad] = useState(true); // Track if this is the first load
  const [aiCategorizingRows, setAiCategorizingRows] = useState<Set<string>>(
    new Set(),
  ); // Track rows being AI-categorized
  const [showDeleteAllDialog, setShowDeleteAllDialog] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);

  const {
    data: fetchedPendingTransactions,
    isSuccess: isPendingTransactionsLoaded,
    isFetching: isFetchingPendingTransactions,
    error: errorPendingTransactions,
    refetch: refetchPendingTransactions,
  } = usePendingTransactions();

  const {
    data: fetchedAccounts,
    isSuccess: isSuccessAccounts,
    isLoading: isLoadingAccounts,
    error: errorAccounts,
  } = useAccountFetch();

  const { data: fetchedCategories, isSuccess: isSuccessCategories } =
    useCategoryFetch();

  const { mutateAsync: insertTransaction } = useTransactionInsert();
  const { mutateAsync: deleteAllPendingTransactions } =
    usePendingTransactionDeleteAll();
  const { mutateAsync: deletePendingTransaction } =
    usePendingTransactionDelete();
  const { mutateAsync: updatePendingTransaction } =
    usePendingTransactionUpdate();
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [loading, isAuthenticated, router]);

  useEffect(() => {
    if (isFetchingPendingTransactions || isLoadingAccounts) {
      setIsLoadingTable(true);
      return;
    }
    // Don't set isLoadingTable to false here - let the GUID generation useEffect handle it
    // Otherwise we'll hide the spinner before the async GUID generation completes
  }, [isFetchingPendingTransactions, isLoadingAccounts]);

  useEffect(() => {
    // Only sync from fetchedPendingTransactions on initial load
    // After that, we manage transactions state locally to avoid refreshes
    if (
      isPendingTransactionsLoaded &&
      fetchedPendingTransactions &&
      isInitialLoad
    ) {
      if (fetchedPendingTransactions.length === 0) {
        setTransactions([]);
        setIsLoadingTable(false);
        setIsInitialLoad(false);
        return;
      }

      const generateTransactionsWithGUID = async () => {
        setIsLoadingTable(true);

        // Get available categories for AI categorization
        const availableCategories = isSuccessCategories
          ? fetchedCategories.map((c) => c.categoryName)
          : [];

        // FAST LOAD: Use rule-based categorization only (no AI delays)
        // Users can trigger AI categorization on-demand by clicking the button in Source column
        const transactionsWithGUID: Transaction[] = await Promise.all(
          fetchedPendingTransactions.map(async (transaction) => {
            // Use fast rule-based categorization
            const category = getCategoryFromDescription(
              transaction.description || "",
            );

            return {
              ...transaction,
              guid: await generateSecureUUID(),
              reoccurringType: "onetime" as ReoccurringType,
              transactionState: "outstanding" as TransactionState,
              transactionType: undefined as unknown as TransactionType,
              category,
              categoryMetadata: {
                source: "rule-based" as const,
                timestamp: new Date(),
                fallbackReason:
                  "Initial load - click AI button to use AI categorization",
              },
              accountType: "debit" as AccountType,
              activeStatus: true,
              notes: "imported",
            };
          }),
        );

        setTransactions(transactionsWithGUID);
        setIsLoadingTable(false);
        setIsInitialLoad(false); // Mark initial load as complete
      };

      generateTransactionsWithGUID();
    }
  }, [
    isPendingTransactionsLoaded,
    fetchedPendingTransactions,
    isInitialLoad,
    isSuccessCategories,
    fetchedCategories,
  ]);

  if (loading || (!loading && !isAuthenticated)) {
    return null;
  }

  // Filter transactions based on account selection
  const filteredTransactions = accountFilter
    ? transactions.filter(
        (transaction) => transaction.accountNameOwner === accountFilter,
      )
    : transactions;

  // Get unique account names for the filter dropdown
  const uniqueAccounts = Array.from(
    new Set(transactions.map((t) => t.accountNameOwner)),
  ).filter(Boolean);

  const handleInsertTransaction = async (
    newData: Transaction,
  ): Promise<Transaction> => {
    try {
      const result = await insertTransaction({
        accountNameOwner: newData.accountNameOwner,
        newRow: newData,
        isFutureTransaction: false,
        isImportTransaction: true,
      });

      setMessage(`Transaction added successfully`);
      setShowSnackbar(true);

      return result;
    } catch (error) {
      handleError(error, "handleAddRow", false);
      if (
        !navigator.onLine ||
        (getErrorMessage(error) &&
          getErrorMessage(error).includes("Failed to fetch"))
      ) {
        // offline error handling
      }
      throw error;
    }
  };

  const handleDeletePendingTransaction = async (
    pendingTransactionId: any,
    guid: string,
  ) => {
    try {
      // Optimistically remove from local state
      setTransactions((prev) => prev.filter((t) => t.guid !== guid));

      await deletePendingTransaction(pendingTransactionId);

      setMessage("Transaction removed successfully");
      setShowSnackbar(true);
    } catch (error) {
      handleError(error, "handleDeleteRow", false);
      // On error, refetch to restore correct state
      setIsInitialLoad(true); // Allow resync from server
      refetchPendingTransactions();
      if (
        !navigator.onLine ||
        (getErrorMessage(error) &&
          getErrorMessage(error).includes("Failed to fetch"))
      ) {
        // offline error handling
      }
    }
  };

  const handleDeleteAllPendingTransactions = async () => {
    setShowDeleteAllDialog(false);
    setIsDeletingAll(true);
    setIsLoadingTable(true);

    try {
      await deleteAllPendingTransactions();

      // Reset state and trigger full refresh from server
      setTransactions([]);
      setIsInitialLoad(true);
      await refetchPendingTransactions();

      setMessage("All pending transactions have been deleted.");
      setShowSnackbar(true);
    } catch (error: unknown) {
      console.error("Error deleting pending transactions: ", error);
      setMessage(
        `Error deleting pending transactions: ${getErrorMessage(error)}`,
      );
      setShowSnackbar(true);
    } finally {
      setIsDeletingAll(false);
    }
  };

  const handleSnackbarClose = () => setShowSnackbar(false);

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

  const validateFormat = (text: string) => {
    const lines = text.split("\n").filter((line) => line.trim() !== "");
    const errors: string[] = [];

    lines.forEach((line, index) => {
      const parts = line.match(/(\d{4}-\d{2}-\d{2})\s(.+)\s(-?\d+\.\d{2})/);
      if (!parts) {
        errors.push(
          `Line ${index + 1}: "${line.substring(0, 50)}${line.length > 50 ? "..." : ""}"`,
        );
      }
    });

    setFormatErrors(errors);
    return errors.length === 0;
  };

  const handleInputChange = (value: string) => {
    setInputText(value);

    // Debounced validation
    setIsValidating(true);
    setTimeout(() => {
      if (value.trim()) {
        validateFormat(value);
      } else {
        setFormatErrors([]);
      }
      setIsValidating(false);
    }, 500);
  };

  const parseTransactions = () => {
    const lines = inputText.split("\n").filter((line) => line.trim() !== "");
    console.log(`Total lines found: ${lines.length}`);

    let failedCount = 0;
    const errors: string[] = [];

    const parsedTransactions = lines
      .map((line, index) => {
        const parts = line.match(/(\d{4}-\d{2}-\d{2})\s(.+)\s(-?\d+\.\d{2})/);
        if (!parts) {
          console.warn(`Failed to parse line ${index + 1}: "${line}"`);
          errors.push(
            `Line ${index + 1}: "${line.substring(0, 50)}${line.length > 50 ? "..." : ""}"`,
          );
          failedCount++;
          return null;
        }

        const category = getCategoryFromDescription(parts[2]);

        return {
          transactionDate: new Date(parts[1]),
          accountNameOwner: "testing_brian",
          reoccurringType: "onetime",
          amount: parseFloat(parts[3]),
          transactionState: "outstanding",
          transactionType: undefined as unknown as TransactionType,
          guid: "pending-uuid", // Will be replaced with server-generated UUID during insertion
          description: parts[2],
          category: category,
          accountType: "debit",
          activeStatus: true,
          notes: "",
        } as Transaction;
      })
      .filter(Boolean) as Transaction[];

    console.log(
      `Successfully parsed transactions: ${parsedTransactions.length}`,
    );

    if (failedCount > 0) {
      console.warn(`Failed to parse ${failedCount} transaction(s).`);
      setMessage(
        `Successfully parsed ${parsedTransactions.length} transactions. ${failedCount} lines failed to parse.`,
      );
    } else {
      setMessage(
        `Successfully parsed ${parsedTransactions.length} transactions.`,
      );
    }

    setShowSnackbar(true);
    setTransactions(parsedTransactions);
  };

  // Handler to trigger AI categorization on-demand for a specific transaction
  const handleAICategorize = async (transaction: Transaction) => {
    const guid = transaction.guid;
    if (!guid) return;

    // Mark row as being AI-categorized
    setAiCategorizingRows((prev) => new Set(prev).add(guid));

    try {
      const availableCategories = isSuccessCategories
        ? fetchedCategories.map((c) => c.categoryName)
        : [];

      // Call AI categorization
      const categorizationResult = await getCategoryWithAI(
        transaction.description || "",
        transaction.amount || 0,
        availableCategories,
        transaction.accountNameOwner || "",
      );

      // Update the transaction with AI result
      setTransactions((prev) =>
        prev.map((t) =>
          t.guid === guid
            ? {
                ...t,
                category: categorizationResult.category,
                categoryMetadata: categorizationResult.metadata,
              }
            : t,
        ),
      );

      setMessage(
        `AI categorization completed: ${categorizationResult.category}`,
      );
      setShowSnackbar(true);
    } catch (error) {
      setMessage(`AI categorization failed: ${getErrorMessage(error)}`);
      setShowSnackbar(true);
      console.error("AI categorization error:", error);
    } finally {
      // Remove from AI-categorizing set
      setAiCategorizingRows((prev) => {
        const next = new Set(prev);
        next.delete(guid);
        return next;
      });
    }
  };

  const columns: GridColDef[] = [
    {
      field: "pendingTransactionId",
      headerName: "Id",
      width: 100,
      hideable: true,
    },
    {
      field: "transactionDate",
      headerName: "Date",
      type: "date",
      width: 100,
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
      width: 200,
      editable: true,
      renderCell: (params) => {
        return (
          <Link href={`/finance/transactions/${params.value}`}>
            {params.value}
          </Link>
        );
      },
    },
    {
      field: "description",
      headerName: "Description",
      width: 225,
      editable: true,
      renderCell: (params) => <div>{params.value}</div>,
    },
    {
      field: "category",
      headerName: "Category",
      width: 150,
      editable: true,
    },
    {
      field: "categorySource",
      headerName: "Source",
      width: 150,
      renderCell: (params: GridRenderCellParams<Transaction>) => {
        const isAICategorizing = aiCategorizingRows.has(params.row.guid || "");
        const isRuleBased =
          params.row.categoryMetadata?.source === "rule-based";

        return (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <AICategoryBadge
              metadata={params.row.categoryMetadata}
              size="small"
            />
            {isAICategorizing ? (
              <CircularProgress size={16} />
            ) : isRuleBased ? (
              <Tooltip title="Use AI to categorize this transaction">
                <IconButton
                  size="small"
                  onClick={() => handleAICategorize(params.row)}
                  sx={{ padding: 0.5 }}
                  color="primary"
                >
                  <AutoAwesomeIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            ) : null}
          </Box>
        );
      },
    },
    {
      field: "amount",
      headerName: "Amount",
      type: "number",
      width: 90,
      renderCell: (params: GridRenderCellParams<Transaction>) =>
        currencyFormat(params.value),
      editable: true,
      cellClassName: "nowrap",
    },
    {
      field: "transactionState",
      headerName: "transactionState",
      width: 275,
      editable: true,
    },
    {
      field: "transactionType",
      headerName: "Type",
      width: 180,
      renderCell: (params: GridRenderCellParams<Transaction>) =>
        params.value || "undefined",
      editable: true,
    },
    {
      field: "reoccurringType",
      headerName: "Reoccur",
      width: 150,
      renderCell: (params: GridRenderCellParams<Transaction>) =>
        params.value || "undefined",
      editable: true,
    },
    {
      field: "notes",
      headerName: "Notes",
      width: 180,
      editable: true,
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 120,
      renderCell: (params) => {
        const isLoading = loadingRows.has(params.row.guid);
        return (
          <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
            {isLoading ? (
              <CircularProgress size={24} />
            ) : (
              <>
                <Tooltip title="Accept Transaction" enterDelay={0}>
                  <span>
                    <IconButton
                      color="primary"
                      size="small"
                      onClick={async () => {
                        const guid = params.row.guid;
                        setLoadingRows((prev) => new Set(prev).add(guid));
                        try {
                          await handleInsertTransaction(params.row);
                          // Optimistically remove from local state
                          setTransactions((prev) =>
                            prev.filter((t) => t.guid !== guid),
                          );
                          await deletePendingTransaction(
                            params.row.pendingTransactionId,
                          );
                        } catch (error) {
                          console.error("Error accepting transaction:", error);
                          // On error, refetch to restore correct state
                          setIsInitialLoad(true); // Allow resync from server
                          refetchPendingTransactions();
                        } finally {
                          setLoadingRows((prev) => {
                            const next = new Set(prev);
                            next.delete(guid);
                            return next;
                          });
                        }
                      }}
                    >
                      <CheckIcon />
                    </IconButton>
                  </span>
                </Tooltip>
                <Tooltip title="Remove from List" enterDelay={0}>
                  <span>
                    <IconButton
                      color="error"
                      size="small"
                      onClick={async () => {
                        const guid = params.row.guid;
                        setLoadingRows((prev) => new Set(prev).add(guid));
                        try {
                          await handleDeletePendingTransaction(
                            params.row.pendingTransactionId,
                            guid,
                          );
                        } catch (error) {
                          console.error("Error deleting transaction:", error);
                        } finally {
                          setLoadingRows((prev) => {
                            const next = new Set(prev);
                            next.delete(guid);
                            return next;
                          });
                        }
                      }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </span>
                </Tooltip>
              </>
            )}
          </Box>
        );
      },
    },
  ];

  // Handle error states first
  if (errorPendingTransactions || errorAccounts) {
    return (
      <>
        <Typography variant="h6">Transaction Import</Typography>
        <ErrorDisplay
          error={errorPendingTransactions || errorAccounts}
          variant="card"
          showRetry={true}
          onRetry={() => refetchPendingTransactions()}
        />
      </>
    );
  }

  return (
    <div>
      <>
        <Box sx={{ mb: 3, textAlign: "center" }}>
          <Typography
            variant="h4"
            component="h1"
            sx={{ mb: 1, fontWeight: 600 }}
          >
            Transaction Import
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Import transactions by pasting them in the required format
          </Typography>
        </Box>

        <>
          {/* Input Section */}
          <Card
            sx={{ mb: 4, border: "2px solid", borderColor: "primary.main" }}
          >
            <CardHeader
              title={
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Typography variant="h6">Paste Transaction Data</Typography>
                  <IconButton
                    onClick={() => setShowFormatHelp(!showFormatHelp)}
                    size="small"
                    sx={{ ml: 1 }}
                  >
                    <HelpIcon />
                  </IconButton>
                </Box>
              }
              action={
                <Button
                  onClick={() => setShowFormatHelp(!showFormatHelp)}
                  startIcon={
                    showFormatHelp ? <ExpandLessIcon /> : <ExpandMoreIcon />
                  }
                  size="small"
                >
                  {showFormatHelp ? "Hide" : "Show"} Format Guide
                </Button>
              }
            />
            <Collapse in={showFormatHelp}>
              <CardContent sx={{ pt: 0 }}>
                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography
                    variant="body2"
                    sx={{ mb: 1, fontWeight: "bold" }}
                  >
                    Required Format: YYYY-MM-DD Description Amount
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    Each transaction must be on a separate line with exactly
                    this format:
                  </Typography>
                  <List dense sx={{ pl: 2 }}>
                    <ListItem sx={{ py: 0 }}>
                      <ListItemText
                        primary="Date: YYYY-MM-DD (e.g., 2024-02-25)"
                        primaryTypographyProps={{ variant: "body2" }}
                      />
                    </ListItem>
                    <ListItem sx={{ py: 0 }}>
                      <ListItemText
                        primary="Description: Any text (e.g., Coffee Shop, Salary Payment)"
                        primaryTypographyProps={{ variant: "body2" }}
                      />
                    </ListItem>
                    <ListItem sx={{ py: 0 }}>
                      <ListItemText
                        primary="Amount: Number with 2 decimal places (e.g., -4.50, 2000.00)"
                        primaryTypographyProps={{ variant: "body2" }}
                      />
                    </ListItem>
                  </List>
                  <Typography
                    variant="body2"
                    sx={{ mt: 1, fontWeight: "bold" }}
                  >
                    Examples:
                  </Typography>
                  <Typography
                    variant="body2"
                    component="pre"
                    sx={{
                      fontFamily: "monospace",
                      bgcolor: "grey.100",
                      p: 1,
                      borderRadius: 1,
                      mt: 1,
                    }}
                  >
                    {`2024-02-25 Coffee Shop -4.50
2024-02-26 Salary Payment 2000.00
2024-02-27 Grocery Store -45.67`}
                  </Typography>
                </Alert>
              </CardContent>
            </Collapse>
            <CardContent>
              <TextField
                multiline
                fullWidth
                rows={8}
                value={inputText}
                onChange={(e) => handleInputChange(e.target.value)}
                placeholder="Paste your transaction data here...\n\nExample:\n2024-02-25 Coffee Shop -4.50\n2024-02-26 Salary Payment 2000.00\n2024-02-27 Grocery Store -45.67"
                variant="outlined"
                sx={{
                  "& .MuiInputBase-root": {
                    fontFamily: "monospace",
                    fontSize: "0.9rem",
                  },
                  "& .MuiInputBase-input": {
                    lineHeight: 1.6,
                  },
                }}
                helperText={`${inputText.split("\n").filter((line) => line.trim()).length} lines entered`}
              />

              {/* Format Validation Feedback */}
              {formatErrors.length > 0 && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  <Typography
                    variant="body2"
                    sx={{ fontWeight: "bold", mb: 1 }}
                  >
                    Format errors found in {formatErrors.length} line(s):
                  </Typography>
                  {formatErrors.slice(0, 5).map((error, index) => (
                    <Typography
                      key={index}
                      variant="body2"
                      sx={{ fontFamily: "monospace", fontSize: "0.85rem" }}
                    >
                      {error}
                    </Typography>
                  ))}
                  {formatErrors.length > 5 && (
                    <Typography
                      variant="body2"
                      sx={{ mt: 1, fontStyle: "italic" }}
                    >
                      ... and {formatErrors.length - 5} more errors
                    </Typography>
                  )}
                </Alert>
              )}

              {inputText.trim() &&
                formatErrors.length === 0 &&
                !isValidating && (
                  <Alert severity="success" sx={{ mt: 2 }}>
                    All lines appear to be in the correct format!
                  </Alert>
                )}

              <Box
                sx={{
                  display: "flex",
                  gap: 2,
                  mt: 3,
                  justifyContent: "center",
                }}
              >
                <Button
                  variant="contained"
                  onClick={parseTransactions}
                  disabled={!inputText.trim() || formatErrors.length > 0}
                  size="large"
                >
                  Parse & Import Transactions
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => {
                    setInputText("");
                    setFormatErrors([]);
                  }}
                >
                  Clear
                </Button>
              </Box>
            </CardContent>
          </Card>

          <Divider sx={{ my: 4 }} />

          {/* Results Section */}
          <Card>
            <CardHeader
              title={
                <Typography variant="h6">
                  {transactions.length > 0
                    ? `Parsed Transactions (${transactions.length} total)`
                    : "Transactions"}
                </Typography>
              }
              action={
                transactions.length > 0 && (
                  <Button
                    variant="contained"
                    color="error"
                    onClick={() => setShowDeleteAllDialog(true)}
                    size="small"
                    disabled={isDeletingAll}
                    startIcon={
                      isDeletingAll ? (
                        <CircularProgress size={20} color="inherit" />
                      ) : null
                    }
                  >
                    {isDeletingAll ? "Deleting..." : "Delete All Pending"}
                  </Button>
                )
              }
            />
            <CardContent>
              <div>
                {/* Account Filter Controls */}
                <Box
                  sx={{
                    mb: 3,
                    display: "flex",
                    gap: 2,
                    flexWrap: "wrap",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Autocomplete
                    options={uniqueAccounts}
                    value={accountFilter || null}
                    onChange={(_, newValue) => setAccountFilter(newValue || "")}
                    sx={{ minWidth: 250 }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Filter by Account"
                        placeholder="All accounts"
                        variant="outlined"
                        size="small"
                      />
                    )}
                  />
                  {accountFilter && (
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => setAccountFilter("")}
                    >
                      Clear Filter
                    </Button>
                  )}
                  {/* Quick filter chips for common accounts */}
                  {uniqueAccounts.slice(0, 3).map((account) => (
                    <Chip
                      key={account}
                      label={account}
                      onClick={() => setAccountFilter(account)}
                      variant={
                        accountFilter === account ? "filled" : "outlined"
                      }
                      color={accountFilter === account ? "primary" : "default"}
                      size="small"
                    />
                  ))}
                </Box>

                {/* Transaction count display */}
                <Box sx={{ mb: 2, textAlign: "center" }}>
                  <Typography variant="body2" color="text.secondary">
                    Showing {filteredTransactions.length} of{" "}
                    {transactions.length} transactions
                    {accountFilter && ` (filtered by: ${accountFilter})`}
                  </Typography>
                </Box>

                {/* Loading state for table */}
                {isLoadingTable ? (
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      minHeight: 400,
                      flexDirection: "column",
                      gap: 2,
                    }}
                  >
                    <CircularProgress size={48} />
                    <Typography variant="body2" color="text.secondary">
                      Loading transactions...
                    </Typography>
                  </Box>
                ) : (
                  <Box sx={{ width: "100%", overflowX: "auto" }}>
                    <DataGrid
                      rows={filteredTransactions}
                      columns={columns}
                      processRowUpdate={async (
                        newRow: PendingTransaction,
                        oldRow: PendingTransaction,
                      ): Promise<PendingTransaction> => {
                        if (JSON.stringify(newRow) === JSON.stringify(oldRow)) {
                          return oldRow;
                        }
                        try {
                          await updatePendingTransaction({
                            oldPendingTransaction: oldRow,
                            newPendingTransaction: newRow,
                          });
                          setMessage(
                            "PendingTransaction updated successfully.",
                          );
                          setShowSnackbar(true);

                          return { ...newRow };
                        } catch (error) {
                          handleError(
                            error,
                            "Update PendingTransaction failure.",
                            false,
                          );
                          throw error;
                        }
                      }}
                      initialState={{
                        columns: {
                          columnVisibilityModel: {
                            pendingTransactionId: false, // This will hide the column by default
                          },
                        },
                        sorting: {
                          sortModel: [
                            { field: "transactionDate", sort: "desc" }, // Newest dates first
                          ],
                        },
                      }}
                      getRowId={(row) => row.guid}
                      autoHeight
                      sx={{
                        "& .MuiDataGrid-root": {
                          border: "none",
                        },
                      }}
                    />
                  </Box>
                )}
              </div>
            </CardContent>
          </Card>
        </>
        <SnackbarBaseline
          message={message}
          state={showSnackbar}
          handleSnackbarClose={handleSnackbarClose}
        />
        <ConfirmDialog
          open={showDeleteAllDialog}
          title="Delete All Pending Transactions"
          message={`Are you sure you want to delete all ${transactions.length} pending transaction(s)? This action cannot be undone.`}
          onConfirm={handleDeleteAllPendingTransactions}
          onClose={() => setShowDeleteAllDialog(false)}
          confirmText="Delete All"
          cancelText="Cancel"
        />
      </>
    </div>
  );
}
