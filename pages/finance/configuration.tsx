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
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import Spinner from "../../components/Spinner";
import SnackbarBaseline from "../../components/SnackbarBaseline";
import ErrorDisplay from "../../components/ErrorDisplay";
import EmptyState from "../../components/EmptyState";
import LoadingState from "../../components/LoadingState";
import useParameterFetch from "../../hooks/useParameterFetch";
import useParameterInsert from "../../hooks/useParameterInsert";
import useParameterDelete from "../../hooks/useParameterDelete";
import Parameter from "../../model/Parameter";
import useParameterUpdate from "../../hooks/useParameterUpdate";
import FinanceLayout from "../../layouts/FinanceLayout";
import PageHeader from "../../components/PageHeader";
import DataGridBase from "../../components/DataGridBase";
import ConfirmDialog from "../../components/ConfirmDialog";
import FormDialog from "../../components/FormDialog";
import { useAuth } from "../../components/AuthProvider";
import { generateSecureUUID } from "../../utils/security/secureUUID";
import { modalTitles, modalBodies } from "../../utils/modalMessages";

export default function Configuration() {
  const [message, setMessage] = useState("");
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [snackbarSeverity, setSnackbarSeverity] = useState<
    "error" | "warning" | "info" | "success"
  >("info");
  const [showSpinner, setShowSpinner] = useState(true);
  const [showModalAdd, setShowModalAdd] = useState(false);
  const [parameterData, setParameterData] = useState<Parameter | null>(null);
  const [showModalDelete, setShowModalDelete] = useState(false);
  const [selectedParameter, setSelectedParameter] = useState<Parameter | null>(
    null,
  );
  const [formErrors, setFormErrors] = useState<{
    parameterName?: string;
    parameterValue?: string;
  }>({});
  const [offlineRows, setOfflineRows] = useState<Parameter[]>([]);
  const [paginationModel, setPaginationModel] = useState({
    pageSize: 50,
    page: 0,
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
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
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
  }, [
    isSuccessParameters,
    isErrorParameters,
    isFetchingParameters,
    loading,
    isAuthenticated,
  ]);

  useEffect(() => {
    const storedRows = localStorage.getItem("offlineParameters");
    if (storedRows) {
      setOfflineRows(JSON.parse(storedRows));
    }
  }, []); // ✅ Run only once on mount

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
          ); // ✅ Ensures state is updated correctly
          localStorage.setItem(
            "offlineParameters",
            JSON.stringify(remainingRows),
          );
        }
      }
    };

    window.addEventListener("online", syncOfflineRows);
    return () => window.removeEventListener("online", syncOfflineRows);
  }, [insertParameter]); // ✅ Remove `offlineRows` from dependencies

  const handleDeleteRow = async () => {
    if (!selectedParameter) return;

    if (!selectedParameter?.parameterId) return;

    const isOfflineRow = offlineRows.some(
      (row) => row.parameterId === selectedParameter.parameterId,
    );

    if (isOfflineRow) {
      const updatedOfflineRows = offlineRows.filter(
        (row) => row.parameterId !== selectedParameter.parameterId,
      );
      setOfflineRows(updatedOfflineRows);
      localStorage.setItem(
        "offlineParameters",
        JSON.stringify(updatedOfflineRows),
      );

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

  const handleAddRow = async (newData: Parameter) => {
    const errs: { parameterName?: string; parameterValue?: string } = {};
    if (!newData?.parameterName || newData.parameterName.trim() === "") {
      errs.parameterName = "Name is required";
    }
    if (
      !newData?.parameterValue ||
      newData.parameterValue.toString().trim() === ""
    ) {
      errs.parameterValue = "Value is required";
    }
    if (Object.keys(errs).length > 0) {
      setFormErrors(errs);
      setMessage(
        errs.parameterName || errs.parameterValue || "Validation failed",
      );
      setSnackbarSeverity("error");
      setShowSnackbar(true);
      return;
    }

    try {
      await insertParameter({ payload: newData });
      const secureId = await generateSecureUUID();
      setParameterData((prev: any) =>
        prev?.parameterId ? prev : { ...newData, parameterId: secureId },
      );
      setShowModalAdd(false);
      handleSuccess("Configuration added successfully.");
      setFormErrors({});
    } catch (error) {
      handleError(error, "Add Configuration", false);

      if (
        !navigator.onLine ||
        (error.message && error.message.includes("Failed to fetch"))
      ) {
        const offlineId = await generateSecureUUID();
        const newOfflineRow = { ...newData, parameterId: offlineId };
        const updatedOfflineRows = [...offlineRows, newOfflineRow];

        setOfflineRows(updatedOfflineRows as [Parameter]); // 🔹 Ensure UI updates immediately
        localStorage.setItem(
          "offlineParameters",
          JSON.stringify(updatedOfflineRows),
        );

        handleSuccess("Parameter saved offline.");
        setParameterData({ ...newData, parameterId: Math.random() });
      }
    }
  };

  const columns: GridColDef[] = [
    {
      field: "parameterName",
      headerName: "Name",
      width: 200,
      editable: true,
    },
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

  // Handle error states first
  if (isErrorParameters) {
    return (
      <FinanceLayout>
        <PageHeader
          title="System Configuration"
          subtitle="Manage application settings and parameters that control system behavior and defaults"
        />
        <ErrorDisplay
          error={errorParameters}
          variant="card"
          showRetry={true}
          onRetry={() => refetchParameters()}
        />
      </FinanceLayout>
    );
  }

  return (
    <div>
      <FinanceLayout>
        <PageHeader
          title="System Configuration"
          subtitle="Manage application settings and parameters that control system behavior and defaults"
          actions={
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setShowModalAdd(true)}
              sx={{ backgroundColor: "primary.main" }}
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
        ) : (
          <div>
            <Box display="flex" justifyContent="center">
              <Box sx={{ width: "100%", maxWidth: "1200px" }}>
                {(fetchedParameters && fetchedParameters.length > 0) ||
                offlineRows.length > 0 ? (
                  <DataGridBase
                    rows={[...(fetchedParameters || []), ...offlineRows]}
                    columns={columns}
                    getRowId={(row: any) =>
                      row.parameterId ||
                      `fallback-${Date.now()}-${Math.random()}`
                    }
                    checkboxSelection={false}
                    rowSelection={false}
                    paginationModel={paginationModel}
                    onPaginationModelChange={(newModel) =>
                      setPaginationModel(newModel)
                    }
                    pageSizeOptions={[25, 50, 100]}
                    disableRowSelectionOnClick
                    autoHeight
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
                        setParameterData(newRow);
                        handleSuccess("Parameter updated successfully.");

                        return { ...newRow };
                      } catch (error) {
                        handleError(
                          error,
                          `Parameter Update failure: ${error}`,
                          false,
                        );
                        return oldRow;
                      }
                    }}
                  />
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
              </Box>
            </Box>
            <SnackbarBaseline
              message={message}
              state={showSnackbar}
              handleSnackbarClose={handleSnackbarClose}
              severity={snackbarSeverity}
            />
          </div>
        )}

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

        {/* Modal Add Parameter */}
        <FormDialog
          open={showModalAdd}
          onClose={() => setShowModalAdd(false)}
          onSubmit={() => {
            if (parameterData) {
              handleAddRow(parameterData);
            } else {
              handleAddRow({
                parameterName: "",
                parameterValue: "",
              } as Parameter);
            }
          }}
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
                (prev) =>
                  ({
                    ...prev,
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
              setParameterData((prev) =>
                prev
                  ? {
                      ...prev,
                      parameterValue: e.target.value,
                    }
                  : null,
              )
            }
          />
        </FormDialog>
      </FinanceLayout>
    </div>
  );
}
