import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { GridColDef } from "@mui/x-data-grid";
import { Box, Button, IconButton, Tooltip, Link, TextField, Typography, Alert, Switch, FormControlLabel } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import Spinner from "../../components/Spinner";
import SnackbarBaseline from "../../components/SnackbarBaseline";
import ErrorDisplay from "../../components/ErrorDisplay";
import EmptyState from "../../components/EmptyState";
import LoadingState from "../../components/LoadingState";
import useFetchCategory from "../../hooks/useCategoryFetch";
import useCategoryInsert from "../../hooks/useCategoryInsert";
import useCategoryDelete from "../../hooks/useCategoryDelete";
import Category from "../../model/Category";
import useCategoryUpdate from "../../hooks/useCategoryUpdate";
import FinanceLayout from "../../layouts/FinanceLayout";
import PageHeader from "../../components/PageHeader";
import DataGridBase from "../../components/DataGridBase";
import ConfirmDialog from "../../components/ConfirmDialog";
import FormDialog from "../../components/FormDialog";
import { useAuth } from "../../components/AuthProvider";
import { modalTitles, modalBodies } from "../../utils/modalMessages";

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
  const [formErrors, setFormErrors] = useState<{
    categoryName?: string;
    activeStatus?: string;
  }>({});

  const {
    data: fetchedCategories,
    isSuccess: isSuccessCategories,
    isLoading: isFetchingCategories,
    isError: isErrorCategories,
    error: errorCategories,
    refetch,
  } = useFetchCategory();
  const { mutateAsync: insertCategory } = useCategoryInsert();
  const { mutateAsync: updateCategory } = useCategoryUpdate();
  const { mutateAsync: deleteCategory } = useCategoryDelete();
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [loading, isAuthenticated, router]);

  useEffect(() => {
    if (isFetchingCategories || loading || (!loading && !isAuthenticated)) {
      setShowSpinner(true);
      return;
    }
    if (isSuccessCategories) {
      setShowSpinner(false);
    }
  }, [
    isSuccessCategories,
    isErrorCategories,
    isFetchingCategories,
    loading,
    isAuthenticated,
  ]);

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
    const errs: { categoryName?: string; activeStatus?: string } = {};
    const name = newData?.categoryName || "";
    if (!name || name.trim() === "") {
      errs.categoryName = "Name is required";
    } else {
      if (name.length > 255) {
        errs.categoryName = "Name too long";
      } else if (!/^[a-zA-Z0-9 _-]+$/.test(name)) {
        errs.categoryName = "Name contains invalid characters";
      }
    }
    // Validate status: must be boolean; allow string 'true'/'false'
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
      flex: 2,
      minWidth: 150,
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
      flex: 1,
      minWidth: 100,
      editable: true,
      renderCell: (params) => {
        return params.value ? "Active" : "Inactive";
      },
    },
    {
      field: "",
      headerName: "Actions",
      width: 100,
      sortable: false,
      filterable: false,
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

  // Handle error states first
  if (isErrorCategories) {
    return (
      <FinanceLayout>
        <PageHeader
          title="Category Management"
          subtitle="Organize transactions by creating and managing categories for better tracking"
          actions={
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setShowModalAdd(true)}
              sx={{ backgroundColor: "primary.main" }}
            >
              Add Category
            </Button>
          }
        />
        <ErrorDisplay
          error={errorCategories}
          variant="card"
          showRetry={true}
          onRetry={() => refetch()}
        />
      </FinanceLayout>
    );
  }

  return (
    <div>
      <FinanceLayout>
        <PageHeader
          title="Category Management"
          subtitle="Organize your transactions by creating and managing categories for better financial tracking"
          actions={
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setShowModalAdd(true)}
              sx={{ backgroundColor: "primary.main" }}
            >
              Add Category
            </Button>
          }
        />
        {showSpinner ? (
          <LoadingState variant="card" message="Loading categories..." />
        ) : (
          <div>
            <Box display="flex" justifyContent="center">
              <Box sx={{ width: "100%", maxWidth: "800px" }}>
                {fetchedCategories && fetchedCategories.length > 0 ? (
                  <DataGridBase
                    rows={fetchedCategories || []}
                    columns={columns}
                    getRowId={(row: any) =>
                      row.categoryId ?? `${row.categoryName}-${row.activeStatus}`
                    }
                    checkboxSelection={false}
                    rowSelection={false}
                    autoHeight
                    sx={{
                      "& .MuiDataGrid-cell": {
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      },
                    }}
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
                        return oldRow;
                      }
                    }}
                  />
                ) : (
                  <EmptyState
                    title="No Categories Found"
                    message="You haven't created any categories yet. Create your first category to organize your transactions."
                    dataType="categories"
                    variant="create"
                    actionLabel="Add Category"
                    onAction={() => setShowModalAdd(true)}
                    onRefresh={() => refetch()}
                  />
                )}
              </Box>
            </Box>
          </div>
        )}

        <SnackbarBaseline
          message={message}
          state={showSnackbar}
          handleSnackbarClose={handleSnackbarClose}
        />

        <ConfirmDialog
          open={confirmDelete}
          onClose={() => setConfirmDelete(false)}
          onConfirm={handleDeleteRow}
          title={modalTitles.confirmDeletion}
          message={modalBodies.confirmDeletion(
            "category",
            selectedCategory?.categoryName ?? "",
          )}
          confirmText="Delete"
          cancelText="Cancel"
        />

        <FormDialog
          open={showModalAdd}
          onClose={() => setShowModalAdd(false)}
          onSubmit={() =>
            handleAddRow(
              (categoryData as Category) ||
                ({ categoryName: "", activeStatus: true } as any),
            )
          }
          title={modalTitles.addNew("category")}
          submitText="Add"
        >
          <TextField
              label="Name"
              fullWidth
              margin="normal"
              value={categoryData?.categoryName || ""}
              error={!!formErrors.categoryName}
              helperText={formErrors.categoryName}
              onChange={(e) =>
                setCategoryData((prev) => ({
                  ...prev,
                  categoryName: e.target.value,
                }))
              }
            />
          <Box mt={1}>
            <FormControlLabel
              control={
                <Switch
                  checked={!!categoryData?.activeStatus}
                  onChange={(e) =>
                    setCategoryData((prev: any) => ({
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
        </FormDialog>
      </FinanceLayout>
    </div>
  );
}
