import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/router";
import { GridColDef } from "@mui/x-data-grid";
import {
  Box,
  Button,
  IconButton,
  Link,
  TextField,
  Typography,
  Autocomplete,
  Tooltip,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import EventNoteIcon from "@mui/icons-material/EventNote";
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
import ConfirmDialog from "../../components/ConfirmDialog";
import FormDialog from "../../components/FormDialog";
import PageHeader from "../../components/PageHeader";
import ActionBar from "../../components/ActionBar";
import DataGridBase from "../../components/DataGridBase";
import SummaryBar from "../../components/SummaryBar";
import StatCard from "../../components/StatCard";
import SearchFilterBar from "../../components/SearchFilterBar";
import ViewToggle from "../../components/ViewToggle";
import { useAuth } from "../../components/AuthProvider";
import { modalTitles, modalBodies } from "../../utils/modalMessages";

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

  // Search and filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilters, setActiveFilters] = useState<{
    accountType: "all" | "debit" | "credit";
    activeStatus: "all" | "active" | "inactive";
  }>({
    accountType: "all",
    activeStatus: "all",
  });
  const [viewMode, setViewMode] = useState<"grid" | "table">("table");

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

  // Load view preference from localStorage
  useEffect(() => {
    const savedView = localStorage.getItem("finance-accounts-view");
    if (savedView === "grid" || savedView === "table") {
      setViewMode(savedView);
    }
  }, []);

  // Save view preference to localStorage
  useEffect(() => {
    localStorage.setItem("finance-accounts-view", viewMode);
  }, [viewMode]);

  // Filter accounts based on search and filters
  const filteredAccounts = useMemo(() => {
    if (!fetchedAccounts) return [];

    return fetchedAccounts.filter((account) => {
      // Search filter
      const matchesSearch =
        searchTerm === "" ||
        account.accountNameOwner
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        account.moniker?.toLowerCase().includes(searchTerm.toLowerCase());

      // Account type filter
      const matchesType =
        activeFilters.accountType === "all" ||
        account.accountType.toLowerCase() === activeFilters.accountType;

      // Active status filter
      const matchesStatus =
        activeFilters.activeStatus === "all" ||
        (activeFilters.activeStatus === "active"
          ? account.activeStatus
          : !account.activeStatus);

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [fetchedAccounts, searchTerm, activeFilters]);

  const handleClearFilters = () => {
    setSearchTerm("");
    setActiveFilters({
      accountType: "all",
      activeStatus: "all",
    });
  };

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
    const errs: {
      accountNameOwner?: string;
      accountType?: string;
      moniker?: string;
    } = {};
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
      headerAlign: "right",
      align: "right",
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
      headerAlign: "right",
      align: "right",
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
      headerAlign: "right",
      align: "right",
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
      headerAlign: "left",
      align: "left",
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
          <Tooltip title="Delete this row">
            <IconButton
              aria-label="Delete this row"
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
        <PageHeader
          title="Account Overview"
          subtitle="View all accounts with current balances and financial status at a glance"
        />
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
        <PageHeader
          title="Account Overview"
          subtitle="View all accounts with current balances and financial status at a glance"
          actions={
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setShowModelAdd(true)}
              sx={{ backgroundColor: "primary.main" }}
            >
              Add Account
            </Button>
          }
        />
        {showSpinner ? (
          <LoadingState
            variant="card"
            message="Loading accounts and totals..."
          />
        ) : (
          <div>
            {/* Search and Filter Bar */}
            <SearchFilterBar
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              activeFilters={activeFilters}
              onFilterChange={setActiveFilters}
              onClearFilters={handleClearFilters}
              resultCount={filteredAccounts.length}
              totalCount={fetchedAccounts?.length || 0}
            />

            {/* View Toggle and Result Count */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 3,
              }}
            >
              <Typography variant="body2" color="text.secondary">
                {/* Placeholder for additional info */}
              </Typography>
              <ViewToggle view={viewMode} onChange={setViewMode} />
            </Box>

            {/* Summary Stats Cards */}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2, 1fr)",
                  md: "repeat(4, 1fr)",
                },
                gap: 2,
                mb: 3,
              }}
            >
              <StatCard
                icon={<AccountBalanceIcon />}
                label="Total"
                value={currencyFormat(noNaN(fetchedTotals?.totals ?? 0))}
                color="primary"
              />
              <StatCard
                icon={<CheckCircleIcon />}
                label="Cleared"
                value={currencyFormat(noNaN(fetchedTotals?.totalsCleared ?? 0))}
                color="success"
              />
              <StatCard
                icon={<AccessTimeIcon />}
                label="Outstanding"
                value={currencyFormat(
                  noNaN(fetchedTotals?.totalsOutstanding ?? 0),
                )}
                color="warning"
              />
              <StatCard
                icon={<EventNoteIcon />}
                label="Future"
                value={currencyFormat(noNaN(fetchedTotals?.totalsFuture ?? 0))}
                color="info"
              />
            </Box>

            {/* Data Grid / Grid View */}
            <Box display="flex" justifyContent="center">
              <Box sx={{ width: "fit-content" }}>
                {filteredAccounts && filteredAccounts.length > 0 ? (
                  viewMode === "table" ? (
                    <DataGridBase
                      rows={filteredAccounts.filter((row) => row != null) || []}
                      columns={columns}
                      getRowId={(row: any) =>
                        row.accountId ?? row.accountNameOwner
                      }
                      pageSizeOptions={[25, 50, 100]}
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
                          await updateAccount({
                            newRow: newRow,
                            oldRow: oldRow,
                          });
                          setMessage("Account updated successfully.");
                          setShowSnackbar(true);
                          return { ...newRow };
                        } catch (error: any) {
                          handleError(
                            error,
                            `Update Account ${error.message}`,
                            false,
                          );
                          return oldRow;
                        }
                      }}
                    />
                  ) : (
                    <Box sx={{ p: 2 }}>
                      <Typography variant="h6" color="text.secondary">
                        Grid view coming in Phase 2
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        For now, please use table view to see your accounts.
                      </Typography>
                    </Box>
                  )
                ) : (
                  <EmptyState
                    title={
                      searchTerm ||
                      activeFilters.accountType !== "all" ||
                      activeFilters.activeStatus !== "all"
                        ? "No Matching Accounts"
                        : "No Accounts Found"
                    }
                    message={
                      searchTerm ||
                      activeFilters.accountType !== "all" ||
                      activeFilters.activeStatus !== "all"
                        ? "No accounts match your current filters. Try adjusting your search or filters."
                        : "You haven't created any accounts yet. Get started by adding your first account."
                    }
                    dataType="accounts"
                    variant="create"
                    actionLabel={
                      searchTerm ||
                      activeFilters.accountType !== "all" ||
                      activeFilters.activeStatus !== "all"
                        ? "Clear Filters"
                        : "Add Account"
                    }
                    onAction={() => {
                      if (
                        searchTerm ||
                        activeFilters.accountType !== "all" ||
                        activeFilters.activeStatus !== "all"
                      ) {
                        handleClearFilters();
                      } else {
                        setShowModelAdd(true);
                      }
                    }}
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
        <ConfirmDialog
          open={showModelDelete}
          onClose={() => setShowModelDelete(false)}
          onConfirm={handleDeleteRow}
          title={modalTitles.confirmDeletion}
          message={modalBodies.confirmDeletion(
            "account",
            selectedAccount?.accountNameOwner ?? "",
          )}
          confirmText="Delete"
          cancelText="Cancel"
        />

        <FormDialog
          open={showModelAdd}
          onClose={() => setShowModelAdd(false)}
          onSubmit={() =>
            handleAddRow({
              ...(accountData as Account),
              accountNameOwner: accountData?.accountNameOwner || "",
              accountType: (accountData?.accountType as any) || "",
              validationDate: new Date(0),
            } as Account)
          }
          title={modalTitles.addNew("account")}
          submitText="Add"
        >
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
        </FormDialog>
      </FinanceLayout>
    </div>
  );
}
