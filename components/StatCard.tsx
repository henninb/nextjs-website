import React from "react";
import {
  Card,
  CardContent,
  Box,
  Typography,
  useTheme,
  Chip,
  alpha,
} from "@mui/material";
import FilterListIcon from "@mui/icons-material/FilterList";

type StatCardProps = {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subtitle?: string;
  color?: "primary" | "success" | "warning" | "info" | "secondary";
  trend?: {
    value: number;
    direction: "up" | "down";
  };
  highlighted?: boolean;
  onClick?: () => void;
};

export default function StatCard({
  icon,
  label,
  value,
  subtitle,
  color = "primary",
  trend,
  highlighted = false,
  onClick,
}: StatCardProps) {
  const theme = useTheme();

  // Get color from theme based on color prop
  const getColor = () => {
    switch (color) {
      case "primary":
        return theme.palette.primary.main;
      case "success":
        return theme.palette.success.main;
      case "warning":
        return theme.palette.warning.main;
      case "info":
        return theme.palette.info?.main || theme.palette.primary.main;
      case "secondary":
        return theme.palette.secondary.main;
      default:
        return theme.palette.primary.main;
    }
  };

  const cardColor = getColor();

  return (
    <Card
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      aria-label={onClick ? `${label} breakdown` : undefined}
      sx={{
        height: "100%",
        cursor: onClick ? "pointer" : undefined,
        transition: "all 0.3s ease-in-out",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow:
            "0 12px 24px -4px rgba(0, 0, 0, 0.4), 0 8px 16px -4px rgba(0, 0, 0, 0.3)",
        },
        "&:focus-visible": onClick
          ? {
              outline: `2px solid ${cardColor}`,
              outlineOffset: "2px",
            }
          : undefined,
        background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${alpha(cardColor, 0.05)} 100%)`,
        border: highlighted
          ? `2px solid ${cardColor}`
          : `1px solid ${theme.palette.divider}`,
        position: "relative",
        overflow: "hidden",
        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "4px",
          background: `linear-gradient(90deg, ${cardColor} 0%, ${theme.palette.background.paper} 100%)`,
        },
      }}
    >
      {highlighted && (
        <Box
          sx={{
            position: "absolute",
            top: 8,
            right: 8,
            zIndex: 1,
          }}
        >
          <Chip
            icon={<FilterListIcon sx={{ fontSize: "0.9rem !important" }} />}
            label="Filtered"
            size="small"
            sx={{
              backgroundColor: cardColor,
              color: theme.palette.getContrastText(cardColor),
              fontWeight: 600,
              fontSize: "0.65rem",
              height: "20px",
              "& .MuiChip-icon": {
                color: theme.palette.getContrastText(cardColor),
              },
            }}
          />
        </Box>
      )}
      <CardContent
        sx={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "flex-start",
          p: 2,
          gap: 2,
          "&:last-child": {
            pb: 2,
          },
        }}
      >
        {/* Icon on the left */}
        <Box
          sx={{
            color: cardColor,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 48,
            height: 48,
            borderRadius: "10px",
            flexShrink: 0,
            background: alpha(cardColor, 0.1),
            "& > svg": {
              fontSize: "1.75rem",
            },
          }}
        >
          {icon}
        </Box>

        {/* Label and Value on the right */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            minWidth: 0,
            flexGrow: 1,
          }}
        >
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              fontWeight: 500,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              fontSize: "0.7rem",
              mb: 0.5,
            }}
          >
            {label}
          </Typography>

          <Box sx={{ display: "flex", alignItems: "baseline", gap: 1 }}>
            <Typography
              variant="h5"
              component="div"
              sx={{
                fontWeight: 700,
                color: "text.primary",
                lineHeight: 1,
              }}
            >
              {value}
            </Typography>

            {trend && (
              <Typography
                variant="caption"
                sx={{
                  color:
                    trend.direction === "up"
                      ? theme.palette.success.main
                      : theme.palette.error.main,
                  fontWeight: 600,
                }}
              >
                {trend.direction === "up" ? "↑" : "↓"} {Math.abs(trend.value)}%
              </Typography>
            )}
          </Box>
          {subtitle && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontSize: "0.65rem", mt: 0.25, display: "block" }}
            >
              {subtitle}
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}
