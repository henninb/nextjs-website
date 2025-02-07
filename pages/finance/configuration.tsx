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
import useParameterFetch from "../../hooks/useParameterFetch";
import useParameterInsert from "../../hooks/useParameterInsert";
import useParameterDelete from "../../hooks/useParameterDelete";
import Parameter from "../../model/Parameter";
import useParameterUpdate from "../../hooks/useParameterUpdate";

export default function configuration() {
  const [message, setMessage] = useState("");
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [showSpinner, setShowSpinner] = useState(true);
  const [showModalAdd, setShowModalAdd] = useState(false);
  const [parameterData, setParameterData] = useState<Parameter | null>(null);
  const [confirmDelete, setParameterDelete] = useState(false);
  const [selectedConfig, setSelectedParameter] = useState<Parameter | null>(
    null,
  );

  const { data, isSuccess } = useParameterFetch();
  const { mutateAsync: insertParameter } = useParameterInsert();
  const { mutateAsync: updateParameter } = useParameterUpdate();
  const { mutateAsync: deleteParameter } = useParameterDelete();

  useEffect(() => {
    if (isSuccess) {
      setShowSpinner(false);
    }
  }, [isSuccess]);

  const handleDeleteRow = async () => {
    if (selectedConfig) {
      try {
        await deleteParameter(selectedConfig);
        setMessage("Parameter deleted successfully.");
        setShowSnackbar(true);
      } catch (error) {
        handleError(error, "Delete Parameter failure.", false);
      } finally {
        setParameterDelete(false);
        setSelectedParameter(null);
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

  const handleAddRow = async (newData: Parameter) => {
    try {
      await insertParameter({ payload: newData });
      setShowModalAdd(false);
      setMessage("Configuration added successfully.");
      setShowSnackbar(true);
    } catch (error) {
      handleError(error, "Add Configuration", false);
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
        <IconButton
          onClick={() => {
            setSelectedParameter(params.row);
            setParameterDelete(true);
          }}
        >
          <DeleteIcon />
        </IconButton>
      ),
    },
  ];

  return (
    <div>
      <h2>Configuration Details</h2>
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
            getRowId={(row) => row.parameterName || 0}
            checkboxSelection={false}
            rowSelection={false}
            processRowUpdate={async (newRow: Parameter, oldRow: Parameter) => {
              try {
                await updateParameter({
                  oldParameter: oldRow,
                  newParameter: newRow,
                });
                setMessage("Configuration updated successfully.");
                setShowSnackbar(true);
              } catch (error) {
                handleError(error, "Update Configuration failure.", false);
              }
              return newRow;
            }}
          />
          <SnackbarBaseline
            message={message}
            state={showSnackbar}
            handleSnackbarClose={handleSnackbarClose}
          />
        </div>
      )}

      <Modal open={confirmDelete} onClose={() => setParameterDelete(false)}>
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
            Are you sure you want to delete the configuration "
            {JSON.stringify(selectedConfig)}"?
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
              onClick={() => setParameterDelete(false)}
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
            {parameterData ? "Edit Configuration" : "Add New Configuration"}
          </h3>
          <TextField
            label="Name"
            fullWidth
            margin="normal"
            value={parameterData?.parameterName || ""}
            onChange={(e) =>
              setParameterData((prev) => ({
                ...prev,
                parameterName: e.target.value,
              }))
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
            {parameterData ? "Update" : "Add"}
          </Button>
        </Box>
      </Modal>
    </div>
  );
}
