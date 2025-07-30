import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import {
  Box,
  Paper,
  Button,
  IconButton,
  Tooltip,
  Modal,
  Link,
  TextField,
  Typography,
  Autocomplete,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import Spinner from "../../components/Spinner";
import SnackbarBaseline from "../../components/SnackbarBaseline";
import useFetchTransfer from "../../hooks/useTransferFetch";
import useTransferInsert from "../../hooks/useTransferInsert";
import useTransferDelete from "../../hooks/useTransferDelete";
import Transfer from "../../model/Transfer";
import useAccountFetch from "../../hooks/useAccountFetch";
import Account from "../../model/Account";
import useTransferUpdate from "../../hooks/useTransferUpdate";
import FinanceLayout from "../../layouts/FinanceLayout";
import { dummyTransfers } from "../../data/dummyTransfers";
import {
  currencyFormat,
  normalizeTransactionDate,
  formatDateForInput,
  formatDateForDisplay,
} from "../../components/Common";
import { useAuth } from "../../components/AuthProvider";

export default function Transfers() {
  const [message, setMessage] = useState("");
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [showSpinner, setShowSpinner] = useState(true);
  const [showModalAdd, setShowModalAdd] = useState(false);
  const [showModalDelete, setShowModalDelete] = useState(false);
  const [paginationModel, setPaginationModel] = useState({
    pageSize: 50,
    page: 0,
  });

  const [transferData, setTransferData] = useState<Transfer>({
    transferId: 0,
    sourceAccount: "",
    destinationAccount: "",
    transactionDate: new Date(),
    amount: 0,
    guidSource: "",
    guidDestination: "",
    activeStatus: true,
  });

  const [selectedTransfer, setSelectedTransfer] = useState<Transfer | null>(
    null,
  );

  const [availableSourceAccounts, setAvailableSourceAccounts] = useState<
    Account[]
  >([]);
  const [availableDestinationAccounts, setAvailableDestinationAccounts] =
    useState<Account[]>([]);
  const [selectedSourceAccount, setSelectedSourceAccount] =
    useState<Account | null>(null);
  const [selectedDestinationAccount, setSelectedDestinationAccount] =
    useState<Account | null>(null);

  const { mutateAsync: insertTransfer } = useTransferInsert();
  const { mutateAsync: deleteTransfer } = useTransferDelete();
  const { mutateAsync: updateTransfer } = useTransferUpdate();

  const {
    data: fetchedAccounts,
    isSuccess: isSuccessAccounts,
    isFetching: isFetchingAccounts,
    error: errorAccounts,
  } = useAccountFetch();
  const {
    data: fetchedTransfers,
    isSuccess: isSuccessTransfers,
    isFetching: isFetchingTransfers,
    error: errorTransfers,
  } = useFetchTransfer();

  const transfersToDisplay = errorTransfers
    ? dummyTransfers
    : fetchedTransfers?.filter((row) => row != null) || [];
  //const transfersToDisplay = fetchedTransfers || [];
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
    } else if (errorTransfers || errorAccounts) {
      setShowSpinner(false);
      setMessage("Error fetching data.");
      setShowSnackbar(true);
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
        fetchedAccounts.filter(
          (account) =>
            account.accountType === "debit" &&
            account.accountNameOwner !== selectedSourceAccount.accountNameOwner,
        ),
      );
    } else if (isSuccessAccounts) {
      setAvailableDestinationAccounts(
        fetchedAccounts.filter((account) => account.accountType === "debit"),
      );
    }
  }, [selectedSourceAccount, isSuccessAccounts, fetchedAccounts]);

  useEffect(() => {
    if (selectedDestinationAccount) {
      setAvailableSourceAccounts(
        fetchedAccounts.filter(
          (account) =>
            account.accountType === "debit" &&
            account.accountNameOwner !==
              selectedDestinationAccount.accountNameOwner,
        ),
      );
    } else if (isSuccessAccounts) {
      setAvailableSourceAccounts(
        fetchedAccounts.filter((account) => account.accountType === "debit"),
      );
    }
  }, [selectedDestinationAccount, isSuccessAccounts, fetchedAccounts]);

  const handleSourceAccountChange = (event: any, newValue: Account | null) => {
    setSelectedSourceAccount(newValue);
    setTransferData((prev) => ({
      ...prev,
      sourceAccount: newValue ? newValue.accountNameOwner : "",
    }));
  };

  const handleDestinationAccountChange = (
    event: any,
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
        setMessage("Transfer deleted successfully.");
      } catch (error) {
        handleError(error, `Delete Transfer error: ${error}`, false);
      } finally {
        setShowModalDelete(false);
        setSelectedTransfer(null);
      }
    }
  };

  const handleSnackbarClose = () => {
    setShowSnackbar(false);
  };

  const handleError = (error: any, moduleName: string, throwIt: boolean) => {
    const errorMessage = error.message
      ? `${moduleName}: ${error.message}`
      : `${moduleName}: Failure`;

    setMessage(errorMessage);
    setShowSnackbar(true);

    console.error(errorMessage);

    if (throwIt) throw error;
  };

  const handleAddRow = async (newData: Transfer) => {
    try {
      const insertThisValue = {
        ...newData,
        guidDestination: crypto.randomUUID(),
        guidSource: crypto.randomUUID(),
      };
      console.log(`Transfer Insert: ${JSON.stringify(insertThisValue)}`);
      await insertTransfer({ payload: insertThisValue });
      setShowModalAdd(false);
      setMessage("Transfer inserted Successfully.");
      setShowSpinner(false);
      setTransferData({
        transferId: 0,
        sourceAccount: newData.sourceAccount,
        destinationAccount: newData.destinationAccount,
        transactionDate: newData.transactionDate,
        amount: 0,
        guidSource: "",
        guidDestination: "",
        activeStatus: true,
      });
    } catch (error) {
      handleError(error, `Add Transfer error: ${error}`, false);
      if (
        !navigator.onLine ||
        (error.message && error.message.includes("Failed to fetch"))
      ) {
      }
    }
  };

  const columns: GridColDef[] = [
    {
      field: "transactionDate",
      headerName: "Transaction Date",
      width: 200,
      renderCell: (params) => {
        return formatDateForDisplay(params.value);
      },
      valueGetter: (params: string) => {
        return normalizeTransactionDate(params);
      },
    },
    {
      field: "sourceAccount",
      headerName: "Source Account",
      width: 300,
      renderCell: (params) => {
        return (
          <Link href={`/finance/transactions/${params.row.sourceAccount}`}>
            {params.value}
          </Link>
        );
      },
    },
    {
      field: "destinationAccount",
      headerName: "Destination Account",
      width: 300,
      renderCell: (params) => {
        return (
          <Link href={`/finance/transactions/${params.row.destinationAccount}`}>
            {params.value}
          </Link>
        );
      },
    },
    {
      field: "amount",
      headerName: "Amount",
      width: 200,
      editable: true,
      renderCell: (params) => currencyFormat(params.value),
    },
    {
      field: "",
      headerName: "Actions",
      width: 100,
      renderCell: (params) => (
        <Tooltip title="delete this row">
          <IconButton
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

  return (
    <div>
      <FinanceLayout>
        <Box sx={{ mb: 3, textAlign: "center" }}>
          <Typography
            variant="h4"
            component="h1"
            sx={{ mb: 1, fontWeight: 600 }}
          >
            Transfer Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Move funds between accounts with automated transaction creation and
            tracking
          </Typography>
        </Box>
        {showSpinner ? (
          <Spinner />
        ) : (
          <div>
            <Box display="flex" justifyContent="center" mb={2}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setShowModalAdd(true)}
                sx={{ backgroundColor: "primary.main" }}
              >
                Add Transfer
              </Button>
            </Box>
            <Box display="flex" justifyContent="center">
              <Box sx={{ width: "fit-content" }}>
                <DataGrid
                  //rows={fetchedTransfers?.filter((row) => row != null) || []}
                  rows={transfersToDisplay}
                  columns={columns}
                  getRowId={(row) => row.transferId || `temp-${Math.random()}`}
                  checkboxSelection={false}
                  rowSelection={false}
                  pagination
                  paginationModel={paginationModel}
                  onPaginationModelChange={(newModel) =>
                    setPaginationModel(newModel)
                  }
                  pageSizeOptions={[25, 50, 100]}
                  processRowUpdate={async (
                    newRow: Transfer,
                    oldRow: Transfer,
                  ): Promise<Transfer> => {
                    if (JSON.stringify(newRow) === JSON.stringify(oldRow)) {
                      return oldRow;
                    }
                    try {
                      await updateTransfer({
                        oldTransfer: oldRow,
                        newTransfer: newRow,
                      });
                      setMessage("Transfer updated successfully.");
                      setShowSnackbar(true);
                      //return newRow;
                      return { ...newRow };
                    } catch (error) {
                      handleError(
                        error,
                        `Update Transfer error: ${error}`,
                        false,
                      );
                      throw error;
                    }
                  }}
                  autoHeight
                />
              </Box>
            </Box>
            <div>
              <SnackbarBaseline
                message={message}
                state={showSnackbar}
                handleSnackbarClose={handleSnackbarClose}
              />
            </div>
          </div>
        )}

        {/* Confirmation Delete Modal */}
        <Modal open={showModalDelete} onClose={() => setShowModalDelete(false)}>
          <Paper>
            <Typography variant="h6">Confirm Deletion</Typography>
            <Typography>
              Are you sure you want to delete the transfer "
              {selectedTransfer?.transferId}"?
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

        {/* Modal to add a transaction */}
        <Modal open={showModalAdd} onClose={() => setShowModalAdd(false)}>
          <Paper>
            <h3>Add New Transfer</h3>

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
              slotProps={{
                inputLabel: { shrink: true },
              }}
            />

            <Autocomplete
              options={availableSourceAccounts}
              getOptionLabel={(account: Account) =>
                account.accountNameOwner || ""
              }
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
              getOptionLabel={(account: Account) =>
                account.accountNameOwner || ""
              }
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

            <TextField
              label="Amount"
              fullWidth
              margin="normal"
              type="text"
              value={transferData?.amount ?? ""}
              onChange={(e) => {
                const inputValue = e.target.value;

                // Regular expression to allow only numbers with up to 2 decimal places
                const regex = /^\d*\.?\d{0,2}$/;

                if (regex.test(inputValue) || inputValue === "") {
                  setTransferData((prev: any) => ({
                    ...prev,
                    amount: inputValue, // Store as string to allow proper input control
                  }));
                }
              }}
              onBlur={() => {
                // Ensure value is properly formatted when user leaves the field
                setTransferData((prev: any) => ({
                  ...prev,
                  amount: prev.amount
                    ? parseFloat(Number(prev.amount).toFixed(2))
                    : "",
                }));
              }}
              slotProps={{
                input: {
                  inputMode: "decimal",
                },
              }}
            />

            <Button
              variant="contained"
              onClick={() => transferData && handleAddRow(transferData)}
            >
              Add
            </Button>
          </Paper>
        </Modal>
      </FinanceLayout>
    </div>
  );
}
