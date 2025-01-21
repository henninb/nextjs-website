import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { Box, Button, IconButton, Modal, TextField } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import Spinner from "../../components/Spinner";
import SnackbarBaseline from "../../components/SnackbarBaseline";
import useFetchDescription from "../../hooks/useDescriptionFetch";
import useDescriptionInsert from "../../hooks/useDescriptionInsert";
import useDescriptionDelete from "../../hooks/useDescriptionDelete";
import Description from "../../model/Description";

export default function descriptions() {
  const [message, setMessage] = useState("");
  const [open, setOpen] = useState(false);
  const [showSpinner, setShowSpinner] = useState(true);
  const [openForm, setOpenForm] = useState(false);
  const [descriptionData, setDescriptionData] = useState<Description | null>(null);

  const { data, isSuccess, isLoading } = useFetchDescription();
  const { mutate: insertDescription } = useDescriptionInsert();
  const { mutate: deleteDescription } = useDescriptionDelete();

  useEffect(() => {
    if (isSuccess) {
      setShowSpinner(false);
    }
  }, [isSuccess]);

  const handleDeleteRow = async (description: Description) => {
    try {
        JSON.stringify("oldRow: " + description)
      await deleteDescription({ oldRow: description });
    } catch (error) {
      handleError(error, "Delete Description", false);
    }
  };

  const handleSnackbarClose = () => {
    setOpen(false);
  };

  const handleError = (error: any, moduleName: string, throwIt: boolean) => {
    const errorMessage =
      error.response
        ? `${moduleName}: ${error.response.status} - ${JSON.stringify(
            error.response.data
          )}`
        : `${moduleName}: Failure`;

    setMessage(errorMessage);
    setOpen(true);
    if (throwIt) throw error;
  };

  const addRow = async (newData: Description) => {
    try {
      await insertDescription(newData);
      setOpenForm(false);
    } catch (error) {
      handleError(error, "Add Description", false);
    }
  };

  const columns: GridColDef[] = [
    {
      field: "descriptionName",
      headerName: "Name",
      width: 200,
      editable: true,
    },
    {
      field: "activeStatus",
      headerName: "Status",
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
            handleDeleteRow(params.row);
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
          <IconButton onClick={() => setOpenForm(true)}>
            <AddIcon />
          </IconButton>
          <DataGrid
            rows={data || []}
            columns={columns}
            getRowId={(row) => row.descriptionId || 0}
            checkboxSelection={false}
            rowSelection={false}
          />
          <div>
            <SnackbarBaseline
              message={message}
              state={open}
              handleSnackbarClose={handleSnackbarClose}
            />
          </div>
        </div>
      )}

      <Modal open={openForm} onClose={() => setOpenForm(false)}>
        <Box sx={{ width: 400, padding: 4, backgroundColor: "white", margin: "auto" }}>
          <h3>{descriptionData ? "Edit Description" : "Add New Description"}</h3>
          <TextField
            label="Name"
            fullWidth
            margin="normal"
            value={descriptionData?.descriptionName || ""}
            onChange={(e) =>
              setDescriptionData((prev) => ({ ...prev, descriptionName: e.target.value }))
            }
          />
          <TextField
            label="Status"
            fullWidth
            margin="normal"
            value={descriptionData?.activeStatus || ""}
            onChange={(e) =>
              setDescriptionData((prev: any) => ({ ...prev, activeStatus: e.target.value }))
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
