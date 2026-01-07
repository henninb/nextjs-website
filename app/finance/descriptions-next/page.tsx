"use client";
import { getErrorMessage } from "../../../types";

import React, { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
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
import DescriptionIcon from "@mui/icons-material/Description";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import WarningIcon from "@mui/icons-material/Warning";
import FinanceLayout from "../../../layouts/FinanceLayout";
import PageHeader from "../../../components/PageHeader";
import DataGridBase from "../../../components/DataGridBase";
import ConfirmDialog from "../../../components/ConfirmDialog";
import FormDialog from "../../../components/FormDialog";
import LoadingState from "../../../components/LoadingState";
import EmptyState from "../../../components/EmptyState";
import ErrorDisplay from "../../../components/ErrorDisplay";
import SnackbarBaseline from "../../../components/SnackbarBaseline";
import StatCard from "../../../components/StatCard";
import StatCardSkeleton from "../../../components/StatCardSkeleton";
import ViewToggle from "../../../components/ViewToggle";
import DescriptionFilterBar, {
  DescriptionFilters,
} from "../../../components/DescriptionFilterBar";
import DescriptionCard from "../../../components/DescriptionCard";
import DescriptionCardSkeleton from "../../../components/DescriptionCardSkeleton";
import { useAuth } from "../../../components/AuthProvider";
import { modalTitles, modalBodies } from "../../../utils/modalMessages";

import Description from "../../../model/Description";

import useDescriptionFetchGql from "../../../hooks/useDescriptionFetchGql";
import useDescriptionInsertGql from "../../../hooks/useDescriptionInsertGql";
import useDescriptionDeleteGql from "../../../hooks/useDescriptionDeleteGql";
import useDescriptionUpdateGql from "../../../hooks/useDescriptionUpdateGql";

export default function DescriptionsNextGen() {
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

  const [descriptionData, setDescriptionData] = useState<Description | null>(
    null,
  );
  const [selectedDescription, setSelectedDescription] =
    useState<Description | null>(null);
  const [formErrors, setFormErrors] = useState<{
    descriptionName?: string;
    activeStatus?: string;
  }>({});

  // Modern view state
  const [view, setView] = useState<"grid" | "table">(
    () =>
      (typeof window !== "undefined" &&
        (localStorage.getItem("descriptionView") as "grid" | "table")) ||
      "table",
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<DescriptionFilters>({
    status: "all",
    usage: "all",
  });

  const {
    data: fetchedDescriptions,
    isSuccess: isSuccessDescriptions,
    isFetching: isFetchingDescriptions,
    isError: isErrorDescriptions,
    error: errorDescriptions,
    refetch: refetchDescriptions,
  } = useDescriptionFetchGql();

  const { mutateAsync: insertDescription } = useDescriptionInsertGql();
  const { mutateAsync: deleteDescription } = useDescriptionDeleteGql();
  const { mutateAsync: updateDescription } = useDescriptionUpdateGql();

  // Persist view preference
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("descriptionView", view);
    }
  }, [view]);

  // Filtering logic
  const filteredDescriptions = useMemo(() => {
    let filtered = fetchedDescriptions?.filter((row) => row != null) || [];

    // Search filter
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      filtered = filtered.filter((desc) =>
        desc.descriptionName.toLowerCase().includes(lowerSearch),
      );
    }

    // Status filter
    if (filters.status !== "all") {
      filtered = filtered.filter((desc) =>
        filters.status === "active" ? desc.activeStatus : !desc.activeStatus,
      );
    }

    // Usage filter (KEY FEATURE)
    if (filters.usage !== "all") {
      filtered = filtered.filter((desc) => {
        const isUnused = !desc.descriptionCount || desc.descriptionCount === 0;
        return filters.usage === "unused" ? isUnused : !isUnused;
      });
    }

    return filtered;
  }, [fetchedDescriptions, searchTerm, filters]);

  // Stats calculation
  const stats = useMemo(() => {
    const all = fetchedDescriptions || [];
    const total = all.length;
    const active = all.filter((desc) => desc.activeStatus).length;
    const inactive = all.filter((desc) => !desc.activeStatus).length;
    const unused = all.filter(
      (desc) => !desc.descriptionCount || desc.descriptionCount === 0,
    ).length;

    return { total, active, inactive, unused };
  }, [fetchedDescriptions]);

  const descriptionsToDisplay = filteredDescriptions;

  useEffect(() => {
    if (loading) setShowSpinner(true);
    if (!loading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [loading, isAuthenticated, router]);

  useEffect(() => {
    if (isFetchingDescriptions || loading || (!loading && !isAuthenticated)) {
      setShowSpinner(true);
      return;
    }
    if (isSuccessDescriptions) {
      setShowSpinner(false);
    }
  }, [
    isSuccessDescriptions,
    isErrorDescriptions,
    isFetchingDescriptions,
    loading,
    isAuthenticated,
  ]);

  const handleDeleteRow = async () => {
    if (selectedDescription) {
      try {
        await deleteDescription(selectedDescription);
        handleSuccess("Description deleted successfully.");
      } catch (error: unknown) {
        handleError(error, "Delete Description failure.", false);
      } finally {
        setShowModalDelete(false);
        setSelectedDescription(null);
      }
    }
  };

  const handleSnackbarClose = () => {
    setShowSnackbar(false);
  };

  const handleError = (
    error: unknown,
    moduleName: string,
    throwIt: boolean,
  ) => {
    const errorMessage = `${moduleName}: ${getErrorMessage(error)}`;

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

  const handleAddRow = async (newData: Description) => {
    const errs: { descriptionName?: string; activeStatus?: string } = {};
    const name = newData?.descriptionName || "";
    if (!name || name.trim() === "") {
      errs.descriptionName = "Name is required";
    } else {
      if (name.length > 50) {
        errs.descriptionName = "Name too long (max 50 characters)";
      } else if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
        errs.descriptionName =
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
      setMessage(errs.descriptionName || "Validation failed");
      setSnackbarSeverity("error");
      setShowSnackbar(true);
      return;
    }

    try {
      console.log("from handleAddRow: " + JSON.stringify(newData));
      await insertDescription({ description: newData });

      handleSuccess("Description added successfully.");
    } catch (error: unknown) {
      handleError(
        error,
        `Add Description error: ${getErrorMessage(error)}`,
        false,
      );
    } finally {
      setShowModalAdd(false);
    }
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setFilters({
      status: "all",
      usage: "all",
    });
  };

  const getRowId = (row: Description) =>
    row.descriptionId ?? `${row.descriptionName}-${row.activeStatus}`;

  const columns: GridColDef[] = [
    {
      field: "descriptionName",
      headerName: "Name",
      flex: 2,
      minWidth: 300,
      editable: true,
      renderCell: (params) => {
        return (
          <Link href={`/finance/transactions/description/${params.value}`}>
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
              setSelectedDescription(params.row);
              setShowModalDelete(true);
            }}
          >
            <DeleteIcon />
          </IconButton>
        </Tooltip>
      ),
    },
  ];

  if (isErrorDescriptions) {
    return (
      <>
        <PageHeader
          title="Description Management (Next‑Gen)"
          subtitle="GraphQL-powered description organization for better tracking"
          actions={
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setShowModalAdd(true)}
              sx={{ backgroundColor: "primary.main" }}
            >
              Add Description
            </Button>
          }
        />
        <ErrorDisplay
          error={errorDescriptions}
          variant="card"
          showRetry={true}
          onRetry={() => refetchDescriptions()}
        />
      </>
    );
  }

  return (
    <div>
      <>
        <PageHeader
          title="Description Management (Next‑Gen)"
          subtitle="GraphQL-powered description organization for better tracking"
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
                  onClick={() => setShowModalAdd(true)}
                  sx={{ backgroundColor: "primary.main" }}
                >
                  Add Description
                </Button>
              </Fade>
            </Box>
          }
        />

        {/* Filter Bar */}
        <Fade in timeout={500}>
          <Box>
            <DescriptionFilterBar
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              activeFilters={filters}
              onFilterChange={setFilters}
              onClearFilters={handleClearFilters}
              resultCount={descriptionsToDisplay.length}
              totalCount={fetchedDescriptions?.length || 0}
            />
          </Box>
        </Fade>

        {/* StatCards */}
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
                  icon={<DescriptionIcon />}
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

        {/* View Content */}
        {showSpinner ? (
          <LoadingState variant="card" message="Loading descriptions..." />
        ) : descriptionsToDisplay && descriptionsToDisplay.length > 0 ? (
          view === "grid" ? (
            // Grid View
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
              {descriptionsToDisplay.map((description, index) => (
                <Fade
                  in
                  timeout={600 + index * 100}
                  key={description.descriptionId}
                >
                  <Box>
                    <DescriptionCard
                      description={description}
                      onDelete={(desc) => {
                        setSelectedDescription(desc);
                        setShowModalDelete(true);
                      }}
                    />
                  </Box>
                </Fade>
              ))}
            </Box>
          ) : (
            // Table View
            <Box display="flex" justifyContent="center">
              <Box sx={{ width: "100%", maxWidth: "1200px" }}>
                <DataGridBase
                  rows={descriptionsToDisplay}
                  columns={columns}
                  getRowId={getRowId}
                  checkboxSelection={false}
                  rowSelection={false}
                  paginationModel={paginationModel}
                  onPaginationModelChange={(m) => setPaginationModel(m)}
                  pageSizeOptions={[25, 50, 100]}
                  processRowUpdate={async (
                    newRow: Description,
                    oldRow: Description,
                  ): Promise<Description> => {
                    if (JSON.stringify(newRow) === JSON.stringify(oldRow))
                      return oldRow;
                    try {
                      await updateDescription({
                        oldDescription: oldRow,
                        newDescription: newRow,
                      });
                      handleSuccess("Description updated successfully.");
                      return { ...newRow };
                    } catch (error: unknown) {
                      handleError(error, "Update Description failure.", false);
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
          )
        ) : (
          <EmptyState
            title="No Descriptions Found"
            message={
              searchTerm || filters.status !== "all" || filters.usage !== "all"
                ? "No descriptions match your current filters. Try adjusting your search or filter criteria."
                : "You haven't created any descriptions yet. Create your first description to organize your transactions."
            }
            dataType="descriptions"
            variant={
              searchTerm || filters.status !== "all" || filters.usage !== "all"
                ? "search"
                : "create"
            }
            actionLabel={
              searchTerm || filters.status !== "all" || filters.usage !== "all"
                ? "Clear Filters"
                : "Add Description"
            }
            onAction={() => {
              if (
                searchTerm ||
                filters.status !== "all" ||
                filters.usage !== "all"
              ) {
                handleClearFilters();
              } else {
                setShowModalAdd(true);
              }
            }}
            onRefresh={() => refetchDescriptions()}
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
            "description",
            selectedDescription?.descriptionName ?? "",
          )}
          confirmText="Delete"
          cancelText="Cancel"
        />

        <FormDialog
          open={showModalAdd}
          onClose={() => setShowModalAdd(false)}
          onSubmit={() => {
            if (descriptionData) {
              handleAddRow(descriptionData);
            } else {
              handleAddRow({
                descriptionId: 0,
                descriptionName: "",
                activeStatus: true,
              } as Description);
            }
          }}
          title={modalTitles.addNew("description")}
          submitText="Add"
        >
          <TextField
            label="Name"
            fullWidth
            margin="normal"
            value={descriptionData?.descriptionName || ""}
            error={!!formErrors.descriptionName}
            helperText={
              formErrors.descriptionName ||
              "Lowercase letters, numbers, hyphens, and underscores only (no spaces)"
            }
            onChange={(e) =>
              setDescriptionData((prev) => ({
                ...prev,
                descriptionId: prev?.descriptionId || 0,
                descriptionName: e.target.value,
                activeStatus: prev?.activeStatus ?? true,
              }))
            }
          />
          <Box mt={1}>
            <FormControlLabel
              control={
                <Switch
                  checked={!!descriptionData?.activeStatus}
                  onChange={(e) =>
                    setDescriptionData((prev: Description) => ({
                      ...prev,
                      descriptionId: prev?.descriptionId || 0,
                      descriptionName: prev?.descriptionName || "",
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
      </>
    </div>
  );
}
