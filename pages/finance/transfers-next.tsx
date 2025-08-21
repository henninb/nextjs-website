import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { GridColDef } from "@mui/x-data-grid";
import {
  Box,
  Button,
  IconButton,
  Tooltip,
  Link,
  TextField,
  Autocomplete,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import FinanceLayout from "../../layouts/FinanceLayout";
import PageHeader from "../../components/PageHeader";
import DataGridBase from "../../components/DataGridBase";
import ConfirmDialog from "../../components/ConfirmDialog";
import FormDialog from "../../components/FormDialog";
import LoadingState from "../../components/LoadingState";
import EmptyState from "../../components/EmptyState";
import ErrorDisplay from "../../components/ErrorDisplay";
import SnackbarBaseline from "../../components/SnackbarBaseline";
import USDAmountInput from "../../components/USDAmountInput";
import { useAuth } from "../../components/AuthProvider";
import {
  currencyFormat,
  normalizeTransactionDate,
  formatDateForInput,
  formatDateForDisplay,
} from "../../components/Common";

import Transfer from "../../model/Transfer";
import Account from "../../model/Account";

import useTransferFetchGql from "../../hooks/useTransferFetchGql";
import useTransferInsertGql from "../../hooks/useTransferInsertGql";
import useTransferDeleteGql from "../../hooks/useTransferDeleteGql";
import useTransferUpdateGql from "../../hooks/useTransferUpdateGql";
import useAccountFetchGql from "../../hooks/useAccountFetchGql";

export default function TransfersNextGen() {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();

  const [message, setMessage] = useState("");
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [showSpinner, setShowSpinner] = useState(true);
  const [showModalAdd, setShowModalAdd] = useState(false);
  const [showModalDelete, setShowModalDelete] = useState(false);
  const [paginationModel, setPaginationModel] = useState({ pageSize: 50, page: 0 });

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

  const [selectedTransfer, setSelectedTransfer] = useState<Transfer | null>(null);
  const [availableSourceAccounts, setAvailableSourceAccounts] = useState<Account[]>([]);
  const [availableDestinationAccounts, setAvailableDestinationAccounts] = useState<Account[]>([]);
  const [selectedSourceAccount, setSelectedSourceAccount] = useState<Account | null>(null);
  const [selectedDestinationAccount, setSelectedDestinationAccount] = useState<Account | null>(null);

  const { data: fetchedAccounts, isSuccess: isSuccessAccounts, isFetching: isFetchingAccounts, error: errorAccounts, refetch: refetchAccounts } = useAccountFetchGql();
  const { data: fetchedTransfers, isSuccess: isSuccessTransfers, isFetching: isFetchingTransfers, error: errorTransfers, refetch: refetchTransfers } = useTransferFetchGql();

  const { mutateAsync: insertTransfer } = useTransferInsertGql();
  const { mutateAsync: deleteTransfer } = useTransferDeleteGql();
  const { mutateAsync: updateTransfer } = useTransferUpdateGql();

  const transfersToDisplay = fetchedTransfers?.filter((row) => row != null) || [];

  useEffect(() => {
    if (loading) {
      setShowSpinner(true);
    }
    if (!loading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [loading, isAuthenticated, router]);

  useEffect(() => {
    if (isFetchingAccounts || isFetchingTransfers || loading || (!loading && !isAuthenticated)) {
      setShowSpinner(true);
      return;
    }
    if (isSuccessTransfers && isSuccessAccounts) {
      setShowSpinner(false);
    }
  }, [isSuccessTransfers, isSuccessAccounts, errorTransfers, errorAccounts, isFetchingAccounts, isFetchingTransfers, loading, isAuthenticated]);

  useEffect(() => {
    if (isSuccessAccounts) {
      setAvailableSourceAccounts(fetchedAccounts.filter((a) => a.accountType === "debit"));
      setAvailableDestinationAccounts(fetchedAccounts.filter((a) => a.accountType === "debit"));
    }
  }, [isSuccessAccounts, fetchedAccounts]);

  useEffect(() => {
    if (selectedSourceAccount) {
      setAvailableDestinationAccounts(
        (fetchedAccounts || []).filter(
          (a) => a.accountType === "debit" && a.accountNameOwner !== selectedSourceAccount.accountNameOwner,
        ),
      );
    } else if (isSuccessAccounts) {
      setAvailableDestinationAccounts((fetchedAccounts || []).filter((a) => a.accountType === "debit"));
    }
  }, [selectedSourceAccount, isSuccessAccounts, fetchedAccounts]);

  useEffect(() => {
    if (selectedDestinationAccount) {
      setAvailableSourceAccounts(
        (fetchedAccounts || []).filter(
          (a) => a.accountType === "debit" && a.accountNameOwner !== selectedDestinationAccount.accountNameOwner,
        ),
      );
    } else if (isSuccessAccounts) {
      setAvailableSourceAccounts((fetchedAccounts || []).filter((a) => a.accountType === "debit"));
    }
  }, [selectedDestinationAccount, isSuccessAccounts, fetchedAccounts]);

  const handleSourceAccountChange = (_e: any, newValue: Account | null) => {
    setSelectedSourceAccount(newValue);
    setTransferData((prev) => ({ ...prev, sourceAccount: newValue ? newValue.accountNameOwner : "" }));
  };

  const handleDestinationAccountChange = (_e: any, newValue: Account | null) => {
    setSelectedDestinationAccount(newValue);
    setTransferData((prev) => ({ ...prev, destinationAccount: newValue ? newValue.accountNameOwner : "" }));
  };

  const handleDeleteRow = async () => {
    if (selectedTransfer) {
      try {
        await deleteTransfer({ oldRow: selectedTransfer });
        const when = formatDateForDisplay(selectedTransfer.transactionDate);
        const amt = currencyFormat(selectedTransfer.amount);
        setMessage(`Transfer deleted: ${amt} from ${selectedTransfer.sourceAccount} to ${selectedTransfer.destinationAccount} on ${when}.`);
        setShowSnackbar(true);
      } catch (error: any) {
        handleError(error, `Delete Transfer error: ${error}`, false);
      } finally {
        setShowModalDelete(false);
        setSelectedTransfer(null);
      }
    }
  };

  const handleError = (error: any, moduleName: string, throwIt: boolean) => {
    const errorMessage = error?.message ? `${moduleName}: ${error.message}` : `${moduleName}: Failure`;
    setMessage(errorMessage);
    setShowSnackbar(true);
    console.error(errorMessage);
    if (throwIt) throw error;
  };

  const handleAddRow = async (newData: Transfer) => {
    try {
      await insertTransfer({ payload: newData });
      const when = formatDateForDisplay(newData.transactionDate);
      setMessage(`Transferred ${currencyFormat(newData.amount)} from ${newData.sourceAccount} to ${newData.destinationAccount} on ${when}.`);
      setShowSnackbar(true);
      setShowSpinner(false);
      setShowModalAdd(false);
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
    } catch (error: any) {
      handleError(error, `Add Transfer error: ${error}`, false);
    }
  };

  const columns: GridColDef[] = [
    {
      field: "transactionDate",
      headerName: "Date",
      flex: 0.8,
      minWidth: 120,
      headerAlign: "left",
      align: "left",
      renderCell: (params) => formatDateForDisplay(params.value),
      valueGetter: (params: string) => normalizeTransactionDate(params),
    },
    {
      field: "sourceAccount",
      headerName: "Source Account",
      flex: 2,
      minWidth: 200,
      renderCell: (params) => (
        <Link href={`/finance/transactions/${params.row.sourceAccount}`}>{params.value}</Link>
      ),
    },
    {
      field: "destinationAccount",
      headerName: "Destination Account",
      flex: 2,
      minWidth: 200,
      renderCell: (params) => (
        <Link href={`/finance/transactions/${params.row.destinationAccount}`}>{params.value}</Link>
      ),
    },
    {
      field: "amount",
      headerName: "Amount",
      flex: 0.6,
      minWidth: 120,
      headerAlign: "right",
      align: "right",
      editable: true,
      renderCell: (params) => currencyFormat(params.value),
    },
    {
      field: "",
      headerName: "Actions",
      width: 100,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Tooltip title="Delete this row">
          <IconButton
            aria-label="Delete this row"
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

  if (errorTransfers || errorAccounts) {
    return (
      <FinanceLayout>
        <PageHeader title="Transfer Management (Next‑Gen)" subtitle="GraphQL-powered transfers between accounts" />
        <ErrorDisplay
          error={errorTransfers || errorAccounts}
          variant="card"
          showRetry
          onRetry={() => {
            if (errorTransfers) refetchTransfers();
            if (errorAccounts) refetchAccounts();
          }}
        />
      </FinanceLayout>
    );
  }

  return (
    <div>
      <FinanceLayout>
        <PageHeader
          title="Transfer Management (Next‑Gen)"
          subtitle="GraphQL-powered transfers between accounts"
          actions={
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setShowModalAdd(true)}>
              Add Transfer
            </Button>
          }
        />
        {showSpinner ? (
          <LoadingState variant="card" message="Loading transfers and accounts..." />
        ) : transfersToDisplay && transfersToDisplay.length > 0 ? (
          <Box display="flex" justifyContent="center">
            <Box sx={{ width: "100%", maxWidth: "1200px" }}>
              <DataGridBase
                rows={transfersToDisplay}
                columns={columns}
                getRowId={(row: any) => row.transferId ?? `${row.sourceAccount}-${row.destinationAccount}-${row.amount}-${row.transactionDate}`}
                checkboxSelection={false}
                rowSelection={false}
                paginationModel={paginationModel}
                onPaginationModelChange={(m) => setPaginationModel(m)}
                pageSizeOptions={[25, 50, 100]}
                processRowUpdate={async (newRow: Transfer, oldRow: Transfer): Promise<Transfer> => {
                  if (JSON.stringify(newRow) === JSON.stringify(oldRow)) return oldRow;
                  try {
                    await updateTransfer({ oldTransfer: oldRow, newTransfer: newRow });
                    const when = formatDateForDisplay(newRow.transactionDate);
                    setMessage(`Transfer updated: ${currencyFormat(newRow.amount)} from ${newRow.sourceAccount} to ${newRow.destinationAccount} on ${when}.`);
                    setShowSnackbar(true);
                    return { ...newRow };
                  } catch (error: any) {
                    handleError(error, `Update Transfer error: ${error}`, false);
                    return oldRow;
                  }
                }}
                autoHeight
                disableColumnResize={false}
                sx={{
                  "& .MuiDataGrid-cell": {
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  },
                }}
              />
            </Box>
          </Box>
        ) : (
          <EmptyState
            title="No Transfers Found"
            message="Create your first transfer to move funds between accounts."
            actionLabel="Add Transfer"
            onAction={() => setShowModalAdd(true)}
            variant="create"
            dataType="transfers"
          />
        )}

        <ConfirmDialog
          open={showModalDelete}
          title="Delete Transfer?"
          message={`Are you sure you want to delete transfer ${selectedTransfer?.transferId ?? ""}? This cannot be undone.`}
          onClose={() => setShowModalDelete(false)}
          onConfirm={handleDeleteRow}
          confirmText="Delete"
          cancelText="Cancel"
        />

        <SnackbarBaseline
          message={message}
          state={showSnackbar}
          handleSnackbarClose={() => setShowSnackbar(false)}
          severity="success"
        />

        <FormDialog
          open={showModalAdd}
          onClose={() => setShowModalAdd(false)}
          onSubmit={() => handleAddRow(transferData)}
          title={transferData?.amount && parseFloat(String(transferData.amount)) > 0 ? `Transfer ${currencyFormat(transferData.amount)}` : "Add Transfer"}
          submitText={transferData?.amount && parseFloat(String(transferData.amount)) > 0 ? `Transfer ${currencyFormat(transferData.amount)}` : "Add Transfer"}
        >
          <TextField
            label="Transaction Date"
            fullWidth
            margin="normal"
            type="date"
            value={formatDateForInput(transferData?.transactionDate || new Date())}
            onChange={(e) => {
              const normalizedDate = normalizeTransactionDate(e.target.value);
              setTransferData((prev: any) => ({ ...prev, transactionDate: normalizedDate }));
            }}
            slotProps={{ inputLabel: { shrink: true } }}
          />

          <Autocomplete
            options={availableSourceAccounts}
            getOptionLabel={(a: Account) => a.accountNameOwner || ""}
            isOptionEqualToValue={(o, v) => o.accountNameOwner === v?.accountNameOwner}
            value={selectedSourceAccount}
            onChange={handleSourceAccountChange}
            renderInput={(params) => (
              <TextField {...params} label="Source Account" fullWidth margin="normal" placeholder="Select a source account" />
            )}
          />

          <Autocomplete
            options={availableDestinationAccounts}
            getOptionLabel={(a: Account) => a.accountNameOwner || ""}
            isOptionEqualToValue={(o, v) => o.accountNameOwner === v?.accountNameOwner}
            value={selectedDestinationAccount}
            onChange={handleDestinationAccountChange}
            renderInput={(params) => (
              <TextField {...params} label="Destination Account" fullWidth margin="normal" placeholder="Select a destination account" />
            )}
          />

          <USDAmountInput
            label="Amount"
            value={transferData?.amount ? transferData.amount : ""}
            onChange={(value) => setTransferData((prev: any) => ({ ...prev, amount: value }))}
            onBlur={() => {
              const currentValue = parseFloat(String(transferData?.amount || ""));
              if (!isNaN(currentValue)) {
                setTransferData((prev: any) => ({ ...prev, amount: Number(currentValue.toFixed(2)) }));
              }
            }}
            fullWidth
            margin="normal"
          />
        </FormDialog>
      </FinanceLayout>
    </div>
  );
}
