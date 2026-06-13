"use client";

import React, { useEffect, useState, useMemo } from "react";
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
  Fade,
  Grow,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import CategoryIcon from "@mui/icons-material/Category";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import WarningIcon from "@mui/icons-material/Warning";
import PageHeader from "../../../components/PageHeader";
import DataGridBase from "../../../components/DataGridBase";
import ConfirmDialog from "../../../components/ConfirmDialog";
import FormDialog from "../../../components/FormDialog";
import LoadingState from "../../../components/LoadingState";
import EmptyState from "../../../components/EmptyState";
import ErrorDisplay from "../../../components/ErrorDisplay";
import SnackbarBaseline from "../../../components/SnackbarBaseline";
import CacheToggleCheckbox from "../../../components/CacheToggleCheckbox";
import ContentContainer from "../../../components/ContentContainer";
import StatCard from "../../../components/StatCard";
import StatCardSkeleton from "../../../components/StatCardSkeleton";
import ViewToggle from "../../../components/ViewToggle";
import CategoryFilterBar, {
  CategoryFilters,
} from "../../../components/CategoryFilterBar";
import CategoryCard from "../../../components/CategoryCard";
import CategoryCardSkeleton from "../../../components/CategoryCardSkeleton";
import { getErrorMessage } from "../../../types";
import { modalTitles, modalBodies } from "../../../utils/modalMessages";
import { coerceActiveStatus } from "../../../utils/coerceActiveStatus";
import { useLocalStorageCache } from "../../../hooks/useLocalStorageCache";
import { useFinancePageState } from "../../../hooks/useFinancePageState";
import Category from "../../../model/Category";
import useCategoryFetchGql from "../../../hooks/useCategoryFetchGql";
import useCategoryInsertGql from "../../../hooks/useCategoryInsertGql";
import useCategoryDeleteGql from "../../../hooks/useCategoryDeleteGql";
import useCategoryUpdateGql from "../../../hooks/useCategoryUpdateGql";

const CATEGORIES_NEXT_CACHE_ENABLED_KEY =
  "finance_cache_enabled_categories_next";
const CATEGORIES_NEXT_CACHE_DATA_KEY = "finance_cached_data_categories_next";

export default function CategoriesNextGen() {
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
  } = useFinancePageState(CATEGORIES_NEXT_CACHE_ENABLED_KEY);

  const [categoryData, setCategoryData] = useState<Category | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [formErrors, setFormErrors] = useState<{
    categoryName?: string;
    activeStatus?: string;
  }>({});

  const [view, setView] = useState<"grid" | "table">("table");
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<CategoryFilters>({
    status: "all",
    usage: "all",
  });

  const { save, getStored } = useLocalStorageCache<Category>({
    storageKey: CATEGORIES_NEXT_CACHE_DATA_KEY,
    cacheEnabledKey: CATEGORIES_NEXT_CACHE_ENABLED_KEY,
  });

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

  useEffect(() => {
    try {
      const saved = localStorage.getItem("categoryView") as "grid" | "table";
      if (saved) setView(saved);
    } catch {
      // localStorage may not be available
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("categoryView", view);
    } catch {
      // localStorage may not be available
    }
  }, [view]);

  const filteredCategories = useMemo(() => {
    let filtered = fetchedCategories?.filter((row) => row != null) || [];

    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      filtered = filtered.filter((cat) =>
        cat.categoryName.toLowerCase().includes(lowerSearch),
      );
    }

    if (filters.status !== "all") {
      filtered = filtered.filter((cat) =>
        filters.status === "active" ? cat.activeStatus : !cat.activeStatus,
      );
    }

    if (filters.usage !== "all") {
      filtered = filtered.filter((cat) => {
        const isUnused = !cat.categoryCount || cat.categoryCount === 0;
        return filters.usage === "unused" ? isUnused : !isUnused;
      });
    }

    return filtered;
  }, [fetchedCategories, searchTerm, filters]);

  const stats = useMemo(() => {
    const all = fetchedCategories || [];
    return {
      total: all.length,
      active: all.filter((cat) => cat.activeStatus).length,
      inactive: all.filter((cat) => !cat.activeStatus).length,
      unused: all.filter((cat) => !cat.categoryCount || cat.categoryCount === 0)
        .length,
    };
  }, [fetchedCategories]);

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
        handleSuccess("Category deleted successfully.");
      } catch (error: unknown) {
        handleError(error, "Delete Category failure.", false);
      } finally {
        setShowModalDelete(false);
        setSelectedCategory(null);
      }
    }
  };

  const handleAddRow = async (newData: Category) => {
    const errs: { categoryName?: string; activeStatus?: string } = {};
    const name = newData?.categoryName || "";
    if (!name || name.trim() === "") {
      errs.categoryName = "Name is required";
    } else if (name.length > 50) {
      errs.categoryName = "Name too long (max 50 characters)";
    } else if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
      errs.categoryName =
        "Name can only contain letters, numbers, hyphens, and underscores (no spaces)";
    }

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
    } catch (error: unknown) {
      handleError(
        error,
        `Add Category error: ${getErrorMessage(error)}`,
        false,
      );
    } finally {
      setShowModalAdd(false);
    }
  };

  const handleOpenAddModal = () => {
    setCategoryData(cacheEnabled ? getStored() : null);
    setFormErrors({});
    setShowModalAdd(true);
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setFilters({ status: "all", usage: "all" });
  };

  const getRowId = (row: Category) =>
    row.categoryId ?? `${row.categoryName}-${row.activeStatus}`;

  const columns: GridColDef[] = [
    {
      field: "categoryName",
      headerName: "Name",
      flex: 2,
      minWidth: 300,
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
      flex: 0.6,
      minWidth: 100,
      editable: true,
      renderCell: (params) => (params.value ? "Active" : "Inactive"),
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
      <>
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
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Category Management (Next‑Gen)"
        subtitle="GraphQL-powered category organization for better tracking"
        actions={
          <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
            <Fade in timeout={600}>
              <Box>
                <ViewToggle view={view} onChange={setView} />
              </Box>
            </Fade>
            <Fade in timeout={700}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleOpenAddModal}
                sx={{ backgroundColor: "primary.main" }}
              >
                Add Category
              </Button>
            </Fade>
          </Box>
        }
      />

      <Fade in timeout={500}>
        <Box>
          <CategoryFilterBar
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            activeFilters={filters}
            onFilterChange={setFilters}
            onClearFilters={handleClearFilters}
            resultCount={filteredCategories.length}
            totalCount={fetchedCategories?.length || 0}
          />
        </Box>
      </Fade>

      {showSpinner ? (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, 1fr)",
              md: "repeat(4, 1fr)",
            },
            gap: 2,
            mb: 3,
          }}
        >
          {[0, 1, 2, 3].map((i) => (
            <Grow in timeout={700 + i * 100} key={i}>
              <Box>
                <StatCardSkeleton />
              </Box>
            </Grow>
          ))}
        </Box>
      ) : (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, 1fr)",
              md: "repeat(4, 1fr)",
            },
            gap: 2,
            mb: 3,
          }}
        >
          <Grow in timeout={700}>
            <Box>
              <StatCard
                icon={<CategoryIcon />}
                label="Total"
                value={stats.total}
                color="primary"
              />
            </Box>
          </Grow>
          <Grow in timeout={800}>
            <Box>
              <StatCard
                icon={<CheckCircleIcon />}
                label="Active"
                value={stats.active}
                color="success"
              />
            </Box>
          </Grow>
          <Grow in timeout={900}>
            <Box>
              <StatCard
                icon={<CancelIcon />}
                label="Inactive"
                value={stats.inactive}
                color="warning"
              />
            </Box>
          </Grow>
          <Grow in timeout={1000}>
            <Box>
              <StatCard
                icon={<WarningIcon />}
                label="Not Used"
                value={stats.unused}
                color="secondary"
              />
            </Box>
          </Grow>
        </Box>
      )}

      {showSpinner ? (
        <LoadingState variant="card" message="Loading categories..." />
      ) : filteredCategories && filteredCategories.length > 0 ? (
        view === "grid" ? (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, 1fr)",
                md: "repeat(3, 1fr)",
                lg: "repeat(4, 1fr)",
              },
              gap: 2,
            }}
          >
            {filteredCategories.map((category, index) => (
              <Fade in timeout={600 + index * 100} key={category.categoryId}>
                <Box>
                  <CategoryCard
                    category={category}
                    onDelete={(cat) => {
                      setSelectedCategory(cat);
                      setShowModalDelete(true);
                    }}
                  />
                </Box>
              </Fade>
            ))}
          </Box>
        ) : (
          <ContentContainer>
            <DataGridBase
              rows={filteredCategories}
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
                } catch (error: unknown) {
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
          </ContentContainer>
        )
      ) : (
        <EmptyState
          title="No Categories Found"
          message={
            searchTerm || filters.status !== "all" || filters.usage !== "all"
              ? "No categories match your current filters. Try adjusting your search or filter criteria."
              : "You haven't created any categories yet. Create your first category to organize your transactions."
          }
          dataType="categories"
          variant={
            searchTerm || filters.status !== "all" || filters.usage !== "all"
              ? "search"
              : "create"
          }
          actionLabel={
            searchTerm || filters.status !== "all" || filters.usage !== "all"
              ? "Clear Filters"
              : "Add Category"
          }
          onAction={() => {
            if (
              searchTerm ||
              filters.status !== "all" ||
              filters.usage !== "all"
            ) {
              handleClearFilters();
            } else {
              handleOpenAddModal();
            }
          }}
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
        onSubmit={() =>
          handleAddRow(
            categoryData ?? ({
              categoryId: 0,
              categoryName: "",
              activeStatus: true,
            } as Category),
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
        <Box sx={{ mt: 1 }}>
          <FormControlLabel
            control={
              <Switch
                checked={!!categoryData?.activeStatus}
                onChange={(e) =>
                  setCategoryData((prev: Category) => ({
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
        <CacheToggleCheckbox
          checked={cacheEnabled}
          cacheEnabledKey={CATEGORIES_NEXT_CACHE_ENABLED_KEY}
          cacheDataKey={CATEGORIES_NEXT_CACHE_DATA_KEY}
          onChange={setCacheEnabled}
        />
      </FormDialog>
    </>
  );
}
