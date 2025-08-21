import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { GridColDef } from "@mui/x-data-grid";
import {
  Box,
  Button,
  IconButton,
  Tooltip,
  Link,
  TextField,
  Typography,
  Autocomplete,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import Spinner from "../../components/Spinner";
import SnackbarBaseline from "../../components/SnackbarBaseline";
import ErrorDisplay from "../../components/ErrorDisplay";
import EmptyState from "../../components/EmptyState";
import LoadingState from "../../components/LoadingState";
import USDAmountInput from "../../components/USDAmountInput";
import useFetchTransfer from "../../hooks/useTransferFetch";
import useTransferInsert from "../../hooks/useTransferInsert";
import useTransferDelete from "../../hooks/useTransferDelete";
import Transfer from "../../model/Transfer";
import useAccountFetch from "../../hooks/useAccountFetch";
import Account from "../../model/Account";
import useTransferUpdate from "../../hooks/useTransferUpdate";
import FinanceLayout from "../../layouts/FinanceLayout";
import PageHeader from "../../components/PageHeader";
import DataGridBase from "../../components/DataGridBase";
import ConfirmDialog from "../../components/ConfirmDialog";
import FormDialog from "../../components/FormDialog";
import { dummyTransfers } from "../../data/dummyTransfers";
import { generateSecureUUID } from "../../utils/security/secureUUID";
import {
  currencyFormat,
  normalizeTransactionDate,
  formatDateForInput,
  formatDateForDisplay,
} from "../../components/Common";
import { useAuth } from "../../components/AuthProvider";
import { modalTitles, modalBodies } from "../../utils/modalMessages";

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
    amount: 0.0,
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
    refetch: refetchAccounts,
  } = useAccountFetch();
  const {
    data: fetchedTransfers,
    isSuccess: isSuccessTransfers,
    isFetching: isFetchingTransfers,
    error: errorTransfers,
    refetch: refetchTransfers,
  } = useFetchTransfer();

  const transfersToDisplay =
    fetchedTransfers?.filter((row) => row != null) || [];
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
        const when = formatDateForDisplay(selectedTransfer.transactionDate);
        const amt = currencyFormat(selectedTransfer.amount);
        setMessage(
          `Transfer deleted: ${amt} from ${selectedTransfer.sourceAccount} to ${selectedTransfer.destinationAccount} on ${when}.`,
        );
        setShowSnackbar(true);
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
      const [guidDestination, guidSource] = await Promise.all([
        generateSecureUUID(),
        generateSecureUUID(),
      ]);

      const insertThisValue = {
        ...newData,
        guidDestination,
        guidSource,
      };
      console.log(`Transfer Insert: ${JSON.stringify(insertThisValue)}`);
      await insertTransfer({ payload: insertThisValue });
      setShowModalAdd(false);
      const when = formatDateForDisplay(newData.transactionDate);
      setMessage(
        `Transferred ${currencyFormat(newData.amount)} from ${newData.sourceAccount} to ${newData.destinationAccount} on ${when}.`,
      );
      setShowSnackbar(true);
      setShowSpinner(false);
      setTransferData({
        transferId: 0,
        sourceAccount: newData.sourceAccount,
        destinationAccount: newData.destinationAccount,
        transactionDate: newData.transactionDate,
        amount: 0.0,
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
      headerName: "Date",
      flex: 0.8,
      minWidth: 120,
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
      flex: 2,
      minWidth: 200,
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
      flex: 2,
      minWidth: 200,
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
      flex: 0.6,
      minWidth: 120,
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

  // Handle error states first
  if (errorTransfers || errorAccounts) {
    return (
      <FinanceLayout>
        <PageHeader
          title="Transfer Management"
          subtitle="Move funds between accounts with automated transaction creation and tracking"
        />
        <ErrorDisplay
          error={errorTransfers || errorAccounts}
          variant="card"
          showRetry={true}
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
          title="Transfer Management"
          subtitle="Move funds between accounts with automated transaction creation and tracking"
          actions={
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setShowModalAdd(true)}
              sx={{ backgroundColor: "primary.main" }}
            >
              Add Transfer
            </Button>
          }
        />
        {showSpinner ? (
          <LoadingState
            variant="card"
            message="Loading transfers and accounts..."
          />
        ) : (
          <div>
            <Box display="flex" justifyContent="center">
              <Box sx={{ width: "100%", maxWidth: "1200px" }}>
                {transfersToDisplay && transfersToDisplay.length > 0 ? (
                  <DataGridBase
                    //rows={fetchedTransfers?.filter((row) => row != null) || []}
                    rows={transfersToDisplay}
                    columns={columns}
                    getRowId={(row: any) =>
                      row.transferId ??
                      `${row.sourceAccount}-${row.destinationAccount}-${row.amount}-${row.transactionDate}`
                    }
                    checkboxSelection={false}
                    rowSelection={false}
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
                        const when = formatDateForDisplay(
                          newRow.transactionDate,
                        );
                        setMessage(
                          `Transfer updated: ${currencyFormat(newRow.amount)} from ${newRow.sourceAccount} to ${newRow.destinationAccount} on ${when}.`,
                        );
                        setShowSnackbar(true);
                        //return newRow;
                        return { ...newRow };
                      } catch (error) {
                        handleError(
                          error,
                          `Update Transfer error: ${error}`,
                          false,
                        );
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
                ) : (
                  <EmptyState
                    title="No Transfers Found"
                    message="No transfers have been created yet. Create your first transfer to move funds between accounts."
                    dataType="transfers"
                    variant="create"
                    actionLabel="Add Transfer"
                    onAction={() => setShowModalAdd(true)}
                    onRefresh={() => {
                      refetchTransfers();
                      refetchAccounts();
                    }}
                  />
                )}
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

        <ConfirmDialog
          open={showModalDelete}
          onClose={() => setShowModalDelete(false)}
          onConfirm={handleDeleteRow}
          title={modalTitles.confirmDeletion}
          message={modalBodies.confirmDeletion(
            "transfer",
            selectedTransfer?.transferId ?? "",
          )}
          confirmText="Delete"
          cancelText="Cancel"
        />

        {/* Modal to add a transaction */}
        <FormDialog
          open={showModalAdd}
          onClose={() => setShowModalAdd(false)}
          onSubmit={() => transferData && handleAddRow(transferData)}
          title={modalTitles.addNew("transfer")}
          submitText={
            transferData?.amount && parseFloat(String(transferData.amount)) > 0
              ? `Transfer ${currencyFormat(transferData.amount)}`
              : "Add Transfer"
          }
        >
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

          <USDAmountInput
            label="Amount"
            value={transferData?.amount ? transferData.amount : ""}
            onChange={(value) => {
              setTransferData((prev: any) => ({
                ...prev,
                amount: value,
              }));
            }}
            onBlur={() => {
              // Ensure value is properly formatted when user leaves the field
              const currentValue = parseFloat(
                String(transferData?.amount || ""),
              );
              if (!isNaN(currentValue)) {
                setTransferData((prev: any) => ({
                  ...prev,
                  amount: currentValue.toFixed(2),
                }));
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
