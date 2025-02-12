import { useState, useEffect } from "react";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import {
  Box,
  Button,
  IconButton,
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
  const [transferData, setTransferData] = useState<Transfer | null>(null);
  const [selectedTransfer, setSelectedTransfer] = useState<Transfer | null>(
    null,
  );

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
        <IconButton
          onClick={() => {
            setSelectedTransfer(params.row);
            setShowModalDelete(true);
          }}
        >
          <DeleteIcon />
        </IconButton>
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
              try {
                await updateTransfer({
                  oldTransfer: oldRow,
                  newTransfer: newRow,
                });
                setMessage("Transfer updated successfully.");
                setShowSnackbar(true);
                return newRow;
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
            options={
              isSuccessAccounts
                ? fetchedAccounts.filter(
                    (account) => account.accountType === "debit",
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
              transferData?.sourceAccount && isSuccessAccounts
                ? fetchedAccounts.find(
                    (account) =>
                      account.accountNameOwner === transferData.sourceAccount,
                  ) || null
                : null
            }
            onChange={(event, newValue) =>
              setTransferData((prev) => ({
                ...prev,
                sourceAccount: newValue ? newValue.accountNameOwner : "",
              }))
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="SourceAccount"
                fullWidth
                margin="normal"
                placeholder="Select a source account"
              />
            )}
          />

          <Autocomplete
            options={
              isSuccessAccounts
                ? fetchedAccounts.filter(
                    (account) => account.accountType === "debit",
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
              transferData?.destinationAccount && isSuccessAccounts
                ? fetchedAccounts.find(
                    (account) =>
                      account.accountNameOwner ===
                      transferData.destinationAccount,
                  ) || null
                : null
            }
            onChange={(event, newValue) =>
              setTransferData((prev) => ({
                ...prev,
                destinationAccount: newValue ? newValue.accountNameOwner : "",
              }))
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="DestinationAccount"
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
          />
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
