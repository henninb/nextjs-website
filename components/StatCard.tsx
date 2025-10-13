import React from "react";
import {
  Card,
  CardContent,
  Box,
  Typography,
  useTheme,
  Chip,
} from "@mui/material";
import FilterListIcon from "@mui/icons-material/FilterList";

type StatCardProps = {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color?: "primary" | "success" | "warning" | "info" | "secondary";
  trend?: {
    value: number;
    direction: "up" | "down";
  };
  highlighted?: boolean;
};

export default function StatCard({
  icon,
  label,
  value,
  color = "primary",
  trend,
  highlighted = false,
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
      sx={{
        height: "100%",
        transition: "all 0.3s ease-in-out",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow:
            "0 12px 24px -4px rgba(0, 0, 0, 0.4), 0 8px 16px -4px rgba(0, 0, 0, 0.3)",
        },
        background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, rgba(${parseInt(cardColor.slice(1, 3), 16)}, ${parseInt(cardColor.slice(3, 5), 16)}, ${parseInt(cardColor.slice(5, 7), 16)}, 0.05) 100%)`,
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
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          p: 3,
          "&:last-child": {
            pb: 3,
          },
        }}
      >
        <Box
          sx={{
            mb: 2,
            color: cardColor,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 56,
            height: 56,
            borderRadius: "12px",
            background: `rgba(${parseInt(cardColor.slice(1, 3), 16)}, ${parseInt(cardColor.slice(3, 5), 16)}, ${parseInt(cardColor.slice(5, 7), 16)}, 0.1)`,
            "& > svg": {
              fontSize: "2rem",
            },
          }}
        >
          {icon}
        </Box>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            mb: 1,
            fontWeight: 500,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            fontSize: "0.75rem",
          }}
        >
          {label}
        </Typography>

        <Typography
          variant="h4"
          component="div"
          sx={{
            fontWeight: 700,
            color: "text.primary",
            mb: trend ? 1 : 0,
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
      </CardContent>
    </Card>
  );
}
