import React, { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Stack,
  Collapse,
  Checkbox,
} from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import EventNoteIcon from "@mui/icons-material/EventNote";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import SwapVertIcon from "@mui/icons-material/SwapVert";
import DeleteIcon from "@mui/icons-material/Delete";
import Transaction from "../model/Transaction";
import { TransactionState } from "../model/TransactionState";
import { currencyFormat, formatDateForDisplay } from "./Common";

interface TransactionCardProps {
  transaction: Transaction;
  onClone?: (transaction: Transaction) => void;
  onMove?: (transaction: Transaction) => void;
  onDelete?: (transaction: Transaction) => void;
  onStateChange?: (
    transaction: Transaction,
    newState: TransactionState,
  ) => void;
  selected?: boolean;
  onSelect?: (transactionId: number) => void;
}

const TransactionCard: React.FC<TransactionCardProps> = React.memo(
  ({
    transaction,
    onClone,
    onMove,
    onDelete,
    onStateChange,
    selected = false,
    onSelect,
  }) => {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [notesExpanded, setNotesExpanded] = useState(false);

    const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
      event.stopPropagation();
      setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
      setAnchorEl(null);
    };

    const handleClone = (event: React.MouseEvent) => {
      event.stopPropagation();
      handleMenuClose();
      if (onClone) {
        onClone(transaction);
      }
    };

    const handleMove = (event: React.MouseEvent) => {
      event.stopPropagation();
      handleMenuClose();
      if (onMove) {
        onMove(transaction);
      }
    };

    const handleDelete = (event: React.MouseEvent) => {
      event.stopPropagation();
      handleMenuClose();
      if (onDelete) {
        onDelete(transaction);
      }
    };

    const handleStateClick =
      (state: TransactionState) => (event: React.MouseEvent) => {
        event.stopPropagation();
        if (onStateChange) {
          onStateChange(transaction, state);
        }
      };

    const handleSelectChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      event.stopPropagation();
      if (onSelect && transaction.transactionId) {
        onSelect(transaction.transactionId);
      }
    };

    const toggleNotes = (event: React.MouseEvent) => {
      event.stopPropagation();
      setNotesExpanded(!notesExpanded);
    };

    // Determine amount color based on value
    const getAmountColor = () => {
      const amount = transaction.amount ?? 0;
      if (amount > 0) return "#22c55e"; // Green for income
      if (amount < 0) return "#ef4444"; // Red for expense
      return "text.secondary"; // Gray for zero
    };

    // Determine state color
    const getStateColor = (state: TransactionState) => {
      switch (state) {
        case "cleared":
          return "success";
        case "outstanding":
          return "warning";
        case "future":
          return "info";
        default:
          return "default";
      }
    };

    // Determine state icon
    const getStateIcon = (state: TransactionState) => {
      switch (state) {
        case "cleared":
          return <CheckCircleIcon fontSize="small" />;
        case "outstanding":
          return <AccessTimeIcon fontSize="small" />;
        case "future":
          return <EventNoteIcon fontSize="small" />;
        default:
          return null;
      }
    };

    // Determine type color
    const getTypeColor = () => {
      switch (transaction.transactionType) {
        case "income":
          return "success";
        case "expense":
          return "primary";
        case "transfer":
          return "info";
        default:
          return "default";
      }
    };

    // Get type label
    const getTypeLabel = () => {
      return transaction.transactionType || "undefined";
    };

    // Get reoccurring label
    const getReoccurringLabel = () => {
      switch (transaction.reoccurringType) {
        case "onetime":
          return "One-Time";
        case "monthly":
          return "Monthly";
        case "annually":
          return "Annually";
        case "quarterly":
          return "Quarterly";
        case "fortnightly":
          return "Fortnightly";
        case "bi_annually":
          return "Bi-Annually";
        case "undefined":
          return "Undefined";
        default:
          return transaction.reoccurringType || "undefined";
      }
    };

    const hasNotes = transaction.notes && transaction.notes.trim().length > 0;
    const notesPreview =
      hasNotes && transaction.notes!.length > 100 && !notesExpanded
        ? `${transaction.notes!.substring(0, 100)}...`
        : transaction.notes;

    return (
      <Card
        sx={{
          position: "relative",
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          "&:hover": {
            boxShadow: 8,
            transform: "translateY(-4px) scale(1.02)",
            borderColor: "primary.light",
          },
          minHeight: "280px",
          display: "flex",
          flexDirection: "column",
          border: selected ? 2 : 1,
          borderColor: selected ? "primary.main" : "divider",
          cursor: "pointer",
          willChange: "transform, box-shadow",
        }}
      >
        <CardContent
          sx={{
            p: 3,
            flex: 1,
            display: "flex",
            flexDirection: "column",
            "&:last-child": { pb: 3 },
          }}
        >
          {/* Header: Date Badge, Checkbox, Actions */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              mb: 2,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              {onSelect && transaction.transactionId && (
                <Checkbox
                  size="small"
                  checked={selected}
                  onChange={handleSelectChange}
                  onClick={(e) => e.stopPropagation()}
                />
              )}
              <Chip
                label={formatDateForDisplay(transaction.transactionDate)}
                size="small"
                color={
                  transaction.transactionState === "future" ? "info" : "default"
                }
                sx={{ fontWeight: 500 }}
              />
            </Box>
            <IconButton
              size="small"
              onClick={handleMenuClick}
              sx={{
                mt: -1,
                mr: -1,
                transition: "all 0.2s ease-in-out",
                "&:hover": {
                  transform: "scale(1.1) rotate(90deg)",
                  backgroundColor: "action.hover",
                },
              }}
            >
              <MoreVertIcon fontSize="small" />
            </IconButton>
          </Box>

          {/* Description */}
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              mb: 1,
              lineHeight: 1.3,
              overflow: "hidden",
              textOverflow: "ellipsis",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
            }}
          >
            {transaction.description || "No description"}
          </Typography>

          {/* Category */}
          {transaction.category && (
            <Box sx={{ mb: 2 }}>
              <Chip
                label={transaction.category}
                size="small"
                variant="outlined"
                sx={{ fontWeight: 500 }}
              />
            </Box>
          )}

          {/* Amount */}
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              color: getAmountColor(),
              mb: 2,
              letterSpacing: "-0.02em",
            }}
          >
            {currencyFormat(transaction.amount ?? 0)}
          </Typography>

          {/* State, Type, Reoccurring Badges */}
          <Stack
            direction="row"
            spacing={1}
            flexWrap="wrap"
            useFlexGap
            sx={{ mb: 2 }}
          >
            {/* State buttons */}
            {(["cleared", "outstanding", "future"] as TransactionState[]).map(
              (state) => (
                <Chip
                  key={state}
                  icon={getStateIcon(state) || undefined}
                  label={state.charAt(0).toUpperCase() + state.slice(1)}
                  size="small"
                  color={
                    transaction.transactionState === state
                      ? getStateColor(state)
                      : "default"
                  }
                  variant={
                    transaction.transactionState === state
                      ? "filled"
                      : "outlined"
                  }
                  onClick={handleStateClick(state)}
                  sx={{
                    cursor: onStateChange ? "pointer" : "default",
                    transition: "all 0.2s ease-in-out",
                    "&:hover": onStateChange
                      ? {
                          opacity: 0.8,
                          transform: "scale(1.05)",
                        }
                      : {},
                    "&:active": onStateChange
                      ? {
                          transform: "scale(0.95)",
                        }
                      : {},
                  }}
                />
              ),
            )}
          </Stack>

          {/* Type and Reoccurring */}
          <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
            <Chip
              label={getTypeLabel()}
              size="small"
              color={getTypeColor()}
              variant="outlined"
            />
            <Chip
              label={getReoccurringLabel()}
              size="small"
              variant="outlined"
            />
          </Stack>

          {/* Notes Section */}
          {hasNotes && (
            <Box sx={{ mt: "auto" }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  mb: 0.5,
                }}
              >
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontWeight: 600 }}
                >
                  Notes
                </Typography>
                {transaction.notes!.length > 100 && (
                  <IconButton
                    size="small"
                    onClick={toggleNotes}
                    sx={{
                      p: 0.5,
                      transition: "all 0.3s ease-in-out",
                      transform: notesExpanded
                        ? "rotate(180deg)"
                        : "rotate(0deg)",
                      "&:hover": {
                        backgroundColor: "action.hover",
                      },
                    }}
                  >
                    <ExpandMoreIcon fontSize="small" />
                  </IconButton>
                )}
              </Box>
              <Collapse in={notesExpanded || transaction.notes!.length <= 100}>
                <Typography variant="body2" color="text.secondary">
                  {notesPreview}
                </Typography>
              </Collapse>
            </Box>
          )}
        </CardContent>

        {/* Actions Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          onClick={(e) => e.stopPropagation()}
        >
          {onClone && (
            <MenuItem onClick={handleClone}>
              <ContentCopyIcon fontSize="small" sx={{ mr: 1 }} />
              Clone
            </MenuItem>
          )}
          {onMove && (
            <MenuItem onClick={handleMove}>
              <SwapVertIcon fontSize="small" sx={{ mr: 1 }} />
              Move
            </MenuItem>
          )}
          {onDelete && (
            <MenuItem onClick={handleDelete} sx={{ color: "error.main" }}>
              <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
              Delete
            </MenuItem>
          )}
        </Menu>
      </Card>
    );
  },
);

TransactionCard.displayName = "TransactionCard";

export default TransactionCard;
