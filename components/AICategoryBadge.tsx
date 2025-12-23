// Visual indicator for transaction categorization source
import React from "react";
import { Chip, Tooltip, ChipProps } from "@mui/material";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import RuleIcon from "@mui/icons-material/Rule";
import EditIcon from "@mui/icons-material/Edit";
import TransactionCategoryMetadata from "../model/TransactionCategoryMetadata";

interface AICategoryBadgeProps {
  metadata?: TransactionCategoryMetadata;
  size?: "small" | "medium";
  onClick?: () => void;
}

export default function AICategoryBadge({
  metadata,
  size = "small",
  onClick,
}: AICategoryBadgeProps) {
  if (!metadata) {
    return null;
  }

  // Determine color and icon based on source
  const getColorAndIcon = () => {
    switch (metadata.source) {
      case "ai":
        return {
          color: "secondary" as ChipProps["color"],
          icon: <AutoAwesomeIcon />,
          label: "AI",
        };
      case "rule-based":
        return {
          color: "info" as ChipProps["color"],
          icon: <RuleIcon />,
          label: "Rule",
        };
      case "manual":
        return {
          color: "success" as ChipProps["color"],
          icon: <EditIcon />,
          label: "Manual",
        };
      default:
        return {
          color: "default" as ChipProps["color"],
          icon: <RuleIcon />,
          label: "Auto",
        };
    }
  };

  const { color, icon, label } = getColorAndIcon();

  // Build tooltip content
  const buildTooltipContent = () => {
    const lines: string[] = [];

    lines.push(`Source: ${metadata.source}`);

    if (metadata.confidence !== undefined) {
      lines.push(`Confidence: ${(metadata.confidence * 100).toFixed(0)}%`);
    }

    if (metadata.aiModel) {
      lines.push(`Model: ${metadata.aiModel}`);
    }

    if (metadata.similarTransactionsUsed !== undefined) {
      lines.push(`Examples used: ${metadata.similarTransactionsUsed}`);
    }

    if (metadata.fallbackReason) {
      lines.push(`Fallback reason: ${metadata.fallbackReason}`);
    }

    if (metadata.timestamp) {
      const date = new Date(metadata.timestamp);
      lines.push(`Categorized: ${date.toLocaleString()}`);
    }

    return lines.join("\n");
  };

  return (
    <Tooltip title={<pre style={{ margin: 0 }}>{buildTooltipContent()}</pre>}>
      <Chip
        icon={icon}
        label={label}
        color={color}
        size={size}
        variant="outlined"
        onClick={onClick}
        sx={{
          cursor: onClick ? "pointer" : "default",
          "& .MuiChip-icon": {
            fontSize: size === "small" ? "0.9rem" : "1.1rem",
          },
        }}
      />
    </Tooltip>
  );
}
