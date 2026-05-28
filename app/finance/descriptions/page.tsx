"use client";
import { getErrorMessage } from "../../../types";
import React, { useState } from "react";
import { GridColDef } from "@mui/x-data-grid";
import { Box, Button, Link, Checkbox } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import SnackbarBaseline from "../../../components/SnackbarBaseline";
import ErrorDisplay from "../../../components/ErrorDisplay";
import EmptyState from "../../../components/EmptyState";
import LoadingState from "../../../components/LoadingState";
import ContentContainer from "../../../components/ContentContainer";
import MergeDialog from "../../../components/MergeDialog";
import NameActiveStatusFormFields from "../../../components/NameActiveStatusFormFields";
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
import { useSpinnerEffect } from "../../../hooks/useSpinnerEffect";
import { useRowSelection } from "../../../hooks/useRowSelection";
import { modalTitles, modalBodies } from "../../../utils/modalMessages";
import { validateName } from "../../../utils/validateName";
import { createDeleteColumn } from "../../../utils/createDeleteColumn";
import { coerceActiveStatus } from "../../../utils/coerceActiveStatus";
import { useLocalStorageCache } from "../../../hooks/useLocalStorageCache";
import { createProcessRowUpdate } from "../../../utils/createProcessRowUpdate";

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

  const [selectedDescription, setSelectedDescription] = useState<Description | null>(null);
  const [descriptionData, setDescriptionData] = useState<Description | null>(null);
  const [formErrors, setFormErrors] = useState<{
    descriptionName?: string;
    activeStatus?: string;
  }>({});
  const [showModalMerge, setShowModalMerge] = useState(false);

  const { save, getStored } = useLocalStorageCache<Description>({
    storageKey: DESCRIPTIONS_CACHE_DATA_KEY,
    cacheEnabledKey: DESCRIPTIONS_CACHE_ENABLED_KEY,
  });

  const {
    data: fetchedDescriptions,
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
  } = useRowSelection(fetchedDescriptions, getRowId);

  useSpinnerEffect(setShowSpinner, isFetchingDescriptions, isSuccessDescriptions, loading, isAuthenticated);

  const handleDeleteRow = async () => {
    if (selectedDescription) {
      try {
        await deleteDescription(selectedDescription);
        handleSuccess("Description deleted successfully.");
      } catch (error) {
        handleError(error, `Delete Description: ${getErrorMessage(error)}`, false);
      } finally {
        setShowModalDelete(false);
        setSelectedDescription(null);
      }
    }
  };

  const handleAddRow = async (newData: Description) => {
    const errs: { descriptionName?: string; activeStatus?: string } = {};
    const nameErr = validateName(newData?.descriptionName || "");
    if (nameErr) errs.descriptionName = nameErr;

    const { coerced, error: statusErr } = coerceActiveStatus(
      (newData as any)?.activeStatus,
    );
    if (statusErr) {
      errs.activeStatus = statusErr;
    } else if (coerced !== undefined) {
      newData.activeStatus = coerced;
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
      if (cacheEnabled) save(newData);
      handleSuccess("Description added successfully.");
      setFormErrors({});
    } catch (error) {
      handleError(error, `Add Description error: ${getErrorMessage(error)}`, false);
    } finally {
      setShowModalAdd(false);
    }
  };

  const handleOpenAddModal = () => {
    setDescriptionData(cacheEnabled ? getStored() : null);
    setFormErrors({});
    setShowModalAdd(true);
  };

  const handleMerge = async (name: string) => {
    const selectedNames = (fetchedDescriptions || [])
      .filter((row) => rowSelection.includes(getRowId(row)))
      .map((row) => row.descriptionName);
    try {
      await mergeDescriptions({ sourceNames: selectedNames, targetName: name.trim() });
      handleSuccess("Descriptions merged successfully.");
      setShowModalMerge(false);
      clearSelection();
      refetchDescriptions();
    } catch (error: unknown) {
      handleError(error, `Merge Descriptions error: ${getErrorMessage(error)}`, false);
    }
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
      renderCell: (params) => (
        <Link href={`/finance/transactions/description/${params.value}`}>
          {params.value}
        </Link>
      ),
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
              onClick={handleOpenAddModal}
              sx={{ backgroundColor: "primary.main" }}
            >
              Add Description
            </Button>
            {rowSelection.length > 0 && (
              <Button variant="outlined" onClick={() => setShowModalMerge(true)}>
                Merge
              </Button>
            )}
          </Box>
        }
      />
      {showSpinner ? (
        <LoadingState variant="card" message="Loading descriptions..." />
      ) : (
        <ContentContainer>
          {fetchedDescriptions && fetchedDescriptions.length > 0 ? (
            <DataGridBase
              rows={fetchedDescriptions.filter((row) => row != null)}
              columns={columns}
              getRowId={getRowId}
              paginationModel={paginationModel}
              onPaginationModelChange={(newModel) => setPaginationModel(newModel)}
              pageSizeOptions={[25, 50, 100]}
              autoHeight
              disableColumnResize={false}
              processRowUpdate={createProcessRowUpdate<Description>(
                (newRow, oldRow) => updateDescription({ oldDescription: oldRow, newDescription: newRow }),
                "Description updated successfully.",
                "Update Description failure.",
                handleSuccess,
                handleError,
              )}
            />
          ) : (
            <EmptyState
              title="No Descriptions Found"
              message="You haven't created any descriptions yet. Create your first description to standardize your transaction records."
              dataType="descriptions"
              variant="create"
              actionLabel="Add Description"
              onAction={handleOpenAddModal}
              onRefresh={() => refetchDescriptions()}
            />
          )}
        </ContentContainer>
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
        message={modalBodies.confirmDeletion("description", selectedDescription?.descriptionName ?? "")}
        confirmText="Delete"
        cancelText="Cancel"
      />

      <MergeDialog
        open={showModalMerge}
        title="Merge Descriptions"
        onClose={() => setShowModalMerge(false)}
        onSubmit={handleMerge}
      />

      <FormDialog
        open={showModalAdd}
        onClose={() => setShowModalAdd(false)}
        onSubmit={() =>
          handleAddRow(descriptionData ?? ({ descriptionName: "", activeStatus: true } as Description))
        }
        title={modalTitles.addNew("description")}
        submitText="Add"
      >
        <NameActiveStatusFormFields
          nameValue={descriptionData?.descriptionName || ""}
          nameError={formErrors.descriptionName}
          activeStatus={!!descriptionData?.activeStatus}
          activeStatusError={formErrors.activeStatus}
          onNameChange={(value) =>
            setDescriptionData((prev) => (prev ? { ...prev, descriptionName: value } : null))
          }
          onActiveStatusChange={(checked) =>
            setDescriptionData((prev: Description) => ({ ...prev, activeStatus: checked }))
          }
          cacheEnabled={cacheEnabled}
          cacheEnabledKey={DESCRIPTIONS_CACHE_ENABLED_KEY}
          cacheDataKey={DESCRIPTIONS_CACHE_DATA_KEY}
          onCacheChange={setCacheEnabled}
        />
      </FormDialog>
    </>
  );
}
