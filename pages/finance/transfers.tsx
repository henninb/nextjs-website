import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { Box, Button, IconButton, Modal, TextField } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import Spinner from "../../components/Spinner";
import SnackbarBaseline from "../../components/SnackbarBaseline";
import useFetchTransfer from "../../hooks/useTransferFetch";
import useTransferInsert from "../../hooks/useTransferInsert";
import useTransferDelete from "../../hooks/useTransferDelete";
import Transfer from "../../model/Transfer";

export default function transfers() {
  const [message, setMessage] = useState("");
  const [open, setOpen] = useState(false);
  const [showSpinner, setShowSpinner] = useState(true);
  const [openForm, setOpenForm] = useState(false);
  const [transferData, setTransferData] = useState<Transfer | null>(null);
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

  const handleDeleteRow = async (transfer: Transfer) => {
    try {
      await deleteTransfer({ oldRow: transfer });
    } catch (error) {
      handleError(error, "Delete Transfer", false);
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
      field: "sourceAccount",
      headerName: "Source Account",
      width: 200,
    },
    {
      field: "destinationAccount",
      headerName: "Destination Account",
      width: 200,
    },
    {
      field: "transactionDate",
      headerName: "Transaction Date",
      width: 200,
    },
    {
      field: "amount",
      headerName: "Amount",
      width: 150,
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
            handleDeleteRow(params.row);
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
            rows={data || []}
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
