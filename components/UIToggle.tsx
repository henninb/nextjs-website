import React from "react";
import {
  Box,
  IconButton,
  Tooltip,
  Paper,
  Typography,
  useTheme,
} from "@mui/material";
import { Palette, AutoAwesome } from "@mui/icons-material";
import { useUI } from "../contexts/UIContext";

// Inline version for use in toolbar
export const UIToggleInline: React.FC = () => {
  const { uiMode, toggleUIMode } = useUI();
  const theme = useTheme();

  const isModern = uiMode === "modern";

  return (
    <Tooltip
      title={`Switch to ${isModern ? "Dracula" : "Modern Dark"} UI`}
      placement="bottom"
    >
      <IconButton
        onClick={toggleUIMode}
        size="small"
        sx={{
          color: "inherit",
          borderRadius: 2,
          padding: "8px",
          transition: "all 0.2s ease-in-out",
          "&:hover": {
            backgroundColor: "rgba(255, 255, 255, 0.08)",
            transform: "scale(1.05)",
          },
        }}
      >
        {isModern ? (
          <Palette
            sx={{
              fontSize: "1.2rem",
            }}
          />
        ) : (
          <AutoAwesome
            sx={{
              fontSize: "1.2rem",
            }}
          />
        )}
      </IconButton>
    </Tooltip>
  );
};

// Original fixed position version (kept for backward compatibility if needed)
export const UIToggle: React.FC = () => {
  const { uiMode, toggleUIMode } = useUI();
  const theme = useTheme();

  const isModern = uiMode === "modern";

  return (
    <Paper
      elevation={0}
      sx={{
        position: "fixed",
        top: 16,
        right: 16,
        zIndex: 1300,
        borderRadius: 3,
        border: isModern
          ? "1px solid #334155"
          : "1px solid rgba(68, 71, 90, 1)",
        backgroundColor: isModern ? "#1e293b" : "rgba(42, 43, 58, 1)",
        backdropFilter: "blur(10px)",
        boxShadow: isModern
          ? "0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)"
          : "0px 4px 10px rgba(0, 0, 0, 0.3)",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          padding: "8px 12px",
          gap: 1,
        }}
      >
        <Typography
          variant="caption"
          sx={{
            fontSize: "0.75rem",
            fontWeight: 500,
            color: isModern ? "#cbd5e1" : "rgba(139, 233, 253, 1)",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          UI Mode
        </Typography>

        <Tooltip
          title={`Switch to ${isModern ? "Dracula" : "Modern Dark"} UI`}
          placement="left"
        >
          <IconButton
            onClick={toggleUIMode}
            size="small"
            sx={{
              borderRadius: 2,
              padding: "6px",
              transition: "all 0.2s ease-in-out",
              backgroundColor: isModern
                ? "rgba(59, 130, 246, 0.1)"
                : "rgba(189, 147, 249, 0.1)",
              "&:hover": {
                backgroundColor: isModern
                  ? "rgba(59, 130, 246, 0.2)"
                  : "rgba(189, 147, 249, 0.2)",
                transform: "scale(1.05)",
              },
            }}
          >
            {isModern ? (
              <Palette
                sx={{
                  fontSize: "1.2rem",
                  color: "rgba(189, 147, 249, 1)",
                }}
              />
            ) : (
              <AutoAwesome
                sx={{
                  fontSize: "1.2rem",
                  color: "#3b82f6",
                }}
              />
            )}
          </IconButton>
        </Tooltip>

        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            marginLeft: 0.5,
          }}
        >
          <Typography
            variant="caption"
            sx={{
              fontSize: "0.65rem",
              fontWeight: 600,
              color: isModern ? "#3b82f6" : "rgba(189, 147, 249, 1)",
              textTransform: "capitalize",
              lineHeight: 1,
            }}
          >
            {uiMode}
          </Typography>
          <Box
            sx={{
              width: 24,
              height: 2,
              borderRadius: 1,
              backgroundColor: isModern ? "#3b82f6" : "rgba(189, 147, 249, 1)",
              marginTop: "2px",
            }}
          />
        </Box>
      </Box>
    </Paper>
  );
};
