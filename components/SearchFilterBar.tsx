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
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutline";
import BoltIcon from "@mui/icons-material/Bolt";
import PaymentIcon from "@mui/icons-material/Payment";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import ScheduleIcon from "@mui/icons-material/Schedule";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";

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
  accountNamePattern: "all" | "checking";
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
    activeFilters.balanceStatus !== "all" ||
    activeFilters.accountNamePattern !== "all";

  // Quick filter presets
  const quickFilters = [
    {
      label: "Payment Required",
      icon: <PaymentIcon sx={{ fontSize: "1rem" }} />,
      filters: {
        accountType: "credit" as const,
        activeStatus: "active" as const,
        balanceStatus: "hasActivity" as const,
      },
      color: theme.palette.error.main,
    },
    {
      label: "Needs Attention",
      icon: <NotificationsActiveIcon sx={{ fontSize: "1rem" }} />,
      filters: {
        accountType: "all" as const,
        activeStatus: "active" as const,
        balanceStatus: "hasOutstanding" as const,
      },
      color: theme.palette.warning.main,
    },
    {
      label: "Future Scheduled",
      icon: <ScheduleIcon sx={{ fontSize: "1rem" }} />,
      filters: {
        accountType: "all" as const,
        activeStatus: "active" as const,
        balanceStatus: "hasFuture" as const,
      },
      color: theme.palette.info.main,
    },
  ];

  const isQuickFilterActive = (preset: (typeof quickFilters)[0]) => {
    return (
      activeFilters.accountType === preset.filters.accountType &&
      activeFilters.activeStatus === preset.filters.activeStatus &&
      activeFilters.balanceStatus === preset.filters.balanceStatus
    );
  };

  const handleQuickFilter = (filters: FilterState) => {
    onFilterChange(filters);
  };

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

  const handleAccountNamePatternFilter = (pattern: "all" | "checking") => {
    onFilterChange({
      ...activeFilters,
      accountNamePattern: pattern,
    });
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 1.5,
        mb: 2,
        background: theme.palette.background.paper,
        border: `1px solid ${theme.palette.divider}`,
      }}
    >
      <Box
        sx={{
          display: "flex",
          gap: 1.5,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        {/* Search Input - More compact */}
        <TextField
          placeholder="Search accounts..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          size="small"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon
                  sx={{
                    color: theme.palette.text.secondary,
                    fontSize: "1.1rem",
                  }}
                />
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
            minWidth: "200px",
            flexGrow: 1,
            "& .MuiOutlinedInput-root": {
              borderRadius: "8px",
            },
          }}
        />

        {/* Quick Filters Section */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <BoltIcon
            sx={{ fontSize: "1rem", color: theme.palette.warning.main }}
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
            FILTERS:
          </Typography>
        </Box>

        {quickFilters.map((preset) => {
          const active = isQuickFilterActive(preset);
          return (
            <Chip
              key={preset.label}
              icon={preset.icon}
              label={preset.label}
              onClick={() => handleQuickFilter(preset.filters)}
              variant={active ? "filled" : "outlined"}
              size="small"
              sx={{
                borderRadius: "6px",
                fontWeight: 600,
                fontSize: "0.75rem",
                height: "28px",
                borderColor: preset.color,
                color: active
                  ? theme.palette.getContrastText(preset.color)
                  : preset.color,
                backgroundColor: active ? preset.color : "transparent",
                "&:hover": {
                  backgroundColor: active ? preset.color : `${preset.color}20`,
                  borderColor: preset.color,
                },
                "& .MuiChip-icon": {
                  color: active
                    ? theme.palette.getContrastText(preset.color)
                    : preset.color,
                  fontSize: "1rem",
                },
              }}
            />
          );
        })}

        {/* Account Type Filters */}
        <Chip
          label="Debit"
          onClick={() => handleAccountTypeFilter("debit")}
          color={activeFilters.accountType === "debit" ? "primary" : "default"}
          variant={
            activeFilters.accountType === "debit" ? "filled" : "outlined"
          }
          size="small"
          sx={{
            borderRadius: "6px",
            fontWeight: 500,
            height: "28px",
          }}
        />
        <Chip
          label="Credit"
          onClick={() => handleAccountTypeFilter("credit")}
          color={activeFilters.accountType === "credit" ? "primary" : "default"}
          variant={
            activeFilters.accountType === "credit" ? "filled" : "outlined"
          }
          size="small"
          sx={{
            borderRadius: "6px",
            fontWeight: 500,
            height: "28px",
          }}
        />

        {/* Zero Balance Filter */}
        <Chip
          icon={<RemoveCircleOutlineIcon sx={{ fontSize: "1rem" }} />}
          label="Zero Balance"
          onClick={() => handleBalanceStatusFilter("zeroBalance")}
          color={
            activeFilters.balanceStatus === "zeroBalance" ? "info" : "default"
          }
          variant={
            activeFilters.balanceStatus === "zeroBalance"
              ? "filled"
              : "outlined"
          }
          size="small"
          sx={{
            borderRadius: "6px",
            fontWeight: 500,
            height: "28px",
          }}
        />

        {/* Checking Accounts Filter */}
        <Chip
          icon={<AccountBalanceIcon sx={{ fontSize: "1rem" }} />}
          label="Checking"
          onClick={() =>
            handleAccountNamePatternFilter(
              activeFilters.accountNamePattern === "checking" ? "all" : "checking"
            )
          }
          color={
            activeFilters.accountNamePattern === "checking"
              ? "success"
              : "default"
          }
          variant={
            activeFilters.accountNamePattern === "checking"
              ? "filled"
              : "outlined"
          }
          size="small"
          sx={{
            borderRadius: "6px",
            fontWeight: 500,
            height: "28px",
          }}
        />

        {/* Clear Filters Button - Show only when filters are active */}
        {hasActiveFilters && (
          <Chip
            label="Clear All"
            onClick={onClearFilters}
            onDelete={onClearFilters}
            deleteIcon={<ClearIcon />}
            variant="outlined"
            size="small"
            sx={{
              borderRadius: "6px",
              fontWeight: 500,
              height: "28px",
              borderColor: theme.palette.error.main,
              color: theme.palette.error.main,
              "&:hover": {
                backgroundColor: `${theme.palette.error.main}20`,
              },
            }}
          />
        )}

        {/* Result Count - Inline at the end */}
        {resultCount !== undefined && totalCount !== undefined && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ ml: "auto" }}
          >
            <strong style={{ color: theme.palette.primary.main }}>
              {resultCount}
            </strong>
            {" / "}
            <strong>{totalCount}</strong>
            {hasActiveFilters && " (filtered)"}
          </Typography>
        )}
      </Box>
    </Paper>
  );
}
