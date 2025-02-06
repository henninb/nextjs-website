import { useState, useEffect } from "react";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import {
  Box,
  Button,
  IconButton,
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

export default function descriptions() {
  const [message, setMessage] = useState("");
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [showSpinner, setShowSpinner] = useState(true);
  const [showModalAdd, setShowModalAdd] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [selectedDescription, setSelectedDescription] =
    useState<Description | null>(null);
  const [descriptionData, setDescriptionData] = useState<Description | null>(
    null,
  );

  const { data, isSuccess } = useFetchDescription();
  const { mutateAsync: insertDescription } = useDescriptionInsert();
  const { mutate: updateDescription } = useDescriptionUpdate();
  const { mutate: deleteDescription } = useDescriptionDelete();

  useEffect(() => {
    if (isSuccess) {
      setShowSpinner(false);
    }
  }, [isSuccess]);

  const handleDeleteRow = async () => {
    if (selectedDescription) {
      try {
        await deleteDescription(selectedDescription);
        setMessage("Description deleted successfully.");
        setShowSnackbar(true);
      } catch (error) {
        handleError(error, "Delete Description failure.", false);
      } finally {
        setConfirmDelete(false);
        setSelectedDescription(null);
      }
    }
  };

  const handleSnackbarClose = () => {
    setShowSnackbar(false);
  };

  const handleError = (error: any, moduleName: string, throwIt: boolean) => {
    const errorMessage = error.response
      ? `${moduleName}: ${error.response.status} - ${JSON.stringify(
          error.response.data,
        )}`
      : `${moduleName}: Failure`;

    setMessage(errorMessage);
    setShowSnackbar(true);
    if (throwIt) throw error;
  };

  const addRow = async (newData: Description): Promise<Description> => {
    try {
      const result = await insertDescription(newData);
      setShowModalAdd(false);
      setMessage("Description inserted successfully.");
      setShowSnackbar(true);
      return result;
    } catch (error) {
      handleError(error, "Add Description", false);
    }
  };

  const columns: GridColDef[] = [
    {
      field: "descriptionName",
      headerName: "Name",
      width: 350,
      editable: true,
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
        <IconButton
          onClick={() => {
            setSelectedDescription(params.row);
            setConfirmDelete(true);
          }}
        >
          <DeleteIcon />
        </IconButton>
      ),
    },
  ];

  return (
    <div>
      <h2>Description Details</h2>
      {showSpinner ? (
        <Spinner />
      ) : (
        <div>
          <IconButton onClick={() => setShowModalAdd(true)}>
            <AddIcon />
          </IconButton>
          <DataGrid
            rows={data?.filter((row) => row != null) || []}
            columns={columns}
            getRowId={(row) => row.descriptionId || 0}
            checkboxSelection={false}
            rowSelection={false}
            processRowUpdate={(newRow: Description, oldRow: Description) => {
              try {
                updateDescription({
                  oldDescription: oldRow,
                  newDescription: newRow,
                });
                setMessage("Description updated successfully.");
                setShowSnackbar(true);
              } catch (error) {
                handleError(error, "Update Description failure.", false);
              }
              return newRow;
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

      {/* Confirmation Delete Modal */}
      <Modal open={confirmDelete} onClose={() => setConfirmDelete(false)}>
        <Box
          sx={{
            width: 400,
            padding: 4,
            backgroundColor: "white",
            margin: "auto",
            marginTop: "20%",
          }}
        >
          <Typography variant="h6">Confirm Deletion</Typography>
          <Typography>
            Are you sure you want to delete the description "
            {JSON.stringify(selectedDescription)}"?
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
              onClick={() => setConfirmDelete(false)}
            >
              Cancel
            </Button>
          </Box>
        </Box>
      </Modal>

      <Modal open={showModalAdd} onClose={() => setShowModalAdd(false)}>
        <Box
          sx={{
            width: 400,
            padding: 4,
            backgroundColor: "white",
            margin: "auto",
            marginTop: "20%",
          }}
        >
          <h3>
            {descriptionData ? "Edit Description" : "Add New Description"}
          </h3>
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
            onClick={() => descriptionData && addRow(descriptionData)}
          >
            {descriptionData ? "Update" : "Add"}
          </Button>
        </Box>
      </Modal>
    </div>
  );
}
