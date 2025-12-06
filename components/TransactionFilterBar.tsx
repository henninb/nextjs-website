import React from "react";
import {
  Box,
  TextField,
  Chip,
  Paper,
  Typography,
  IconButton,
  InputAdornment,
  useTheme,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import { TransactionState } from "../model/TransactionState";
import { TransactionType } from "../model/TransactionType";
import { ReoccurringType } from "../model/ReoccurringType";

export interface TransactionFilters {
  states: Set<TransactionState>;
  types: Set<TransactionType | "undefined">;
  reoccurring: Set<ReoccurringType>;
  dateRange: {
    start: Date | null;
    end: Date | null;
    preset: string;
  };
  amountRange: {
    min: number;
    max: number;
  };
}

interface TransactionFilterBarProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  activeFilters: TransactionFilters;
  onFilterChange: (filters: TransactionFilters) => void;
  onClearFilters: () => void;
  resultCount?: number;
  totalCount?: number;
  amountBounds: {
    min: number;
    max: number;
  };
}

const TransactionFilterBar: React.FC<TransactionFilterBarProps> = ({
  searchTerm,
  onSearchChange,
  activeFilters,
  onFilterChange,
  onClearFilters,
  resultCount,
  totalCount,
  amountBounds,
}) => {
  const theme = useTheme();

  const hasActiveFilters =
    searchTerm.length > 0 ||
    activeFilters.states.size < 3 ||
    activeFilters.types.size < 4 ||
    activeFilters.reoccurring.size < 7 ||
    activeFilters.dateRange.preset !== "all" ||
    activeFilters.amountRange.min !== amountBounds.min ||
    activeFilters.amountRange.max !== amountBounds.max;

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
      <Box sx={{ display: "flex", gap: 1.5, alignItems: "center", flexWrap: "wrap" }}>
        {/* Search Input - Compact */}
        <TextField
          placeholder="Search by description, category, notes, date, or amount..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          size="small"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: theme.palette.text.secondary, fontSize: "1.1rem" }} />
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
            minWidth: "300px",
            flexGrow: 1,
            "& .MuiOutlinedInput-root": {
              borderRadius: "8px",
            },
          }}
        />

        {/* Clear Filters Button - Only shown when filters are active */}
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
          <Typography variant="caption" color="text.secondary" sx={{ ml: "auto" }}>
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
};

export default TransactionFilterBar;
