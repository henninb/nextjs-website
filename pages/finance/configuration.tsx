import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import {
  Box,
  Paper,
  Button,
  IconButton,
  Tooltip,
  Modal,
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
import { useAuth } from "../../components/AuthProvider";
import { generateSecureUUID } from "../../utils/security/secureUUID";

export default function Configuration() {
  const [message, setMessage] = useState("");
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [showSpinner, setShowSpinner] = useState(true);
  const [showModalAdd, setShowModalAdd] = useState(false);
  const [parameterData, setParameterData] = useState<Parameter | null>(null);
  const [showModalDelete, setShowModalDelete] = useState(false);
  const [selectedParameter, setSelectedParameter] = useState<Parameter | null>(
    null,
  );
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

      setMessage("Offline parameter deleted successfully.");
      setShowSnackbar(true);
    } else {
      try {
        await deleteParameter(selectedParameter);
        setMessage("Parameter deleted successfully.");
        setShowSnackbar(true);
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
    setShowSnackbar(true);

    console.error(errorMessage);

    if (throwIt) throw error;
  };

  const handleAddRow = async (newData: Parameter) => {
    try {
      await insertParameter({ payload: newData });
      const secureId = await generateSecureUUID();
      setParameterData((prev: any) =>
        prev?.parameterId ? prev : { ...newData, parameterId: secureId },
      );
      setShowModalAdd(false);
      setMessage("Configuration added successfully.");
      setShowSnackbar(true);
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

        setMessage("Parameter saved offline.");
        setShowSnackbar(true);
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
        <Tooltip title="delete this row">
          <IconButton
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
        <Box sx={{ mb: 3, textAlign: "center" }}>
          <Typography
            variant="h4"
            component="h1"
            sx={{ mb: 1, fontWeight: 600 }}
          >
            System Configuration
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage application settings and parameters that control system
            behavior and defaults
          </Typography>
        </Box>
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
        <Box sx={{ mb: 3, textAlign: "center" }}>
          <Typography
            variant="h4"
            component="h1"
            sx={{ mb: 1, fontWeight: 600 }}
          >
            System Configuration
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage application settings and parameters that control system
            behavior and defaults
          </Typography>
        </Box>
        {showSpinner ? (
          <LoadingState
            variant="card"
            message="Loading configuration parameters..."
          />
        ) : (
          <div>
            <Box display="flex" justifyContent="center" mb={2}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setShowModalAdd(true)}
                sx={{ backgroundColor: "primary.main" }}
              >
                Add Parameter
              </Button>
            </Box>
            <Box display="flex" justifyContent="center">
              <Box sx={{ width: "fit-content" }}>
                {(fetchedParameters && fetchedParameters.length > 0) ||
                offlineRows.length > 0 ? (
                  <DataGrid
                    rows={[...(fetchedParameters || []), ...offlineRows]}
                    columns={columns}
                    getRowId={(row) =>
                      row.parameterId ||
                      `fallback-${Date.now()}-${Math.random()}`
                    }
                    checkboxSelection={false}
                    rowSelection={false}
                    pagination
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
                        setMessage("Parameter updated successfully.");
                        setShowSnackbar(true);

                        return { ...newRow };
                      } catch (error) {
                        handleError(
                          error,
                          `Parameter Update failure: ${error}`,
                          false,
                        );
                        throw error;
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
            />
          </div>
        )}

        <Modal open={showModalDelete} onClose={() => setShowModalDelete(false)}>
          <Paper>
            <Typography variant="h6">Confirm Deletion</Typography>
            <Typography>
              Are you sure you want to delete "
              {selectedParameter?.parameterName}
              "?
            </Typography>
            <Box mt={2} display="flex" justifyContent="space-between">
              <Button
                variant="contained"
                color="primary"
                onClick={handleDeleteRow}
              >
                Delete
              </Button>
              <Button
                variant="outlined"
                color="secondary"
                onClick={() => setShowModalDelete(false)}
              >
                Cancel
              </Button>
            </Box>
          </Paper>
        </Modal>

        {/* Modal Add Parameter */}
        <Modal open={showModalAdd} onClose={() => setShowModalAdd(false)}>
          <Paper>
            <h3>Add New Parameter</h3>
            <TextField
              label="Name"
              fullWidth
              margin="normal"
              value={parameterData?.parameterName || ""}
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
              onChange={(e) =>
                setParameterData((prev) => ({
                  ...prev,
                  parameterValue: e.target.value,
                }))
              }
            />
            <Button
              variant="contained"
              onClick={() => parameterData && handleAddRow(parameterData)}
            >
              Add
            </Button>
          </Paper>
        </Modal>
      </FinanceLayout>
    </div>
  );
}
