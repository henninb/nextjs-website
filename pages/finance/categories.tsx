import { useState, useEffect } from "react";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import {
  Box,
  Button,
  IconButton,
  Modal,
  TextField,
  Typography,
  Alert,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import Spinner from "../../components/Spinner";
import SnackbarBaseline from "../../components/SnackbarBaseline";
import useFetchCategory from "../../hooks/useCategoryFetch";
import useCategoryInsert from "../../hooks/useCategoryInsert";
import useCategoryDelete from "../../hooks/useCategoryDelete";
import Category from "../../model/Category";
import useCategoryUpdate from "../../hooks/useCategoryUpdate";
import Link from "next/link";

export default function Categories() {
  const [message, setMessage] = useState("");
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [showSpinner, setShowSpinner] = useState(true);
  const [showModalAdd, setShowModalAdd] = useState(false);
  const [categoryData, setCategoryData] = useState<Category | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null,
  );
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [fallbackData, setFallbackData] = useState<Category[]>([]);

  const { data, isSuccess, isError, refetch } = useFetchCategory();
  const { mutateAsync: insertCategory } = useCategoryInsert();
  const { mutateAsync: updateCategory } = useCategoryUpdate();
  const { mutateAsync: deleteCategory } = useCategoryDelete();

  useEffect(() => {
    if (isSuccess) {
      setShowSpinner(false);
      setFetchError(null);
      if (typeof window !== "undefined") {
        const cachedData = localStorage.getItem("cachedCategories");
        if (cachedData) {
          setFallbackData(JSON.parse(cachedData));
        }
      }
    }
    if (isError) {
      setShowSpinner(false);
      setFetchError("Failed to load categories. Please check your connection.");
    }
  }, [isSuccess, isError, data]);

  // Load cached data if API fails
  // const fallbackData: Category[] = JSON.parse(
  //   localStorage.getItem("cachedCategories") || "[]",
  // );
  // const fallbackData: Category[] = JSON.parse(
  //   localStorage.getItem("cachedCategories") || "[]"
  // );

  const handleDeleteRow = async () => {
    if (selectedCategory) {
      try {
        await deleteCategory(selectedCategory);
        setMessage("Category deleted successfully.");
        setShowSnackbar(true);
      } catch (error) {
        handleError(error, "Delete Category failure.", false);
      } finally {
        setConfirmDelete(false);
        setSelectedCategory(null);
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

  const handleAddRow = async (newData: Category) => {
    try {
      console.log("from handleAddRow: " + JSON.stringify(newData));
      await insertCategory({ category: newData });

      setMessage("Category inserted successfully.");
      setShowSnackbar(true);
    } catch (error) {
      handleError(error, `Add Category error: ${error.message}`, false);
    } finally {
      setShowModalAdd(false);
    }
  };

  const columns: GridColDef[] = [
    {
      field: "categoryName",
      headerName: "Name",
      width: 200,
      editable: true,
      renderCell: (params) => {
        return (
          <Link href={`/finance/transactions/category/${params.value}`}>
            {params.value}
          </Link>
        );
      },
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
            setSelectedCategory(params.row);
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
      <h2>Category Details</h2>
      {showSpinner ? (
        <Spinner />
      ) : fetchError ? (
        <Box sx={{ textAlign: "center", mt: 3 }}>
          <Alert severity="error">{fetchError}</Alert>
          {fallbackData.length > 0 ? (
            <>
              <Typography variant="body1" sx={{ mt: 2 }}>
                Showing cached data instead:
              </Typography>
              <DataGrid
                rows={fallbackData}
                columns={columns}
                getRowId={(row) => row.categoryId || 0}
              />
            </>
          ) : (
            <Typography variant="body1" sx={{ mt: 2 }}>
              No cached data available.
            </Typography>
          )}
          <Button
            variant="contained"
            color="primary"
            sx={{ mt: 2 }}
            onClick={() => {
              setShowSpinner(true);
              refetch();
            }}
          >
            Retry
          </Button>
        </Box>
      ) : (
        <div>
          <IconButton onClick={() => setShowModalAdd(true)}>
            <AddIcon />
          </IconButton>
          <DataGrid
            //rows={data?.filter((row) => row != null) || []}
            rows={data || []}
            columns={columns}
            getRowId={(row) => row.categoryId || 0}
            checkboxSelection={false}
            rowSelection={false}
            processRowUpdate={async (newRow, oldRow) => {
              try {
                await updateCategory({
                  oldCategory: oldRow,
                  newCategory: newRow,
                });
                setMessage("Category updated successfully.");
                setShowSnackbar(true);
                return newRow;
              } catch (error) {
                handleError(error, "Update Category failure.", false);
                return oldRow; // Revert the row
              }
            }}
            // processRowUpdate={async (newRow: Category, oldRow: Category) => {
            //   try {
            //     await updateCategory({
            //       oldCategory: oldRow,
            //       newCategory: newRow,
            //     });
            //     setMessage("Category updated successfully.");
            //     setShowSnackbar(true);
            //   } catch (error) {
            //     handleError(error, "Update Category failure.", false);
            //   }
            //   return newRow;
            // }}
          />
        </div>
      )}

      <SnackbarBaseline
        message={message}
        state={showSnackbar}
        handleSnackbarClose={handleSnackbarClose}
      />

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
            Are you sure you want to delete the category "
            {JSON.stringify(selectedCategory)}"?
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

      {/* Add/Edit Category Modal */}
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
          <h3>{categoryData ? "Edit Category" : "Add New Category"}</h3>
          <TextField
            label="Name"
            fullWidth
            margin="normal"
            value={categoryData?.categoryName || ""}
            onChange={(e) =>
              setCategoryData((prev) => ({
                ...prev,
                categoryName: e.target.value,
              }))
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
                activeStatus: e.target.value,
              }))
            }
          />
          <Button
            variant="contained"
            onClick={() => {
              categoryData && handleAddRow(categoryData);
            }}
          >
            {categoryData ? "Update" : "Add"}
          </Button>
        </Box>
      </Modal>
    </div>
  );
}
