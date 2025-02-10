import { useRouter } from "next/router";
import React, { useState, useEffect } from "react";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import TextField from "@mui/material/TextField";
import {
  Box,
  Button,
  Modal,
  IconButton,
  Typography,
  Tooltip,
} from "@mui/material";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Autocomplete from "@mui/material/Autocomplete";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import Spinner from "../../../components/Spinner";
import SnackbarBaseline from "../../../components/SnackbarBaseline";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterMoment } from "@mui/x-date-pickers/AdapterMoment";
import { v4 as uuidv4 } from "uuid";
import useTransactionByAccountFetch from "../../../hooks/useTransactionByAccountFetch";
import useTransactionUpdate from "../../../hooks/useTransactionUpdate";
import useTransactionInsert from "../../../hooks/useTransactionInsert";
import useTransactionDelete from "../../../hooks/useTransactionDelete";
import useTotalsPerAccountFetch from "../../../hooks/useTotalsPerAccountFetch";
import useValidationAmountFetch from "../../../hooks/useValidationAmountFetch";
import useValidationAmountInsert from "../../../hooks/useValidationAmountInsert";
import useAccountFetch from "../../../hooks/useAccountFetch";
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
  epochToDate,
  currencyFormat,
  noNaN,
  formatDate,
} from "../../../components/Common";
import useCategoryFetch from "../../../hooks/useCategoryFetch";

export default function TransactionTable() {
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

  const router = useRouter();
  const { accountNameOwner }: any = router.query;

  const [transactionData, setTransactionData] = useState({
    transactionDate: new Date(), // Default to today's date
    accountNameOwner: accountNameOwner,
    reoccurringType: "onetime" as ReoccurringType, // Default to "onetime"
    amount: 0.0, // Default to 0.0
    transactionState: "outstanding" as TransactionState, // Default to "outstanding"
    transactionType: "undefined" as TransactionType,
    guid: uuidv4(),
    description: "",
    category: "",
    accountType: "undefined" as AccountType,
    activeStatus: true,
    notes: "",
  });

  //const routeMatch: PathMatch<string> | null = useMatch("/transactions/:account");
  //const accountNameOwner = routeMatch?.params?.account || "default";

  const { data, isSuccess } = useTransactionByAccountFetch(accountNameOwner);
  const { data: totals, isSuccess: isSuccessTotals } =
    useTotalsPerAccountFetch(accountNameOwner);
  const { data: validationData, isSuccess: isSuccessValidationTotals } =
    useValidationAmountFetch(accountNameOwner);
  const { data: accounts, isSuccess: isSuccessAccounts } = useAccountFetch();
  const { data: categories, isSuccess: isSuccessCategories } =
    useCategoryFetch();
  const { data: descrptions, isSuccess: isSuccessDescriptions } =
    useDescriptionFetch();

  const { mutateAsync: updateTransaction } = useTransactionUpdate();
  const { mutateAsync: deleteTransaction } = useTransactionDelete();
  const { mutateAsync: insertTransaction } =
    useTransactionInsert(accountNameOwner);
  const { mutateAsync: insertValidationAmount } = useValidationAmountInsert();

  const transactionStates = ["outstanding", "future", "cleared"];

  useEffect(() => {
    if (isSuccess && isSuccessTotals && isSuccessValidationTotals) {
      setShowSpinner(false);
    }
  }, [isSuccess, isSuccessTotals, isSuccessValidationTotals]);

  const handleSnackbarClose = () => setShowSnackbar(false);

  const handleError = (error: any, moduleName: string, throwIt: boolean) => {
    const errorMessage = error.response
      ? `${moduleName}: ${error.response.status} - ${JSON.stringify(
          error.response.data,
        )}`
      : `${moduleName}: Failure`;

    setMessage(errorMessage);
    setShowSnackbar(true);
    if (throwIt) throw error;
  };

  const handleInsertNewValidationData = async (
    accountNameOwner: string,
    transactionState: TransactionState,
  ) => {
    //console.log(accountNameOwner);

    const payload: ValidationAmount = {
      validationId: Math.random(),
      activeStatus: true,
      amount: totals.totalsCleared,
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
      setMessage("Transaction moved successfully.");
      setShowSnackbar(true);
    } catch (error) {
      handleError(error, `Move Transaction failure: ${error}`, false);
    }
  };

  const handleDeleteRow = async () => {
    if (selectedTransaction) {
      try {
        await deleteTransaction({ oldRow: selectedTransaction });
        setMessage("Transaction deleted successfully.");
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
        accountNameOwner: selectedTransaction.accountNameOwner,
        newRow: selectedTransaction,
        isFutureTransaction: true,
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
        accountNameOwner: newData.accountNameOwner,
        newRow: newData,
        isFutureTransaction: false,
      });

      setMessage(`Transaction added successfully: ${JSON.stringify(result)}`);
      setShowSnackbar(true);

      return result;
    } catch (error) {
      handleError(error, "handleAddRow", false);
      throw error;
    }
  };

  const columns: GridColDef[] = [
    {
      field: "transactionDate",
      headerName: "Transaction Date",
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
        //console.log("localDate: " + localDate);
        return localDate;
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
      renderCell: (params: any) =>
        params.value?.toLocaleString("en-US", {
          style: "currency",
          currency: "USD",
        }),
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
            // Avoid directly mutating `params.row`
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
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
          >
            {transactionStates.map((state) => (
              <Button
                key={state}
                size="small"
                variant={
                  params.row.transactionState === state
                    ? "contained"
                    : "outlined"
                }
                onClick={() => handleStateChange(state as TransactionState)}
              >
                {state}
              </Button>
            ))}
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
      field: "accountType",
      headerName: "AccountType",
      width: 150,
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
  ];

  return (
    <Box>
      <h2>{`${accountNameOwner}`}</h2>
      {showSpinner ? (
        <Spinner />
      ) : (
        <div>
          <div>
            <h4>{`[ ${currencyFormat(
              noNaN(totals?.["totals"] ?? 0),
            )} ] [ ${currencyFormat(
              noNaN(totals?.["totalsCleared"] ?? 0),
            )} ]  [ ${currencyFormat(
              noNaN(totals?.["totalsOutstanding"] ?? 0),
            )} ] [ ${currencyFormat(noNaN(totals?.["totalsFuture"] ?? 0))} ]`}</h4>

            <IconButton
              onClick={() => {
                setShowModalAdd(true);
              }}
              style={{ marginLeft: 8 }}
            >
              <AddIcon />
            </IconButton>

            <Button
              onClick={() => {
                console.log(
                  'insertNewValidationData(accountNameOwner, "cleared")',
                );
                handleInsertNewValidationData(accountNameOwner, "cleared");
              }}
            >
              {validationData?.amount
                ? validationData?.amount.toLocaleString("en-US", {
                    style: "currency",
                    currency: "USD",
                  })
                : "$0.00"}{" "}
              {" - "}{" "}
              {new Date(validationData?.validationDate).toLocaleString("en-US")}
            </Button>

            <DataGrid
              rows={data?.filter((row) => row != null) || []}
              columns={columns}
              getRowId={(row) => row.transactionId || 0}
              checkboxSelection={false}
              rowSelection={false}
              processRowUpdate={async (
                newRow: Transaction,
                oldRow: Transaction,
              ): Promise<Transaction> => {
                try {
                  await updateTransaction({ newRow: newRow, oldRow: oldRow });
                  setMessage("Transaction updated successfully.");
                  setShowSnackbar(true);
                  return newRow;
                } catch (error) {
                  handleError(error, "Update Transaction failure.", false);
                  return oldRow;
                }
              }}
            />
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

      {/* Modal  Clone Transaction */}
      <Modal open={showModalClone} onClose={() => setShowModalClone(false)}>
        <Box
          sx={{
            width: 400,
            padding: 4,
            backgroundColor: "white",
            margin: "auto",
            marginTop: "20%",
          }}
        >
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
        </Box>
      </Modal>

      {/* Modal Delete Transaction */}
      <Modal open={showModalDelete} onClose={() => setShowModalDelete(false)}>
        <Box
          sx={{
            width: 400,
            padding: 4,
            backgroundColor: "white",
            margin: "auto",
            marginTop: "20%",
          }}
        >
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
        </Box>
      </Modal>

      {/* Modal Add/Edit Transaction */}
      <Modal
        open={showModalAdd}
        onClose={() => setShowModalAdd(false)}
        aria-labelledby="transaction-form-modal"
        aria-describedby="transaction-form-modal-description"
      >
        <Box
          sx={{
            width: 400,
            padding: 4,
            backgroundColor: "white",
            margin: "auto",
            marginTop: "20%",
          }}
        >
          <h3>
            {transactionData ? "Edit Transaction" : "Add New Transaction"}
          </h3>

          <LocalizationProvider dateAdapter={AdapterMoment}>
            <DatePicker
              label="Transaction Date"
              onChange={(newValue) =>
                setTransactionData((prev: any) => ({
                  ...prev,
                  transactionDate: newValue,
                }))
              }
            />
          </LocalizationProvider>

          <Autocomplete
            freeSolo
            options={
              isSuccessDescriptions
                ? descrptions.map((d) => d.descriptionName)
                : []
            }
            value={transactionData?.description || ""}
            onChange={(_, newValue) =>
              setTransactionData((prev: any) => ({
                ...prev,
                description: newValue,
              }))
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Description"
                fullWidth
                margin="normal"
              />
            )}
          />

          <Autocomplete
            freeSolo
            options={
              isSuccessCategories ? categories.map((c) => c.categoryName) : []
            }
            value={transactionData?.category || ""}
            onChange={(_, newValue) =>
              setTransactionData((prev: any) => ({
                ...prev,
                category: newValue,
              }))
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Category"
                fullWidth
                margin="normal"
              />
            )}
          />

          <TextField
            label="Amount"
            value={transactionData?.amount ?? ""}
            onChange={(e) =>
              setTransactionData((prev: any) => ({
                ...prev,
                amount: parseFloat(e.target.value) || 0,
              }))
            }
            fullWidth
            margin="normal"
            type="number"
            slotProps={{
              htmlInput: {
                step: "0.01", // Allow decimal inputs
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
              {transactionData ? "Update" : "Add"}
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              onClick={() => setShowModalAdd(false)}
              style={{ marginTop: 16, marginLeft: 8 }}
            >
              Cancel
            </Button>
          </div>
        </Box>
      </Modal>

      {/* Modal Move Transaction */}
      <Modal open={showModalMove} onClose={() => setShowModalMove(false)}>
        <Box
          sx={{
            width: 400,
            padding: 4,
            backgroundColor: "white",
            margin: "auto",
            marginTop: "20%",
          }}
        >
          <Autocomplete
            options={
              isSuccessAccounts && isSuccess && selectedTransaction
                ? accounts.filter(
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
                ? accounts.find(
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
        </Box>
      </Modal>
    </Box>
  );
}
