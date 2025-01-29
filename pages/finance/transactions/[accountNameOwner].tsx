import { useRouter } from "next/router";
import React, { useState, useEffect } from "react";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import TextField from "@mui/material/TextField";
import { Box, Button, Modal, IconButton, Typography } from "@mui/material";
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
import EditIcon from "@mui/icons-material/CreateRounded";
import AddIcon from "@mui/icons-material/AddRounded";
import AttachMoneyRounded from "@mui/icons-material/AttachMoneyRounded";
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
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [showModalMove, setShowModalMove] = useState(false);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [showModalAdd, setShowModalAdd] = useState<boolean>(false);
  const [confirmDelete, setShowModalDelete] = useState(false);
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);

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

  const { mutate: updateTransaction } = useTransactionUpdate();
  const { mutate: deleteTransaction } = useTransactionDelete();
  const { mutateAsync: insertTransaction } = useTransactionInsert(accountNameOwner);
  const { mutate: insertValidationAmount } = useValidationAmountInsert();

  const transactionStates = ["outstanding", "future", "cleared"];

  useEffect(() => {
    if (isSuccess && isSuccessTotals && isSuccessValidationTotals) {
      setShowSpinner(false);
    }
  }, [isSuccess, isSuccessTotals, isSuccessValidationTotals]);

  const handleSnackbarClose = () => setOpenSnackbar(false);

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

  const handleInsertNewValidationData = (
    accountNameOwner: string,
    transactionState: TransactionState,
  ) => {
    console.log(accountNameOwner);

    const payload: ValidationAmount = {
      validationId: Math.random(),
      activeStatus: true,
      amount: totals.totalsCleared,
      transactionState: transactionState,
      validationDate: new Date(),
    };

    insertValidationAmount({
      accountNameOwner: accountNameOwner,
      payload: payload,
    });
  };

  const handleMoveRow = async (transaction: Transaction) => {
    // console.log(JSON.stringify(transaction))

    // updateTransaction({
    //   newRow: updatedRow,
    //   oldRow: params.row,
    // });
  }


  const handleDeleteRow = async () => {
    if (selectedTransaction) {
      try {
        await deleteTransaction({ oldRow: selectedTransaction });
        setMessage("Transaction deleted successfully.");
      } catch (error) {
        handleError(error, "Delete Transaction failure.", false);
      } finally {
        setShowModalDelete(false);
        setSelectedTransaction(null);
      }
    }
  };

  const handleAddRow = async () => {
    const newRow = {
      transactionDate: new Date(),
      accountNameOwner,
      reoccurringType: "onetime" as ReoccurringType,
      amount: 0.0,
      transactionState: "outstanding" as TransactionState,
      transactionType: "undefined" as TransactionType,
      guid: uuidv4(),
      description: "",
      category: "",
      accountType: "undefined" as AccountType,
      activeStatus: true,
      notes: "",
    };
    try {
      await insertTransaction({
        accountNameOwner,
        newRow,
        isFutureTransaction: false,
      });
    } catch (error) {
      handleError(error, "handleAddRow", false);
    }
  };

  const addRow = async(newData: Transaction): Promise<Transaction> => {
    try {
      const result = await insertTransaction({
        accountNameOwner: newData.accountNameOwner,
        newRow: newData,
        isFutureTransaction: false,
      });

      return result;
    } catch (error) {
      handleError(error, "addRow", false);
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
        const handleStateChange = (newState: TransactionState) => {
          // Avoid directly mutating `params.row`
          const updatedRow = { ...params.row, transactionState: newState };

          // Update the row in the database
          updateTransaction({
            newRow: updatedRow,
            oldRow: params.row,
          });
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
            <IconButton
              onClick={() => {
                setSelectedTransaction(params.row)
                setShowModalMove(true)
              }}
            >
              <SwapVert />
            </IconButton>
            <IconButton
              onClick={() => {
                setSelectedTransaction(params.row);
                setShowModalDelete(true);
              }}
            >
              <DeleteIcon />
            </IconButton>
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
          <h3>{`[ ${currencyFormat(
            noNaN(totals?.["totals"] ?? 0),
          )} ] [ ${currencyFormat(
            noNaN(totals?.["totalsCleared"] ?? 0),
          )} ]  [ ${currencyFormat(
            noNaN(totals?.["totalsOutstanding"] ?? 0),
          )} ] [ ${currencyFormat(noNaN(totals?.["totalsFuture"] ?? 0))} ]`}</h3>
          <IconButton
            onClick={() => {
              setShowModalAdd(true);
              return handleAddRow;
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
            {" - "} {formatDate(validationData?.validationDate)}
          </Button>

          <DataGrid
            rows={data?.filter((row) => row != null) || []}
            columns={columns}
            getRowId={(row) => row.transactionId || 0}
            checkboxSelection={false}
            rowSelection={false}
            processRowUpdate={(newRow: Transaction, oldRow: Transaction) => {
              updateTransaction({ newRow: newRow, oldRow: oldRow });
              return newRow;
            }}
          />
        </div>
      )}

      <SnackbarBaseline
        open={openSnackbar}
        onClose={handleSnackbarClose}
        message={message}
      />

      {/* Confirmation Modal */}
      <Modal open={confirmDelete} onClose={() => setShowModalDelete(false)}>
        <Box
          sx={{
            width: 400,
            padding: 4,
            backgroundColor: "white",
            margin: "auto",
            marginTop: "20%",
          }}
        >
          <Typography variant="h6">Confirm Deletion</Typography>
          <Typography>
            Are you sure you want to delete the transaction "
            {JSON.stringify(selectedTransaction)}"?
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

      {/* Form Overlay for Adding/Editing Transaction */}
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
            top: "20%",
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
                category: newValue, // Allows selection from the list or free input
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
              onClick={() => transactionData && addRow(transactionData)}
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
              isSuccessAccounts && isSuccess
                ? accounts.filter(
                    (account) =>
                      account.accountType === transactionData.accountType,
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
              transactionData?.accountNameOwner
                ? accounts.find(
                    (account) =>
                      account.accountNameOwner ===
                      transactionData.accountNameOwner,
                  ) || null
                : null
            }
            onChange={(event, newValue) =>
              setTransactionData((prev) => ({
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
              onClick={() => transactionData && handleMoveRow(transactionData)}
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
