import React from "react";
import { Box, Typography, Button } from "@mui/material";
import {
  Search,
  Add,
  Refresh,
  Inbox,
  FilterList,
  AccountBalance,
  Receipt,
  SwapHoriz,
  Category,
  Description,
} from "@mui/icons-material";

export interface EmptyStateProps {
  title?: string;
  message?: string;
  icon?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  showRefresh?: boolean;
  onRefresh?: () => void;
  variant?: "search" | "data" | "filter" | "create";
  dataType?:
    | "accounts"
    | "transactions"
    | "payments"
    | "transfers"
    | "categories"
    | "descriptions"
    | "parameters"
    | "generic";
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  message,
  icon,
  actionLabel,
  onAction,
  showRefresh = true,
  onRefresh,
  variant = "data",
  dataType = "generic",
}) => {
  const getDefaultIcon = () => {
    if (icon) return icon;

    switch (dataType) {
      case "accounts":
        return (
          <AccountBalance sx={{ fontSize: 64, color: "text.secondary" }} />
        );
      case "transactions":
        return <Receipt sx={{ fontSize: 64, color: "text.secondary" }} />;
      case "payments":
        return <Receipt sx={{ fontSize: 64, color: "text.secondary" }} />;
      case "transfers":
        return <SwapHoriz sx={{ fontSize: 64, color: "text.secondary" }} />;
      case "categories":
        return <Category sx={{ fontSize: 64, color: "text.secondary" }} />;
      case "descriptions":
        return <Description sx={{ fontSize: 64, color: "text.secondary" }} />;
      default:
        switch (variant) {
          case "search":
            return <Search sx={{ fontSize: 64, color: "text.secondary" }} />;
          case "filter":
            return (
              <FilterList sx={{ fontSize: 64, color: "text.secondary" }} />
            );
          case "create":
            return <Add sx={{ fontSize: 64, color: "text.secondary" }} />;
          default:
            return <Inbox sx={{ fontSize: 64, color: "text.secondary" }} />;
        }
    }
  };

  const getDefaultTitle = () => {
    if (title) return title;

    switch (variant) {
      case "search":
        return "No results found";
      case "filter":
        return "No matches";
      case "create":
        return `No ${dataType} yet`;
      default:
        return `No ${dataType} available`;
    }
  };

  const getDefaultMessage = () => {
    if (message) return message;

    switch (variant) {
      case "search":
        return "Try adjusting your search terms or clearing filters.";
      case "filter":
        return "Try changing your filter criteria.";
      case "create":
        return `Get started by creating your first ${dataType === "generic" ? "item" : dataType}.`;
      default:
        return "There's no data to display at the moment.";
    }
  };

  const getDefaultActionLabel = () => {
    if (actionLabel) return actionLabel;

    switch (variant) {
      case "search":
        return "Clear Search";
      case "filter":
        return "Clear Filters";
      case "create":
        return `Add ${dataType === "generic" ? "Item" : dataType}`;
      default:
        return "Refresh";
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        py: 6,
        px: 4,
        textAlign: "center",
        minHeight: "200px",
      }}
    >
      {getDefaultIcon()}

      <Typography variant="h6" color="text.secondary" sx={{ mt: 2, mb: 1 }}>
        {getDefaultTitle()}
      </Typography>

      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ mb: 3, maxWidth: "400px" }}
      >
        {getDefaultMessage()}
      </Typography>

      <Box display="flex" gap={2}>
        {onAction && (
          <Button
            variant="contained"
            onClick={onAction}
            startIcon={variant === "create" ? <Add /> : undefined}
          >
            {getDefaultActionLabel()}
          </Button>
        )}

        {showRefresh && onRefresh && (
          <Button
            variant="outlined"
            onClick={onRefresh}
            startIcon={<Refresh />}
          >
            Refresh
          </Button>
        )}
      </Box>
    </Box>
  );
};

export default EmptyState;
