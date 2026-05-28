"use client";
import { getErrorMessage } from "../../../types";
import React, { useState } from "react";
import { GridColDef } from "@mui/x-data-grid";
import { Box, Button, Link, Checkbox } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import SnackbarBaseline from "../../../components/SnackbarBaseline";
import ErrorDisplay from "../../../components/ErrorDisplay";
import EmptyState from "../../../components/EmptyState";
import LoadingState from "../../../components/LoadingState";
import ContentContainer from "../../../components/ContentContainer";
import MergeDialog from "../../../components/MergeDialog";
import NameActiveStatusFormFields from "../../../components/NameActiveStatusFormFields";
import useFetchCategory from "../../../hooks/useCategoryFetch";
import useCategoryInsert from "../../../hooks/useCategoryInsert";
import useCategoryDelete from "../../../hooks/useCategoryDelete";
import Category from "../../../model/Category";
import useCategoryUpdate from "../../../hooks/useCategoryUpdate";
import useCategoryMerge from "../../../hooks/useCategoryMerge";
import PageHeader from "../../../components/PageHeader";
import DataGridBase from "../../../components/DataGridBase";
import ConfirmDialog from "../../../components/ConfirmDialog";
import FormDialog from "../../../components/FormDialog";
import { useFinancePageState } from "../../../hooks/useFinancePageState";
import { useSpinnerEffect } from "../../../hooks/useSpinnerEffect";
import { useRowSelection } from "../../../hooks/useRowSelection";
import { modalTitles, modalBodies } from "../../../utils/modalMessages";
import { validateName } from "../../../utils/validateName";
import { createDeleteColumn } from "../../../utils/createDeleteColumn";
import { coerceActiveStatus } from "../../../utils/coerceActiveStatus";
import { useLocalStorageCache } from "../../../hooks/useLocalStorageCache";
import { createProcessRowUpdate } from "../../../utils/createProcessRowUpdate";

const CATEGORIES_CACHE_ENABLED_KEY = "finance_cache_enabled_categories";
const CATEGORIES_CACHE_DATA_KEY = "finance_cached_data_categories";

export default function Categories() {
  const {
    message,
    showSnackbar,
    snackbarSeverity,
    showSpinner,
    setShowSpinner,
    showModalAdd,
    setShowModalAdd,
    showModalDelete,
    setShowModalDelete,
    paginationModel,
    setPaginationModel,
    cacheEnabled,
    setCacheEnabled,
    isAuthenticated,
    loading,
    handleError,
    handleSuccess,
    handleSnackbarClose,
    setMessage,
    setShowSnackbar,
    setSnackbarSeverity,
  } = useFinancePageState(CATEGORIES_CACHE_ENABLED_KEY);

  const [categoryData, setCategoryData] = useState<Category | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [formErrors, setFormErrors] = useState<{
    categoryName?: string;
    activeStatus?: string;
  }>({});
  const [showModalMerge, setShowModalMerge] = useState(false);

  const { save, getStored } = useLocalStorageCache<Category>({
    storageKey: CATEGORIES_CACHE_DATA_KEY,
    cacheEnabledKey: CATEGORIES_CACHE_ENABLED_KEY,
  });

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
  const { mutateAsync: mergeCategories } = useCategoryMerge();

  const getRowId = (row: Category) =>
    row.categoryId ?? `${row.categoryName}-${row.activeStatus}`;

  const {
    rowSelection,
    isRowSelected,
    handleRowToggle,
    handleSelectAll,
    clearSelection,
    isAllSelected,
    isIndeterminate,
  } = useRowSelection(fetchedCategories, getRowId);

  useSpinnerEffect(setShowSpinner, isFetchingCategories, isSuccessCategories, loading, isAuthenticated);

  const handleDeleteRow = async () => {
    if (selectedCategory) {
      try {
        await deleteCategory(selectedCategory);
        handleSuccess("Category deleted successfully.");
      } catch (error) {
        handleError(error, "Delete Category failure.", false);
      } finally {
        setShowModalDelete(false);
        setSelectedCategory(null);
      }
    }
  };

  const handleAddRow = async (newData: Category) => {
    const errs: { categoryName?: string; activeStatus?: string } = {};
    const nameErr = validateName(newData?.categoryName || "");
    if (nameErr) errs.categoryName = nameErr;

    const { coerced, error: statusErr } = coerceActiveStatus(
      (newData as any)?.activeStatus,
    );
    if (statusErr) {
      errs.activeStatus = statusErr;
    } else if (coerced !== undefined) {
      newData.activeStatus = coerced;
    }

    if (Object.keys(errs).length > 0) {
      setFormErrors(errs);
      setMessage(errs.categoryName || "Validation failed");
      setSnackbarSeverity("error");
      setShowSnackbar(true);
      return;
    }

    try {
      await insertCategory({ category: newData });
      if (cacheEnabled) save(newData);
      handleSuccess("Category added successfully.");
    } catch (error) {
      handleError(error, `Add Category error: ${getErrorMessage(error)}`, false);
    } finally {
      setShowModalAdd(false);
    }
  };

  const handleOpenAddModal = () => {
    setCategoryData(cacheEnabled ? getStored() : null);
    setFormErrors({});
    setShowModalAdd(true);
  };

  const handleMerge = async (name: string) => {
    const selectedNames = (fetchedCategories || [])
      .filter((row) => rowSelection.includes(getRowId(row)))
      .map((row) => row.categoryName);
    try {
      await mergeCategories({ sourceNames: selectedNames, targetName: name.trim() });
      handleSuccess("Categories merged successfully.");
      setShowModalMerge(false);
      clearSelection();
      refetch();
    } catch (error: unknown) {
      handleError(error, `Merge Categories error: ${getErrorMessage(error)}`, false);
    }
  };

  const columns: GridColDef[] = [
    {
      field: "select",
      headerName: "",
      width: 50,
      sortable: false,
      disableColumnMenu: true,
      renderHeader: () => (
        <Checkbox
          checked={isAllSelected}
          indeterminate={isIndeterminate}
          onChange={handleSelectAll}
          slotProps={{ input: { "aria-label": "Select all categories" } }}
        />
      ),
      renderCell: (params) => (
        <Checkbox
          checked={isRowSelected(getRowId(params.row))}
          onChange={() => handleRowToggle(getRowId(params.row))}
          slotProps={{
            input: { "aria-label": `Select category ${params.row?.categoryName ?? ""}` },
          }}
        />
      ),
    },
    {
      field: "categoryName",
      headerName: "Name",
      width: 300,
      editable: true,
      renderCell: (params) => (
        <Link href={`/finance/transactions/category/${params.value}`}>
          {params.value}
        </Link>
      ),
    },
    {
      field: "activeStatus",
      headerName: "Status",
      width: 100,
      editable: true,
      renderCell: (params) => (params.value ? "Active" : "Inactive"),
    },
    createDeleteColumn<Category>((row) => {
      setSelectedCategory(row);
      setShowModalDelete(true);
    }),
  ];

  if (isErrorCategories) {
    return (
      <>
        <PageHeader
          title="Category Management"
          subtitle="Organize transactions by creating and managing categories for better tracking"
          actions={
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleOpenAddModal}
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
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Category Management"
        subtitle="Organize your transactions by creating and managing categories for better financial tracking"
        actions={
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleOpenAddModal}
              sx={{ backgroundColor: "primary.main" }}
            >
              Add Category
            </Button>
            {rowSelection.length > 0 && (
              <Button variant="outlined" onClick={() => setShowModalMerge(true)}>
                Merge
              </Button>
            )}
          </Box>
        }
      />
      {showSpinner ? (
        <LoadingState variant="card" message="Loading categories..." />
      ) : (
        <ContentContainer>
          {fetchedCategories && fetchedCategories.length > 0 ? (
            <DataGridBase
              rows={fetchedCategories.filter((row) => row != null)}
              columns={columns}
              getRowId={getRowId}
              paginationModel={paginationModel}
              onPaginationModelChange={(newModel) => setPaginationModel(newModel)}
              pageSizeOptions={[25, 50, 100]}
              autoHeight
              disableColumnResize={false}
              sx={{
                "& .MuiDataGrid-cell": {
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                },
                "& .MuiDataGrid-columnHeader[data-field='select'] .MuiDataGrid-iconSeparator":
                  { display: "none" },
                "& .MuiDataGrid-columnHeader[data-field='select'] .MuiDataGrid-columnSeparator":
                  { display: "none" },
                "& .MuiDataGrid-cell[data-field='select']": { borderRight: "none" },
              }}
              processRowUpdate={createProcessRowUpdate<Category>(
                (newRow, oldRow) => updateCategory({ oldCategory: oldRow, newCategory: newRow }),
                "Category updated successfully.",
                "Update Category failure.",
                handleSuccess,
                handleError,
              )}
            />
          ) : (
            <EmptyState
              title="No Categories Found"
              message="You haven't created any categories yet. Create your first category to organize your transactions."
              dataType="categories"
              variant="create"
              actionLabel="Add Category"
              onAction={handleOpenAddModal}
              onRefresh={() => refetch()}
            />
          )}
        </ContentContainer>
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
        message={modalBodies.confirmDeletion("category", selectedCategory?.categoryName ?? "")}
        confirmText="Delete"
        cancelText="Cancel"
      />

      <MergeDialog
        open={showModalMerge}
        title="Merge Categories"
        onClose={() => setShowModalMerge(false)}
        onSubmit={handleMerge}
      />

      <FormDialog
        open={showModalAdd}
        onClose={() => setShowModalAdd(false)}
        onSubmit={() =>
          handleAddRow(categoryData ?? ({ categoryName: "", activeStatus: true } as Category))
        }
        title={modalTitles.addNew("category")}
        submitText="Add"
      >
        <NameActiveStatusFormFields
          nameValue={categoryData?.categoryName || ""}
          nameError={formErrors.categoryName}
          activeStatus={!!categoryData?.activeStatus}
          activeStatusError={formErrors.activeStatus}
          onNameChange={(value) =>
            setCategoryData((prev) => (prev ? { ...prev, categoryName: value } : null))
          }
          onActiveStatusChange={(checked) =>
            setCategoryData((prev: Category) => ({ ...prev, activeStatus: checked }))
          }
          cacheEnabled={cacheEnabled}
          cacheEnabledKey={CATEGORIES_CACHE_ENABLED_KEY}
          cacheDataKey={CATEGORIES_CACHE_DATA_KEY}
          onCacheChange={setCacheEnabled}
        />
      </FormDialog>
    </>
  );
}
