import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { Box, Button, IconButton, Modal, TextField } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import Spinner from "../../components/Spinner";
import SnackbarBaseline from "../../components/SnackbarBaseline";
import useFetchPayment from "../../hooks/usePaymentFetch";
import usePaymentInsert from "../../hooks/usePaymentInsert";
import usePaymentDelete from "../../hooks/usePaymentDelete";
import Payment from "../../model/Payment";
import { formatDate } from "../../components/Common";

export default function payments() {
  const [message, setMessage] = useState("");
  const [open, setOpen] = useState(false);
  const [showSpinner, setShowSpinner] = useState(true);
  const [openForm, setOpenForm] = useState(false);
  const [paymentData, setPaymentData] = useState<Payment | null>(null);
  const router = useRouter();

  const { data, isSuccess, isLoading } = useFetchPayment();
  const { mutate: insertPayment } = usePaymentInsert();
  const { mutate: deletePayment } = usePaymentDelete();

  useEffect(() => {
    if (isSuccess) {
      setShowSpinner(false);
    }
  }, [isSuccess]);

  const handleButtonClickLink = (accountNameOwner: string) => {
    router.push(`/finance/transactions/${accountNameOwner}`);
  };

  const handleDeleteRow = async (payment: Payment) => {
    try {
      await deletePayment({ oldRow: payment });
    } catch (error) {
      handleError(error, "Delete Payment", false);
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

  const addRow = async (newData: Payment) => {
    try {
      await insertPayment({ payload: newData });
      setOpenForm(false);
    } catch (error) {
      handleError(error, "Add Payment", false);
    }
  };

  const columns: GridColDef[] = [
    {
      field: "transactionDate",
      headerName: "Transaction Date",
      width: 200,
      renderCell: (params) => {
        return formatDate(params.value);
      },
    },
    {
      field: "accountNameOwner",
      headerName: "Account",
      width: 200,
      renderCell: (params) => (
        <Button
          onClick={() => handleButtonClickLink(params.row.accountNameOwner)}
        >
          {params.row.accountNameOwner}
        </Button>
      ),
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
      renderCell: (params: any) => (
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
      <h2>Payment Details</h2>
      {showSpinner ? (
        <Spinner />
      ) : (
        <div>
          <IconButton onClick={() => setOpenForm(true)}>
            <AddIcon />
          </IconButton>
          <DataGrid
            rows={data?.filter(row => row != null) || []}
            columns={columns}
            getRowId={(row) => row.paymentId || 0}
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
          <h3>{paymentData ? "Edit Payment" : "Add New Payment"}</h3>
          <TextField
            label="Account Name Owner"
            fullWidth
            margin="normal"
            value={paymentData?.accountNameOwner || ""}
            onChange={(e) =>
              setPaymentData((prev) => ({
                ...prev,
                accountNameOwner: e.target.value,
              }))
            }
          />
          <TextField
            label="Transaction Date"
            fullWidth
            margin="normal"
            type="date"
            value={paymentData?.transactionDate || ""}
            onChange={(e) =>
              setPaymentData((prev: any) => ({
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
            value={paymentData?.amount ?? ""}
            onChange={(e) =>
              setPaymentData((prev) => ({
                ...prev,
                amount: parseFloat(e.target.value),
              }))
            }
          />
          <Button
            variant="contained"
            onClick={() => paymentData && addRow(paymentData)}
          >
            {paymentData ? "Update" : "Add"}
          </Button>
        </Box>
      </Modal>
    </div>
  );
}
