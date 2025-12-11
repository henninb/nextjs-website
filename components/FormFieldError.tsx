/**
 * FormFieldError Component
 *
 * Displays field-specific validation errors in forms
 * Lightweight component for use with form fields
 */

import React from "react";
import { Box, Typography, Tooltip, IconButton } from "@mui/material";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";

export interface FormFieldErrorProps {
  /**
   * Error message to display
   */
  message: string;

  /**
   * Severity level
   * Default: 'error'
   */
  severity?: "error" | "warning" | "info";

  /**
   * Show icon next to message
   * Default: false
   */
  showIcon?: boolean;

  /**
   * Optional help text/tooltip to provide guidance
   */
  helpText?: string;

  /**
   * Custom styles
   */
  sx?: import('@mui/material').SxProps<import('@mui/material').Theme>;
}

/**
 * Gets the color for severity
 */
function getSeverityColor(severity: "error" | "warning" | "info"): string {
  switch (severity) {
    case "error":
      return "error.main";
    case "warning":
      return "warning.main";
    case "info":
      return "info.main";
  }
}

/**
 * Gets the icon component for severity
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
 * FormFieldError Component
 *
 * Simple component for displaying field-specific errors
 *
 * @example
 * ```tsx
 * <TextField
 *   error={!!fieldErrors.transactionDate}
 *   label="Transaction Date"
 * />
 * {fieldErrors.transactionDate && (
 *   <FormFieldError
 *     message={fieldErrors.transactionDate}
 *     severity="error"
 *     helpText="Use YYYY-MM-DD format (e.g., 2025-01-15)"
 *   />
 * )}
 * ```
 */
export default function FormFieldError({
  message,
  severity = "error",
  showIcon = false,
  helpText,
  sx,
}: FormFieldErrorProps) {
  const color = getSeverityColor(severity);

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "flex-start",
        gap: 0.5,
        mt: 0.5,
        ...sx,
      }}
    >
      {showIcon && (
        <Box
          sx={{
            color,
            display: "flex",
            alignItems: "center",
            mt: 0.25,
          }}
        >
          {getSeverityIcon(severity)}
        </Box>
      )}
      <Typography
        variant="caption"
        color={color}
        sx={{
          flex: 1,
          lineHeight: 1.4,
        }}
      >
        {message}
      </Typography>
      {helpText && (
        <Tooltip title={helpText} arrow>
          <IconButton
            size="small"
            sx={{ p: 0, ml: 0.5, color: "text.secondary" }}
          >
            <HelpOutlineIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
    </Box>
  );
}

/**
 * Hook for managing form field errors
 * Provides convenient state management for field errors
 *
 * @example
 * ```tsx
 * const { fieldErrors, setFieldError, clearFieldError, setFieldErrors, hasError } = useFormFieldErrors();
 *
 * // Set a single field error
 * setFieldError('transactionDate', 'Date is required');
 *
 * // Set multiple field errors
 * setFieldErrors({
 *   transactionDate: 'Date is required',
 *   amount: 'Amount must be positive'
 * });
 *
 * // Check if field has error
 * if (hasError('transactionDate')) {
 *   // ...
 * }
 *
 * // Clear a field error
 * clearFieldError('transactionDate');
 * ```
 */
export function useFormFieldErrors() {
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>(
    {},
  );

  const setFieldError = React.useCallback((field: string, message: string) => {
    setFieldErrors((prev) => ({
      ...prev,
      [field]: message,
    }));
  }, []);

  const clearFieldError = React.useCallback((field: string) => {
    setFieldErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  const clearAllErrors = React.useCallback(() => {
    setFieldErrors({});
  }, []);

  const hasError = React.useCallback(
    (field: string) => {
      return !!fieldErrors[field];
    },
    [fieldErrors],
  );

  const getError = React.useCallback(
    (field: string) => {
      return fieldErrors[field];
    },
    [fieldErrors],
  );

  return {
    fieldErrors,
    setFieldError,
    clearFieldError,
    clearAllErrors,
    setFieldErrors,
    hasError,
    getError,
  };
}
