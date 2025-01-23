import { useState, useEffect } from "react";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { Box, Button, IconButton, Modal, TextField } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import Spinner from "../../components/Spinner";
import SnackbarBaseline from "../../components/SnackbarBaseline";
import useFetchCategory from "../../hooks/useCategoryFetch";
import useCategoryInsert from "../../hooks/useCategoryInsert";
import useCategoryDelete from "../../hooks/useCategoryDelete";
import Category from "../../model/Category";
import useCategoryUpdate from "../../hooks/useCategoryUpdate";

export default function Categories() {
  const [message, setMessage] = useState("");
  const [open, setOpen] = useState(false);
  const [showSpinner, setShowSpinner] = useState(true);
  const [openForm, setOpenForm] = useState(false);
  const [categoryData, setCategoryData] = useState<Category | null>(null);

  const { data, isSuccess, isLoading } = useFetchCategory();
  const { mutate: insertCategory } = useCategoryInsert();
  const { mutate: updateCategory } = useCategoryUpdate();
  const { mutate: deleteCategory } = useCategoryDelete();

  useEffect(() => {
    if (isSuccess) {
      setShowSpinner(false);
    }
  }, [isSuccess]);

  const handleDeleteRow = async (category: Category) => {
    try {
      await deleteCategory(category);
    } catch (error) {
      handleError(error, "Delete Category", false);
    }
  };

  const handleSnackbarClose = () => {
    setOpen(false);
  };

  const handleError = (error: any, moduleName: string, throwIt: boolean) => {
    const errorMessage = error.response
      ? `${moduleName}: ${error.response.status} - ${JSON.stringify(
          error.response.data,
        )}`
      : `${moduleName}: Failure`;

    setMessage(errorMessage);
    setOpen(true);
    if (throwIt) throw error;
  };

  const addRow = async (newData: Category) => {
    try {
      await insertCategory(newData);
      setOpenForm(false);
    } catch (error) {
      handleError(error, "Add Category", false);
    }
  };

  const columns: GridColDef[] = [
    {
      field: "categoryName",
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
      <h2>Category Details</h2>
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
            getRowId={(row) => row.categoryId || 0}
            checkboxSelection={false}
            rowSelection={false}
            processRowUpdate={(newRow: Category, oldRow: Category) => {
              // Handle row update here
              console.log("Row updating:", newRow);
              updateCategory({ oldCategory: oldRow, newCategory: newRow });
              console.log("Row updated:", newRow);
              return newRow; // Return the updated row
            }}
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
        <Box
          sx={{
            width: 400,
            padding: 4,
            backgroundColor: "white",
            margin: "auto",
          }}
        >
          <h3>{categoryData ? "Edit Category" : "Add New Category"}</h3>
          <TextField
            label="Name"
            fullWidth
            margin="normal"
            value={categoryData?.categoryName || ""}
            onChange={(e) =>
              setCategoryData((prev) => ({ ...prev, name: e.target.value }))
            }
          />
          <TextField
            label="Status"
            fullWidth
            margin="normal"
            value={categoryData?.activeStatus || ""}
            onChange={(e) =>
              setCategoryData((prev: any) => ({
                ...prev,
                description: e.target.value,
              }))
            }
          />
          <Button
            variant="contained"
            onClick={() => categoryData && addRow(categoryData)}
          >
            {categoryData ? "Update" : "Add"}
          </Button>
        </Box>
      </Modal>
    </div>
  );
}
