import React from "react";
import {
  Box,
  TextField,
  InputAdornment,
  Chip,
  IconButton,
  Paper,
  Stack,
  Typography,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import FilterListIcon from "@mui/icons-material/FilterList";

type FilterState = {
  accountType: "all" | "debit" | "credit";
  activeStatus: "all" | "active" | "inactive";
  balanceStatus:
    | "all"
    | "hasActivity"
    | "hasOutstanding"
    | "hasFuture"
    | "hasCleared"
    | "zeroBalance";
};

type SearchFilterBarProps = {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  activeFilters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  onClearFilters: () => void;
  resultCount?: number;
  totalCount?: number;
};

export default function SearchFilterBar({
  searchTerm,
  onSearchChange,
  activeFilters,
  onFilterChange,
  onClearFilters,
  resultCount,
  totalCount,
}: SearchFilterBarProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const hasActiveFilters =
    searchTerm !== "" ||
    activeFilters.accountType !== "all" ||
    activeFilters.activeStatus !== "all" ||
    activeFilters.balanceStatus !== "all";

  const handleAccountTypeFilter = (type: "all" | "debit" | "credit") => {
    onFilterChange({
      ...activeFilters,
      accountType: type,
    });
  };

  const handleActiveStatusFilter = (status: "all" | "active" | "inactive") => {
    onFilterChange({
      ...activeFilters,
      activeStatus: status,
    });
  };

  const handleBalanceStatusFilter = (
    status:
      | "all"
      | "hasActivity"
      | "hasOutstanding"
      | "hasFuture"
      | "hasCleared"
      | "zeroBalance",
  ) => {
    onFilterChange({
      ...activeFilters,
      balanceStatus: status,
    });
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        mb: 3,
        background: theme.palette.background.paper,
        border: `1px solid ${theme.palette.divider}`,
      }}
    >
      <Stack spacing={2}>
        {/* Search Input */}
        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
          <TextField
            fullWidth
            placeholder="Search accounts by name or moniker..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: theme.palette.text.secondary }} />
                </InputAdornment>
              ),
              endAdornment: searchTerm && (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={() => onSearchChange("")}
                    aria-label="Clear search"
                  >
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: "12px",
              },
            }}
          />
        </Box>

        {/* Filter Chips */}
        <Box>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              mb: 1,
              flexWrap: "wrap",
            }}
          >
            <FilterListIcon
              fontSize="small"
              sx={{ color: theme.palette.text.secondary }}
            />
            <Typography
              variant="caption"
              sx={{
                color: theme.palette.text.secondary,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Filter by:
            </Typography>
          </Box>

          <Stack
            direction={isMobile ? "column" : "row"}
            spacing={2}
            sx={{ alignItems: isMobile ? "stretch" : "center" }}
          >
            {/* Account Type Filters */}
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              <Chip
                label="All Types"
                onClick={() => handleAccountTypeFilter("all")}
                color={
                  activeFilters.accountType === "all" ? "primary" : "default"
                }
                variant={
                  activeFilters.accountType === "all" ? "filled" : "outlined"
                }
                size={isMobile ? "medium" : "small"}
                sx={{
                  borderRadius: "8px",
                  fontWeight: 500,
                }}
              />
              <Chip
                label="Debit"
                onClick={() => handleAccountTypeFilter("debit")}
                color={
                  activeFilters.accountType === "debit" ? "primary" : "default"
                }
                variant={
                  activeFilters.accountType === "debit" ? "filled" : "outlined"
                }
                size={isMobile ? "medium" : "small"}
                sx={{
                  borderRadius: "8px",
                  fontWeight: 500,
                }}
              />
              <Chip
                label="Credit"
                onClick={() => handleAccountTypeFilter("credit")}
                color={
                  activeFilters.accountType === "credit" ? "primary" : "default"
                }
                variant={
                  activeFilters.accountType === "credit" ? "filled" : "outlined"
                }
                size={isMobile ? "medium" : "small"}
                sx={{
                  borderRadius: "8px",
                  fontWeight: 500,
                }}
              />
            </Box>

            {/* Active Status Filters */}
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              <Chip
                label="All Status"
                onClick={() => handleActiveStatusFilter("all")}
                color={
                  activeFilters.activeStatus === "all" ? "success" : "default"
                }
                variant={
                  activeFilters.activeStatus === "all" ? "filled" : "outlined"
                }
                size={isMobile ? "medium" : "small"}
                sx={{
                  borderRadius: "8px",
                  fontWeight: 500,
                }}
              />
              <Chip
                label="Active"
                onClick={() => handleActiveStatusFilter("active")}
                color={
                  activeFilters.activeStatus === "active"
                    ? "success"
                    : "default"
                }
                variant={
                  activeFilters.activeStatus === "active"
                    ? "filled"
                    : "outlined"
                }
                size={isMobile ? "medium" : "small"}
                sx={{
                  borderRadius: "8px",
                  fontWeight: 500,
                }}
              />
              <Chip
                label="Inactive"
                onClick={() => handleActiveStatusFilter("inactive")}
                color={
                  activeFilters.activeStatus === "inactive"
                    ? "success"
                    : "default"
                }
                variant={
                  activeFilters.activeStatus === "inactive"
                    ? "filled"
                    : "outlined"
                }
                size={isMobile ? "medium" : "small"}
                sx={{
                  borderRadius: "8px",
                  fontWeight: 500,
                }}
              />
            </Box>

            {/* Balance Status Filters */}
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              <Chip
                label="All Balances"
                onClick={() => handleBalanceStatusFilter("all")}
                color={
                  activeFilters.balanceStatus === "all" ? "info" : "default"
                }
                variant={
                  activeFilters.balanceStatus === "all" ? "filled" : "outlined"
                }
                size={isMobile ? "medium" : "small"}
                sx={{
                  borderRadius: "8px",
                  fontWeight: 500,
                }}
              />
              <Chip
                label="Has Activity"
                onClick={() => handleBalanceStatusFilter("hasActivity")}
                color={
                  activeFilters.balanceStatus === "hasActivity"
                    ? "info"
                    : "default"
                }
                variant={
                  activeFilters.balanceStatus === "hasActivity"
                    ? "filled"
                    : "outlined"
                }
                size={isMobile ? "medium" : "small"}
                sx={{
                  borderRadius: "8px",
                  fontWeight: 500,
                }}
              />
              <Chip
                label="Has Outstanding"
                onClick={() => handleBalanceStatusFilter("hasOutstanding")}
                color={
                  activeFilters.balanceStatus === "hasOutstanding"
                    ? "info"
                    : "default"
                }
                variant={
                  activeFilters.balanceStatus === "hasOutstanding"
                    ? "filled"
                    : "outlined"
                }
                size={isMobile ? "medium" : "small"}
                sx={{
                  borderRadius: "8px",
                  fontWeight: 500,
                }}
              />
              <Chip
                label="Has Future"
                onClick={() => handleBalanceStatusFilter("hasFuture")}
                color={
                  activeFilters.balanceStatus === "hasFuture"
                    ? "info"
                    : "default"
                }
                variant={
                  activeFilters.balanceStatus === "hasFuture"
                    ? "filled"
                    : "outlined"
                }
                size={isMobile ? "medium" : "small"}
                sx={{
                  borderRadius: "8px",
                  fontWeight: 500,
                }}
              />
              <Chip
                label="Has Cleared"
                onClick={() => handleBalanceStatusFilter("hasCleared")}
                color={
                  activeFilters.balanceStatus === "hasCleared"
                    ? "info"
                    : "default"
                }
                variant={
                  activeFilters.balanceStatus === "hasCleared"
                    ? "filled"
                    : "outlined"
                }
                size={isMobile ? "medium" : "small"}
                sx={{
                  borderRadius: "8px",
                  fontWeight: 500,
                }}
              />
              <Chip
                label="Zero Balance"
                onClick={() => handleBalanceStatusFilter("zeroBalance")}
                color={
                  activeFilters.balanceStatus === "zeroBalance"
                    ? "info"
                    : "default"
                }
                variant={
                  activeFilters.balanceStatus === "zeroBalance"
                    ? "filled"
                    : "outlined"
                }
                size={isMobile ? "medium" : "small"}
                sx={{
                  borderRadius: "8px",
                  fontWeight: 500,
                }}
              />
            </Box>

            {/* Clear Filters Button */}
            {hasActiveFilters && (
              <Chip
                label="Clear All"
                onClick={onClearFilters}
                onDelete={onClearFilters}
                deleteIcon={<ClearIcon />}
                variant="outlined"
                size={isMobile ? "medium" : "small"}
                sx={{
                  borderRadius: "8px",
                  fontWeight: 500,
                  borderColor: theme.palette.error.main,
                  color: theme.palette.error.main,
                  "&:hover": {
                    backgroundColor: `${theme.palette.error.main}20`,
                  },
                }}
              />
            )}
          </Stack>
        </Box>

        {/* Result Count */}
        {resultCount !== undefined && totalCount !== undefined && (
          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
            <Typography variant="body2" color="text.secondary">
              Showing{" "}
              <strong style={{ color: theme.palette.primary.main }}>
                {resultCount}
              </strong>{" "}
              of <strong>{totalCount}</strong> accounts
              {hasActiveFilters && " (filtered)"}
            </Typography>
          </Box>
        )}
      </Stack>
    </Paper>
  );
}
