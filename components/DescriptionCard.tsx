import React, { useState } from "react";
import {
  Card,
  CardContent,
  Box,
  Typography,
  IconButton,
  Chip,
  Menu,
  MenuItem,
  useTheme,
  Tooltip,
} from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import DescriptionIcon from "@mui/icons-material/Description";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import DeleteIcon from "@mui/icons-material/Delete";
import Description from "../model/Description";
import { format } from "date-fns";

interface DescriptionCardProps {
  description: Description;
  onDelete?: (description: Description) => void;
}

const DescriptionCard = React.memo<DescriptionCardProps>(
  ({ description, onDelete }) => {
    const theme = useTheme();
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
      event.stopPropagation();
      setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = (event?: React.MouseEvent) => {
      if (event) {
        event.stopPropagation();
      }
      setAnchorEl(null);
    };

    const handleDelete = (event: React.MouseEvent) => {
      event.stopPropagation();
      handleMenuClose();
      onDelete?.(description);
    };

    const isUnused =
      !description.descriptionCount || description.descriptionCount === 0;
    const statusColor = description.activeStatus
      ? theme.palette.success.main
      : theme.palette.warning.main;

    return (
      <Card
        sx={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          position: "relative",
          transition: "all 0.3s ease-in-out",
          "&:hover": {
            transform: "translateY(-4px) scale(1.02)",
            boxShadow: `0 12px 24px -4px rgba(0, 0, 0, 0.4), 0 8px 16px -4px rgba(0, 0, 0, 0.3)`,
          },
          border: `1px solid ${theme.palette.divider}`,
        }}
      >
        <CardContent sx={{ flexGrow: 1, p: 2.5 }}>
          {/* Header with Icon and Actions */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              mb: 2,
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 48,
                height: 48,
                borderRadius: "12px",
                backgroundColor: `${theme.palette.primary.main}15`,
                color: theme.palette.primary.main,
              }}
            >
              <DescriptionIcon sx={{ fontSize: "1.75rem" }} />
            </Box>

            <IconButton
              size="small"
              onClick={handleMenuOpen}
              aria-label="Description actions"
              sx={{
                transition: "all 0.2s ease-in-out",
                "&:hover": {
                  transform: "rotate(90deg)",
                  backgroundColor: `${theme.palette.primary.main}15`,
                },
              }}
            >
              <MoreVertIcon fontSize="small" />
            </IconButton>

            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={() => handleMenuClose()}
              onClick={(e) => e.stopPropagation()}
            >
              <MenuItem onClick={handleDelete}>
                <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
                Delete
              </MenuItem>
            </Menu>
          </Box>

          {/* Description Name */}
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              mb: 2,
              wordBreak: "break-word",
              color: "text.primary",
            }}
          >
            {description.descriptionName}
          </Typography>

          {/* Status and Usage Badges */}
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 2 }}>
            <Chip
              icon={
                description.activeStatus ? (
                  <CheckCircleIcon sx={{ fontSize: "1rem !important" }} />
                ) : (
                  <CancelIcon sx={{ fontSize: "1rem !important" }} />
                )
              }
              label={description.activeStatus ? "Active" : "Inactive"}
              size="small"
              sx={{
                backgroundColor: `${statusColor}20`,
                color: statusColor,
                fontWeight: 600,
                "& .MuiChip-icon": {
                  color: statusColor,
                },
              }}
            />

            {isUnused && (
              <Chip
                label="Not Used"
                size="small"
                sx={{
                  backgroundColor: `${theme.palette.error.main}15`,
                  color: theme.palette.error.main,
                  fontWeight: 600,
                }}
              />
            )}
          </Box>

          {/* Transaction Count */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Transaction Usage
            </Typography>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                color: isUnused
                  ? theme.palette.error.main
                  : theme.palette.info.main,
              }}
            >
              {description.descriptionCount ?? 0}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {description.descriptionCount === 1
                ? "transaction"
                : "transactions"}
            </Typography>
          </Box>

          {/* Metadata */}
          <Box
            sx={{
              pt: 2,
              borderTop: `1px solid ${theme.palette.divider}`,
            }}
          >
            {description.dateAdded && (
              <Typography
                variant="caption"
                color="text.secondary"
                display="block"
              >
                Added: {format(new Date(description.dateAdded), "MMM d, yyyy")}
              </Typography>
            )}
            {description.dateUpdated && (
              <Typography
                variant="caption"
                color="text.secondary"
                display="block"
              >
                Updated:{" "}
                {format(new Date(description.dateUpdated), "MMM d, yyyy")}
              </Typography>
            )}
          </Box>
        </CardContent>
      </Card>
    );
  },
);

DescriptionCard.displayName = "DescriptionCard";

export default DescriptionCard;
