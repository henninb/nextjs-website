import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { GridColDef } from "@mui/x-data-grid";
import {
  Box,
  Button,
  IconButton,
  Tooltip,
  Link,
  TextField,
  Switch,
  FormControlLabel,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import FinanceLayout from "../../layouts/FinanceLayout";
import PageHeader from "../../components/PageHeader";
import DataGridBase from "../../components/DataGridBase";
import ConfirmDialog from "../../components/ConfirmDialog";
import FormDialog from "../../components/FormDialog";
import LoadingState from "../../components/LoadingState";
import EmptyState from "../../components/EmptyState";
import ErrorDisplay from "../../components/ErrorDisplay";
import SnackbarBaseline from "../../components/SnackbarBaseline";
import { useAuth } from "../../components/AuthProvider";
import { modalTitles, modalBodies } from "../../utils/modalMessages";

import Category from "../../model/Category";

import useCategoryFetchGql from "../../hooks/useCategoryFetchGql";
import useCategoryInsertGql from "../../hooks/useCategoryInsertGql";
import useCategoryDeleteGql from "../../hooks/useCategoryDeleteGql";
import useCategoryUpdateGql from "../../hooks/useCategoryUpdateGql";

export default function CategoriesNextGen() {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();

  const [message, setMessage] = useState("");
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [snackbarSeverity, setSnackbarSeverity] = useState<
    "error" | "warning" | "info" | "success"
  >("info");
  const [showSpinner, setShowSpinner] = useState(true);
  const [showModalAdd, setShowModalAdd] = useState(false);
  const [showModalDelete, setShowModalDelete] = useState(false);
  const [paginationModel, setPaginationModel] = useState({
    pageSize: 50,
    page: 0,
  });

  const [categoryData, setCategoryData] = useState<Category | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null,
  );
  const [formErrors, setFormErrors] = useState<{
    categoryName?: string;
    activeStatus?: string;
  }>({});

  const {
    data: fetchedCategories,
    isSuccess: isSuccessCategories,
    isFetching: isFetchingCategories,
    isError: isErrorCategories,
    error: errorCategories,
    refetch: refetchCategories,
  } = useCategoryFetchGql();

  const { mutateAsync: insertCategory } = useCategoryInsertGql();
  const { mutateAsync: deleteCategory } = useCategoryDeleteGql();
  const { mutateAsync: updateCategory } = useCategoryUpdateGql();

  const categoriesToDisplay =
    fetchedCategories?.filter((row) => row != null) || [];

  useEffect(() => {
    if (loading) setShowSpinner(true);
    if (!loading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [loading, isAuthenticated, router]);

  useEffect(() => {
    if (
      isFetchingCategories ||
      loading ||
      (!loading && !isAuthenticated)
    ) {
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
        handleSuccess("Category deleted successfully.");
      } catch (error: any) {
        handleError(error, "Delete Category failure.", false);
      } finally {
        setShowModalDelete(false);
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
    setSnackbarSeverity("error");
    setShowSnackbar(true);

    console.error(errorMessage);

    if (throwIt) throw error;
  };

  const handleSuccess = (successMessage: string) => {
    setMessage(successMessage);
    setSnackbarSeverity("success");
    setShowSnackbar(true);
  };

  const handleAddRow = async (newData: Category) => {
    const errs: { categoryName?: string; activeStatus?: string } = {};
    const name = newData?.categoryName || "";
    if (!name || name.trim() === "") {
      errs.categoryName = "Name is required";
    } else {
      if (name.length > 50) {
        errs.categoryName = "Name too long (max 50 characters)";
      } else if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
        errs.categoryName =
          "Name can only contain letters, numbers, hyphens, and underscores (no spaces)";
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
      setMessage(errs.categoryName || "Validation failed");
      setSnackbarSeverity("error");
      setShowSnackbar(true);
      return;
    }

    try {
      console.log("from handleAddRow: " + JSON.stringify(newData));
      await insertCategory({ category: newData });

      handleSuccess("Category added successfully.");
    } catch (error: any) {
      handleError(error, `Add Category error: ${error.message}`, false);
    } finally {
      setShowModalAdd(false);
    }
  };

  const getRowId = (row: any) =>
    row.categoryId ?? `${row.categoryName}-${row.activeStatus}`;

  const columns: GridColDef[] = [
    {
      field: "categoryName",
      headerName: "Name",
      flex: 2,
      minWidth: 300,
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
      flex: 0.6,
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
        <Tooltip title="Delete this row">
          <IconButton
            aria-label="Delete this row"
            onClick={() => {
              setSelectedCategory(params.row);
              setShowModalDelete(true);
            }}
          >
            <DeleteIcon />
          </IconButton>
        </Tooltip>
      ),
    },
  ];

  if (isErrorCategories) {
    return (
      <FinanceLayout>
        <PageHeader
          title="Category Management (Next‑Gen)"
          subtitle="GraphQL-powered category organization for better tracking"
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
          onRetry={() => refetchCategories()}
        />
      </FinanceLayout>
    );
  }

  return (
    <div>
      <FinanceLayout>
        <PageHeader
          title="Category Management (Next‑Gen)"
          subtitle="GraphQL-powered category organization for better tracking"
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
        ) : categoriesToDisplay && categoriesToDisplay.length > 0 ? (
          <Box display="flex" justifyContent="center">
            <Box sx={{ width: "100%", maxWidth: "1200px" }}>
              <DataGridBase
                rows={categoriesToDisplay}
                columns={columns}
                getRowId={getRowId}
                checkboxSelection={false}
                rowSelection={false}
                paginationModel={paginationModel}
                onPaginationModelChange={(m) => setPaginationModel(m)}
                pageSizeOptions={[25, 50, 100]}
                processRowUpdate={async (
                  newRow: Category,
                  oldRow: Category,
                ): Promise<Category> => {
                  if (JSON.stringify(newRow) === JSON.stringify(oldRow))
                    return oldRow;
                  try {
                    await updateCategory({
                      oldCategory: oldRow,
                      newCategory: newRow,
                    });
                    handleSuccess("Category updated successfully.");
                    return { ...newRow };
                  } catch (error: any) {
                    handleError(error, "Update Category failure.", false);
                    return oldRow;
                  }
                }}
                autoHeight
                disableColumnResize={false}
                sx={{
                  "& .MuiDataGrid-cell": {
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  },
                }}
              />
            </Box>
          </Box>
        ) : (
          <EmptyState
            title="No Categories Found"
            message="You haven't created any categories yet. Create your first category to organize your transactions."
            dataType="categories"
            variant="create"
            actionLabel="Add Category"
            onAction={() => setShowModalAdd(true)}
            onRefresh={() => refetchCategories()}
          />
        )}

        <SnackbarBaseline
          message={message}
          state={showSnackbar}
          handleSnackbarClose={handleSnackbarClose}
          severity={snackbarSeverity}
        />

        <ConfirmDialog
          open={showModalDelete}
          onClose={() => setShowModalDelete(false)}
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
          onSubmit={() => {
            if (categoryData) {
              handleAddRow(categoryData);
            } else {
              handleAddRow({
                categoryId: 0,
                categoryName: "",
                activeStatus: true,
              } as Category);
            }
          }}
          title={modalTitles.addNew("category")}
          submitText="Add"
        >
          <TextField
            label="Name"
            fullWidth
            margin="normal"
            value={categoryData?.categoryName || ""}
            error={!!formErrors.categoryName}
            helperText={
              formErrors.categoryName ||
              "Lowercase letters, numbers, hyphens, and underscores only (no spaces)"
            }
            onChange={(e) =>
              setCategoryData((prev) => ({
                ...prev,
                categoryId: prev?.categoryId || 0,
                categoryName: e.target.value,
                activeStatus: prev?.activeStatus ?? true,
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
                      categoryId: prev?.categoryId || 0,
                      categoryName: prev?.categoryName || "",
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
