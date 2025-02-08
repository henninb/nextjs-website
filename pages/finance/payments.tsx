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
import useFetchPayment from "../../hooks/usePaymentFetch";
import usePaymentInsert from "../../hooks/usePaymentInsert";
import usePaymentDelete from "../../hooks/usePaymentDelete";
import Payment from "../../model/Payment";
import { formatDate } from "../../components/Common";
import useAccountFetch from "../../hooks/useAccountFetch";
import Account from "../../model/Account";
import usePaymentUpdate from "../../hooks/usePaymentUpdate";

export default function payments() {
  const [message, setMessage] = useState("");
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [showSpinner, setShowSpinner] = useState(true);
  const [showModalAdd, setShowModalAdd] = useState(false);
  const [paymentData, setPaymentData] = useState<Payment | null>(null);
  const [showModalDelete, setShowModalDelete] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const router = useRouter();

  const { data, isSuccess } = useFetchPayment();
  const { data: accounts, isSuccess: isSuccessAccounts } = useAccountFetch();

  const { mutateAsync: insertPayment } = usePaymentInsert();
  const { mutateAsync: deletePayment } = usePaymentDelete();
  const { mutateAsync: updatePayment } = usePaymentUpdate();

  useEffect(() => {
    if (isSuccess && isSuccessAccounts) {
      setShowSpinner(false);
    }
  }, [isSuccess, isSuccessAccounts]);

  const handleButtonClickLink = (accountNameOwner: string) => {
    router.push(`/finance/transactions/${accountNameOwner}`);
  };

  const handleDeleteRow = async () => {
    if (selectedPayment) {
      try {
        await deletePayment({ oldRow: selectedPayment });
        setMessage("Payment deleted successfully.");
        setShowSnackbar(true);
      } catch (error) {
        handleError(error, `Delete Payment error: ${error}`, false);
      } finally {
        setShowModalDelete(false);
        setSelectedPayment(null);
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

  const handleAddRow = async (newData: Payment) => {
    try {
      await insertPayment({ payload: newData });
      setShowModalAdd(false);
      setMessage("Payment Added successfully.");
      setShowSnackbar(true);
    } catch (error) {
      handleError(error, `Add Payment error: ${error}`, false);
    }
  };

  const columns: GridColDef[] = [
    {
      field: "transactionDate",
      headerName: "Transaction Date",
      width: 175,
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
      field: "accountNameOwner",
      headerName: "Destination Account",
      width: 350,
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
      editable: true,
      valueFormatter: (params: number) =>
        params.toLocaleString("en-US", {
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
            setSelectedPayment(params.row);
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
      <h2>Payment Details</h2>
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
            getRowId={(row) => row.paymentId || `temp-${Math.random()}`}
            checkboxSelection={false}
            rowSelection={false}
            processRowUpdate={async (newRow, oldRow) => {
              try {
                await updatePayment({ oldPayment: oldRow, newPayment: newRow });
                setMessage("Payment updated successfully.");
                setShowSnackbar(true);
                return newRow;
              } catch (error) {
                handleError(error, `Update Payment error: ${error}`, false);
                return oldRow;
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
            Are you sure you want to delete the payment "
            {selectedPayment?.paymentId}"?
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
          <h3>{paymentData ? "Edit Payment" : "Add New Payment"}</h3>
          <Autocomplete
            options={
              isSuccessAccounts
                ? accounts.filter((account) => account.accountType === "credit")
                : []
            }
            getOptionLabel={(account: Account) =>
              account.accountNameOwner || ""
            }
            isOptionEqualToValue={(option, value) =>
              option.accountNameOwner === value?.accountNameOwner
            }
            value={
              paymentData?.accountNameOwner
                ? accounts.find(
                    (account) =>
                      account.accountNameOwner === paymentData.accountNameOwner,
                  ) || null
                : null
            }
            onChange={(event, newValue) =>
              setPaymentData((prev) => ({
                ...prev,
                accountNameOwner: newValue ? newValue.accountNameOwner : "",
              }))
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Account"
                fullWidth
                margin="normal"
                placeholder="Select or search an account"
              />
            )}
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
            onClick={() => paymentData && handleAddRow(paymentData)}
          >
            {paymentData ? "Update" : "Add"}
          </Button>
        </Box>
      </Modal>
    </div>
  );
}
