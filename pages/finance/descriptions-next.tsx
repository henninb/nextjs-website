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
  Switch,
  FormControlLabel,
  Typography,
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
import { useAuth } from "../../components/AuthProvider";
import { modalTitles, modalBodies } from "../../utils/modalMessages";

import Description from "../../model/Description";

import useDescriptionFetchGql from "../../hooks/useDescriptionFetchGql";
import useDescriptionInsertGql from "../../hooks/useDescriptionInsertGql";
import useDescriptionDeleteGql from "../../hooks/useDescriptionDeleteGql";
import useDescriptionUpdateGql from "../../hooks/useDescriptionUpdateGql";

export default function DescriptionsNextGen() {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();

  const [message, setMessage] = useState("");
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [snackbarSeverity, setSnackbarSeverity] = useState<
    "error" | "warning" | "info" | "success"
  >("info");
  const [showSpinner, setShowSpinner] = useState(true);
  const [showModalAdd, setShowModalAdd] = useState(false);
  const [showModalDelete, setShowModalDelete] = useState(false);
  const [paginationModel, setPaginationModel] = useState({
    pageSize: 50,
    page: 0,
  });

  const [descriptionData, setDescriptionData] = useState<Description | null>(
    null,
  );
  const [selectedDescription, setSelectedDescription] =
    useState<Description | null>(null);
  const [formErrors, setFormErrors] = useState<{
    descriptionName?: string;
    activeStatus?: string;
  }>({});

  const {
    data: fetchedDescriptions,
    isSuccess: isSuccessDescriptions,
    isFetching: isFetchingDescriptions,
    isError: isErrorDescriptions,
    error: errorDescriptions,
    refetch: refetchDescriptions,
  } = useDescriptionFetchGql();

  const { mutateAsync: insertDescription } = useDescriptionInsertGql();
  const { mutateAsync: deleteDescription } = useDescriptionDeleteGql();
  const { mutateAsync: updateDescription } = useDescriptionUpdateGql();

  const descriptionsToDisplay =
    fetchedDescriptions?.filter((row) => row != null) || [];

  useEffect(() => {
    if (loading) setShowSpinner(true);
    if (!loading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [loading, isAuthenticated, router]);

  useEffect(() => {
    if (
      isFetchingDescriptions ||
      loading ||
      (!loading && !isAuthenticated)
    ) {
      setShowSpinner(true);
      return;
    }
    if (isSuccessDescriptions) {
      setShowSpinner(false);
    }
  }, [
    isSuccessDescriptions,
    isErrorDescriptions,
    isFetchingDescriptions,
    loading,
    isAuthenticated,
  ]);

  const handleDeleteRow = async () => {
    if (selectedDescription) {
      try {
        await deleteDescription(selectedDescription);
        handleSuccess("Description deleted successfully.");
      } catch (error: any) {
        handleError(error, "Delete Description failure.", false);
      } finally {
        setShowModalDelete(false);
        setSelectedDescription(null);
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

  const handleAddRow = async (newData: Description) => {
    const errs: { descriptionName?: string; activeStatus?: string } = {};
    const name = newData?.descriptionName || "";
    if (!name || name.trim() === "") {
      errs.descriptionName = "Name is required";
    } else {
      if (name.length > 50) {
        errs.descriptionName = "Name too long (max 50 characters)";
      } else if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
        errs.descriptionName =
          "Name can only contain letters, numbers, hyphens, and underscores (no spaces)";
      }
    }
    // Validate status: must be boolean; allow string 'true'/'false'
    const statusValue = (newData as any)?.activeStatus;
    if (typeof statusValue !== "boolean") {
      if (statusValue === "true" || statusValue === "false") {
        newData.activeStatus = statusValue === "true";
      } else if (statusValue !== undefined) {
        errs.activeStatus = "Status must be true or false";
      }
    }
    if (Object.keys(errs).length > 0) {
      setFormErrors(errs);
      setMessage(errs.descriptionName || "Validation failed");
      setSnackbarSeverity("error");
      setShowSnackbar(true);
      return;
    }

    try {
      console.log("from handleAddRow: " + JSON.stringify(newData));
      await insertDescription({ description: newData });

      handleSuccess("Description added successfully.");
    } catch (error: any) {
      handleError(error, `Add Description error: ${error.message}`, false);
    } finally {
      setShowModalAdd(false);
    }
  };

  const getRowId = (row: any) =>
    row.descriptionId ?? `${row.descriptionName}-${row.activeStatus}`;

  const columns: GridColDef[] = [
    {
      field: "descriptionName",
      headerName: "Name",
      flex: 2,
      minWidth: 300,
      editable: true,
      renderCell: (params) => {
        return (
          <Link href={`/finance/transactions/description/${params.value}`}>
            {params.value}
          </Link>
        );
      },
    },
    {
      field: "activeStatus",
      headerName: "Status",
      flex: 0.6,
      minWidth: 100,
      editable: true,
      renderCell: (params) => {
        return params.value ? "Active" : "Inactive";
      },
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
              setSelectedDescription(params.row);
              setShowModalDelete(true);
            }}
          >
            <DeleteIcon />
          </IconButton>
        </Tooltip>
      ),
    },
  ];

  if (isErrorDescriptions) {
    return (
      <FinanceLayout>
        <PageHeader
          title="Description Management (Next‑Gen)"
          subtitle="GraphQL-powered description organization for better tracking"
          actions={
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setShowModalAdd(true)}
              sx={{ backgroundColor: "primary.main" }}
            >
              Add Description
            </Button>
          }
        />
        <ErrorDisplay
          error={errorDescriptions}
          variant="card"
          showRetry={true}
          onRetry={() => refetchDescriptions()}
        />
      </FinanceLayout>
    );
  }

  return (
    <div>
      <FinanceLayout>
        <PageHeader
          title="Description Management (Next‑Gen)"
          subtitle="GraphQL-powered description organization for better tracking"
          actions={
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setShowModalAdd(true)}
              sx={{ backgroundColor: "primary.main" }}
            >
              Add Description
            </Button>
          }
        />
        {showSpinner ? (
          <LoadingState variant="card" message="Loading descriptions..." />
        ) : descriptionsToDisplay && descriptionsToDisplay.length > 0 ? (
          <Box display="flex" justifyContent="center">
            <Box sx={{ width: "100%", maxWidth: "1200px" }}>
              <DataGridBase
                rows={descriptionsToDisplay}
                columns={columns}
                getRowId={getRowId}
                checkboxSelection={false}
                rowSelection={false}
                paginationModel={paginationModel}
                onPaginationModelChange={(m) => setPaginationModel(m)}
                pageSizeOptions={[25, 50, 100]}
                processRowUpdate={async (
                  newRow: Description,
                  oldRow: Description,
                ): Promise<Description> => {
                  if (JSON.stringify(newRow) === JSON.stringify(oldRow))
                    return oldRow;
                  try {
                    await updateDescription({
                      oldDescription: oldRow,
                      newDescription: newRow,
                    });
                    handleSuccess("Description updated successfully.");
                    return { ...newRow };
                  } catch (error: any) {
                    handleError(error, "Update Description failure.", false);
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
            title="No Descriptions Found"
            message="You haven't created any descriptions yet. Create your first description to organize your transactions."
            dataType="descriptions"
            variant="create"
            actionLabel="Add Description"
            onAction={() => setShowModalAdd(true)}
            onRefresh={() => refetchDescriptions()}
          />
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
          message={modalBodies.confirmDeletion(
            "description",
            selectedDescription?.descriptionName ?? "",
          )}
          confirmText="Delete"
          cancelText="Cancel"
        />

        <FormDialog
          open={showModalAdd}
          onClose={() => setShowModalAdd(false)}
          onSubmit={() => {
            if (descriptionData) {
              handleAddRow(descriptionData);
            } else {
              handleAddRow({
                descriptionId: 0,
                descriptionName: "",
                activeStatus: true,
              } as Description);
            }
          }}
          title={modalTitles.addNew("description")}
          submitText="Add"
        >
          <TextField
            label="Name"
            fullWidth
            margin="normal"
            value={descriptionData?.descriptionName || ""}
            error={!!formErrors.descriptionName}
            helperText={
              formErrors.descriptionName ||
              "Lowercase letters, numbers, hyphens, and underscores only (no spaces)"
            }
            onChange={(e) =>
              setDescriptionData((prev) => ({
                ...prev,
                descriptionId: prev?.descriptionId || 0,
                descriptionName: e.target.value,
                activeStatus: prev?.activeStatus ?? true,
              }))
            }
          />
          <Box mt={1}>
            <FormControlLabel
              control={
                <Switch
                  checked={!!descriptionData?.activeStatus}
                  onChange={(e) =>
                    setDescriptionData((prev: any) => ({
                      ...prev,
                      descriptionId: prev?.descriptionId || 0,
                      descriptionName: prev?.descriptionName || "",
                      activeStatus: e.target.checked,
                    }))
                  }
                />
              }
              label="Status"
            />
            {formErrors.activeStatus && (
              <Typography color="error" variant="caption">
                {formErrors.activeStatus}
              </Typography>
            )}
          </Box>
        </FormDialog>
      </FinanceLayout>
    </div>
  );
}
