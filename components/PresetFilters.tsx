import React from "react";
import { Box, Chip, Typography, useTheme } from "@mui/material";
import BoltIcon from "@mui/icons-material/Bolt";
import PaymentIcon from "@mui/icons-material/Payment";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import ScheduleIcon from "@mui/icons-material/Schedule";

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

type PresetFiltersProps = {
  onPresetClick: (filters: FilterState) => void;
  currentFilters: FilterState;
};

export default function PresetFilters({
  onPresetClick,
  currentFilters,
}: PresetFiltersProps) {
  const theme = useTheme();

  const presets = [
    {
      label: "Payment Required",
      icon: <PaymentIcon sx={{ fontSize: "1rem" }} />,
      filters: {
        accountType: "credit" as const,
        activeStatus: "active" as const,
        balanceStatus: "hasActivity" as const,
      },
      description: "Active credit accounts with balances",
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
      description: "Active accounts with outstanding transactions",
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
      description: "Active accounts with scheduled payments",
      color: theme.palette.info.main,
    },
  ];

  const isPresetActive = (preset: (typeof presets)[0]) => {
    return (
      currentFilters.accountType === preset.filters.accountType &&
      currentFilters.activeStatus === preset.filters.activeStatus &&
      currentFilters.balanceStatus === preset.filters.balanceStatus
    );
  };

  return (
    <Box
      sx={{
        mb: 2,
        p: 2,
        background: theme.palette.background.paper,
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: "8px",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
        <BoltIcon fontSize="small" sx={{ color: theme.palette.warning.main }} />
        <Typography
          variant="caption"
          sx={{
            color: theme.palette.text.secondary,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          Quick Filters:
        </Typography>
      </Box>
      <Box
        sx={{
          display: "flex",
          gap: 1,
          flexWrap: "wrap",
        }}
      >
        {presets.map((preset) => {
          const active = isPresetActive(preset);
          return (
            <Chip
              key={preset.label}
              icon={preset.icon}
              label={preset.label}
              onClick={() => onPresetClick(preset.filters)}
              variant={active ? "filled" : "outlined"}
              sx={{
                borderRadius: "8px",
                fontWeight: 600,
                fontSize: "0.8rem",
                height: "32px",
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
                },
              }}
            />
          );
        })}
      </Box>
    </Box>
  );
}
