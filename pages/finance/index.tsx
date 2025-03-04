import React, { useState, useEffect } from "react";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import {
  Box,
  Button,
  IconButton,
  Modal,
  Link,
  Paper,
  TextField,
  Typography,
  Autocomplete,
  Tooltip,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import Spinner from "../../components/Spinner";
import SnackbarBaseline from "../../components/SnackbarBaseline";
import useAccountFetch from "../../hooks/useAccountFetch";
import useAccountInsert from "../../hooks/useAccountInsert";
import useAccountDelete from "../../hooks/useAccountDelete";
import useTotalsFetch from "../../hooks/useTotalsFetch";
import Account from "../../model/Account";
import useAccountUpdate from "../../hooks/useAccountUpdate";
import { currencyFormat, noNaN } from "../../components/Common";
import FinanceLayout from "../../layouts/FinanceLayout";

export default function Accounts() {
  const [message, setMessage] = useState("");
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [showSpinner, setShowSpinner] = useState(true);
  const [showModelAdd, setShowModelAdd] = useState(false);
  const [showModelDelete, setShowModelDelete] = useState(false);
  const [accountData, setAccountData] = useState<Account | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);

  const {
    data: fetchedAccounts,
    isSuccess: isSuccessAccounts,
    isFetching: isFetchingAccounts,
    error: errorAccounts,
  } = useAccountFetch();
  const {
    data: fetchedTotals,
    isSuccess: isSuccessTotals,
    isFetching: isFetchingTotals,
    error: errorTotals,
  } = useTotalsFetch();

  const { mutateAsync: insertAccount } = useAccountInsert();
  const { mutateAsync: updateAccount } = useAccountUpdate();
  const { mutateAsync: deleteAccount } = useAccountDelete();

  const accountTypeOptions = ["debit", "credit"];

  useEffect(() => {
    if (isFetchingAccounts || isFetchingTotals) {
      setShowSpinner(true);
      return;
    }
    if (isSuccessAccounts && isSuccessTotals) {
      setShowSpinner(false);
    }
  }, [
    isSuccessAccounts,
    isSuccessTotals,
    isFetchingAccounts,
    isFetchingTotals,
  ]);

  const handleAccountTypeKeyDown = (event: any) => {
    if (event.key === "Tab") {
      const inputValue = event.target.value.toLowerCase();
      const match = accountTypeOptions.find((option) =>
        option.startsWith(inputValue),
      );
      if (match) {
        event.preventDefault(); // Prevent default tab behavior
        setAccountData((prev: any) => ({
          ...prev,
          accountType: match,
        }));
      }
    }
  };

  const handleDeleteRow = async () => {
    if (selectedAccount) {
      try {
        await deleteAccount({ oldRow: selectedAccount });
        setMessage("Account deleted successfully.");
        setShowSnackbar(true);
      } catch (error) {
        handleError(error, `Delete Account error: ${error.message}`, false);
      } finally {
        setShowModelDelete(false);
        setSelectedAccount(null);
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

  const handleAddRow = async (newData: Account) => {
    try {
      await insertAccount({ payload: newData });
      setShowModelAdd(false);
      setMessage("Account inserted successfully.");
      setShowSnackbar(true);
    } catch (error) {
      handleError(error, `Add Account ${error.message}`, false);
      if (
        !navigator.onLine ||
        (error.message && error.message.includes("Failed to fetch"))
      ) {
      }
    }
  };

  const columns: GridColDef[] = [
    {
      field: "accountNameOwner",
      headerName: "Account",
      width: 250,
      editable: true,
      renderCell: (params) => {
        return (
          <Link href={`/finance/transactions/${params.row.accountNameOwner}`}>
            {params.value}
          </Link>
        );
      },
    },
    { field: "accountType", headerName: "Type", width: 150, editable: true },
    { field: "moniker", headerName: "Moniker", width: 150, editable: true },
    {
      field: "future",
      headerName: "Future",
      width: 150,
      renderCell: (params) =>
        params.value?.toLocaleString("en-US", {
          style: "currency",
          currency: "USD",
        }),
    },
    {
      field: "outstanding",
      headerName: "Outstanding",
      width: 150,
      renderCell: (params) =>
        params.value?.toLocaleString("en-US", {
          style: "currency",
          currency: "USD",
        }),
    },
    {
      field: "cleared",
      headerName: "Cleared",
      width: 150,
      renderCell: (params) =>
        params.value?.toLocaleString("en-US", {
          style: "currency",
          currency: "USD",
        }),
    },
    {
      field: "activeStatus",
      headerName: "Active",
      width: 75,
      editable: true,
    },
    {
      field: "validationDate",
      headerName: "Validation Date",
      width: 150,
      type: "date",
      valueGetter: (params) => new Date(params),
      renderCell: (params) => {
        return params?.value?.toLocaleDateString("en-US");
      },
    },
    {
      field: "",
      headerName: "Actions",
      width: 100,
      renderCell: (params) => (
        <Box>
          <Tooltip title="delete this row">
            <IconButton
              onClick={() => {
                setSelectedAccount(params.row);
                setShowModelDelete(true);
              }}
            >
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <div>
      <FinanceLayout>
        <h2>Account Details</h2>
        {showSpinner ? (
          <Spinner />
        ) : (
          <div>
            <IconButton onClick={() => setShowModelAdd(true)}>
              <AddIcon />
            </IconButton>

            <h4>{`[ ${currencyFormat(
              noNaN(fetchedTotals?.totals ?? 0),
            )} ] [ ${currencyFormat(
              noNaN(fetchedTotals?.totalsCleared ?? 0),
            )} ]  [ ${currencyFormat(
              noNaN(fetchedTotals?.totalsOutstanding ?? 0),
            )} ] [ ${currencyFormat(noNaN(fetchedTotals?.totalsFuture ?? 0))} ]`}</h4>

            <DataGrid
              rows={fetchedAccounts?.filter((row) => row != null) || []}
              columns={columns}
              getRowId={(row) => row.accountId || 0}
              paginationModel={{ pageSize: fetchedAccounts?.length, page: 0 }}
              hideFooterPagination={true}
              checkboxSelection={false}
              rowSelection={false}
              processRowUpdate={async (
                newRow: Account,
                oldRow: Account,
              ): Promise<Account> => {
                if (JSON.stringify(newRow) === JSON.stringify(oldRow)) {
                  return oldRow;
                }
                try {
                  await updateAccount({ newRow: newRow, oldRow: oldRow });
                  setMessage("Account updated successfully.");
                  setShowSnackbar(true);

                  return { ...newRow };
                } catch (error) {
                  handleError(error, `Update Account ${error.message}`, false);
                  return error;
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

        {/* Confirmation Deleting Modal */}
        <Modal open={showModelDelete} onClose={() => setShowModelDelete(false)}>
          <Paper>
            <Typography variant="h6">Confirm Deletion</Typography>
            <Typography>
              Are you sure you want to delete the account "
              {selectedAccount?.accountNameOwner}"?
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
                onClick={() => setShowModelDelete(false)}
              >
                Cancel
              </Button>
            </Box>
          </Paper>
        </Modal>

        {/* Modal Add Account */}
        <Modal open={showModelAdd} onClose={() => setShowModelAdd(false)}>
          <Paper>
            <h3>Add New Account</h3>
            <TextField
              label="Account"
              fullWidth
              margin="normal"
              value={accountData?.accountNameOwner || ""}
              onChange={(e) =>
                setAccountData((prev) => ({
                  ...prev,
                  accountNameOwner: e.target.value,
                }))
              }
            />

            <Autocomplete
              freeSolo
              options={accountTypeOptions}
              value={accountData?.accountType || ""}
              onChange={(event, newValue) =>
                setAccountData((prev: any) => ({
                  ...prev,
                  accountType: newValue || "",
                }))
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Account Type"
                  fullWidth
                  margin="normal"
                  onKeyDown={handleAccountTypeKeyDown}
                />
              )}
            />

            <TextField
              label="Moniker"
              fullWidth
              margin="normal"
              value={accountData?.moniker || ""}
              onChange={(e) =>
                setAccountData((prev: any) => ({
                  ...prev,
                  moniker: e.target.value,
                }))
              }
            />
            <Button
              variant="contained"
              onClick={() => accountData && handleAddRow(accountData)}
            >
              Add
            </Button>
          </Paper>
        </Modal>
      </FinanceLayout>
    </div>
  );
}
