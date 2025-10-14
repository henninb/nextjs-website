import React, { useState } from "react";
import {
  Box,
  TextField,
  Chip,
  Button,
  Stack,
  Typography,
  IconButton,
  InputAdornment,
  Slider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import FilterListIcon from "@mui/icons-material/FilterList";
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
  const [localAmountRange, setLocalAmountRange] = useState<[number, number]>([
    activeFilters.amountRange.min,
    activeFilters.amountRange.max,
  ]);

  // Reusable chip animation styles
  const chipAnimationSx = {
    transition: "all 0.2s ease-in-out",
    "&:hover": { transform: "scale(1.05)", boxShadow: 2 },
    "&:active": { transform: "scale(0.95)" },
  };

  // Date range presets
  const datePresets = [
    { label: "All Time", value: "all" },
    { label: "Last 7 Days", value: "7days" },
    { label: "Last 30 Days", value: "30days" },
    { label: "Last 90 Days", value: "90days" },
    { label: "This Year", value: "thisYear" },
  ];

  const handleDatePresetChange = (preset: string) => {
    const now = new Date();
    let start: Date | null = null;
    let end: Date | null = now;

    switch (preset) {
      case "7days":
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "30days":
        start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case "90days":
        start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case "thisYear":
        start = new Date(now.getFullYear(), 0, 1);
        break;
      case "all":
      default:
        start = null;
        end = null;
        break;
    }

    onFilterChange({
      ...activeFilters,
      dateRange: { start, end, preset },
    });
  };

  const handleStateToggle = (state: TransactionState) => {
    const newStates = new Set(activeFilters.states);
    if (newStates.has(state)) {
      newStates.delete(state);
    } else {
      newStates.add(state);
    }
    onFilterChange({
      ...activeFilters,
      states: newStates,
    });
  };

  const handleTypeToggle = (type: TransactionType | "undefined") => {
    const newTypes = new Set(activeFilters.types);
    if (newTypes.has(type)) {
      newTypes.delete(type);
    } else {
      newTypes.add(type);
    }
    onFilterChange({
      ...activeFilters,
      types: newTypes,
    });
  };

  const handleReoccurringToggle = (reoccurring: ReoccurringType) => {
    const newReoccurring = new Set(activeFilters.reoccurring);
    if (newReoccurring.has(reoccurring)) {
      newReoccurring.delete(reoccurring);
    } else {
      newReoccurring.add(reoccurring);
    }
    onFilterChange({
      ...activeFilters,
      reoccurring: newReoccurring,
    });
  };

  const handleAmountRangeChange = (
    event: Event,
    newValue: number | number[],
  ) => {
    setLocalAmountRange(newValue as [number, number]);
  };

  const handleAmountRangeCommitted = (
    event: Event | React.SyntheticEvent,
    newValue: number | number[],
  ) => {
    const [min, max] = newValue as [number, number];
    onFilterChange({
      ...activeFilters,
      amountRange: { min, max },
    });
  };

  const hasActiveFilters =
    searchTerm.length > 0 ||
    activeFilters.states.size < 3 ||
    activeFilters.types.size < 4 ||
    activeFilters.reoccurring.size < 7 ||
    activeFilters.dateRange.preset !== "all" ||
    activeFilters.amountRange.min !== amountBounds.min ||
    activeFilters.amountRange.max !== amountBounds.max;

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
        placeholder="Search by description, category, notes, date, or amount..."
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
        {/* Date Range Preset */}
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Date Range
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {datePresets.map((preset) => (
              <Chip
                key={preset.value}
                label={preset.label}
                onClick={() => handleDatePresetChange(preset.value)}
                color={
                  activeFilters.dateRange.preset === preset.value
                    ? "primary"
                    : "default"
                }
                variant={
                  activeFilters.dateRange.preset === preset.value
                    ? "filled"
                    : "outlined"
                }
                size="small"
                sx={chipAnimationSx}
              />
            ))}
          </Stack>
        </Box>

        {/* Amount Range Slider */}
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Amount Range: ${localAmountRange[0].toFixed(2)} - $
            {localAmountRange[1].toFixed(2)}
          </Typography>
          <Slider
            value={localAmountRange}
            onChange={handleAmountRangeChange}
            onChangeCommitted={handleAmountRangeCommitted}
            valueLabelDisplay="auto"
            valueLabelFormat={(value) => `$${value.toFixed(2)}`}
            min={amountBounds.min}
            max={amountBounds.max}
            step={0.01}
            sx={{ mt: 1 }}
          />
        </Box>

        {/* State Filters */}
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Transaction State
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Chip
              label="Cleared"
              onClick={() => handleStateToggle("cleared")}
              color={
                activeFilters.states.has("cleared") ? "success" : "default"
              }
              variant={
                activeFilters.states.has("cleared") ? "filled" : "outlined"
              }
              size="small"
              sx={{
                transition: "all 0.2s ease-in-out",
                "&:hover": { transform: "scale(1.05)", boxShadow: 2 },
                "&:active": { transform: "scale(0.95)" },
              }}
            />
            <Chip
              label="Outstanding"
              onClick={() => handleStateToggle("outstanding")}
              color={
                activeFilters.states.has("outstanding") ? "warning" : "default"
              }
              variant={
                activeFilters.states.has("outstanding") ? "filled" : "outlined"
              }
              size="small"
              sx={{
                transition: "all 0.2s ease-in-out",
                "&:hover": { transform: "scale(1.05)", boxShadow: 2 },
                "&:active": { transform: "scale(0.95)" },
              }}
            />
            <Chip
              label="Future"
              onClick={() => handleStateToggle("future")}
              color={activeFilters.states.has("future") ? "info" : "default"}
              variant={
                activeFilters.states.has("future") ? "filled" : "outlined"
              }
              size="small"
              sx={{
                transition: "all 0.2s ease-in-out",
                "&:hover": { transform: "scale(1.05)", boxShadow: 2 },
                "&:active": { transform: "scale(0.95)" },
              }}
            />
          </Stack>
        </Box>

        {/* Type Filters */}
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Transaction Type
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Chip
              label="All Types"
              onClick={() =>
                onFilterChange({
                  ...activeFilters,
                  types: new Set([
                    "expense",
                    "income",
                    "transfer",
                    "undefined",
                  ]),
                })
              }
              color={activeFilters.types.size === 4 ? "primary" : "default"}
              variant={activeFilters.types.size === 4 ? "filled" : "outlined"}
              size="small"
              sx={chipAnimationSx}
            />
            <Chip
              label="Expense"
              onClick={() => handleTypeToggle("expense")}
              color={activeFilters.types.has("expense") ? "primary" : "default"}
              variant={
                activeFilters.types.has("expense") ? "filled" : "outlined"
              }
              size="small"
              sx={chipAnimationSx}
            />
            <Chip
              label="Income"
              onClick={() => handleTypeToggle("income")}
              color={activeFilters.types.has("income") ? "success" : "default"}
              variant={
                activeFilters.types.has("income") ? "filled" : "outlined"
              }
              size="small"
              sx={chipAnimationSx}
            />
            <Chip
              label="Transfer"
              onClick={() => handleTypeToggle("transfer")}
              color={activeFilters.types.has("transfer") ? "info" : "default"}
              variant={
                activeFilters.types.has("transfer") ? "filled" : "outlined"
              }
              size="small"
              sx={chipAnimationSx}
            />
            <Chip
              label="Undefined"
              onClick={() => handleTypeToggle("undefined")}
              color={
                activeFilters.types.has("undefined") ? "default" : "default"
              }
              variant={
                activeFilters.types.has("undefined") ? "filled" : "outlined"
              }
              size="small"
              sx={chipAnimationSx}
            />
          </Stack>
        </Box>

        {/* Reoccurring Filters */}
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Recurrence
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Chip
              label="All"
              onClick={() =>
                onFilterChange({
                  ...activeFilters,
                  reoccurring: new Set([
                    "onetime",
                    "monthly",
                    "annually",
                    "bi_annually",
                    "fortnightly",
                    "quarterly",
                    "undefined",
                  ]),
                })
              }
              color={
                activeFilters.reoccurring.size === 7 ? "primary" : "default"
              }
              variant={
                activeFilters.reoccurring.size === 7 ? "filled" : "outlined"
              }
              size="small"
              sx={chipAnimationSx}
            />
            <Chip
              label="One-Time"
              onClick={() => handleReoccurringToggle("onetime")}
              color={
                activeFilters.reoccurring.has("onetime") ? "primary" : "default"
              }
              variant={
                activeFilters.reoccurring.has("onetime") ? "filled" : "outlined"
              }
              size="small"
              sx={chipAnimationSx}
            />
            <Chip
              label="Monthly"
              onClick={() => handleReoccurringToggle("monthly")}
              color={
                activeFilters.reoccurring.has("monthly") ? "primary" : "default"
              }
              variant={
                activeFilters.reoccurring.has("monthly") ? "filled" : "outlined"
              }
              size="small"
              sx={chipAnimationSx}
            />
            <Chip
              label="Annually"
              onClick={() => handleReoccurringToggle("annually")}
              color={
                activeFilters.reoccurring.has("annually")
                  ? "primary"
                  : "default"
              }
              variant={
                activeFilters.reoccurring.has("annually")
                  ? "filled"
                  : "outlined"
              }
              size="small"
              sx={chipAnimationSx}
            />
            <Chip
              label="Quarterly"
              onClick={() => handleReoccurringToggle("quarterly")}
              color={
                activeFilters.reoccurring.has("quarterly")
                  ? "primary"
                  : "default"
              }
              variant={
                activeFilters.reoccurring.has("quarterly")
                  ? "filled"
                  : "outlined"
              }
              size="small"
              sx={chipAnimationSx}
            />
            <Chip
              label="Fortnightly"
              onClick={() => handleReoccurringToggle("fortnightly")}
              color={
                activeFilters.reoccurring.has("fortnightly")
                  ? "primary"
                  : "default"
              }
              variant={
                activeFilters.reoccurring.has("fortnightly")
                  ? "filled"
                  : "outlined"
              }
              size="small"
              sx={chipAnimationSx}
            />
            <Chip
              label="Bi-Annually"
              onClick={() => handleReoccurringToggle("bi_annually")}
              color={
                activeFilters.reoccurring.has("bi_annually")
                  ? "primary"
                  : "default"
              }
              variant={
                activeFilters.reoccurring.has("bi_annually")
                  ? "filled"
                  : "outlined"
              }
              size="small"
              sx={chipAnimationSx}
            />
            <Chip
              label="Undefined"
              onClick={() => handleReoccurringToggle("undefined")}
              color={
                activeFilters.reoccurring.has("undefined")
                  ? "default"
                  : "default"
              }
              variant={
                activeFilters.reoccurring.has("undefined")
                  ? "filled"
                  : "outlined"
              }
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
              <strong>{totalCount}</strong> transaction
              {totalCount !== 1 ? "s" : ""}
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

export default TransactionFilterBar;
