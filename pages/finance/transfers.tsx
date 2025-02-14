import { useState, useEffect } from "react";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import {
  Box,
  Button,
  IconButton,
  Tooltip,
  Modal,
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
import Link from "next/link";

export default function Transfers() {
  const [message, setMessage] = useState("");
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [showSpinner, setShowSpinner] = useState(true);
  const [showModalAdd, setShowModalAdd] = useState(false);
  const [showModalDelete, setShowModalDelete] = useState(false);

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
    error: errorAccounts,
  } = useAccountFetch();
  const {
    data: fetchedTransfers,
    isSuccess: isSuccessTransfers,
    error: errorTransfers,
  } = useFetchTransfer();

  const dummyTransfers: Transfer[] = [
    {
      transferId: 1,
      sourceAccount: "barclays-savings_brian",
      destinationAccount: "wellsfargo-savings_kari",
      transactionDate: new Date("2025-01-04"),
      amount: 3.0,
      guidSource: "00a8a750-cc3d-4c24-9263-c85af59cab64",
      guidDestination: "00a8a750-cc3d-4c24-9263-c85af59cab64",
      activeStatus: true,
    },
    {
      transferId: 2,
      sourceAccount: "barclays-savings_brian",
      destinationAccount: "wellsfargo-savings_kari",
      transactionDate: new Date("2025-01-04"),
      amount: 2.0,
      guidSource: "00a8a750-cc3d-4c24-9263-c85af59cab64",
      guidDestination: "00a8a750-cc3d-4c24-9263-c85af59cab64",
      activeStatus: true,
    },
  ];

  const transfersToDisplay = errorTransfers
    ? dummyTransfers
    : fetchedTransfers?.filter((row) => row != null) || [];
  //const transfersToDisplay = fetchedTransfers || [];

  useEffect(() => {
    if (isSuccessTransfers && isSuccessAccounts) {
      setShowSpinner(false);
    } else if (errorTransfers || errorAccounts) {
      setShowSpinner(false);
      setMessage("Error fetching data.");
      setShowSnackbar(true);
    }
  }, [isSuccessTransfers, isSuccessAccounts, errorTransfers, errorAccounts]);

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
    const errorMessage = error.response
      ? `${moduleName}: ${error.response.status} - ${JSON.stringify(
          error.response.data,
        )}`
      : `${moduleName}: Failure`;

    setMessage(errorMessage);
    setShowSnackbar(true);
    if (throwIt) throw error;
  };

  const handleAddRow = async (newData: Transfer) => {
    try {
      await insertTransfer({ payload: newData });
      setShowModalAdd(false);
      setMessage("Transfer inserted Successfully.");
      setShowSpinner(false);
      setTransferData(null);
    } catch (error) {
      handleError(error, `Add Transfer error: ${error}`, false);
    }
  };

  const columns: GridColDef[] = [
    {
      field: "transactionDate",
      headerName: "Transaction Date",
      width: 200,
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
      renderCell: (params) =>
        params.value?.toLocaleString("en-US", {
          style: "currency",
          currency: "USD",
        }),
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
      <h2>Transfer Details</h2>
      {showSpinner ? (
        <Spinner />
      ) : (
        <div>
          <IconButton onClick={() => setShowModalAdd(true)}>
            <AddIcon />
          </IconButton>
          <DataGrid
            //rows={fetchedTransfers?.filter((row) => row != null) || []}
            rows={transfersToDisplay}
            columns={columns}
            getRowId={(row) => row.transferId || `temp-${Math.random()}`}
            checkboxSelection={false}
            rowSelection={false}
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
                handleError(error, `Update Transfer error: ${error}`, false);
                throw error;
              }
            }}
          />
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
        </Box>
      </Modal>

      {/* Modal to add or update a transaction */}
      <Modal open={showModalAdd} onClose={() => setShowModalAdd(false)}>
        <Box
          sx={{
            width: 400,
            padding: 4,
            backgroundColor: "white",
            margin: "auto",
            marginTop: "20%",
          }}
        >
          <h3>{transferData ? "Edit Transfer" : "Add New Transfer"}</h3>

          <TextField
            label="Transaction Date"
            fullWidth
            margin="normal"
            type="date"
            value={transferData?.transactionDate || ""}
            onChange={(e) =>
              setTransferData((prev: any) => ({
                ...prev,
                transactionDate: e.target.value,
              }))
            }
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

          {/* <TextField
            label="Amount"
            fullWidth
            margin="normal"
            type="number"
            value={transferData?.amount ?? ""}
            onChange={(e) => {
              const inputValue = e.target.value;
              let parsedValue =
                inputValue === "" ? null : parseFloat(inputValue);

              if (parsedValue !== null) {
                parsedValue = parseFloat(parsedValue.toFixed(2)); // Round to 2 decimals
              }
              setTransferData((prev) => ({
                ...prev,
                amount: parsedValue,
              }));
            }}
          /> */}
          <Button
            variant="contained"
            onClick={() => transferData && handleAddRow(transferData)}
          >
            {transferData ? "Update" : "Add"}
          </Button>
        </Box>
      </Modal>
    </div>
  );
}
