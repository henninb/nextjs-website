import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
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
import ErrorDisplay from "../../components/ErrorDisplay";
import EmptyState from "../../components/EmptyState";
import LoadingState from "../../components/LoadingState";
import useAccountFetch from "../../hooks/useAccountFetch";
import useAccountInsert from "../../hooks/useAccountInsert";
import useAccountDelete from "../../hooks/useAccountDelete";
import useTotalsFetch from "../../hooks/useTotalsFetch";
import Account from "../../model/Account";
import useAccountUpdate from "../../hooks/useAccountUpdate";
import { currencyFormat, noNaN } from "../../components/Common";
import FinanceLayout from "../../layouts/FinanceLayout";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import EventNoteIcon from "@mui/icons-material/EventNote";
import { useAuth } from "../../components/AuthProvider";
import { modalTitles, modalBodies } from "../../utils/modalMessages";
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
} from "@mui/material";

export default function Accounts() {
  const [message, setMessage] = useState("");
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [showSpinner, setShowSpinner] = useState(true);
  const [showModelAdd, setShowModelAdd] = useState(false);
  const [showModelDelete, setShowModelDelete] = useState(false);
  const [accountData, setAccountData] = useState<Account | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [formErrors, setFormErrors] = useState<{
    accountNameOwner?: string;
    accountType?: string;
    moniker?: string;
  }>({});
  // const [paginationModel, setPaginationModel] = useState({
  //   pageSize: 25,
  //   page: 0,
  // });

  const {
    data: fetchedAccounts,
    isSuccess: isSuccessAccounts,
    isFetching: isFetchingAccounts,
    error: errorAccounts,
    refetch: refetchAccounts,
  } = useAccountFetch();
  const {
    data: fetchedTotals,
    isSuccess: isSuccessTotals,
    isFetching: isFetchingTotals,
    error: errorTotals,
    refetch: refetchTotals,
  } = useTotalsFetch();

  const { mutateAsync: insertAccount } = useAccountInsert();
  const { mutateAsync: updateAccount } = useAccountUpdate();
  const { mutateAsync: deleteAccount } = useAccountDelete();

  const accountTypeOptions = ["debit", "credit"];
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [loading, isAuthenticated, router]);

  useEffect(() => {
    if (
      isFetchingAccounts ||
      isFetchingTotals ||
      loading ||
      (!loading && !isAuthenticated)
    ) {
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
    loading,
    isAuthenticated,
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
    // Basic required field validation
    const errs: { accountNameOwner?: string; accountType?: string; moniker?: string } = {};
    if (!newData?.accountNameOwner || newData.accountNameOwner.trim() === "") {
      errs.accountNameOwner = "Account name is required";
    } else if (!/^[a-zA-Z0-9_-]+$/.test(newData.accountNameOwner)) {
      errs.accountNameOwner =
        "Account name can only contain letters, numbers, underscores, or hyphens";
    }
    if (!newData?.accountType || String(newData.accountType).trim() === "") {
      errs.accountType = "Account type is required";
    } else {
      const typeNorm = String(newData.accountType).toLowerCase();
      if (!accountTypeOptions.includes(typeNorm)) {
        errs.accountType = "Account type must be debit or credit";
      }
    }

    // Moniker: required and alphanumeric only
    const moniker = newData?.moniker || "";
    if (!moniker || moniker.trim() === "") {
      errs.moniker = "Moniker is required";
    } else if (!/^[a-zA-Z0-9]+$/.test(moniker)) {
      errs.moniker = "Moniker can only contain letters and numbers";
    }

    if (Object.keys(errs).length > 0) {
      setFormErrors(errs);
      return;
    }

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

  // Handle error states first
  if (errorAccounts || errorTotals) {
    return (
      <FinanceLayout>
        <Box sx={{ mb: 3, textAlign: "center" }}>
          <Typography
            variant="h4"
            component="h1"
            sx={{ mb: 1, fontWeight: 600 }}
          >
            Account Overview
          </Typography>
          <Typography variant="body1" color="text.secondary">
            View all accounts with current balances and financial status at a
            glance
          </Typography>
        </Box>
        <ErrorDisplay
          error={errorAccounts || errorTotals}
          variant="card"
          showRetry={true}
          onRetry={() => {
            if (errorAccounts) refetchAccounts();
            if (errorTotals) refetchTotals();
          }}
        />
      </FinanceLayout>
    );
  }

  return (
    <div>
      <FinanceLayout>
        <Box sx={{ mb: 3, textAlign: "center" }}>
          <Typography
            variant="h4"
            component="h1"
            sx={{ mb: 1, fontWeight: 600 }}
          >
            Account Overview
          </Typography>
          <Typography variant="body1" color="text.secondary">
            View all accounts with current balances and financial status at a
            glance
          </Typography>
        </Box>
        {showSpinner ? (
          <LoadingState
            variant="card"
            message="Loading accounts and totals..."
          />
        ) : (
          <div>
            <div
              style={{
                maxWidth: "600px",
                margin: "0 auto",
                marginBottom: "16px",
              }}
            >
              <TableContainer component={Paper}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell align="center">
                        <strong>Total</strong>
                      </TableCell>
                      <TableCell align="center">
                        <CheckCircleIcon
                          fontSize="small"
                          style={{ verticalAlign: "middle" }}
                        />{" "}
                        <strong>Cleared</strong>
                      </TableCell>
                      <TableCell align="center">
                        <AccessTimeIcon
                          fontSize="small"
                          style={{ verticalAlign: "middle" }}
                        />{" "}
                        <strong>Outstanding</strong>
                      </TableCell>
                      <TableCell align="center">
                        <EventNoteIcon
                          fontSize="small"
                          style={{ verticalAlign: "middle" }}
                        />{" "}
                        <strong>Future</strong>
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell align="center">
                        {currencyFormat(noNaN(fetchedTotals?.totals ?? 0))}
                      </TableCell>
                      <TableCell align="center">
                        {currencyFormat(
                          noNaN(fetchedTotals?.totalsCleared ?? 0),
                        )}
                      </TableCell>
                      <TableCell align="center">
                        {currencyFormat(
                          noNaN(fetchedTotals?.totalsOutstanding ?? 0),
                        )}
                      </TableCell>
                      <TableCell align="center">
                        {currencyFormat(
                          noNaN(fetchedTotals?.totalsFuture ?? 0),
                        )}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </div>

            <Box display="flex" justifyContent="center" mb={2}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setShowModelAdd(true)}
                sx={{ backgroundColor: "primary.main" }}
              >
                Add Account
              </Button>
            </Box>
            <Box display="flex" justifyContent="center">
              <Box sx={{ width: "fit-content" }}>
                {fetchedAccounts && fetchedAccounts.length > 0 ? (
                  <DataGrid
                    rows={fetchedAccounts?.filter((row) => row != null) || []}
                    columns={columns}
                    getRowId={(row) => row.accountId ?? row.accountNameOwner}
                    paginationModel={{
                      pageSize: fetchedAccounts?.length,
                      page: 0,
                    }}
                    pageSizeOptions={[25, 50, 100]}
                    pagination
                    disableRowSelectionOnClick
                    checkboxSelection={false}
                    rowSelection={false}
                    autoHeight
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
                        handleError(
                          error,
                          `Update Account ${error.message}`,
                          false,
                        );
                        return error;
                      }
                    }}
                  />
                ) : (
                  <EmptyState
                    title="No Accounts Found"
                    message="You haven't created any accounts yet. Get started by adding your first account."
                    dataType="accounts"
                    variant="create"
                    actionLabel="Add Account"
                    onAction={() => setShowModelAdd(true)}
                    onRefresh={() => {
                      refetchAccounts();
                      refetchTotals();
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

        {/* Confirmation Delete Modal */}
        <Modal open={showModelDelete} onClose={() => setShowModelDelete(false)}>
          <Paper>
            <Typography variant="h6">{modalTitles.confirmDeletion}</Typography>
            <Typography>
              {modalBodies.confirmDeletion(
                "account",
                selectedAccount?.accountNameOwner ?? "",
              )}
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
            <Typography variant="h6">
              {modalTitles.addNew("account")}
            </Typography>
            <TextField
              label="Account"
              fullWidth
              margin="normal"
              value={accountData?.accountNameOwner || ""}
              error={!!formErrors.accountNameOwner}
              helperText={formErrors.accountNameOwner}
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
              onInputChange={(event, newInputValue) =>
                setAccountData((prev: any) => ({
                  ...prev,
                  accountType: newInputValue || "",
                }))
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Account Type"
                  fullWidth
                  margin="normal"
                  error={!!formErrors.accountType}
                  helperText={formErrors.accountType}
                  onKeyDown={handleAccountTypeKeyDown}
                />
              )}
            />

            <TextField
              label="Moniker"
              fullWidth
              margin="normal"
              value={accountData?.moniker || ""}
              error={!!formErrors.moniker}
              helperText={formErrors.moniker}
              onChange={(e) =>
                setAccountData((prev: any) => ({
                  ...prev,
                  moniker: e.target.value,
                }))
              }
            />
            <Box mt={2} display="flex" justifyContent="flex-end" gap={1}>
              <Button variant="outlined" onClick={() => setShowModelAdd(false)}>
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={() =>
                  handleAddRow({
                    ...(accountData as Account),
                    accountNameOwner: accountData?.accountNameOwner || "",
                    accountType: (accountData?.accountType as any) || "",
                    validationDate: new Date(0),
                  } as Account)
                }
              >
                Add
              </Button>
            </Box>
          </Paper>
        </Modal>
      </FinanceLayout>
    </div>
  );
}
