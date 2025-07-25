import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/router";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import type { GridRowSelectionModel } from "@mui/x-data-grid";
import type { GridRowId } from "@mui/x-data-grid";
import TextField from "@mui/material/TextField";
import {
  Box,
  Paper,
  Button,
  Modal,
  IconButton,
  Typography,
  Tooltip,
} from "@mui/material";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Autocomplete from "@mui/material/Autocomplete";
import Spinner from "../../../components/Spinner";
import SnackbarBaseline from "../../../components/SnackbarBaseline";
import useTransactionByAccountFetch from "../../../hooks/useTransactionByAccountFetch";
import useTransactionUpdate from "../../../hooks/useTransactionUpdate";
import useTransactionInsert from "../../../hooks/useTransactionInsert";
import useTransactionDelete from "../../../hooks/useTransactionDelete";
import useTotalsPerAccountFetch from "../../../hooks/useTotalsPerAccountFetch";
import useValidationAmountFetch from "../../../hooks/useValidationAmountFetch";
import useValidationAmountInsert from "../../../hooks/useValidationAmountInsert";
import useAccountFetch from "../../../hooks/useAccountFetch";
import useCategoryFetch from "../../../hooks/useCategoryFetch";
import useDescriptionFetch from "../../../hooks/useDescriptionFetch";
import { AccountType } from "../../../model/AccountType";
import Transaction from "../../../model/Transaction";
import Account from "../../../model/Account";
import { TransactionState } from "../../../model/TransactionState";
import { TransactionType } from "../../../model/TransactionType";
import { ReoccurringType } from "../../../model/ReoccurringType";
import ValidationAmount from "../../../model/ValidationAmount";
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
} from "../../../components/Common";
import FinanceLayout from "../../../layouts/FinanceLayout";
import Totals from "../../../model/Totals";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import EventNoteIcon from "@mui/icons-material/EventNote";
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
} from "@mui/material";
import { useAuth } from "../../../components/AuthProvider";

export default function TransactionsByAccount() {
  const [showSpinner, setShowSpinner] = useState(true);
  const [message, setMessage] = useState("");
  const [showSnackbar, setShowSnackbar] = useState<boolean>(false);
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

  const [rowSelectionModel, setRowSelectionModel] =
    useState<GridRowSelectionModel>({
      type: "include", // “include” means these IDs are selected
      ids: new Set(), // start with no selections
    });

  const router = useRouter();
  const { accountNameOwner }: any = router.query;
  const validAccountNameOwner =
    typeof accountNameOwner === "string" ? accountNameOwner : "";

  const initialTransactionData: Transaction = useMemo(
    () => ({
      transactionDate: new Date(),
      accountNameOwner: validAccountNameOwner,
      reoccurringType: "onetime" as ReoccurringType,
      amount: 0.0,
      transactionState: "outstanding" as TransactionState,
      transactionType: "undefined" as TransactionType,
      guid: crypto.randomUUID(),
      description: "",
      category: "",
      accountType: "undefined" as AccountType,
      activeStatus: true,
      notes: "",
    }),
    [validAccountNameOwner],
  );

  const [transactionData, setTransactionData] = useState<Transaction>(
    initialTransactionData,
  );

  const {
    data: fetchedTransactions,
    isSuccess: isSuccessTransactions,
    isLoading: isFetchingTransactions,
    isError: isErrorTransactions,
    error: errorTransactions,
  } = useTransactionByAccountFetch(validAccountNameOwner);
  const {
    data: fetchedTotals,
    isSuccess: isSuccessTotals,
    isLoading: isFetchingTotals,
    isError: isErrorTotals,
    error: errorTotals,
  } = useTotalsPerAccountFetch(validAccountNameOwner);
  const {
    data: fetchedValidationData,
    isSuccess: isSuccessValidationTotals,
    isLoading: isFetchingValidationTotals,
    isError: isErrorValidationTotals,
    error: errorValidationTotals,
  } = useValidationAmountFetch(validAccountNameOwner);
  const {
    data: fetchedAccounts,
    isSuccess: isSuccessAccounts,
    isLoading: isFetchingAccounts,
    isError: isErrorAccounts,
    error: errorAccounts,
  } = useAccountFetch();
  const {
    data: fetchedCategories,
    isSuccess: isSuccessCategories,
    isLoading: isFetchingCategories,
    isError: isErrorCategories,
    error: errorCategories,
  } = useCategoryFetch();
  const {
    data: fetchedDescriptions,
    isSuccess: isSuccessDescriptions,
    isLoading: isFetchingDescriptions,
    isError: isErrorDescriptions,
    error: errorDescriptions,
  } = useDescriptionFetch();

  const { mutateAsync: updateTransaction } = useTransactionUpdate();
  const { mutateAsync: deleteTransaction } = useTransactionDelete();
  const { mutateAsync: insertTransaction } = useTransactionInsert();
  const { mutateAsync: insertValidationAmount } = useValidationAmountInsert();

  const transactionStates = ["outstanding", "future", "cleared"];
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    const { ids } = rowSelectionModel;
    if (ids.size === 0) {
      setSelectedTotal(null);
      return;
    }
    const selectedIds = Array.from(ids);
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

  const handleSnackbarClose = useCallback(() => setShowSnackbar(false), []);

  const handleError = useCallback(
    (error: any, moduleName: string, throwIt: boolean) => {
      const errorMessage = error.message
        ? `${moduleName}: ${error.message}`
        : `${moduleName}: Failure`;

      setMessage(errorMessage);
      setShowSnackbar(true);

      console.error(errorMessage);

      if (throwIt) throw error;
    },
    [],
  );

  const handleInsertNewValidationData = async (
    accountNameOwner: string,
    transactionState: TransactionState,
  ) => {
    // Round to 2 decimal places to ensure proper precision
    const clearedAmount = fetchedTotals?.totalsCleared ?? 0;
    const roundedAmount = Math.round(clearedAmount * 100) / 100;

    const payload: ValidationAmount = {
      validationId: Math.random(),
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
      setMessage(`ValidationAmount inserted successfully`);
      setShowSnackbar(true);
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
      setMessage(`Transaction moved successfully.`);
      setShowSnackbar(true);
    } catch (error) {
      handleError(error, `Move Transaction failure: ${error}`, false);
    }
  };

  const handleDeleteRow = async () => {
    if (selectedTransaction) {
      try {
        await deleteTransaction({ oldRow: selectedTransaction });
        setMessage(`Transaction deleted successfully.`);
        setShowSnackbar(true);
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
      const result = await insertTransaction({
        accountNameOwner: validAccountNameOwner,
        //newRow: selectedTransaction,
        newRow: {
          ...selectedTransaction,
          accountNameOwner: validAccountNameOwner,
        },
        isFutureTransaction: true,
        isImportTransaction: false,
      });

      setMessage(`Transaction cloned successfully: ${JSON.stringify(result)}`);
      setShowSnackbar(true);
    } catch (error) {
      handleError(error, `handleCloneRow error: ${error}`, false);
      throw error;
    }
  };

  const handleAddRow = async (newData: Transaction): Promise<Transaction> => {
    try {
      const result = await insertTransaction({
        accountNameOwner: validAccountNameOwner,
        //newRow: newData,
        newRow: { ...newData, accountNameOwner: validAccountNameOwner },
        isFutureTransaction: false,
        isImportTransaction: false,
      });
      console.log(`Transaction added successfully: ${JSON.stringify(result)}`);
      setMessage(`Transaction added successfully: ${JSON.stringify(result)}`);
      setShowSnackbar(true);

      return result;
    } catch (error) {
      handleError(error, "handleAddRow", false);
      if (
        !navigator.onLine ||
        (error.message && error.message.includes("Failed to fetch"))
      ) {
      }
      throw error;
    }
  };

  const columns: GridColDef[] = useMemo(
    () => [
      {
        field: "transactionDate",
        headerName: "Date",
        type: "date",
        width: 100,
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
        width: 180,
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
        renderCell: (params: any) => {
          const handleStateChange = async (newState: TransactionState) => {
            try {
              const updatedRow = { ...params.row, transactionState: newState };
              await updateTransaction({
                newRow: updatedRow,
                oldRow: params.row,
              });
              setMessage("TransactionState updated Successfully.");
              setShowSnackbar(true);
            } catch (error) {
              handleError(error, "TransactionState failure.", false);
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
                      style={{
                        color:
                          params.row.transactionState === state
                            ? "rgba(189, 147, 249, 1)" // Purple color for active state
                            : "rgba(255, 255, 255, 1)", // White color for inactive state, // Default color for inactive state
                      }}
                      onClick={() => handleStateChange(state)}
                    >
                      <IconComponent />
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
        width: 180,
        renderCell: (params: any) => params.value || "undefined",
      },
      {
        field: "reoccurringType",
        headerName: "Reoccur",
        width: 150,
        renderCell: (params: any) => params.value || "undefined",
      },
      {
        field: "notes",
        headerName: "Notes",
        width: 180,
        editable: true,
      },
      {
        field: "",
        headerName: "Actions",
        sortable: false,
        width: 120,
        renderCell: (params) => {
          return (
            <div>
              <Tooltip title="Clone this row">
                <IconButton
                  onClick={() => {
                    setSelectedTransaction(params.row);
                    setShowModalClone(true);
                  }}
                >
                  <ContentCopyIcon />
                </IconButton>
              </Tooltip>

              <Tooltip title="Move this row to another account">
                <IconButton
                  onClick={() => {
                    setSelectedTransaction(params.row);
                    setOriginalRow(params.row);
                    setShowModalMove(true);
                  }}
                >
                  <SwapVert />
                </IconButton>
              </Tooltip>

              <Tooltip title="Delete this row">
                <IconButton
                  onClick={() => {
                    setSelectedTransaction(params.row);
                    setShowModalDelete(true);
                  }}
                >
                  <DeleteIcon />
                </IconButton>
              </Tooltip>
            </div>
          );
        },
      },
    ],
    [updateTransaction, handleError],
  );

  return (
    <div>
      <FinanceLayout>
        <h2>
          {validAccountNameOwner ? validAccountNameOwner.toUpperCase() : ""}
        </h2>
        {showSpinner ? (
          <Spinner />
        ) : (
          <div>
            <div>
              <div
                style={{
                  maxWidth: "600px",
                  margin: "0 auto",
                  marginBottom: "16px",
                }}
              >
                <TableContainer component={Paper}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell align="center">
                          <strong>Total</strong>
                        </TableCell>
                        <TableCell align="center">
                          <CheckCircleIcon
                            fontSize="small"
                            style={{ verticalAlign: "middle" }}
                          />{" "}
                          <strong>Cleared</strong>
                        </TableCell>
                        <TableCell align="center">
                          <AccessTimeIcon
                            fontSize="small"
                            style={{ verticalAlign: "middle" }}
                          />{" "}
                          <strong>Outstanding</strong>
                        </TableCell>
                        <TableCell align="center">
                          <EventNoteIcon
                            fontSize="small"
                            style={{ verticalAlign: "middle" }}
                          />{" "}
                          <strong>Future</strong>
                        </TableCell>

                        {selectedTotal !== null && (
                          <TableCell align="center">
                            <strong>Selected</strong>
                          </TableCell>
                        )}
                      </TableRow>
                    </TableHead>

                    <TableBody>
                      <TableRow>
                        <TableCell align="center">
                          {currencyFormat(noNaN(fetchedTotals?.totals ?? 0))}
                        </TableCell>
                        <TableCell align="center">
                          {currencyFormat(
                            noNaN(fetchedTotals?.totalsCleared ?? 0),
                          )}
                        </TableCell>
                        <TableCell align="center">
                          {currencyFormat(
                            noNaN(fetchedTotals?.totalsOutstanding ?? 0),
                          )}
                        </TableCell>
                        <TableCell align="center">
                          {currencyFormat(
                            noNaN(fetchedTotals?.totalsFuture ?? 0),
                          )}
                        </TableCell>

                        {selectedTotal !== null && (
                          <TableCell align="center">
                            {currencyFormat(noNaN(selectedTotal))}
                          </TableCell>
                        )}
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </div>

              <div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    marginTop: "16px",
                  }}
                >
                  {" "}
                  {/* Added margin for spacing */}
                  <Button
                    onClick={() =>
                      handleInsertNewValidationData(
                        validAccountNameOwner,
                        "cleared",
                      )
                    }
                    variant="contained" // Added variant for better visual appearance
                    style={{ marginRight: "8px" }} // Added margin for spacing
                  >
                    {fetchedValidationData?.amount
                      ? fetchedValidationData?.amount.toLocaleString("en-US", {
                          style: "currency",
                          currency: "USD",
                        })
                      : "$0.00"}
                    {" - "}
                    {
                      fetchedValidationData?.validationDate // Check if validationDate exists
                        ? new Date(
                            fetchedValidationData?.validationDate,
                          ).toLocaleString("en-US")
                        : "No Date" // Or handle the absence of a date as needed
                    }
                  </Button>
                  <IconButton onClick={() => setShowModalAdd(true)}>
                    <AddIcon />
                  </IconButton>
                </div>
              </div>

              <Box display="flex" justifyContent="center">
                <Box sx={{ width: "fit-content" }}>
                  <DataGrid
                    rows={
                      fetchedTransactions?.filter((row) => row != null) || []
                    }
                    columns={columns}
                    getRowId={(row) => row.transactionId || 0}
                    checkboxSelection={true}
                    pagination
                    paginationModel={paginationModel}
                    hideFooter={fetchedTransactions?.length < 25}
                    onPaginationModelChange={(newModel) => {
                      setPaginationModel(newModel);
                    }}
                    pageSizeOptions={[25, 50, 100]}
                    density="compact"
                    disableColumnFilter
                    disableColumnMenu
                    disableVirtualization={false}
                    autoHeight
                    // initialState={{
                    //   sorting: {
                    //     sortModel: [{ field: "transactionDate", sort: "desc" }],
                    //   },
                    // }}
                    processRowUpdate={async (
                      newRow: Transaction,
                      oldRow: Transaction,
                    ): Promise<Transaction> => {
                      if (JSON.stringify(newRow) === JSON.stringify(oldRow)) {
                        return oldRow;
                      }
                      try {
                        await updateTransaction({
                          newRow: newRow,
                          oldRow: oldRow,
                        });
                        setMessage("Transaction updated successfully.");
                        setShowSnackbar(true);
                        return { ...newRow };
                      } catch (error) {
                        handleError(
                          error,
                          "Update Transaction failure.",
                          false,
                        );
                        throw error;
                      }
                    }}
                    disableRowSelectionOnClick={true}
                    rowSelectionModel={rowSelectionModel}
                    onRowSelectionModelChange={setRowSelectionModel}
                  />
                </Box>
              </Box>
            </div>

            <div>
              <SnackbarBaseline
                message={message}
                state={showSnackbar}
                handleSnackbarClose={handleSnackbarClose}
              />
            </div>
          </div>
        )}

        {/* Modal Clone Transaction */}
        <Modal open={showModalClone} onClose={() => setShowModalClone(false)}>
          <Paper>
            <Typography variant="h6">Confirm Clone</Typography>
            <Typography>
              Are you sure you want to clone the transaction "
              {selectedTransaction?.guid}"?
            </Typography>
            <Box mt={2} display="flex" justifyContent="space-between">
              <Button
                variant="contained"
                color="primary"
                onClick={handleCloneRow}
              >
                Clone
              </Button>
              <Button
                variant="outlined"
                color="secondary"
                onClick={() => setShowModalClone(false)}
              >
                Cancel
              </Button>
            </Box>
          </Paper>
        </Modal>

        {/* Modal Delete Transaction */}
        <Modal open={showModalDelete} onClose={() => setShowModalDelete(false)}>
          <Paper>
            <Typography variant="h6">Confirm Delete</Typography>
            <Typography>
              Are you sure you want to delete the transaction "
              {selectedTransaction?.guid}"?
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

        {/* Modal Add Transaction */}
        <Modal
          open={showModalAdd}
          onClose={() => {
            setShowModalAdd(false);
            setTransactionData(initialTransactionData);
          }}
          //onClose={() => setShowModalAdd(false)}
          aria-labelledby="transaction-form-modal"
          aria-describedby="transaction-form-modal-description"
        >
          <Paper>
            <Typography variant="h6">Add A New Transaction</Typography>

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

            <TextField
              label="Amount"
              fullWidth
              margin="normal"
              type="text"
              value={transactionData?.amount ?? ""}
              onChange={(e) => {
                const inputValue = e.target.value;

                // Regular expression to allow only numbers with up to 2 decimal places
                //const regex = /^\d*\.?\d{0,2}$/;
                const regex = /^-?\d*\.?\d{0,2}$/;

                if (regex.test(inputValue) || inputValue === "") {
                  setTransactionData((prev: any) => ({
                    ...prev,
                    amount: inputValue, // Store as string to allow proper input control
                  }));
                }
              }}
              onBlur={() => {
                // Ensure value is properly formatted when user leaves the field
                setTransactionData((prev: any) => ({
                  ...prev,
                  amount: prev.amount
                    ? parseFloat(Number(prev.amount).toFixed(2)).toString() // Format to 2 decimal places
                    : "",
                }));
              }}
              slotProps={{
                input: {
                  inputMode: "decimal",
                },
              }}
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
              <MenuItem value="monthly">Monthly</MenuItem>
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

            <div>
              <Button
                variant="contained"
                color="primary"
                onClick={() => transactionData && handleAddRow(transactionData)}
                style={{ marginTop: 16 }}
              >
                Add
              </Button>
              <Button
                variant="outlined"
                color="secondary"
                onClick={() => {
                  setShowModalAdd(false);
                  setTransactionData(initialTransactionData);
                }}
                style={{ marginTop: 16, marginLeft: 8 }}
              >
                Cancel
              </Button>
            </div>
          </Paper>
        </Modal>

        {/* Modal Move Transaction */}
        <Modal open={showModalMove} onClose={() => setShowModalMove(false)}>
          <Paper>
            <Typography variant="h6">Confirm Move</Typography>
            <Typography>
              Are you sure you want to move the transaction "
              {selectedTransaction?.guid}"?
            </Typography>
            <Autocomplete
              options={
                isSuccessAccounts &&
                isSuccessTransactions &&
                selectedTransaction
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
                setSelectedTransaction((prev) => ({
                  ...prev,
                  accountNameOwner: newValue ? newValue.accountNameOwner : "",
                  accountId: newValue ? newValue.accountId : 0,
                }))
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

            <Box mt={2} display="flex" justifyContent="space-between">
              <Button
                variant="contained"
                color="primary"
                onClick={() =>
                  originalRow &&
                  selectedTransaction &&
                  handleMoveRow(originalRow, selectedTransaction)
                }
              >
                Save
              </Button>
              <Button
                variant="outlined"
                color="secondary"
                onClick={() => setShowModalMove(false)}
              >
                Cancel
              </Button>
            </Box>
          </Paper>
        </Modal>
      </FinanceLayout>
    </div>
  );
}
