"use client";
import { getErrorMessage } from "../../../types";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { GridColDef } from "@mui/x-data-grid";
import {
  Box,
  Button,
  IconButton,
  Tooltip,
  TextField,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";

import FinanceLayout from "../../../layouts/FinanceLayout";
import PageHeader from "../../../components/PageHeader";
import DataGridBase from "../../../components/DataGridBase";
import ConfirmDialog from "../../../components/ConfirmDialog";
import FormDialog from "../../../components/FormDialog";
import LoadingState from "../../../components/LoadingState";
import EmptyState from "../../../components/EmptyState";
import ErrorDisplay from "../../../components/ErrorDisplay";
import SnackbarBaseline from "../../../components/SnackbarBaseline";
import { useAuth } from "../../../components/AuthProvider";

import Parameter from "../../../model/Parameter";

import useParameterFetchGql from "../../../hooks/useParameterFetchGql";
import useParameterInsertGql from "../../../hooks/useParameterInsertGql";
import useParameterDeleteGql from "../../../hooks/useParameterDeleteGql";
import useParameterUpdateGql from "../../../hooks/useParameterUpdateGql";

const CONFIGURATION_NEXT_CACHE_ENABLED_KEY = "finance_cache_enabled_configuration_next";
const CONFIGURATION_NEXT_CACHE_DATA_KEY = "finance_cached_data_configuration_next";

export default function ConfigurationNextGen() {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();

  const [message, setMessage] = useState("");
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [showSpinner, setShowSpinner] = useState(true);
  const [showModalAdd, setShowModalAdd] = useState(false);
  const [cacheEnabled, setCacheEnabled] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(CONFIGURATION_NEXT_CACHE_ENABLED_KEY) === "true";
  });
  const [showModalDelete, setShowModalDelete] = useState(false);
  const [parameterData, setParameterData] = useState<Parameter | null>(null);
  const [selectedParameter, setSelectedParameter] = useState<Parameter | null>(
    null,
  );
  const [formErrors, setFormErrors] = useState<{
    parameterName?: string;
    parameterValue?: string;
  }>({});
  const [paginationModel, setPaginationModel] = useState({
    pageSize: 50,
    page: 0,
  });

  const {
    data: fetchedParameters,
    isSuccess: isSuccessParameters,
    isFetching: isFetchingParameters,
    error: errorParameters,
    refetch: refetchParameters,
  } = useParameterFetchGql();
  const { mutateAsync: insertParameter } = useParameterInsertGql();
  const { mutateAsync: updateParameter } = useParameterUpdateGql();
  const { mutateAsync: deleteParameter } = useParameterDeleteGql();

  useEffect(() => {
    if (loading) {
      setShowSpinner(true);
    }
    if (!loading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [loading, isAuthenticated, router]);

  useEffect(() => {
    if (isFetchingParameters || loading || (!loading && !isAuthenticated)) {
      setShowSpinner(true);
      return;
    }
    if (isSuccessParameters) {
      setShowSpinner(false);
    }
  }, [isSuccessParameters, isFetchingParameters, loading, isAuthenticated]);

  const handleSnackbarClose = () => setShowSnackbar(false);

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

  const handleAddRow = async (newData: Parameter) => {
    const errs: { parameterName?: string; parameterValue?: string } = {};
    if (!newData?.parameterName || newData.parameterName.trim() === "") {
      errs.parameterName = "Name is required";
    }
    if (
      !newData?.parameterValue ||
      String(newData.parameterValue).trim() === ""
    ) {
      errs.parameterValue = "Value is required";
    }
    if (Object.keys(errs).length > 0) {
      setFormErrors(errs);
      setMessage("Validation failed");
      setShowSnackbar(true);
      return;
    }

    try {
      await insertParameter({ payload: { ...newData, activeStatus: true } });
      if (cacheEnabled && typeof window !== "undefined") {
        localStorage.setItem(CONFIGURATION_NEXT_CACHE_DATA_KEY, JSON.stringify(newData));
      }
      setShowModalAdd(false);
      setFormErrors({});
      setMessage("Configuration added successfully.");
      setShowSnackbar(true);
    } catch (error: unknown) {
      handleError(error, "Add Configuration error", false);
    }
  };

  const handleDeleteRow = async () => {
    if (!selectedParameter) return;
    try {
      await deleteParameter({ oldRow: selectedParameter });
      setMessage("Parameter deleted successfully.");
      setShowSnackbar(true);
    } catch (error: unknown) {
      handleError(error, "Delete Parameter error", false);
    } finally {
      setShowModalDelete(false);
      setSelectedParameter(null);
    }
  };

  const handleOpenAddModal = () => {
    if (cacheEnabled && typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(CONFIGURATION_NEXT_CACHE_DATA_KEY);
        setParameterData(stored ? JSON.parse(stored) : null);
      } catch {
        setParameterData(null);
      }
    } else {
      setParameterData(null);
    }
    setFormErrors({});
    setShowModalAdd(true);
  };

  const columns: GridColDef[] = [
    { field: "parameterName", headerName: "Name", width: 200, editable: true },
    {
      field: "parameterValue",
      headerName: "Value",
      width: 300,
      editable: true,
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
              setSelectedParameter(params.row as Parameter);
              setShowModalDelete(true);
            }}
          >
            <DeleteIcon />
          </IconButton>
        </Tooltip>
      ),
    },
  ];

  if (errorParameters) {
    return (
      <>
        <PageHeader
          title="System Configuration (Next‑Gen)"
          subtitle="GraphQL-powered configuration parameters"
        />
        <ErrorDisplay
          error={errorParameters}
          variant="card"
          showRetry
          onRetry={() => refetchParameters()}
        />
      </>
    );
  }

  return (
    <div>
      <>
        <PageHeader
          title="System Configuration (Next‑Gen)"
          subtitle="GraphQL-powered configuration parameters"
          actions={
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenAddModal()}
            >
              Add Parameter
            </Button>
          }
        />
        {showSpinner ? (
          <LoadingState
            variant="card"
            message="Loading configuration parameters..."
          />
        ) : fetchedParameters && fetchedParameters.length > 0 ? (
          <Box display="flex" justifyContent="center">
            <Box sx={{ width: "100%", maxWidth: "1200px" }}>
              <DataGridBase
                rows={fetchedParameters}
                columns={columns}
                getRowId={(row: Parameter) => row.parameterId}
                checkboxSelection={false}
                rowSelection={false}
                paginationModel={paginationModel}
                onPaginationModelChange={(newModel) =>
                  setPaginationModel(newModel)
                }
                pageSizeOptions={[25, 50, 100]}
                processRowUpdate={async (
                  newRow: Parameter,
                  oldRow: Parameter,
                ): Promise<Parameter> => {
                  if (JSON.stringify(newRow) === JSON.stringify(oldRow)) {
                    return oldRow;
                  }
                  try {
                    await updateParameter({
                      oldParameter: oldRow,
                      newParameter: newRow,
                    });
                    setMessage("Parameter updated successfully.");
                    setShowSnackbar(true);
                    return { ...newRow };
                  } catch (error: unknown) {
                    handleError(
                      error,
                      `Parameter Update failure: ${error}`,
                      false,
                    );
                    return oldRow;
                  }
                }}
                autoHeight
              />
            </Box>
          </Box>
        ) : (
          <EmptyState
            title="No Parameters Found"
            message="No configuration parameters have been set up yet. Create your first parameter to configure system behavior."
            dataType="parameters"
            variant="create"
            actionLabel="Add Parameter"
            onAction={() => setShowModalAdd(true)}
            onRefresh={() => refetchParameters()}
          />
        )}

        <ConfirmDialog
          open={showModalDelete}
          onClose={() => setShowModalDelete(false)}
          onConfirm={handleDeleteRow}
          title={"Delete Parameter?"}
          message={`Are you sure you want to delete parameter ${selectedParameter?.parameterName ?? ""}? This cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
        />

        <FormDialog
          open={showModalAdd}
          onClose={() => setShowModalAdd(false)}
          onSubmit={() => {
            if (parameterData) {
              handleAddRow(parameterData);
            } else {
              handleAddRow({
                parameterId: 0,
                parameterName: "",
                parameterValue: "",
                activeStatus: true,
              } as Parameter);
            }
          }}
          title={"Add new parameter"}
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
                (prev) =>
                  ({
                    ...(prev || {}),
                    parameterName: e.target.value,
                  }) as Parameter,
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
              setParameterData(
                (prev) =>
                  ({
                    ...(prev || {}),
                    parameterValue: e.target.value,
                  }) as Parameter,
              )
            }
          />
          <Box mt={2}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={cacheEnabled}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setCacheEnabled(checked);
                    if (typeof window !== "undefined") {
                      localStorage.setItem(CONFIGURATION_NEXT_CACHE_ENABLED_KEY, String(checked));
                      if (!checked) {
                        localStorage.removeItem(CONFIGURATION_NEXT_CACHE_DATA_KEY);
                      }
                    }
                  }}
                  size="small"
                />
              }
              label="Remember field data"
            />
          </Box>
        </FormDialog>

        <SnackbarBaseline
          message={message}
          state={showSnackbar}
          handleSnackbarClose={handleSnackbarClose}
        />
      </>
    </div>
  );
}
