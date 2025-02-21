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
import useFetchPayment from "../../hooks/usePaymentFetch";
import usePaymentInsert from "../../hooks/usePaymentInsert";
import usePaymentDelete from "../../hooks/usePaymentDelete";
import Payment from "../../model/Payment";
import { formatDate } from "../../components/Common";
import useAccountFetch from "../../hooks/useAccountFetch";
import Account from "../../model/Account";
import usePaymentUpdate from "../../hooks/usePaymentUpdate";
import useParameterFetch from "../../hooks/useParameterFetch";
import Link from "next/link";

export default function Payments() {
  const [message, setMessage] = useState("");
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [showSpinner, setShowSpinner] = useState(true);
  const [showModalAdd, setShowModalAdd] = useState(false);
  const [paymentData, setPaymentData] = useState<Payment | null>(null);
  const [showModalDelete, setShowModalDelete] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);

  const {
    data: fetchedPayments,
    isSuccess: isSuccessPayments,
    error: errorPayments,
  } = useFetchPayment();
  const {
    data: fetchedAccounts,
    isSuccess: isSuccessAccounts,
    isFetching: isFetchingAccounts,
    error: errorAccounts,
  } = useAccountFetch();

  const {
    data: fetchedParameters,
    isSuccess: isSuccessParameters,
    isFetching: isFetchingParameters,
    error: errorParameters,
  } = useParameterFetch();

  const { mutateAsync: insertPayment } = usePaymentInsert();
  const { mutateAsync: deletePayment } = usePaymentDelete();
  const { mutateAsync: updatePayment } = usePaymentUpdate();

  useEffect(() => {
    if( isFetchingAccounts || isFetchingParameters) {
      setShowSpinner(true);
      return;
    }
    if (isSuccessPayments && isSuccessAccounts && isSuccessParameters) {
      setShowSpinner(false);
    } else if (errorPayments || errorAccounts || errorParameters) {
      setShowSpinner(false);
      setMessage("Error fetching data.");
      setShowSnackbar(true);
    }
  }, [
    isSuccessPayments,
    isSuccessAccounts,
    isSuccessParameters,
    errorParameters,
    errorPayments,
    errorAccounts,
    isFetchingAccounts,
    isFetchingParameters
  ]);

  const defaultPaymentMethod =
    fetchedParameters?.find(
      (param) => param.parameterName === "payment_account",
    )?.parameterValue || "";

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
    const errorMessage = error.message
      ? `${moduleName}: ${error.message}`
      : `${moduleName}: Failure`;

    setMessage(errorMessage);
    setShowSnackbar(true);

    console.error(errorMessage);

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
      field: "sourceAccount",
      headerName: "Source Account",
      width: 350,
      renderCell: (params) => {
        return (
          <Link href={`/finance/transactions/${defaultPaymentMethod}`}>
            {defaultPaymentMethod}
          </Link>
        );
      },
    },
    {
      field: "accountNameOwner",
      headerName: "Destination Account",
      width: 350,
      renderCell: (params) => {
        return (
          <Link href={`/finance/transactions/${params.row.accountNameOwner}`}>
            {params.value}
          </Link>
        );
      },
    },

    {
      field: "amount",
      headerName: "Amount",
      width: 150,
      type: "number",
      editable: true,
      renderEditCell: (params) => {
        const value = params.value || "";
        return (
          <TextField
            type="number"
            value={value}
            onChange={(event) => {
              const newValue = event.target.value;
              let parsedValue = newValue === "" ? null : parseFloat(newValue);

              if (parsedValue !== null) {
                parsedValue = parseFloat(parsedValue.toFixed(2));
              }
              params.api.setEditCellValue({
                id: params.id,
                field: params.field,
                value: parsedValue,
              });
            }}
          />
        );
      },
      valueFormatter: (params: any) => {
        const value = params;
        if (value === undefined || value === null) {
          return "";
        }
        return value.toLocaleString("en-US", {
          style: "currency",
          currency: "USD",
        });
      },
    },
    {
      field: "",
      headerName: "Actions",
      width: 100,
      renderCell: (params: any) => (
        <Tooltip title="delete this row">
          <IconButton
            onClick={() => {
              setSelectedPayment(params.row);
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
      <h2>Payment Details</h2>
      {showSpinner ? (
        <Spinner />
      ) : (
        <div>
          <IconButton onClick={() => setShowModalAdd(true)}>
            <AddIcon />
          </IconButton>
          <DataGrid
            rows={fetchedPayments?.filter((row) => row != null) || []}
            columns={columns}
            getRowId={(row) => row.paymentId || `temp-${Math.random()}`}
            checkboxSelection={false}
            rowSelection={false}
            processRowUpdate={async (
              newRow: Payment,
              oldRow: Payment,
            ): Promise<Payment> => {
              if (JSON.stringify(newRow) === JSON.stringify(oldRow)) {
                return oldRow;
              }
              try {
                await updatePayment({ oldPayment: oldRow, newPayment: newRow });
                setMessage("Payment updated successfully.");
                setShowSnackbar(true);
                //return newRow;
                return { ...newRow };
              } catch (error) {
                handleError(error, `Update Payment error: ${error}`, false);
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

      {/* Modal to Add or Edit */}
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
          <h3>Add New Payment</h3>
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
            slotProps={{
              inputLabel: { shrink: true },
            }}
          />

          <Autocomplete
            options={
              isSuccessAccounts
                ? fetchedAccounts.filter(
                    (account) => account.accountType === "credit",
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
              paymentData?.accountNameOwner && isSuccessAccounts
                ? fetchedAccounts.find(
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
                label="Destination Account"
                fullWidth
                margin="normal"
                placeholder="Select or search an account"
              />
            )}
          />

          <TextField
            label="Amount"
            fullWidth
            margin="normal"
            type="text"
            value={paymentData?.amount ?? ""}
            onChange={(e) => {
              const inputValue = e.target.value;

              // Regular expression to allow only numbers with up to 2 decimal places
              const regex = /^\d*\.?\d{0,2}$/;

              if (regex.test(inputValue) || inputValue === "") {
                setPaymentData((prev: any) => ({
                  ...prev,
                  amount: inputValue, // Store as string to allow proper input control
                }));
              }
            }}
            onBlur={() => {
              // Ensure value is properly formatted when user leaves the field
              setPaymentData((prev: any) => ({
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
            value={paymentData?.amount ?? ""}
            onChange={(e) => {
              const inputValue = e.target.value;
              let parsedValue =
                inputValue === "" ? null : parseFloat(inputValue);

              if (parsedValue !== null) {
                parsedValue = parseFloat(parsedValue.toFixed(2)); // Round to 2 decimals
              }
              setPaymentData((prev) => ({
                ...prev,
                amount: parsedValue,
              }));
            }}
          /> */}
          <Button
            variant="contained"
            onClick={() => paymentData && handleAddRow(paymentData)}
          >
            Add
          </Button>
        </Box>
      </Modal>
    </div>
  );
}
