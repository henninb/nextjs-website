"use client";
import { getErrorMessage } from "../../../types";
import React, { useState, useEffect } from "react";
import { GridColDef } from "@mui/x-data-grid";
import {
  Box,
  Button,
  Divider,
  Fade,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import TuneIcon from "@mui/icons-material/Tune";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import CacheToggleCheckbox from "../../../components/CacheToggleCheckbox";
import SnackbarBaseline from "../../../components/SnackbarBaseline";
import ErrorDisplay from "../../../components/ErrorDisplay";
import EmptyState from "../../../components/EmptyState";
import LoadingState from "../../../components/LoadingState";
import ContentContainer from "../../../components/ContentContainer";
import useParameterFetch from "../../../hooks/useParameterFetch";
import useParameterInsert from "../../../hooks/useParameterInsert";
import useParameterDelete from "../../../hooks/useParameterDelete";
import Parameter from "../../../model/Parameter";
import useParameterUpdate from "../../../hooks/useParameterUpdate";
import PageHeader from "../../../components/PageHeader";
import SpendingBonusConfig, { isBonusParam } from "../../../components/SpendingBonusConfig";
import DataGridBase from "../../../components/DataGridBase";
import ConfirmDialog from "../../../components/ConfirmDialog";
import FormDialog from "../../../components/FormDialog";
import { useFinancePageState } from "../../../hooks/useFinancePageState";
import { useSpinnerEffect } from "../../../hooks/useSpinnerEffect";
import { useLocalStorageCache } from "../../../hooks/useLocalStorageCache";
import { modalTitles, modalBodies } from "../../../utils/modalMessages";
import { createDeleteColumn } from "../../../utils/createDeleteColumn";
import { createProcessRowUpdate } from "../../../utils/createProcessRowUpdate";

const CONFIGURATION_CACHE_ENABLED_KEY = "finance_cache_enabled_configuration";
const CONFIGURATION_CACHE_DATA_KEY = "finance_cached_data_configuration";

const sectionLabelSx = {
  textTransform: "uppercase" as const,
  letterSpacing: "0.08em",
  fontWeight: 600,
  color: "text.secondary",
  fontSize: "0.7rem",
};

export default function Configuration() {
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
  } = useFinancePageState(CONFIGURATION_CACHE_ENABLED_KEY);

  const [parameterData, setParameterData] = useState<Parameter | null>(null);
  const [selectedParameter, setSelectedParameter] = useState<Parameter | null>(null);
  const [formErrors, setFormErrors] = useState<{
    parameterName?: string;
    parameterValue?: string;
  }>({});
  const [offlineRows, setOfflineRows] = useState<Parameter[]>([]);

  const { save: saveParameter, getStored } = useLocalStorageCache<Parameter>({
    storageKey: CONFIGURATION_CACHE_DATA_KEY,
    cacheEnabledKey: CONFIGURATION_CACHE_ENABLED_KEY,
  });

  const {
    data: fetchedParameters,
    isSuccess: isSuccessParameters,
    isLoading: isFetchingParameters,
    isError: isErrorParameters,
    error: errorParameters,
    refetch: refetchParameters,
  } = useParameterFetch();
  const { mutateAsync: insertParameter } = useParameterInsert();
  const { mutateAsync: updateParameter } = useParameterUpdate();
  const { mutateAsync: deleteParameter } = useParameterDelete();

  useSpinnerEffect(setShowSpinner, isFetchingParameters, isSuccessParameters, loading, isAuthenticated);

  useEffect(() => {
    const storedRows = localStorage.getItem("offlineParameters");
    if (storedRows) {
      setOfflineRows(JSON.parse(storedRows));
    }
  }, []);

  useEffect(() => {
    const syncOfflineRows = async () => {
      if (navigator.onLine && offlineRows.length > 0) {
        let remainingRows: Parameter[] = [];
        for (const row of offlineRows) {
          try {
            await insertParameter({ payload: row });
          } catch (error) {
            console.error("Error syncing row:", error);
            remainingRows.push(row);
          }
        }
        if (remainingRows.length !== offlineRows.length) {
          setOfflineRows((prevRows) =>
            prevRows.filter((row) => remainingRows.includes(row)),
          );
          localStorage.setItem("offlineParameters", JSON.stringify(remainingRows));
        }
      }
    };
    window.addEventListener("online", syncOfflineRows);
    return () => window.removeEventListener("online", syncOfflineRows);
  }, [insertParameter]);

  const handleDeleteRow = async () => {
    if (!selectedParameter?.parameterId) return;

    const isOfflineRow = offlineRows.some(
      (row) => row.parameterId === selectedParameter.parameterId,
    );

    if (isOfflineRow) {
      const updatedOfflineRows = offlineRows.filter(
        (row) => row.parameterId !== selectedParameter.parameterId,
      );
      setOfflineRows(updatedOfflineRows);
      localStorage.setItem("offlineParameters", JSON.stringify(updatedOfflineRows));
      handleSuccess("Offline parameter deleted successfully.");
    } else {
      try {
        await deleteParameter(selectedParameter);
        handleSuccess("Parameter deleted successfully.");
      } catch (error) {
        handleError(error, "Delete Parameter failure.", false);
      }
    }

    setShowModalDelete(false);
    setSelectedParameter(null);
  };

  const handleAddRow = async (newData: Parameter) => {
    const errs: { parameterName?: string; parameterValue?: string } = {};
    if (!newData?.parameterName || newData.parameterName.trim() === "") {
      errs.parameterName = "Name is required";
    }
    if (!newData?.parameterValue || newData.parameterValue.toString().trim() === "") {
      errs.parameterValue = "Value is required";
    }
    if (Object.keys(errs).length > 0) {
      setFormErrors(errs);
      setMessage(errs.parameterName || errs.parameterValue || "Validation failed");
      setSnackbarSeverity("error");
      setShowSnackbar(true);
      return;
    }

    try {
      await insertParameter({ payload: newData });
      if (cacheEnabled) saveParameter(newData);
      setParameterData((prev: Parameter | null) =>
        prev?.parameterId ? prev : { ...newData, parameterId: 0 },
      );
      setShowModalAdd(false);
      handleSuccess("Configuration added successfully.");
      setFormErrors({});
    } catch (error) {
      handleError(error, "Add Configuration", false);

      if (
        !navigator.onLine ||
        (getErrorMessage(error) && getErrorMessage(error).includes("Failed to fetch"))
      ) {
        const newOfflineRow = { ...newData, parameterId: 0 };
        const updatedOfflineRows = [...offlineRows, newOfflineRow];
        setOfflineRows(updatedOfflineRows as [Parameter]);
        localStorage.setItem("offlineParameters", JSON.stringify(updatedOfflineRows));
        handleSuccess("Parameter saved offline.");
        setParameterData({ ...newData, parameterId: Math.random() });
      }
    }
  };

  const handleOpenAddModal = () => {
    setParameterData(cacheEnabled ? getStored() : null);
    setFormErrors({});
    setShowModalAdd(true);
  };

  const columns: GridColDef[] = [
    { field: "parameterName", headerName: "Name", width: 200, editable: true },
    { field: "parameterValue", headerName: "Value", width: 300, editable: true },
    createDeleteColumn<Parameter>((row) => {
      setSelectedParameter(row);
      setShowModalDelete(true);
    }),
  ];

  const rawParams = (fetchedParameters || []).filter(
    (p) => !isBonusParam(p.parameterName),
  );

  if (isErrorParameters) {
    return (
      <>
        <PageHeader
          title="Configuration"
          subtitle="Manage spending bonuses and system parameters"
        />
        <ErrorDisplay
          error={errorParameters}
          variant="card"
          showRetry={true}
          onRetry={() => refetchParameters()}
        />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Configuration"
        subtitle="Manage spending bonuses and system parameters"
      />

      {showSpinner ? (
        <LoadingState variant="card" message="Loading configuration..." />
      ) : (
        <Fade in={true} timeout={400}>
          <Box>
            <ContentContainer>
              {/* Spending Bonuses section */}
              <Box sx={{ mb: 4 }}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    mb: 2,
                  }}
                >
                  <EmojiEventsIcon sx={{ fontSize: "1rem", color: "text.secondary" }} />
                  <Typography variant="caption" sx={sectionLabelSx}>
                    Spending Bonuses
                  </Typography>
                </Box>
                <SpendingBonusConfig
                  onError={handleError}
                  onSuccess={handleSuccess}
                />
              </Box>

              <Divider sx={{ mb: 4 }} />

              {/* System Parameters section */}
              <Box>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    mb: 2,
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <TuneIcon sx={{ fontSize: "1rem", color: "text.secondary" }} />
                    <Typography variant="caption" sx={sectionLabelSx}>
                      System Parameters
                    </Typography>
                  </Box>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleOpenAddModal}
                    sx={{ backgroundColor: "primary.main" }}
                  >
                    Add Parameter
                  </Button>
                </Box>

                {rawParams.length > 0 || offlineRows.length > 0 ? (
                  <DataGridBase
                    rows={[...rawParams, ...offlineRows]}
                    columns={columns}
                    getRowId={(row: Parameter) =>
                      row.parameterId || `fallback-${Date.now()}-${Math.random()}`
                    }
                    checkboxSelection={false}
                    rowSelection={false}
                    paginationModel={paginationModel}
                    onPaginationModelChange={(newModel) => setPaginationModel(newModel)}
                    pageSizeOptions={[25, 50, 100]}
                    disableRowSelectionOnClick
                    autoHeight
                    processRowUpdate={createProcessRowUpdate<Parameter>(
                      (newRow, oldRow) =>
                        updateParameter({ oldParameter: oldRow, newParameter: newRow }),
                      "Parameter updated successfully.",
                      "Parameter Update failure.",
                      handleSuccess,
                      handleError,
                    )}
                  />
                ) : (
                  <EmptyState
                    title="No Parameters Found"
                    message="No system parameters configured yet."
                    dataType="parameters"
                    variant="create"
                    actionLabel="Add Parameter"
                    onAction={handleOpenAddModal}
                    onRefresh={() => refetchParameters()}
                  />
                )}
              </Box>
            </ContentContainer>
          </Box>
        </Fade>
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
          "parameter",
          selectedParameter?.parameterName ?? "",
        )}
        confirmText="Delete"
        cancelText="Cancel"
      />

      <FormDialog
        open={showModalAdd}
        onClose={() => setShowModalAdd(false)}
        onSubmit={() =>
          handleAddRow(
            parameterData ?? ({ parameterName: "", parameterValue: "" } as Parameter),
          )
        }
        title={modalTitles.addNew("parameter")}
        submitText="Add"
      >
        <TextField
          label="Name"
          fullWidth
          margin="normal"
          value={parameterData?.parameterName || ""}
          error={!!formErrors.parameterName}
          helperText={formErrors.parameterName}
          onChange={(e) =>
            setParameterData(
              (prev) => ({ ...prev, parameterName: e.target.value }) as Parameter,
            )
          }
        />
        <TextField
          label="Value"
          fullWidth
          margin="normal"
          value={parameterData?.parameterValue || ""}
          error={!!formErrors.parameterValue}
          helperText={formErrors.parameterValue}
          onChange={(e) =>
            setParameterData((prev) =>
              prev ? { ...prev, parameterValue: e.target.value } : null,
            )
          }
        />
        <CacheToggleCheckbox
          checked={cacheEnabled}
          cacheEnabledKey={CONFIGURATION_CACHE_ENABLED_KEY}
          cacheDataKey={CONFIGURATION_CACHE_DATA_KEY}
          onChange={setCacheEnabled}
        />
      </FormDialog>
    </>
  );
}
