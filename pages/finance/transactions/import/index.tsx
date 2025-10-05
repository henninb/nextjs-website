import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
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
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import HelpIcon from "@mui/icons-material/Help";
import CheckIcon from "@mui/icons-material/Check";
import DeleteIcon from "@mui/icons-material/Delete";
import Transaction from "../../../../model/Transaction";
import { ReoccurringType } from "../../../../model/ReoccurringType";
import { TransactionState } from "../../../../model/TransactionState";
import { AccountType } from "../../../../model/AccountType";
import { TransactionType } from "../../../../model/TransactionType";
import FinanceLayout from "../../../../layouts/FinanceLayout";
import usePendingTransactions from "../../../../hooks/usePendingTransactionFetch";
import Spinner from "../../../../components/Spinner";
import SnackbarBaseline from "../../../../components/SnackbarBaseline";
import ErrorDisplay from "../../../../components/ErrorDisplay";
import LoadingState from "../../../../components/LoadingState";
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

export default function TransactionImporter() {
  const [inputText, setInputText] = useState("");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showSpinner, setShowSpinner] = useState(true);
  const [message, setMessage] = useState("");
  const [showSnackbar, setShowSnackbar] = useState<boolean>(false);
  const [accountFilter, setAccountFilter] = useState<string>(""); // For filtering by account
  const [showFormatHelp, setShowFormatHelp] = useState(false);
  const [formatErrors, setFormatErrors] = useState<string[]>([]);
  const [isValidating, setIsValidating] = useState(false);

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
    if (loading) {
      setShowSpinner(true);
    }
    if (!loading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [loading, isAuthenticated, router]);

  useEffect(() => {
    if (isFetchingPendingTransactions || isLoadingAccounts) {
      setShowSpinner(true);
      return;
    }
    if (isPendingTransactionsLoaded && isSuccessAccounts) {
      setShowSpinner(false);
    }
  }, [
    isPendingTransactionsLoaded,
    isFetchingPendingTransactions,
    isSuccessAccounts,
    isLoadingAccounts,
  ]);

  useEffect(() => {
    if (isPendingTransactionsLoaded && fetchedPendingTransactions) {
      if (fetchedPendingTransactions.length === 0) {
        setTransactions([]);
        setShowSpinner(false);
        return;
      }

      const generateTransactionsWithGUID = async () => {
        setShowSpinner(true);
        const transactionsWithGUID = await Promise.all(
          fetchedPendingTransactions.map(async (transaction) => ({
            ...transaction,
            guid: await generateSecureUUID(),
            reoccurringType: "onetime" as ReoccurringType,
            transactionState: "outstanding" as TransactionState,
            transactionType: undefined as TransactionType,
            category: getCategoryFromDescription(transaction.description || ""),
            accountType: "debit" as AccountType,
            activeStatus: true,
            notes: "imported",
          })),
        );
        setTransactions(transactionsWithGUID);
        setShowSpinner(false);
      };

      generateTransactionsWithGUID();
    }
  }, [isPendingTransactionsLoaded, fetchedPendingTransactions]);

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

      setMessage(`Transaction added successfully: ${JSON.stringify(result)}`);
      setShowSnackbar(true);

      return result;
    } catch (error) {
      handleError(error, "handleAddRow", false);
      if (
        !navigator.onLine ||
        (error.message && error.message.includes("Failed to fetch"))
      ) {
        // offline error handling
      }
      throw error;
    }
  };

  const handleDeletePendingTransaction = async (pendingTransactionId: any) => {
    try {
      deletePendingTransaction(pendingTransactionId);
    } catch (error) {
      handleError(error, "handleDeleteRow", false);
      if (
        !navigator.onLine ||
        (error.message && error.message.includes("Failed to fetch"))
      ) {
        // offline error handling
      }
    }
  };

  const handleDeleteAllPendingTransactions = async () => {
    try {
      await deleteAllPendingTransactions();
      setMessage("All pending transactions have been deleted.");
      setShowSnackbar(true);
    } catch (error: any) {
      console.error("Error deleting pending transactions: ", error);
      setMessage(`Error deleting pending transactions: ${error.message}`);
      setShowSnackbar(true);
    }
  };

  const handleSnackbarClose = () => setShowSnackbar(false);

  const handleError = (error: any, moduleName: string, throwIt: boolean) => {
    const errorMessage = error.message
      ? `${moduleName}: ${error.message}`
      : `${moduleName}: Failure`;

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
          transactionType: undefined,
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
      renderCell: (params) => <div>{params.value}</div>,
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
      field: "amount",
      headerName: "Amount",
      type: "number",
      width: 90,
      renderCell: (params: any) => currencyFormat(params.value),
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
      renderCell: (params: any) => params.value || "undefined",
      editable: true,
    },
    {
      field: "reoccurringType",
      headerName: "Reoccur",
      width: 150,
      renderCell: (params: any) => params.value || "undefined",
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
      renderCell: (params) => (
        <Box sx={{ display: "flex", gap: 1 }}>
          <IconButton
            color="primary"
            size="small"
            onClick={async () => {
              console.log(params.row);
              await handleInsertTransaction(params.row);
              await handleDeletePendingTransaction(
                params.row.pendingTransactionId,
              );
            }}
          >
            <CheckIcon />
          </IconButton>
          <IconButton
            color="error"
            size="small"
            onClick={() => {
              handleDeletePendingTransaction(params.row.pendingTransactionId);
            }}
          >
            <DeleteIcon />
          </IconButton>
        </Box>
      ),
    },
  ];

  // Handle error states first
  if (errorPendingTransactions || errorAccounts) {
    return (
      <FinanceLayout>
        <Typography variant="h6">Transaction Import</Typography>
        <ErrorDisplay
          error={errorPendingTransactions || errorAccounts}
          variant="card"
          showRetry={true}
          onRetry={() => refetchPendingTransactions()}
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
            Transaction Import
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Import transactions by pasting them in the required format
          </Typography>
        </Box>

        {showSpinner ? (
          <LoadingState
            variant="card"
            message="Loading pending transactions and accounts..."
          />
        ) : (
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
                      onClick={handleDeleteAllPendingTransactions}
                      size="small"
                    >
                      Delete All Pending
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
                      onChange={(_, newValue) =>
                        setAccountFilter(newValue || "")
                      }
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
                        color={
                          accountFilter === account ? "primary" : "default"
                        }
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
                </div>
              </CardContent>
            </Card>
          </>
        )}
        <SnackbarBaseline
          message={message}
          state={showSnackbar}
          handleSnackbarClose={handleSnackbarClose}
        />
      </FinanceLayout>
    </div>
  );
}
