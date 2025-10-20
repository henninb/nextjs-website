import React from "react";
import {
  Box,
  TextField,
  Chip,
  Button,
  Stack,
  Typography,
  IconButton,
  InputAdornment,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";

export interface CategoryFilters {
  status: "all" | "active" | "inactive";
  usage: "all" | "used" | "unused";
}

interface CategoryFilterBarProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  activeFilters: CategoryFilters;
  onFilterChange: (filters: CategoryFilters) => void;
  onClearFilters: () => void;
  resultCount?: number;
  totalCount?: number;
}

const CategoryFilterBar: React.FC<CategoryFilterBarProps> = ({
  searchTerm,
  onSearchChange,
  activeFilters,
  onFilterChange,
  onClearFilters,
  resultCount,
  totalCount,
}) => {
  // Reusable chip animation styles
  const chipAnimationSx = {
    transition: "all 0.2s ease-in-out",
    "&:hover": { transform: "scale(1.05)", boxShadow: 2 },
    "&:active": { transform: "scale(0.95)" },
  };

  const handleStatusChange = (status: "all" | "active" | "inactive") => {
    onFilterChange({
      ...activeFilters,
      status,
    });
  };

  const handleUsageChange = (usage: "all" | "used" | "unused") => {
    onFilterChange({
      ...activeFilters,
      usage,
    });
  };

  const hasActiveFilters =
    searchTerm.length > 0 ||
    activeFilters.status !== "all" ||
    activeFilters.usage !== "all";

  return (
    <Box
      sx={{
        backgroundColor: "background.paper",
        borderRadius: 2,
        p: 3,
        mb: 3,
        boxShadow: 1,
      }}
    >
      {/* Search Bar */}
      <TextField
        fullWidth
        size="small"
        placeholder="Search categories by name..."
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon color="action" />
            </InputAdornment>
          ),
          endAdornment: searchTerm && (
            <InputAdornment position="end">
              <IconButton
                size="small"
                onClick={() => onSearchChange("")}
                aria-label="clear search"
              >
                <ClearIcon fontSize="small" />
              </IconButton>
            </InputAdornment>
          ),
        }}
        sx={{ mb: 3 }}
      />

      {/* Filters Section */}
      <Stack spacing={3}>
        {/* Status Filters */}
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Status
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Chip
              label="All"
              onClick={() => handleStatusChange("all")}
              color={activeFilters.status === "all" ? "primary" : "default"}
              variant={activeFilters.status === "all" ? "filled" : "outlined"}
              size="small"
              sx={chipAnimationSx}
            />
            <Chip
              label="Active"
              onClick={() => handleStatusChange("active")}
              color={activeFilters.status === "active" ? "success" : "default"}
              variant={
                activeFilters.status === "active" ? "filled" : "outlined"
              }
              size="small"
              sx={chipAnimationSx}
            />
            <Chip
              label="Inactive"
              onClick={() => handleStatusChange("inactive")}
              color={
                activeFilters.status === "inactive" ? "warning" : "default"
              }
              variant={
                activeFilters.status === "inactive" ? "filled" : "outlined"
              }
              size="small"
              sx={chipAnimationSx}
            />
          </Stack>
        </Box>

        {/* Usage Filters - KEY FEATURE */}
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Transaction Association
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Chip
              label="All Categories"
              onClick={() => handleUsageChange("all")}
              color={activeFilters.usage === "all" ? "primary" : "default"}
              variant={activeFilters.usage === "all" ? "filled" : "outlined"}
              size="small"
              sx={chipAnimationSx}
            />
            <Chip
              label="Used in Transactions"
              onClick={() => handleUsageChange("used")}
              color={activeFilters.usage === "used" ? "info" : "default"}
              variant={activeFilters.usage === "used" ? "filled" : "outlined"}
              size="small"
              sx={chipAnimationSx}
            />
            <Chip
              label="Not Associated"
              onClick={() => handleUsageChange("unused")}
              color={activeFilters.usage === "unused" ? "error" : "default"}
              variant={activeFilters.usage === "unused" ? "filled" : "outlined"}
              size="small"
              sx={chipAnimationSx}
            />
          </Stack>
        </Box>
      </Stack>

      {/* Footer with result count and clear button */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mt: 3,
          pt: 2,
          borderTop: 1,
          borderColor: "divider",
        }}
      >
        <Typography variant="body2" color="text.secondary">
          {resultCount !== undefined && totalCount !== undefined ? (
            <>
              Showing <strong>{resultCount}</strong> of{" "}
              <strong>{totalCount}</strong> categor
              {totalCount !== 1 ? "ies" : "y"}
              {hasActiveFilters && " (filtered)"}
            </>
          ) : (
            "Apply filters to refine results"
          )}
        </Typography>

        {hasActiveFilters && (
          <Button
            variant="outlined"
            size="small"
            onClick={onClearFilters}
            startIcon={<ClearIcon />}
          >
            Clear All Filters
          </Button>
        )}
      </Box>
    </Box>
  );
};

export default CategoryFilterBar;
