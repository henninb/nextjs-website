/**
 * ValidationErrorList Component
 *
 * Displays validation errors in a formatted, user-friendly list
 * Supports grouping by field and expandable/collapsible views
 */

import React, { useState } from "react";
import {
  Alert,
  AlertTitle,
  Box,
  Collapse,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
} from "@mui/material";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import type { ValidationError } from "../utils/validation/validator";
import {
  formatFieldName,
  groupErrorsByField,
  getErrorSeverity,
  separateErrorsBySeverity,
} from "../utils/validation/errorFormatting";

export interface ValidationErrorListProps {
  /**
   * Array of validation errors to display
   */
  errors: ValidationError[];

  /**
   * Display variant
   * - 'alert': Show in MUI Alert component (default)
   * - 'list': Show as plain list without Alert wrapper
   * - 'compact': Compact single-line format
   */
  variant?: "alert" | "list" | "compact";

  /**
   * Whether to group errors by field
   * Default: true
   */
  groupByField?: boolean;

  /**
   * Whether the list is collapsible (for long error lists)
   * Default: true for more than 3 errors
   */
  collapsible?: boolean;

  /**
   * Initial collapsed state (only applies if collapsible=true)
   * Default: false (expanded)
   */
  defaultCollapsed?: boolean;

  /**
   * Maximum number of errors to show when collapsed
   * Default: 3
   */
  maxCollapsedErrors?: number;

  /**
   * Custom title for the error alert
   */
  title?: string;

  /**
   * Show severity icons for each error
   * Default: true
   */
  showIcons?: boolean;

  /**
   * Severity override (for all errors)
   * Default: auto-detected per error
   */
  severity?: "error" | "warning" | "info";
}

/**
 * Gets the icon component for error severity
 */
function getSeverityIcon(severity: "error" | "warning" | "info") {
  switch (severity) {
    case "error":
      return <ErrorOutlineIcon fontSize="small" />;
    case "warning":
      return <WarningAmberIcon fontSize="small" />;
    case "info":
      return <InfoOutlinedIcon fontSize="small" />;
  }
}

/**
 * Renders a single validation error
 */
function ErrorItem({
  error,
  showIcon = true,
  showFieldName = true,
}: {
  error: ValidationError;
  showIcon?: boolean;
  showFieldName?: boolean;
}) {
  const severity = getErrorSeverity(error);

  return (
    <ListItem sx={{ py: 0.5, px: 0 }}>
      {showIcon && <ListItemIcon sx={{ minWidth: 32 }}>{getSeverityIcon(severity)}</ListItemIcon>}
      <ListItemText
        primary={
          showFieldName ? (
            <span>
              <strong>{formatFieldName(error.field)}:</strong> {error.message}
            </span>
          ) : (
            error.message
          )
        }
        primaryTypographyProps={{
          variant: "body2",
          component: "span",
        }}
      />
    </ListItem>
  );
}

/**
 * ValidationErrorList Component
 */
export default function ValidationErrorList({
  errors,
  variant = "alert",
  groupByField = true,
  collapsible,
  defaultCollapsed = false,
  maxCollapsedErrors = 3,
  title,
  showIcons = true,
  severity,
}: ValidationErrorListProps) {
  // Determine if should be collapsible
  const shouldBeCollapsible =
    collapsible !== undefined ? collapsible : errors.length > maxCollapsedErrors;

  const [expanded, setExpanded] = useState(!defaultCollapsed);

  // Handle empty errors
  if (errors.length === 0) {
    return null;
  }

  // Determine overall severity (if not provided)
  const { errors: errorList, warnings, info } = separateErrorsBySeverity(errors);
  const overallSeverity =
    severity ||
    (errorList.length > 0 ? "error" : warnings.length > 0 ? "warning" : "info");

  // Get displayed errors (when collapsed)
  const displayedErrors = shouldBeCollapsible && !expanded ? errors.slice(0, maxCollapsedErrors) : errors;
  const hiddenErrorCount = errors.length - displayedErrors.length;

  // Render compact variant
  if (variant === "compact") {
    return (
      <Typography variant="body2" color="error">
        {errors.length === 1
          ? `${formatFieldName(errors[0].field)}: ${errors[0].message}`
          : `${errors.length} validation errors`}
      </Typography>
    );
  }

  // Render error list content
  const renderErrorList = () => {
    if (groupByField && errors.length > 1) {
      const grouped = groupErrorsByField(displayedErrors);

      return (
        <List dense disablePadding>
          {Array.from(grouped.entries()).map(([field, fieldErrors]) => (
            <Box key={field}>
              {fieldErrors.length === 1 ? (
                <ErrorItem error={fieldErrors[0]} showIcon={showIcons} />
              ) : (
                <Box>
                  <Typography variant="body2" fontWeight="bold" sx={{ mt: 1, mb: 0.5 }}>
                    {formatFieldName(field)}:
                  </Typography>
                  <List dense disablePadding sx={{ pl: 2 }}>
                    {fieldErrors.map((error, idx) => (
                      <ErrorItem
                        key={`${field}-${idx}`}
                        error={error}
                        showIcon={showIcons}
                        showFieldName={false}
                      />
                    ))}
                  </List>
                </Box>
              )}
            </Box>
          ))}
        </List>
      );
    }

    // Ungrouped list
    return (
      <List dense disablePadding>
        {displayedErrors.map((error, idx) => (
          <ErrorItem key={idx} error={error} showIcon={showIcons} />
        ))}
      </List>
    );
  };

  // Render expand/collapse toggle
  const renderToggle = () => {
    if (!shouldBeCollapsible) {
      return null;
    }

    return (
      <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
        <IconButton
          size="small"
          onClick={() => setExpanded(!expanded)}
          aria-label={expanded ? "Show less" : "Show more"}
          sx={{ p: 0.5 }}
        >
          {expanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
        </IconButton>
        <Typography variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
          {expanded
            ? "Show less"
            : `Show ${hiddenErrorCount} more error${hiddenErrorCount > 1 ? "s" : ""}`}
        </Typography>
      </Box>
    );
  };

  // Render list variant (without Alert wrapper)
  if (variant === "list") {
    return (
      <Box>
        {renderErrorList()}
        {renderToggle()}
      </Box>
    );
  }

  // Render alert variant (default)
  return (
    <Alert severity={overallSeverity} sx={{ mb: 2 }}>
      {title && <AlertTitle>{title}</AlertTitle>}
      {!title && errors.length > 1 && (
        <AlertTitle>
          {overallSeverity === "error"
            ? "Please fix the following errors:"
            : overallSeverity === "warning"
              ? "Please review the following warnings:"
              : "Please note:"}
        </AlertTitle>
      )}
      {renderErrorList()}
      {renderToggle()}
    </Alert>
  );
}

/**
 * Simplified variant for displaying a single error
 */
export function SingleValidationError({
  error,
  severity,
  showIcon = true,
}: {
  error: ValidationError;
  severity?: "error" | "warning" | "info";
  showIcon?: boolean;
}) {
  const autoSeverity = severity || getErrorSeverity(error);

  return (
    <Alert severity={autoSeverity} icon={showIcon ? undefined : false}>
      <strong>{formatFieldName(error.field)}:</strong> {error.message}
    </Alert>
  );
}
