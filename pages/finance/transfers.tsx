import { useState, useEffect } from "react";
import { useRouter } from "next/router";
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
import { formatDate } from "../../components/Common";
import useAccountFetch from "../../hooks/useAccountFetch";
import Account from "../../model/Account";
import useTransferUpdate from "../../hooks/useTransferUpdate";

export default function transfers() {
  const [message, setMessage] = useState("");
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [showSpinner, setShowSpinner] = useState(true);
  const [showModalAdd, setShowModalAdd] = useState(false);
  const [transferData, setTransferData] = useState<Transfer | null>(null);
  const [showModalDelete, setShowModalDelete] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState<Transfer | null>(
    null,
  );
  const router = useRouter();

  const { data, isSuccess } = useFetchTransfer();
  const { mutateAsync: insertTransfer } = useTransferInsert();
  const { mutateAsync: deleteTransfer } = useTransferDelete();
  const { mutateAsync: updateTransfer } = useTransferUpdate();
  const { data: accounts, isSuccess: isSuccessAccounts } = useAccountFetch();

  useEffect(() => {
    if (isSuccess) {
      setShowSpinner(false);
    }
  }, [isSuccess]);

  const handleButtonClickLink = (accountNameOwner: string) => {
    router.push(`/finance/transactions/${accountNameOwner}`);
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
        //console.log("localDate: " + localDate);
        return localDate;
      },
      // valueGetter: (params) => new Date(params),
      // renderCell: (params) => {
      //   return formatDate(params.value);
      // },
    },
    {
      field: "sourceAccount",
      headerName: "Source Account",
      width: 300,
      renderCell: (params) => (
        <Button onClick={() => handleButtonClickLink(params.row.sourceAccount)}>
          {params.row.sourceAccount}
        </Button>
      ),
      //editable: true,
    },
    {
      field: "destinationAccount",
      headerName: "Destination Account",
      width: 300,
      renderCell: (params) => (
        <Button
          onClick={() => handleButtonClickLink(params.row.destinationAccount)}
        >
          {params.row.destinationAccount}
        </Button>
      ),
      //editable: true,
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
            rows={data?.filter((row) => row != null) || []}
            columns={columns}
            getRowId={(row) => row.transferId || 0}
            checkboxSelection={false}
            rowSelection={false}
            processRowUpdate={async (newRow: Transfer, oldRow: Transfer) => {
              try {
                await updateTransfer({
                  oldTransfer: oldRow,
                  newTransfer: newRow,
                });
                setMessage("Transfer updated successfully.");
                setShowSnackbar(true);
              } catch (error) {
                handleError(error, `Update Transfer error: ${error}`, false);
              }
              return newRow;
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
            {JSON.stringify(selectedTransfer)}"?
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

          <Autocomplete
            options={
              isSuccessAccounts
                ? accounts.filter((account) => account.accountType === "debit")
                : []
            }
            getOptionLabel={(account: Account) =>
              account.accountNameOwner || ""
            }
            isOptionEqualToValue={(option, value) =>
              option.accountNameOwner === value?.accountNameOwner
            }
            value={
              transferData?.sourceAccount
                ? accounts.find(
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
                ? accounts.filter((account) => account.accountType === "debit")
                : []
            }
            getOptionLabel={(account: Account) =>
              account.accountNameOwner || ""
            }
            isOptionEqualToValue={(option, value) =>
              option.accountNameOwner === value?.accountNameOwner
            }
            value={
              transferData?.destinationAccount
                ? accounts.find(
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
          />
          <TextField
            label="Amount"
            fullWidth
            margin="normal"
            type="number"
            slotProps={{
              htmlInput: {
                step: "0.01", // Allow decimal inputs
              },
            }}
            value={transferData?.amount ?? ""}
            onChange={(e) =>
              setTransferData((prev) => ({
                ...prev,
                amount: parseFloat(e.target.value),
              }))
            }
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
