import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { Box, Button, IconButton, Modal, TextField, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import Spinner from "../../components/Spinner";
import SnackbarBaseline from "../../components/SnackbarBaseline";
import useFetchTransfer from "../../hooks/useTransferFetch";
import useTransferInsert from "../../hooks/useTransferInsert";
import useTransferDelete from "../../hooks/useTransferDelete";
import Transfer from "../../model/Transfer";
import { formatDate } from "../../components/Common";

export default function transfers() {
  const [message, setMessage] = useState("");
  const [open, setOpen] = useState(false);
  const [showSpinner, setShowSpinner] = useState(true);
  const [openForm, setOpenForm] = useState(false);
  const [transferData, setTransferData] = useState<Transfer | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState<Transfer | null>(null);
  const router = useRouter();

  const { data, isSuccess, isLoading } = useFetchTransfer();
  const { mutate: insertTransfer } = useTransferInsert();
  const { mutate: deleteTransfer } = useTransferDelete();

  useEffect(() => {
    if (isSuccess) {
      setShowSpinner(false);
    }
  }, [isSuccess]);

  const handleButtonClickLink = (accountNameOwner: string) => {
    router.push(`/transactions/${accountNameOwner}`);
  };

  const handleDeleteRow = async () => {
    if (selectedTransfer) {
      try {
        await deleteTransfer({ oldRow:selectedTransfer });
        setMessage("Transfer deleted successfully.");
      } catch (error) {
        handleError(error, "Delete Transfer failure.", false);
      } finally {
        setConfirmDelete(false);
        setSelectedTransfer(null);
      }
    }
  };

  const handleSnackbarClose = () => {
    setOpen(false);
  };

  const handleError = (error: any, moduleName: string, throwIt: boolean) => {
    const errorMessage = error.response
      ? `${moduleName}: ${error.response.status} - ${JSON.stringify(
          error.response.data,
        )}`
      : `${moduleName}: Failure`;

    setMessage(errorMessage);
    setOpen(true);
    if (throwIt) throw error;
  };

  const addRow = async (newData: Transfer) => {
    try {
      await insertTransfer({ payload: newData });
      setOpenForm(false);
    } catch (error) {
      handleError(error, "Add Transfer", false);
    }
  };

  const columns: GridColDef[] = [
    {
      field: "transactionDate",
      headerName: "Transaction Date",
      width: 200,
      valueGetter: (params) => new Date(params),
      renderCell: (params) => {
        return formatDate(params.value);
      },
    },
    {
      field: "sourceAccount",
      headerName: "Source Account",
      width: 200,
      editable: true,
    },
    {
      field: "destinationAccount",
      headerName: "Destination Account",
      width: 200,
      editable: true,
    },

    {
      field: "amount",
      headerName: "Amount",
      width: 150,
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
            setConfirmDelete(true);
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
          <IconButton onClick={() => setOpenForm(true)}>
            <AddIcon />
          </IconButton>
          <DataGrid
            rows={data?.filter((row) => row != null) || []}
            columns={columns}
            getRowId={(row) => row.transferId || 0}
            checkboxSelection={false}
            rowSelection={false}
          />
          <div>
            <SnackbarBaseline
              message={message}
              state={open}
              handleSnackbarClose={handleSnackbarClose}
            />
          </div>
        </div>
      )}


      {/* Confirmation Delete Modal */}
      <Modal open={confirmDelete} onClose={() => setConfirmDelete(false)}>
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
            <Button variant="contained" color="primary" onClick={handleDeleteRow}>
              Delete
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              onClick={() => setConfirmDelete(false)}
            >
              Cancel
            </Button>
          </Box>
        </Box>
      </Modal>

      <Modal open={openForm} onClose={() => setOpenForm(false)}>
        <Box
          sx={{
            width: 400,
            padding: 4,
            backgroundColor: "white",
            margin: "auto",
          }}
        >
          <h3>{transferData ? "Edit Transfer" : "Add New Transfer"}</h3>
          <TextField
            label="Source Account"
            fullWidth
            margin="normal"
            value={transferData?.sourceAccount || ""}
            onChange={(e) =>
              setTransferData((prev) => ({
                ...prev,
                sourceAccount: e.target.value,
              }))
            }
          />
          <TextField
            label="DestinationAccount"
            fullWidth
            margin="normal"
            value={transferData?.destinationAccount || ""}
            onChange={(e) =>
              setTransferData((prev) => ({
                ...prev,
                destinationAccount: e.target.value,
              }))
            }
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
            onClick={() => transferData && addRow(transferData)}
          >
            {transferData ? "Update" : "Add"}
          </Button>
        </Box>
      </Modal>
    </div>
  );
}
