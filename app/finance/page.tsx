"use client";
import { getErrorMessage } from "../../types";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
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
  Fade,
  Grow,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import BlockIcon from "@mui/icons-material/Block";
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
import useAccountDeactivate from "../../hooks/useAccountDeactivate";
import useTotalsFetch from "../../hooks/useTotalsFetch";
import Account from "../../model/Account";
import { AccountType } from "../../model/AccountType";
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
import AccountCard from "../../components/AccountCard";
import StatCardSkeleton from "../../components/StatCardSkeleton";
import AccountCardSkeleton from "../../components/AccountCardSkeleton";
import { useAuth } from "../../components/AuthProvider";
import { modalTitles, modalBodies } from "../../utils/modalMessages";

export default function Accounts() {
  const [message, setMessage] = useState("");
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [showSpinner, setShowSpinner] = useState(true);
  const [showModelAdd, setShowModelAdd] = useState(false);
  const [showModelDelete, setShowModelDelete] = useState(false);
  const [showModelDeactivate, setShowModelDeactivate] = useState(false);
  const [accountData, setAccountData] = useState<Account | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [formErrors, setFormErrors] = useState<{
    accountNameOwner?: string;
    accountType?: string;
    moniker?: string;
  }>({});
  const [paginationModel, setPaginationModel] = useState({
    pageSize: 50,
    page: 0,
  });

  // Search and filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilters, setActiveFilters] = useState<{
    accountType: "all" | "debit" | "credit";
    activeStatus: "all" | "active" | "inactive";
    balanceStatus:
      | "all"
      | "hasActivity"
      | "hasOutstanding"
      | "hasFuture"
      | "hasCleared"
      | "zeroBalance";
    accountNamePattern: "all" | "checking";
  }>({
    accountType: "all",
    activeStatus: "all",
    balanceStatus: "all",
    accountNamePattern: "all",
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
  const { mutateAsync: deactivateAccount } = useAccountDeactivate();

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

      // Balance status filter
      const matchesBalance =
        activeFilters.balanceStatus === "all" ||
        (activeFilters.balanceStatus === "hasActivity" &&
          (account.outstanding > 0 ||
            account.future > 0 ||
            account.cleared > 0)) ||
        (activeFilters.balanceStatus === "hasOutstanding" &&
          account.outstanding > 0) ||
        (activeFilters.balanceStatus === "hasFuture" && account.future > 0) ||
        (activeFilters.balanceStatus === "hasCleared" && account.cleared > 0) ||
        (activeFilters.balanceStatus === "zeroBalance" &&
          account.outstanding === 0 &&
          account.future === 0 &&
          account.cleared === 0);

      // Account name pattern filter (e.g., checking accounts)
      const matchesAccountNamePattern =
        activeFilters.accountNamePattern === "all" ||
        (activeFilters.accountNamePattern === "checking" &&
          account.accountNameOwner.toLowerCase().includes("checking"));

      return (
        matchesSearch &&
        matchesType &&
        matchesStatus &&
        matchesBalance &&
        matchesAccountNamePattern
      );
    });
  }, [fetchedAccounts, searchTerm, activeFilters]);

  const handleClearFilters = () => {
    setSearchTerm("");
    setActiveFilters({
      accountType: "all",
      activeStatus: "all",
      balanceStatus: "all",
      accountNamePattern: "all",
    });
  };

  const handleAccountTypeKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (event.key === "Tab") {
      const inputValue = (event.currentTarget.value || "").toLowerCase();
      const match = accountTypeOptions.find((option) =>
        option.startsWith(inputValue),
      );
      if (match) {
        event.preventDefault(); // Prevent default tab behavior
        setAccountData((prev: Account) => ({
          ...prev,
          accountType: match as AccountType,
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
        handleError(
          error,
          `Delete Account error: ${getErrorMessage(error)}`,
          false,
        );
      } finally {
        setShowModelDelete(false);
        setSelectedAccount(null);
      }
    }
  };

  const handleDeactivateRow = async () => {
    if (selectedAccount) {
      try {
        await deactivateAccount({ oldRow: selectedAccount });
        setMessage(
          "Account and all associated transactions deactivated successfully.",
        );
        setShowSnackbar(true);
      } catch (error) {
        handleError(
          error,
          `Deactivate Account error: ${getErrorMessage(error)}`,
          false,
        );
      } finally {
        setShowModelDeactivate(false);
        setSelectedAccount(null);
      }
    }
  };

  const handleSnackbarClose = () => {
    setShowSnackbar(false);
  };

  const handleError = (
    error: unknown,
    moduleName: string,
    throwIt: boolean,
  ) => {
    const errorMessage = `${moduleName}: ${getErrorMessage(error)}`;

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
      handleError(error, `Add Account ${getErrorMessage(error)}`, false);
      if (
        !navigator.onLine ||
        (getErrorMessage(error) &&
          getErrorMessage(error).includes("Failed to fetch"))
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
      width: 150,
      renderCell: (params) => (
        <Box>
          <Tooltip
            title={
              params.row.activeStatus
                ? "Deactivate this account"
                : "Account is already inactive"
            }
          >
            <span>
              <IconButton
                aria-label="Deactivate this account"
                onClick={() => {
                  setSelectedAccount(params.row);
                  setShowModelDeactivate(true);
                }}
                disabled={!params.row.activeStatus}
              >
                <BlockIcon />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Delete this row">
            <IconButton
              aria-label="Delete this row"
              onClick={() => {
                setSelectedAccount(params.row);
                setShowModelDelete(true);
              }}
              sx={{ ml: 0.5 }}
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
      <>
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
      </>
    );
  }

  return (
    <div>
      <>
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
          <div>
            {/* Loading Skeletons */}
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
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
            </Box>

            {/* Loading skeleton for accounts grid */}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2, 1fr)",
                  md: "repeat(3, 1fr)",
                },
                gap: 3,
                maxWidth: "1400px",
                mx: "auto",
              }}
            >
              <AccountCardSkeleton />
              <AccountCardSkeleton />
              <AccountCardSkeleton />
              <AccountCardSkeleton />
              <AccountCardSkeleton />
              <AccountCardSkeleton />
            </Box>
          </div>
        ) : (
          <div>
            {/* Search and Filter Bar - Now includes Quick Filters */}
            <Fade in={true} timeout={500}>
              <Box>
                <SearchFilterBar
                  searchTerm={searchTerm}
                  onSearchChange={setSearchTerm}
                  activeFilters={activeFilters}
                  onFilterChange={setActiveFilters}
                  onClearFilters={handleClearFilters}
                  resultCount={filteredAccounts.length}
                  totalCount={fetchedAccounts?.length || 0}
                />
              </Box>
            </Fade>

            {/* View Toggle and Result Count */}
            <Fade in={true} timeout={600}>
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
            </Fade>

            {/* Summary Stats Cards with stagger animation */}
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
              <Grow
                in={true}
                timeout={700}
                style={{ transformOrigin: "0 0 0" }}
              >
                <Box>
                  <StatCard
                    icon={<AccountBalanceIcon />}
                    label="Total"
                    value={currencyFormat(noNaN(fetchedTotals?.totals ?? 0))}
                    color="primary"
                  />
                </Box>
              </Grow>
              <Grow
                in={true}
                timeout={800}
                style={{ transformOrigin: "0 0 0" }}
              >
                <Box>
                  <StatCard
                    icon={<CheckCircleIcon />}
                    label="Cleared"
                    value={currencyFormat(
                      noNaN(fetchedTotals?.totalsCleared ?? 0),
                    )}
                    color="success"
                    highlighted={
                      activeFilters.balanceStatus === "hasCleared" ||
                      activeFilters.balanceStatus === "hasActivity"
                    }
                  />
                </Box>
              </Grow>
              <Grow
                in={true}
                timeout={900}
                style={{ transformOrigin: "0 0 0" }}
              >
                <Box>
                  <StatCard
                    icon={<AccessTimeIcon />}
                    label="Outstanding"
                    value={currencyFormat(
                      noNaN(fetchedTotals?.totalsOutstanding ?? 0),
                    )}
                    color="warning"
                    highlighted={
                      activeFilters.balanceStatus === "hasOutstanding" ||
                      activeFilters.balanceStatus === "hasActivity"
                    }
                  />
                </Box>
              </Grow>
              <Grow
                in={true}
                timeout={1000}
                style={{ transformOrigin: "0 0 0" }}
              >
                <Box>
                  <StatCard
                    icon={<EventNoteIcon />}
                    label="Future"
                    value={currencyFormat(
                      noNaN(fetchedTotals?.totalsFuture ?? 0),
                    )}
                    color="info"
                    highlighted={
                      activeFilters.balanceStatus === "hasFuture" ||
                      activeFilters.balanceStatus === "hasActivity"
                    }
                  />
                </Box>
              </Grow>
            </Box>

            {/* Data Grid / Grid View */}
            <Box display="flex" justifyContent="center">
              <Box sx={{ width: viewMode === "grid" ? "100%" : "fit-content" }}>
                {filteredAccounts && filteredAccounts.length > 0 ? (
                  viewMode === "table" ? (
                    <DataGridBase
                      rows={filteredAccounts.filter((row) => row != null) || []}
                      columns={columns}
                      getRowId={(row: Account) =>
                        row.accountId ?? row.accountNameOwner
                      }
                      paginationModel={paginationModel}
                      onPaginationModelChange={setPaginationModel}
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
                        } catch (error: unknown) {
                          handleError(
                            error,
                            `Update Account ${getErrorMessage(error)}`,
                            false,
                          );
                          return oldRow;
                        }
                      }}
                    />
                  ) : (
                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: {
                          xs: "1fr",
                          sm: "repeat(2, 1fr)",
                          md: "repeat(3, 1fr)",
                        },
                        gap: 3,
                        width: "100%",
                        maxWidth: "1400px",
                      }}
                    >
                      {filteredAccounts.map((account, index) => (
                        <Grow
                          key={account.accountId ?? account.accountNameOwner}
                          in={true}
                          timeout={600 + index * 100}
                          style={{ transformOrigin: "0 0 0" }}
                        >
                          <Box>
                            <AccountCard
                              account={account}
                              onEdit={(account) => {
                                setAccountData(account);
                                setShowModelAdd(true);
                              }}
                              onDelete={(account) => {
                                setSelectedAccount(account);
                                setShowModelDelete(true);
                              }}
                            />
                          </Box>
                        </Grow>
                      ))}
                    </Box>
                  )
                ) : (
                  <EmptyState
                    title={
                      searchTerm ||
                      activeFilters.accountType !== "all" ||
                      activeFilters.activeStatus !== "all" ||
                      activeFilters.balanceStatus !== "all" ||
                      activeFilters.accountNamePattern !== "all"
                        ? "No Matching Accounts"
                        : "No Accounts Found"
                    }
                    message={
                      searchTerm ||
                      activeFilters.accountType !== "all" ||
                      activeFilters.activeStatus !== "all" ||
                      activeFilters.balanceStatus !== "all" ||
                      activeFilters.accountNamePattern !== "all"
                        ? "No accounts match your current filters. Try adjusting your search or filters."
                        : "You haven't created any accounts yet. Get started by adding your first account."
                    }
                    dataType="accounts"
                    variant="create"
                    actionLabel={
                      searchTerm ||
                      activeFilters.accountType !== "all" ||
                      activeFilters.activeStatus !== "all" ||
                      activeFilters.balanceStatus !== "all" ||
                      activeFilters.accountNamePattern !== "all"
                        ? "Clear Filters"
                        : "Add Account"
                    }
                    onAction={() => {
                      if (
                        searchTerm ||
                        activeFilters.accountType !== "all" ||
                        activeFilters.activeStatus !== "all" ||
                        activeFilters.balanceStatus !== "all" ||
                        activeFilters.accountNamePattern !== "all"
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

        <ConfirmDialog
          open={showModelDeactivate}
          onClose={() => setShowModelDeactivate(false)}
          onConfirm={handleDeactivateRow}
          title="Confirm Deactivation"
          message={`Are you sure you want to deactivate "${selectedAccount?.accountNameOwner ?? ""}"? This will mark it as inactive.`}
          confirmText="Deactivate"
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
              setAccountData((prev) =>
                prev
                  ? {
                      ...prev,
                      accountNameOwner: e.target.value,
                    }
                  : null,
              )
            }
          />
          <Autocomplete
            freeSolo
            options={accountTypeOptions}
            value={accountData?.accountType || ""}
            onChange={(event, newValue) =>
              setAccountData((prev: Account) => ({
                ...prev,
                accountType: (newValue || "") as AccountType,
              }))
            }
            onInputChange={(event, newInputValue) =>
              setAccountData((prev: Account) => ({
                ...prev,
                accountType: (newInputValue || "") as AccountType,
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
              setAccountData((prev: Account) => ({
                ...prev,
                moniker: e.target.value,
              }))
            }
          />
        </FormDialog>
      </>
    </div>
  );
}
