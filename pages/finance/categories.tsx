import { useState, useEffect } from "react";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import {
  Box,
  Paper,
  Button,
  IconButton,
  Tooltip,
  Modal,
  Link,
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
import FinanceLayout from "../../layouts/FinanceLayout";

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

  const {
    data: fetchedCategories,
    isSuccess: isSuccessCategories,
    isLoading: isFetchingCategories,
    isError: isErrorCategories,
    refetch,
  } = useFetchCategory();
  const { mutateAsync: insertCategory } = useCategoryInsert();
  const { mutateAsync: updateCategory } = useCategoryUpdate();
  const { mutateAsync: deleteCategory } = useCategoryDelete();

  useEffect(() => {
    if (isFetchingCategories) {
      setShowSpinner(true);
      return;
    }
    if (isSuccessCategories) {
      setShowSpinner(false);
      setFetchError(null);
      if (typeof window !== "undefined") {
        const cachedData = localStorage.getItem("cachedCategories");
        if (cachedData) {
          setFallbackData(JSON.parse(cachedData));
        }
      }
    }
    if (isErrorCategories) {
      setShowSpinner(false);
      setFetchError("Failed to load categories. Please check your connection.");
    }
  }, [isSuccessCategories, isErrorCategories, isFetchingCategories]);

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
    const errorMessage = error.message
      ? `${moduleName}: ${error.message}`
      : `${moduleName}: Failure`;

    setMessage(errorMessage);
    setShowSnackbar(true);

    console.error(errorMessage);

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
        <Tooltip title="delete this row">
          <IconButton
            onClick={() => {
              setSelectedCategory(params.row);
              setConfirmDelete(true);
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
              rows={fetchedCategories || []}
              columns={columns}
              getRowId={(row) => row.categoryId || 0}
              checkboxSelection={false}
              rowSelection={false}
              processRowUpdate={async (
                newRow: Category,
                oldRow: Category,
              ): Promise<Category> => {
                if (JSON.stringify(newRow) === JSON.stringify(oldRow)) {
                  return oldRow;
                }
                try {
                  await updateCategory({
                    oldCategory: oldRow,
                    newCategory: newRow,
                  });
                  setMessage("Category updated successfully.");
                  setShowSnackbar(true);

                  return { ...newRow };
                } catch (error) {
                  handleError(error, "Update Category failure.", false);
                  throw error;
                }
              }}
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
          <Paper>
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
          </Paper>
        </Modal>

        {/* Modal Add Category */}
        <Modal open={showModalAdd} onClose={() => setShowModalAdd(false)}>
          <Paper>
            <h3>Add New Category</h3>
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
              Add
            </Button>
          </Paper>
        </Modal>
      </FinanceLayout>
    </div>
  );
}
