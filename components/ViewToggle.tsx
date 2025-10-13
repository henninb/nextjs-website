import React from "react";
import { ToggleButton, ToggleButtonGroup, useTheme } from "@mui/material";
import GridViewIcon from "@mui/icons-material/GridView";
import ViewListIcon from "@mui/icons-material/ViewList";

type ViewToggleProps = {
  view: "grid" | "table";
  onChange: (view: "grid" | "table") => void;
};

export default function ViewToggle({ view, onChange }: ViewToggleProps) {
  const theme = useTheme();

  const handleChange = (
    event: React.MouseEvent<HTMLElement>,
    newView: "grid" | "table" | null,
  ) => {
    if (newView !== null) {
      onChange(newView);
    }
  };

  return (
    <ToggleButtonGroup
      value={view}
      exclusive
      onChange={handleChange}
      aria-label="view toggle"
      size="small"
      sx={{
        backgroundColor: theme.palette.background.paper,
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: "8px",
        "& .MuiToggleButton-root": {
          border: "none",
          borderRadius: "8px",
          color: theme.palette.text.secondary,
          padding: "8px 16px",
          "&.Mui-selected": {
            backgroundColor: theme.palette.primary.main,
            color: theme.palette.primary.contrastText,
            "&:hover": {
              backgroundColor: theme.palette.primary.dark,
            },
          },
          "&:hover": {
            backgroundColor: `${theme.palette.primary.main}20`,
          },
        },
      }}
    >
      <ToggleButton value="table" aria-label="table view">
        <ViewListIcon fontSize="small" sx={{ mr: 0.5 }} />
        Table
      </ToggleButton>
      <ToggleButton value="grid" aria-label="grid view">
        <GridViewIcon fontSize="small" sx={{ mr: 0.5 }} />
        Grid
      </ToggleButton>
    </ToggleButtonGroup>
  );
}
