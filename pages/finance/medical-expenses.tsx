import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { GridColDef } from "@mui/x-data-grid";
import { Box, Button, IconButton, Tooltip, Chip, Dialog } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";

import SnackbarBaseline from "../../components/SnackbarBaseline";
import ErrorDisplay from "../../components/ErrorDisplay";
import EmptyState from "../../components/EmptyState";
import LoadingState from "../../components/LoadingState";
import FinanceLayout from "../../layouts/FinanceLayout";
import ConfirmDialog from "../../components/ConfirmDialog";
import FormDialog from "../../components/FormDialog";
import PageHeader from "../../components/PageHeader";
import DataGridBase from "../../components/DataGridBase";
import SummaryBar from "../../components/SummaryBar";
import MedicalExpenseForm from "../../components/MedicalExpenseForm";
import { useAuth } from "../../components/AuthProvider";

import useMedicalExpenseFetch from "../../hooks/useMedicalExpenseFetch";
import useMedicalExpenseDelete from "../../hooks/useMedicalExpenseDelete";
import useMedicalExpenseInsert from "../../hooks/useMedicalExpenseInsert";
import useMedicalExpenseUpdate from "../../hooks/useMedicalExpenseUpdate";
import { MedicalExpense, ClaimStatus } from "../../model/MedicalExpense";
import { currencyFormat } from "../../components/Common";

export default function MedicalExpenses() {
  const [message, setMessage] = useState("");
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [showSpinner, setShowSpinner] = useState(true);
  const [showModalDelete, setShowModalDelete] = useState(false);
  const [showModalForm, setShowModalForm] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<MedicalExpense | null>(
    null,
  );
  const [isEditMode, setIsEditMode] = useState(false);

  const {
    data: medicalExpenses,
    isSuccess,
    isFetching,
    error,
    refetch,
  } = useMedicalExpenseFetch();

  const { mutateAsync: deleteExpense } = useMedicalExpenseDelete();
  const { mutateAsync: insertExpense } = useMedicalExpenseInsert();
  const { mutateAsync: updateExpense } = useMedicalExpenseUpdate();

  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [loading, isAuthenticated, router]);

  useEffect(() => {
    if (isFetching || loading || (!loading && !isAuthenticated)) {
      setShowSpinner(true);
      return;
    }
    if (isSuccess) {
      setShowSpinner(false);
    }
  }, [isSuccess, isFetching, loading, isAuthenticated]);

  const handleDeleteExpense = async () => {
    if (selectedExpense) {
      try {
        await deleteExpense({ oldRow: selectedExpense });
        setMessage("Medical expense deleted successfully.");
        setShowSnackbar(true);
      } catch (error: any) {
        setMessage(`Delete error: ${error.message}`);
        setShowSnackbar(true);
      } finally {
        setShowModalDelete(false);
        setSelectedExpense(null);
      }
    }
  };

  const handleAddExpense = () => {
    setSelectedExpense(null);
    setIsEditMode(false);
    setShowModalForm(true);
  };

  const handleEditExpense = (expense: MedicalExpense) => {
    setSelectedExpense(expense);
    setIsEditMode(true);
    setShowModalForm(true);
  };

  const handleFormSubmit = async (formData: Partial<MedicalExpense>) => {
    try {
      if (isEditMode && selectedExpense) {
        const updatedExpense = {
          ...selectedExpense,
          ...formData,
        } as MedicalExpense;
        await updateExpense({
          newRow: updatedExpense,
          oldRow: selectedExpense,
        });
        setMessage("Medical expense updated successfully.");
      } else {
        await insertExpense({ payload: formData as any });
        setMessage("Medical expense created successfully.");
      }
      setShowSnackbar(true);
      setShowModalForm(false);
      setSelectedExpense(null);
    } catch (error: any) {
      setMessage(`${isEditMode ? "Update" : "Create"} error: ${error.message}`);
      setShowSnackbar(true);
    }
  };

  const handleFormCancel = () => {
    setShowModalForm(false);
    setSelectedExpense(null);
    setIsEditMode(false);
  };

  const handleSnackbarClose = () => {
    setShowSnackbar(false);
  };

  const getClaimStatusColor = (
    status: ClaimStatus,
  ): "success" | "primary" | "error" | "warning" | "info" | "default" => {
    switch (status) {
      case ClaimStatus.Approved:
        return "success";
      case ClaimStatus.Paid:
        return "primary";
      case ClaimStatus.Denied:
        return "error";
      case ClaimStatus.Processing:
        return "warning";
      case ClaimStatus.Submitted:
        return "info";
      case ClaimStatus.Closed:
        return "default";
      default:
        return "default";
    }
  };

  const columns: GridColDef[] = [
    {
      field: "serviceDate",
      headerName: "Service Date",
      width: 120,
      type: "date",
      valueGetter: (params) => new Date(params),
      renderCell: (params) => params.value?.toLocaleDateString("en-US"),
    },
    {
      field: "serviceDescription",
      headerName: "Description",
      width: 200,
      editable: false,
      renderCell: (params) => (
        <Box
          sx={{
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            width: "100%",
          }}
        >
          {params.value || "No description"}
        </Box>
      ),
    },
    {
      field: "billedAmount",
      headerName: "Billed Amount",
      width: 120,
      headerAlign: "right",
      align: "right",
      renderCell: (params) => currencyFormat(params.value || 0),
    },
    {
      field: "insurancePaid",
      headerName: "Insurance Paid",
      width: 120,
      headerAlign: "right",
      align: "right",
      renderCell: (params) => currencyFormat(params.value || 0),
    },
    {
      field: "patientResponsibility",
      headerName: "Patient Responsibility",
      width: 150,
      headerAlign: "right",
      align: "right",
      renderCell: (params) => currencyFormat(params.value || 0),
    },
    {
      field: "claimStatus",
      headerName: "Status",
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={getClaimStatusColor(params.value)}
          size="small"
          variant="outlined"
        />
      ),
    },
    {
      field: "isOutOfNetwork",
      headerName: "Network",
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value ? "Out-of-Network" : "In-Network"}
          color={params.value ? "warning" : "success"}
          size="small"
          variant="filled"
        />
      ),
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 120,
      sortable: false,
      renderCell: (params) => (
        <Box>
          <Tooltip title="Edit">
            <IconButton
              size="small"
              onClick={() => handleEditExpense(params.row)}
            >
              <EditIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete this row">
            <IconButton
              size="small"
              aria-label="Delete this row"
              onClick={() => {
                setSelectedExpense(params.row);
                setShowModalDelete(true);
              }}
            >
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  // Calculate totals for summary bar
  const totalBilled =
    medicalExpenses?.reduce((sum, exp) => sum + (exp.billedAmount || 0), 0) ||
    0;
  const totalInsurancePaid =
    medicalExpenses?.reduce((sum, exp) => sum + (exp.insurancePaid || 0), 0) ||
    0;
  const totalPatientResponsibility =
    medicalExpenses?.reduce(
      (sum, exp) => sum + (exp.patientResponsibility || 0),
      0,
    ) || 0;
  const totalOutstanding =
    medicalExpenses
      ?.filter((exp) => !exp.paidDate && exp.patientResponsibility > 0)
      .reduce((sum, exp) => sum + exp.patientResponsibility, 0) || 0;

  // Handle error states first
  if (error) {
    return (
      <FinanceLayout>
        <PageHeader
          title="Medical Expenses"
          subtitle="Track and manage your healthcare expenses and insurance claims"
        />
        <ErrorDisplay
          error={error}
          variant="card"
          showRetry={true}
          onRetry={() => refetch()}
        />
      </FinanceLayout>
    );
  }

  return (
    <FinanceLayout>
      <PageHeader
        title="Medical Expenses"
        subtitle="Track and manage your healthcare expenses and insurance claims"
        actions={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddExpense}
            sx={{ backgroundColor: "primary.main" }}
          >
            Add Medical Expense
          </Button>
        }
      />

      {showSpinner ? (
        <LoadingState variant="card" message="Loading medical expenses..." />
      ) : (
        <div>
          {/* Summary Bar */}
          <Box sx={{ maxWidth: 800, mx: "auto", mb: 3 }}>
            <SummaryBar
              total={currencyFormat(totalBilled)}
              cleared={currencyFormat(totalInsurancePaid)}
              outstanding={currencyFormat(totalOutstanding)}
              future={currencyFormat(totalPatientResponsibility)}
              totalLabel="Billed Amount"
              clearedLabel="Insurance Paid"
              outstandingLabel="Outstanding"
              futureLabel="Patient Responsibility"
            />
          </Box>

          <Box display="flex" justifyContent="center">
            <Box sx={{ width: "fit-content" }}>
              {medicalExpenses && medicalExpenses.length > 0 ? (
                <DataGridBase
                  rows={medicalExpenses.filter((row) => row != null) || []}
                  columns={columns}
                  getRowId={(row) => row.medicalExpenseId}
                  pageSizeOptions={[25, 50, 100]}
                  checkboxSelection={false}
                  rowSelection={false}
                  autoHeight={true}
                />
              ) : (
                <EmptyState
                  title="No Medical Expenses Found"
                  message="You haven't added any medical expenses yet. Start tracking your healthcare expenses."
                  dataType="generic"
                  variant="create"
                  actionLabel="Add Medical Expense"
                  onAction={handleAddExpense}
                  onRefresh={() => refetch()}
                />
              )}
            </Box>
          </Box>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={showModalDelete}
        onClose={() => setShowModalDelete(false)}
        onConfirm={handleDeleteExpense}
        title="Confirm Deletion"
        message={`Are you sure you want to delete the medical expense for "${selectedExpense?.serviceDescription || "this service"}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
      />

      {/* Add/Edit Medical Expense Form Dialog */}
      <Dialog
        open={showModalForm}
        onClose={handleFormCancel}
        maxWidth="md"
        fullWidth
      >
        <MedicalExpenseForm
          initialData={selectedExpense || undefined}
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
          isEdit={isEditMode}
        />
      </Dialog>

      <SnackbarBaseline
        message={message}
        state={showSnackbar}
        handleSnackbarClose={handleSnackbarClose}
      />
    </FinanceLayout>
  );
}
