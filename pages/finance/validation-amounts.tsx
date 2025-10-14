import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { GridColDef } from "@mui/x-data-grid";
import {
  Box,
  Button,
  IconButton,
  Tooltip,
  TextField,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import SnackbarBaseline from "../../components/SnackbarBaseline";
import ErrorDisplay from "../../components/ErrorDisplay";
import EmptyState from "../../components/EmptyState";
import LoadingState from "../../components/LoadingState";
import ValidationAmount from "../../model/ValidationAmount";
import { TransactionState } from "../../model/TransactionState";
import useValidationAmountsFetchAll from "../../hooks/useValidationAmountsFetchAll";
import useValidationAmountInsert from "../../hooks/useValidationAmountInsert";
import useValidationAmountUpdate from "../../hooks/useValidationAmountUpdate";
import useValidationAmountDelete from "../../hooks/useValidationAmountDelete";
import useAccountFetch from "../../hooks/useAccountFetch";
import FinanceLayout from "../../layouts/FinanceLayout";
import PageHeader from "../../components/PageHeader";
import DataGridBase from "../../components/DataGridBase";
import ConfirmDialog from "../../components/ConfirmDialog";
import FormDialog from "../../components/FormDialog";
import { useAuth } from "../../components/AuthProvider";
import { modalTitles, modalBodies } from "../../utils/modalMessages";
import { currencyFormat } from "../../components/Common";

export default function ValidationAmounts() {
  const [message, setMessage] = useState("");
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [snackbarSeverity, setSnackbarSeverity] = useState<
    "error" | "warning" | "info" | "success"
  >("info");
  const [showSpinner, setShowSpinner] = useState(true);
  const [showModalAdd, setShowModalAdd] = useState(false);
  const [showModalDelete, setShowModalDelete] = useState(false);
  const [selectedValidationAmount, setSelectedValidationAmount] =
    useState<ValidationAmount | null>(null);
  const [paginationModel, setPaginationModel] = useState({
    pageSize: 50,
    page: 0,
  });
  const [selectedAccount, setSelectedAccount] = useState<string>("");
  const [formData, setFormData] = useState<Partial<ValidationAmount>>({
    validationDate: new Date(),
    amount: 0,
    transactionState: "cleared",
    activeStatus: true,
  });
  const [formErrors, setFormErrors] = useState<{
    validationDate?: string;
    amount?: string;
    transactionState?: string;
  }>({});

  const { data: accounts, isLoading: isLoadingAccounts } = useAccountFetch();
  const {
    data: validationAmounts,
    isSuccess: isSuccessValidationAmounts,
    isLoading: isFetchingValidationAmounts,
    isError: isErrorValidationAmounts,
    error: errorValidationAmounts,
    refetch,
  } = useValidationAmountsFetchAll(selectedAccount);

  const { mutateAsync: insertValidationAmount } = useValidationAmountInsert();
  const { mutateAsync: updateValidationAmount } = useValidationAmountUpdate();
  const { mutateAsync: deleteValidationAmount } = useValidationAmountDelete();

  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [loading, isAuthenticated, router]);

  useEffect(() => {
    if (
      isFetchingValidationAmounts ||
      loading ||
      (!loading && !isAuthenticated) ||
      !selectedAccount
    ) {
      setShowSpinner(true);
      return;
    }
    if (isSuccessValidationAmounts) {
      setShowSpinner(false);
    }
  }, [
    isSuccessValidationAmounts,
    isErrorValidationAmounts,
    isFetchingValidationAmounts,
    loading,
    isAuthenticated,
    selectedAccount,
  ]);

  const handleDeleteRow = async () => {
    if (selectedValidationAmount) {
      try {
        await deleteValidationAmount(selectedValidationAmount);
        handleSuccess("Validation amount deleted successfully.");
      } catch (error) {
        handleError(error, "Delete validation amount failure.", false);
      } finally {
        setShowModalDelete(false);
        setSelectedValidationAmount(null);
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
    setSnackbarSeverity("error");
    setShowSnackbar(true);

    console.error(errorMessage);

    if (throwIt) throw error;
  };

  const handleSuccess = (successMessage: string) => {
    setMessage(successMessage);
    setSnackbarSeverity("success");
    setShowSnackbar(true);
  };

  const validateForm = (): boolean => {
    const errs: {
      validationDate?: string;
      amount?: string;
      transactionState?: string;
    } = {};

    if (!formData.validationDate) {
      errs.validationDate = "Validation date is required";
    }

    if (formData.amount === undefined || formData.amount === null) {
      errs.amount = "Amount is required";
    } else if (isNaN(Number(formData.amount))) {
      errs.amount = "Amount must be a valid number";
    }

    if (!formData.transactionState) {
      errs.transactionState = "Transaction state is required";
    }

    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleAddRow = async () => {
    if (!validateForm()) {
      setMessage("Please fix validation errors");
      setSnackbarSeverity("error");
      setShowSnackbar(true);
      return;
    }

    if (!selectedAccount) {
      setMessage("Please select an account first");
      setSnackbarSeverity("error");
      setShowSnackbar(true);
      return;
    }

    try {
      const payload: ValidationAmount = {
        validationId: 0,
        validationDate: new Date(formData.validationDate!),
        amount: Number(formData.amount),
        transactionState: formData.transactionState as TransactionState,
        activeStatus: formData.activeStatus ?? true,
      };

      await insertValidationAmount({
        accountNameOwner: selectedAccount,
        payload,
      });

      handleSuccess("Validation amount added successfully.");
      setFormData({
        validationDate: new Date(),
        amount: 0,
        transactionState: "cleared",
        activeStatus: true,
      });
      setFormErrors({});
    } catch (error) {
      handleError(
        error,
        `Add validation amount error: ${error.message}`,
        false,
      );
    } finally {
      setShowModalAdd(false);
    }
  };

  const getRowId = (row: any) =>
    row.validationId ?? `${row.validationDate}-${row.amount}`;

  const transactionStateOptions: TransactionState[] = [
    "cleared",
    "outstanding",
    "future",
    "undefined",
  ];

  const columns: GridColDef[] = [
    {
      field: "validationId",
      headerName: "ID",
      width: 80,
      editable: false,
    },
    {
      field: "validationDate",
      headerName: "Validation Date",
      width: 150,
      editable: true,
      type: "date",
      valueGetter: (params) => (params ? new Date(params) : null),
      renderCell: (params) => params.value?.toLocaleDateString("en-US"),
    },
    {
      field: "amount",
      headerName: "Amount",
      width: 150,
      editable: true,
      type: "number",
      headerAlign: "right",
      align: "right",
      renderCell: (params) => currencyFormat(params.value || 0),
    },
    {
      field: "transactionState",
      headerName: "Transaction State",
      width: 150,
      editable: true,
      type: "singleSelect",
      valueOptions: transactionStateOptions,
    },
    {
      field: "activeStatus",
      headerName: "Active",
      width: 100,
      editable: true,
      type: "boolean",
      renderCell: (params) => (params.value ? "Active" : "Inactive"),
    },
    {
      field: "dateAdded",
      headerName: "Date Added",
      width: 150,
      editable: false,
      valueGetter: (params) => (params ? new Date(params) : null),
      renderCell: (params) =>
        params.value ? params.value.toLocaleDateString("en-US") : "",
    },
    {
      field: "dateUpdated",
      headerName: "Date Updated",
      width: 150,
      editable: false,
      valueGetter: (params) => (params ? new Date(params) : null),
      renderCell: (params) =>
        params.value ? params.value.toLocaleDateString("en-US") : "",
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 100,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Tooltip title="Delete this row">
          <IconButton
            aria-label="Delete this row"
            onClick={() => {
              setSelectedValidationAmount(params.row);
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
  if (isErrorValidationAmounts && selectedAccount) {
    return (
      <FinanceLayout>
        <PageHeader
          title="Validation Amounts"
          subtitle="Manage validation amounts for account reconciliation"
          actions={
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setShowModalAdd(true)}
              disabled={!selectedAccount}
              sx={{ backgroundColor: "primary.main" }}
            >
              Add Validation Amount
            </Button>
          }
        />
        <ErrorDisplay
          error={errorValidationAmounts}
          variant="card"
          showRetry={true}
          onRetry={() => refetch()}
        />
      </FinanceLayout>
    );
  }

  return (
    <div>
      <FinanceLayout>
        <PageHeader
          title="Validation Amounts"
          subtitle="Manage validation amounts for account reconciliation"
          actions={
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setShowModalAdd(true)}
              disabled={!selectedAccount}
              sx={{ backgroundColor: "primary.main" }}
            >
              Add Validation Amount
            </Button>
          }
        />

        {/* Account Selector */}
        <Box display="flex" justifyContent="center" sx={{ mb: 3 }}>
          <Box sx={{ width: "100%", maxWidth: "600px" }}>
            <FormControl fullWidth>
              <InputLabel id="account-select-label">Select Account</InputLabel>
              <Select
                labelId="account-select-label"
                id="account-select"
                value={selectedAccount}
                label="Select Account"
                onChange={(e) => setSelectedAccount(e.target.value)}
                disabled={isLoadingAccounts}
              >
                {accounts?.map((account) => (
                  <MenuItem
                    key={account.accountNameOwner}
                    value={account.accountNameOwner}
                  >
                    {account.accountNameOwner}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Box>

        {!selectedAccount ? (
          <Box display="flex" justifyContent="center">
            <EmptyState
              title="No Account Selected"
              message="Please select an account from the dropdown above to view validation amounts."
              dataType="generic"
              variant="create"
            />
          </Box>
        ) : showSpinner ? (
          <LoadingState
            variant="card"
            message="Loading validation amounts..."
          />
        ) : (
          <div>
            <Box display="flex" justifyContent="center">
              <Box sx={{ width: "100%", maxWidth: "1400px" }}>
                {validationAmounts && validationAmounts.length > 0 ? (
                  <DataGridBase
                    rows={validationAmounts?.filter((row) => row != null) || []}
                    columns={columns}
                    getRowId={getRowId}
                    paginationModel={paginationModel}
                    onPaginationModelChange={(newModel) =>
                      setPaginationModel(newModel)
                    }
                    pageSizeOptions={[25, 50, 100]}
                    autoHeight
                    disableColumnResize={false}
                    processRowUpdate={async (
                      newRow: ValidationAmount,
                      oldRow: ValidationAmount,
                    ): Promise<ValidationAmount> => {
                      if (JSON.stringify(newRow) === JSON.stringify(oldRow)) {
                        return oldRow;
                      }
                      try {
                        await updateValidationAmount({
                          oldValidationAmount: oldRow,
                          newValidationAmount: newRow,
                        });
                        handleSuccess(
                          "Validation amount updated successfully.",
                        );
                        return { ...newRow };
                      } catch (error) {
                        handleError(
                          error,
                          "Update validation amount failure.",
                          false,
                        );
                        return oldRow;
                      }
                    }}
                  />
                ) : (
                  <EmptyState
                    title="No Validation Amounts Found"
                    message={`No validation amounts found for account "${selectedAccount}". Create your first validation amount to track reconciliation.`}
                    dataType="generic"
                    variant="create"
                    actionLabel="Add Validation Amount"
                    onAction={() => setShowModalAdd(true)}
                    onRefresh={() => refetch()}
                  />
                )}
              </Box>
            </Box>
          </div>
        )}

        <SnackbarBaseline
          message={message}
          state={showSnackbar}
          handleSnackbarClose={handleSnackbarClose}
          severity={snackbarSeverity}
        />

        <ConfirmDialog
          open={showModalDelete}
          onClose={() => setShowModalDelete(false)}
          onConfirm={handleDeleteRow}
          title={modalTitles.confirmDeletion}
          message={`This will permanently delete the validation amount "${selectedValidationAmount?.validationId?.toString() ?? ""}". This action cannot be undone. Do you want to proceed?`}
          confirmText="Delete"
          cancelText="Cancel"
        />

        <FormDialog
          open={showModalAdd}
          onClose={() => {
            setShowModalAdd(false);
            setFormErrors({});
          }}
          onSubmit={handleAddRow}
          title="Add Validation Amount"
          submitText="Add"
        >
          <TextField
            label="Validation Date"
            type="date"
            fullWidth
            margin="normal"
            value={
              formData.validationDate
                ? new Date(formData.validationDate).toISOString().split("T")[0]
                : ""
            }
            error={!!formErrors.validationDate}
            helperText={formErrors.validationDate}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                validationDate: new Date(e.target.value),
              }))
            }
            InputLabelProps={{
              shrink: true,
            }}
          />
          <TextField
            label="Amount"
            type="number"
            fullWidth
            margin="normal"
            value={formData.amount ?? 0}
            error={!!formErrors.amount}
            helperText={formErrors.amount}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                amount: parseFloat(e.target.value),
              }))
            }
            inputProps={{
              step: "0.01",
            }}
          />
          <FormControl
            fullWidth
            margin="normal"
            error={!!formErrors.transactionState}
          >
            <InputLabel>Transaction State</InputLabel>
            <Select
              value={formData.transactionState || "cleared"}
              label="Transaction State"
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  transactionState: e.target.value as TransactionState,
                }))
              }
            >
              {transactionStateOptions.map((state) => (
                <MenuItem key={state} value={state}>
                  {state}
                </MenuItem>
              ))}
            </Select>
            {formErrors.transactionState && (
              <Typography color="error" variant="caption">
                {formErrors.transactionState}
              </Typography>
            )}
          </FormControl>
          <Box mt={1}>
            <FormControlLabel
              control={
                <Switch
                  checked={!!formData.activeStatus}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      activeStatus: e.target.checked,
                    }))
                  }
                />
              }
              label="Active Status"
            />
          </Box>
        </FormDialog>
      </FinanceLayout>
    </div>
  );
}
