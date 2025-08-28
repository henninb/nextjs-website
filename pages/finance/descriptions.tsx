import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { GridColDef } from "@mui/x-data-grid";
import {
  Box,
  Link,
  Button,
  IconButton,
  Tooltip,
  TextField,
  Typography,
  Switch,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import Spinner from "../../components/Spinner";
import SnackbarBaseline from "../../components/SnackbarBaseline";
import ErrorDisplay from "../../components/ErrorDisplay";
import EmptyState from "../../components/EmptyState";
import LoadingState from "../../components/LoadingState";
import useFetchDescription from "../../hooks/useDescriptionFetch";
import useDescriptionInsert from "../../hooks/useDescriptionInsert";
import useDescriptionDelete from "../../hooks/useDescriptionDelete";
import Description from "../../model/Description";
import useDescriptionUpdate from "../../hooks/useDescriptionUpdate";
import useDescriptionMerge from "../../hooks/useDescriptionMerge";
import FinanceLayout from "../../layouts/FinanceLayout";
import PageHeader from "../../components/PageHeader";
import DataGridBase from "../../components/DataGridBase";
import ConfirmDialog from "../../components/ConfirmDialog";
import FormDialog from "../../components/FormDialog";
import { useAuth } from "../../components/AuthProvider";
import { modalTitles, modalBodies } from "../../utils/modalMessages";

export default function Descriptions() {
  const [message, setMessage] = useState("");
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [snackbarSeverity, setSnackbarSeverity] = useState<
    "error" | "warning" | "info" | "success"
  >("info");
  const [showSpinner, setShowSpinner] = useState(true);
  const [showModalAdd, setShowModalAdd] = useState(false);
  const [showModalDelete, setShowModalDelete] = useState(false);
  const [selectedDescription, setSelectedDescription] =
    useState<Description | null>(null);
  const [descriptionData, setDescriptionData] = useState<Description | null>(
    null,
  );
  const [paginationModel, setPaginationModel] = useState({
    pageSize: 50,
    page: 0,
  });
  const [formErrors, setFormErrors] = useState<{
    descriptionName?: string;
    activeStatus?: string;
  }>({});

  const {
    data: fetchedDescrptions,
    isSuccess: isSuccessDescriptions,
    isLoading: isFetchingDescriptions,
    isError: isErrorDescriptions,
    error: errorDescriptions,
    refetch: refetchDescriptions,
  } = useFetchDescription();
  const { mutateAsync: insertDescription } = useDescriptionInsert();
  const { mutateAsync: updateDescription } = useDescriptionUpdate();
  const { mutateAsync: deleteDescription } = useDescriptionDelete();
  const { mutateAsync: mergeDescriptions } = useDescriptionMerge();
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [rowSelection, setRowSelection] = useState<Array<string | number>>([]);
  const [showModalMerge, setShowModalMerge] = useState(false);
  const [mergeName, setMergeName] = useState("");
  const [mergeError, setMergeError] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [loading, isAuthenticated, router]);

  useEffect(() => {
    if (isFetchingDescriptions || loading || (!loading && !isAuthenticated)) {
      setShowSpinner(true);
      return;
    }
    if (isSuccessDescriptions) {
      setShowSpinner(false);
    }
  }, [isSuccessDescriptions, isFetchingDescriptions, loading, isAuthenticated]);

  const handleDeleteRow = async () => {
    if (selectedDescription) {
      try {
        await deleteDescription(selectedDescription);
        handleSuccess(`Description deleted successfully.`);
      } catch (error) {
        handleError(error, `Delete Description: ${error.message}`, false);
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
      if (name.length > 255) {
        errs.descriptionName = "Name too long";
      } else if (!/^[a-zA-Z0-9 _-]+$/.test(name)) {
        errs.descriptionName = "Name contains invalid characters";
      }
    }
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
      await insertDescription(newData);
      handleSuccess(`Description added successfully.`);
      setFormErrors({});
    } catch (error) {
      handleError(error, `Add Description error: ${error.message}`, false);
      if (
        !navigator.onLine ||
        (error.message && error.message.includes("Failed to fetch"))
      ) {
      }
    } finally {
      setShowModalAdd(false);
    }
  };

  const isRowSelected = (rowId: string | number) => rowSelection.includes(rowId);
  
  const handleRowToggle = (rowId: string | number) => {
    setRowSelection(prev => 
      prev.includes(rowId) 
        ? prev.filter(id => id !== rowId)
        : [...prev, rowId]
    );
  };

  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const allRowIds = fetchedDescrptions?.map(row => getRowId(row)) || [];
      setRowSelection(allRowIds);
    } else {
      setRowSelection([]);
    }
  };

  const isAllSelected = fetchedDescrptions?.length > 0 && 
    rowSelection.length === fetchedDescrptions?.length;
  const isIndeterminate = rowSelection.length > 0 && 
    rowSelection.length < (fetchedDescrptions?.length || 0);

  const columns: GridColDef[] = [
    {
      field: "select",
      headerName: "",
      width: 50,
      sortable: false,
      disableColumnMenu: true,
      renderHeader: () => (
        <Checkbox
          checked={isAllSelected}
          indeterminate={isIndeterminate}
          onChange={handleSelectAll}
        />
      ),
      renderCell: (params) => (
        <Checkbox
          checked={isRowSelected(getRowId(params.row))}
          onChange={() => handleRowToggle(getRowId(params.row))}
        />
      ),
    },
    {
      field: "descriptionName",
      headerName: "Name",
      width: 300,
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
      width: 75,
      editable: true,
    },
    {
      field: "descriptionCount",
      headerName: "Count",
      width: 75,
    },
    {
      field: "",
      headerName: "Actions",
      width: 100,
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

  const getRowId = (row: any) =>
    row.descriptionId ?? `${row.descriptionName}-${row.activeStatus}`;

  const validateName = (name: string): string | undefined => {
    const trimmed = (name || "").trim();
    if (!trimmed) return "Name is required";
    if (trimmed.length > 255) return "Name too long";
    if (!/^[a-zA-Z0-9 _-]+$/.test(trimmed))
      return "Name contains invalid characters";
    return undefined;
  };

  const handleMerge = async () => {
    const err = validateName(mergeName);
    if (err) {
      setMergeError(err);
      setMessage(err);
      setSnackbarSeverity("error");
      setShowSnackbar(true);
      return;
    }

    // Map selected ids to description names
    const selectedNames: string[] = (fetchedDescrptions || [])
      .filter((row) => rowSelection.includes(getRowId(row)))
      .map((row) => row.descriptionName);

    try {
      await mergeDescriptions({
        sourceNames: selectedNames,
        targetName: mergeName.trim(),
      });
      handleSuccess("Descriptions merged successfully.");
      setShowModalMerge(false);
      setMergeName("");
      setMergeError(undefined);
      setRowSelection([]);
      refetchDescriptions();
    } catch (error: any) {
      handleError(error, `Merge Descriptions error: ${error.message}`, false);
    }
  };

  // Handle error states first
  if (isErrorDescriptions) {
    return (
      <FinanceLayout>
        <PageHeader
          title="Description Management"
          subtitle="Create and manage transaction descriptions to standardize your records"
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
          title="Description Management"
          subtitle="Create and manage transaction descriptions to standardize your records"
          actions={
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setShowModalAdd(true)}
                sx={{ backgroundColor: "primary.main" }}
              >
                Add Description
              </Button>
              {rowSelection.length > 0 && (
                <Button
                  variant="outlined"
                  onClick={() => setShowModalMerge(true)}
                >
                  Merge
                </Button>
              )}
            </Box>
          }
        />
        {showSpinner ? (
          <LoadingState variant="card" message="Loading descriptions..." />
        ) : (
          <div>
            <Box display="flex" justifyContent="center">
              <Box sx={{ width: "100%", maxWidth: "1200px" }}>
                {fetchedDescrptions && fetchedDescrptions.length > 0 ? (
                  <DataGridBase
                    rows={
                      fetchedDescrptions?.filter((row) => row != null) || []
                    }
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
                      newRow: Description,
                      oldRow: Description,
                    ): Promise<Description> => {
                      if (JSON.stringify(newRow) === JSON.stringify(oldRow)) {
                        return oldRow;
                      }
                      try {
                        await updateDescription({
                          oldDescription: oldRow,
                          newDescription: newRow,
                        });
                        handleSuccess("Description updated successfully.");
                        return { ...newRow };
                      } catch (error) {
                        handleError(
                          error,
                          `Update Description error: ${error.message}`,
                          false,
                        );
                        return oldRow;
                      }
                    }}
                  />
                ) : (
                  <EmptyState
                    title="No Descriptions Found"
                    message="You haven't created any descriptions yet. Create your first description to standardize your transaction records."
                    dataType="descriptions"
                    variant="create"
                    actionLabel="Add Description"
                    onAction={() => setShowModalAdd(true)}
                    onRefresh={() => refetchDescriptions()}
                  />
                )}
              </Box>
            </Box>
            <div>
              <SnackbarBaseline
                message={message}
                state={showSnackbar}
                handleSnackbarClose={handleSnackbarClose}
                severity={snackbarSeverity}
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
            helperText={formErrors.descriptionName}
            onChange={(e) =>
              setDescriptionData((prev) => ({
                ...prev,
                descriptionName: e.target.value,
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

        <FormDialog
          open={showModalMerge}
          onClose={() => {
            setShowModalMerge(false);
            setMergeError(undefined);
            setMergeName("");
          }}
          onSubmit={handleMerge}
          title="Merge Descriptions"
          submitText="Merge"
          disabled={!!validateName(mergeName)}
        >
          <TextField
            label="New Name"
            fullWidth
            margin="normal"
            value={mergeName}
            error={!!mergeError}
            helperText={mergeError}
            onChange={(e) => {
              const next = e.target.value;
              setMergeName(next);
              setMergeError(validateName(next));
            }}
          />
        </FormDialog>
      </FinanceLayout>
    </div>
  );
}
