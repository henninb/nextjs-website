import React, { useState, useEffect } from "react";
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
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import Spinner from "../../components/Spinner";
import SnackbarBaseline from "../../components/SnackbarBaseline";
import useFetchDescription from "../../hooks/useDescriptionFetch";
import useDescriptionInsert from "../../hooks/useDescriptionInsert";
import useDescriptionDelete from "../../hooks/useDescriptionDelete";
import Description from "../../model/Description";
import useDescriptionUpdate from "../../hooks/useDescriptionUpdate";
import FinanceLayout from "../../layouts/FinanceLayout";

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
    pageSize: 25,
    page: 0,
  });
  // const [newDescriptionData, setNewDescriptionData] = useState<Description>({
  //   descriptionId: 0,
  //   descriptionName: "",
  //   activeStatus: true,
  // });

  const {
    data: fetchedDescrptions,
    isSuccess: isSuccessDescriptions,
    isLoading: isFetchingDescriptions,
    isError: isErrorDescriptions,
    error: errorDescriptions,
  } = useFetchDescription();
  const { mutateAsync: insertDescription } = useDescriptionInsert();
  const { mutateAsync: updateDescription } = useDescriptionUpdate();
  const { mutateAsync: deleteDescription } = useDescriptionDelete();

  useEffect(() => {
    if (isFetchingDescriptions) {
      setShowSpinner(true);
      return;
    }
    if (isSuccessDescriptions) {
      setShowSpinner(false);
    }
  }, [isSuccessDescriptions, isFetchingDescriptions]);

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

  return (
    <div>
      <FinanceLayout>
        <h2>Description Details</h2>
        {showSpinner ? (
          <Spinner />
        ) : (
          <div>
            <IconButton onClick={() => setShowModalAdd(true)}>
              <AddIcon />
            </IconButton>
            <DataGrid
              rows={fetchedDescrptions?.filter((row) => row != null) || []}
              columns={columns}
              getRowId={(row) => row.descriptionId || 0}
              checkboxSelection={false}
              rowSelection={false}
              pagination
              paginationModel={paginationModel}
              onPaginationModelChange={(newModel) =>
                setPaginationModel(newModel)
              }
              pageSizeOptions={[25, 50, 100]}
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
            <Typography variant="h6">Confirm Deletion</Typography>
            <Typography>
              Are you sure you want to delete the description "
              {selectedDescription ? selectedDescription.descriptionName : ""}"?
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
            <h3>Add New Description</h3>
            <TextField
              label="Name"
              fullWidth
              margin="normal"
              value={descriptionData?.descriptionName || ""}
              onChange={(e) =>
                setDescriptionData((prev) => ({
                  ...prev,
                  descriptionName: e.target.value,
                }))
              }
            />
            <TextField
              label="Status"
              fullWidth
              margin="normal"
              value={descriptionData?.activeStatus || ""}
              onChange={(e) =>
                setDescriptionData((prev: any) => ({
                  ...prev,
                  activeStatus: e.target.value,
                }))
              }
            />
            <Button
              variant="contained"
              onClick={() => descriptionData && handleAddRow(descriptionData)}
            >
              Add
            </Button>
          </Paper>
        </Modal>
      </FinanceLayout>
    </div>
  );
}
