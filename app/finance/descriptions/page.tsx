"use client";
import { getErrorMessage } from "../../../types";
import React, { useState, useEffect } from "react";
import { GridColDef } from "@mui/x-data-grid";
import {
  Box,
  Link,
  Button,
  TextField,
  Typography,
  Switch,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import CacheToggleCheckbox from "../../../components/CacheToggleCheckbox";
import SnackbarBaseline from "../../../components/SnackbarBaseline";
import ErrorDisplay from "../../../components/ErrorDisplay";
import EmptyState from "../../../components/EmptyState";
import LoadingState from "../../../components/LoadingState";
import useFetchDescription from "../../../hooks/useDescriptionFetch";
import useDescriptionInsert from "../../../hooks/useDescriptionInsert";
import useDescriptionDelete from "../../../hooks/useDescriptionDelete";
import Description from "../../../model/Description";
import useDescriptionUpdate from "../../../hooks/useDescriptionUpdate";
import useDescriptionMerge from "../../../hooks/useDescriptionMerge";
import PageHeader from "../../../components/PageHeader";
import DataGridBase from "../../../components/DataGridBase";
import ConfirmDialog from "../../../components/ConfirmDialog";
import FormDialog from "../../../components/FormDialog";
import { useFinancePageState } from "../../../hooks/useFinancePageState";
import { useRowSelection } from "../../../hooks/useRowSelection";
import { modalTitles, modalBodies } from "../../../utils/modalMessages";
import { validateName } from "../../../utils/validateName";
import { createDeleteColumn } from "../../../utils/createDeleteColumn";

const DESCRIPTIONS_CACHE_ENABLED_KEY = "finance_cache_enabled_descriptions";
const DESCRIPTIONS_CACHE_DATA_KEY = "finance_cached_data_descriptions";

export default function Descriptions() {
  const {
    message,
    showSnackbar,
    snackbarSeverity,
    showSpinner,
    setShowSpinner,
    showModalAdd,
    setShowModalAdd,
    showModalDelete,
    setShowModalDelete,
    paginationModel,
    setPaginationModel,
    cacheEnabled,
    setCacheEnabled,
    isAuthenticated,
    loading,
    handleError,
    handleSuccess,
    handleSnackbarClose,
    setMessage,
    setShowSnackbar,
    setSnackbarSeverity,
  } = useFinancePageState(DESCRIPTIONS_CACHE_ENABLED_KEY);
  const [selectedDescription, setSelectedDescription] =
    useState<Description | null>(null);
  const [descriptionData, setDescriptionData] = useState<Description | null>(
    null,
  );
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

  const getRowId = (row: Description) =>
    row.descriptionId ?? `${row.descriptionName}-${row.activeStatus}`;

  const {
    rowSelection,
    isRowSelected,
    handleRowToggle,
    handleSelectAll,
    clearSelection,
    isAllSelected,
    isIndeterminate,
  } = useRowSelection(fetchedDescrptions, getRowId);

  const [showModalMerge, setShowModalMerge] = useState(false);
  const [mergeName, setMergeName] = useState("");
  const [mergeError, setMergeError] = useState<string | undefined>(undefined);

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
        handleError(
          error,
          `Delete Description: ${getErrorMessage(error)}`,
          false,
        );
      } finally {
        setShowModalDelete(false);
        setSelectedDescription(null);
      }
    }
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
      if (cacheEnabled && typeof window !== "undefined") {
        localStorage.setItem(
          DESCRIPTIONS_CACHE_DATA_KEY,
          JSON.stringify(newData),
        );
      }
      handleSuccess(`Description added successfully.`);
      setFormErrors({});
    } catch (error) {
      handleError(
        error,
        `Add Description error: ${getErrorMessage(error)}`,
        false,
      );
    } finally {
      setShowModalAdd(false);
    }
  };

  const handleOpenAddModal = () => {
    if (cacheEnabled && typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(DESCRIPTIONS_CACHE_DATA_KEY);
        setDescriptionData(stored ? JSON.parse(stored) : null);
      } catch {
        setDescriptionData(null);
      }
    } else {
      setDescriptionData(null);
    }
    setFormErrors({});
    setShowModalAdd(true);
  };

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
    createDeleteColumn<Description>((row) => {
      setSelectedDescription(row);
      setShowModalDelete(true);
    }),
  ];

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
      clearSelection();
      refetchDescriptions();
    } catch (error: unknown) {
      handleError(
        error,
        `Merge Descriptions error: ${getErrorMessage(error)}`,
        false,
      );
    }
  };

  // Handle error states first
  if (isErrorDescriptions) {
    return (
      <>
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
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Description Management"
        subtitle="Create and manage transaction descriptions to standardize your records"
        actions={
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenAddModal()}
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
        <>
          <Box sx={{ display: "flex", justifyContent: "center" }}>
            <Box sx={{ width: "100%", maxWidth: "1200px" }}>
              {fetchedDescrptions && fetchedDescrptions.length > 0 ? (
                <DataGridBase
                  rows={fetchedDescrptions?.filter((row) => row != null) || []}
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
                        `Update Description error: ${getErrorMessage(error)}`,
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
                  onAction={() => handleOpenAddModal()}
                  onRefresh={() => refetchDescriptions()}
                />
              )}
            </Box>
          </Box>
          <SnackbarBaseline
            message={message}
            state={showSnackbar}
            handleSnackbarClose={handleSnackbarClose}
            severity={snackbarSeverity}
          />
        </>
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
            setDescriptionData((prev) =>
              prev
                ? {
                    ...prev,
                    descriptionName: e.target.value,
                  }
                : null,
            )
          }
        />
        <Box sx={{ mt: 1 }}>
          <FormControlLabel
            control={
              <Switch
                checked={!!descriptionData?.activeStatus}
                onChange={(e) =>
                  setDescriptionData((prev: Description) => ({
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
        <CacheToggleCheckbox
          checked={cacheEnabled}
          cacheEnabledKey={DESCRIPTIONS_CACHE_ENABLED_KEY}
          cacheDataKey={DESCRIPTIONS_CACHE_DATA_KEY}
          onChange={setCacheEnabled}
        />
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
    </>
  );
}
