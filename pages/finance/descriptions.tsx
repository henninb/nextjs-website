import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import {
  Box,
  Paper,
  Link,
  Button,
  IconButton,
  Tooltip,
  Modal,
  TextField,
  Typography,
  Switch,
  FormControlLabel,
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
import FinanceLayout from "../../layouts/FinanceLayout";
import { useAuth } from "../../components/AuthProvider";
import { modalTitles, modalBodies } from "../../utils/modalMessages";

export default function Descriptions() {
  const [message, setMessage] = useState("");
  const [showSnackbar, setShowSnackbar] = useState(false);
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
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

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
        setMessage(`Description deleted successfully.`);
        setShowSnackbar(true);
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
    setShowSnackbar(true);

    console.error(errorMessage);

    if (throwIt) throw error;
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
      return;
    }

    try {
      await insertDescription(newData);
      setMessage(`Description inserted successfully.`);
      setShowSnackbar(true);
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

  const columns: GridColDef[] = [
    {
      field: "descriptionName",
      headerName: "Name",
      width: 350,
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
        <Tooltip title="delete this row">
          <IconButton
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

  // Handle error states first
  if (isErrorDescriptions) {
    return (
      <FinanceLayout>
        <Box sx={{ mb: 3, textAlign: "center" }}>
          <Typography
            variant="h4"
            component="h1"
            sx={{ mb: 1, fontWeight: 600 }}
          >
            Description Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Create and manage transaction descriptions to standardize your
            financial record keeping
          </Typography>
        </Box>
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
        <Box sx={{ mb: 3, textAlign: "center" }}>
          <Typography
            variant="h4"
            component="h1"
            sx={{ mb: 1, fontWeight: 600 }}
          >
            Description Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Create and manage transaction descriptions to standardize your
            financial record keeping
          </Typography>
        </Box>
        {showSpinner ? (
          <LoadingState variant="card" message="Loading descriptions..." />
        ) : (
          <div>
            <Box display="flex" justifyContent="center" mb={2}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setShowModalAdd(true)}
                sx={{ backgroundColor: "primary.main" }}
              >
                Add Description
              </Button>
            </Box>
            <Box display="flex" justifyContent="center">
              <Box sx={{ width: "fit-content" }}>
                {fetchedDescrptions && fetchedDescrptions.length > 0 ? (
                  <DataGrid
                    rows={
                      fetchedDescrptions?.filter((row) => row != null) || []
                    }
                    columns={columns}
                    getRowId={(row) =>
                      row.descriptionId ??
                      `${row.descriptionName}-${row.activeStatus}`
                    }
                    checkboxSelection={false}
                    rowSelection={false}
                    pagination
                    paginationModel={paginationModel}
                    onPaginationModelChange={(newModel) =>
                      setPaginationModel(newModel)
                    }
                    pageSizeOptions={[25, 50, 100]}
                    autoHeight
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
                        setMessage("Description updated successfully.");
                        setShowSnackbar(true);
                        return { ...newRow };
                      } catch (error) {
                        handleError(
                          error,
                          `Update Description error: ${error.message}`,
                          false,
                        );
                        throw error;
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
              />
            </div>
          </div>
        )}

        {/* Delete Modal */}
        <Modal open={showModalDelete} onClose={() => setShowModalDelete(false)}>
          <Paper>
            <Typography variant="h6">{modalTitles.confirmDeletion}</Typography>
            <Typography>
              {modalBodies.confirmDeletion(
                "description",
                selectedDescription?.descriptionName ?? "",
              )}
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

        {/* Modal Add Description */}
        <Modal open={showModalAdd} onClose={() => setShowModalAdd(false)}>
          <Paper>
            <Typography variant="h6">
              {modalTitles.addNew("description")}
            </Typography>
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
            <Button
              variant="contained"
              onClick={() =>
                handleAddRow(
                  (descriptionData as Description) ||
                    ({ descriptionName: "", activeStatus: true } as any),
                )
              }
            >
              Add
            </Button>
          </Paper>
        </Modal>
      </FinanceLayout>
    </div>
  );
}
