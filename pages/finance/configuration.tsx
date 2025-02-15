import { useState, useEffect } from "react";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import {
  Box,
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
import useParameterFetch from "../../hooks/useParameterFetch";
import useParameterInsert from "../../hooks/useParameterInsert";
import useParameterDelete from "../../hooks/useParameterDelete";
import Parameter from "../../model/Parameter";
import useParameterUpdate from "../../hooks/useParameterUpdate";

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

  const {
    data: fetchedParameters,
    isSuccess: isSuccessParameters,
    error: errorParameters,
  } = useParameterFetch();
  const { mutateAsync: insertParameter } = useParameterInsert();
  const { mutateAsync: updateParameter } = useParameterUpdate();
  const { mutateAsync: deleteParameter } = useParameterDelete();

  useEffect(() => {
    if (isSuccessParameters) {
      setShowSpinner(false);
    }
  }, [isSuccessParameters]);

  useEffect(() => {
    const storedRows = localStorage.getItem("offlineParameters");
    if (storedRows) {
      setOfflineRows(JSON.parse(storedRows));
    }
  }, []);

  useEffect(() => {
    const storedRows = localStorage.getItem("offlineParameters");
    if (storedRows) {
      setOfflineRows(JSON.parse(storedRows));
    }
  }, [offlineRows]); // 🔹 Re-run when offlineRows changes

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
          setOfflineRows(remainingRows);
          localStorage.setItem(
            "offlineParameters",
            JSON.stringify(remainingRows),
          );
        }
      }
    };

    window.addEventListener("online", syncOfflineRows);
    return () => window.removeEventListener("online", syncOfflineRows);
  }, [insertParameter, offlineRows]);

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
      //setParameterData(null);
      setParameterData({ ...newData, parameterId: Math.random() });
      setShowModalAdd(false);
      setMessage("Configuration added successfully.");
      setShowSnackbar(true);
    } catch (error) {
      handleError(error, "Add Configuration", false);

      const newOfflineRow = { ...newData, parameterId: crypto.randomUUID() };
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
            //key={offlineRows?.length}  // 🔹 Changing this key forces a re-render
            //rows={fetchedParameters?.filter((row) => row != null) || []}
            rows={[...(fetchedParameters || []), ...offlineRows]}
            columns={columns}
            getRowId={(row) => row.parameterId || crypto.randomUUID()}
            checkboxSelection={false}
            rowSelection={false}
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
                handleError(error, `Parameter Update failure: ${error}`, false);
                throw error;
              }
            }}
          />
          <SnackbarBaseline
            message={message}
            state={showSnackbar}
            handleSnackbarClose={handleSnackbarClose}
          />
        </div>
      )}

      <Modal open={showModalDelete} onClose={() => setShowModalDelete(false)}>
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
            Are you sure you want to delete "{selectedParameter?.parameterName}
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
        </Box>
      </Modal>

      {/* add or Edit modal */}
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
            {parameterData ? "Update" : "Add"}
          </Button>
        </Box>
      </Modal>
    </div>
  );
}
