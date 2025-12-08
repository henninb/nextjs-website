/**
 * ValidationDebugPanel Component
 *
 * Developer tool for debugging validation errors
 * Only renders in development mode
 *
 * Displays detailed validation error information including:
 * - Raw error object
 * - Transformed field errors
 * - Format hints
 * - What was expected vs what was received
 */

import React, { useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  IconButton,
  Tooltip,
  Stack,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import BugReportIcon from "@mui/icons-material/BugReport";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import {
  isValidationError,
  HookValidationError,
} from "../utils/hookValidation";
import type { ValidationError } from "../utils/validation/validator";
import {
  formatFieldName,
  getErrorSeverity,
  createErrorReport,
} from "../utils/validation/errorFormatting";

export interface ValidationDebugPanelProps {
  /**
   * Error to debug (can be any error type)
   */
  error?: any;

  /**
   * Optional title for the panel
   */
  title?: string;

  /**
   * Show even in production (default: false, only shows in development)
   */
  showInProduction?: boolean;

  /**
   * Position of the panel
   */
  position?: "fixed" | "relative";

  /**
   * Default expanded state
   */
  defaultExpanded?: boolean;
}

/**
 * ValidationDebugPanel Component
 *
 * @example
 * ```tsx
 * try {
 *   await insertTransaction({ payload: data });
 * } catch (error) {
 *   // In development, show debug panel
 *   return <ValidationDebugPanel error={error} />;
 * }
 * ```
 */
export default function ValidationDebugPanel({
  error,
  title = "Validation Debug Panel",
  showInProduction = false,
  position = "relative",
  defaultExpanded = true,
}: ValidationDebugPanelProps) {
  const [copied, setCopied] = useState(false);

  // Only show in development unless explicitly enabled
  if (process.env.NODE_ENV !== "development" && !showInProduction) {
    return null;
  }

  // Don't render if no error
  if (!error) {
    return null;
  }

  // Check if it's a validation error
  const isValError = isValidationError(error);
  const validationErrors = isValError ? error.validationErrors : [];

  // Handle copy to clipboard
  const handleCopyError = () => {
    const errorInfo = {
      type: error.constructor.name,
      message: error.message,
      validationErrors: validationErrors,
      stack: error.stack,
    };

    navigator.clipboard.writeText(JSON.stringify(errorInfo, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Get error report
  const errorReport =
    validationErrors && validationErrors.length > 0
      ? createErrorReport(validationErrors)
      : null;

  const positionStyles =
    position === "fixed"
      ? {
          position: "fixed",
          bottom: 16,
          right: 16,
          maxWidth: 600,
          maxHeight: "80vh",
          overflow: "auto",
          zIndex: 9999,
        }
      : {};

  return (
    <Paper
      elevation={8}
      sx={{
        ...positionStyles,
        border: "2px solid",
        borderColor: "error.main",
        bgcolor: "grey.900",
        color: "common.white",
      }}
    >
      <Box
        sx={{
          p: 2,
          bgcolor: "error.dark",
          display: "flex",
          alignItems: "center",
          gap: 1,
        }}
      >
        <BugReportIcon />
        <Typography variant="h6" sx={{ flex: 1 }}>
          {title}
        </Typography>
        <Chip
          label={process.env.NODE_ENV}
          size="small"
          color="warning"
          sx={{ textTransform: "uppercase" }}
        />
        <Tooltip title={copied ? "Copied!" : "Copy error to clipboard"}>
          <IconButton
            size="small"
            onClick={handleCopyError}
            sx={{ color: "common.white" }}
          >
            {copied ? <CheckCircleIcon /> : <ContentCopyIcon />}
          </IconButton>
        </Tooltip>
      </Box>

      <Box sx={{ p: 2 }}>
        {/* Error Type */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" color="grey.400">
            Error Type:
          </Typography>
          <Chip
            label={error.constructor.name}
            color="error"
            size="small"
            sx={{ mt: 0.5 }}
          />
        </Box>

        {/* Error Message */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" color="grey.400">
            Message:
          </Typography>
          <Typography variant="body2" sx={{ mt: 0.5, fontFamily: "monospace" }}>
            {error.message || "No message"}
          </Typography>
        </Box>

        {/* Validation Errors Summary */}
        {errorReport && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" color="grey.400">
              Summary:
            </Typography>
            <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
              <Chip
                label={`${errorReport.errorCount} errors`}
                size="small"
                color="error"
              />
              <Chip
                label={`${errorReport.fieldCount} fields`}
                size="small"
                color="warning"
              />
            </Stack>
          </Box>
        )}

        {/* Validation Errors Detail */}
        {validationErrors && validationErrors.length > 0 && (
          <Accordion
            defaultExpanded={defaultExpanded}
            sx={{ bgcolor: "grey.800", mt: 2 }}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle2">
                Validation Errors ({validationErrors.length})
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ color: "grey.400" }}>Field</TableCell>
                      <TableCell sx={{ color: "grey.400" }}>Message</TableCell>
                      <TableCell sx={{ color: "grey.400" }}>Code</TableCell>
                      <TableCell sx={{ color: "grey.400" }}>Severity</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {validationErrors.map(
                      (err: ValidationError, idx: number) => {
                        const severity = getErrorSeverity(err);
                        return (
                          <TableRow key={idx}>
                            <TableCell
                              sx={{
                                color: "common.white",
                                fontFamily: "monospace",
                              }}
                            >
                              {err.field}
                              <br />
                              <Typography variant="caption" color="grey.500">
                                ({formatFieldName(err.field)})
                              </Typography>
                            </TableCell>
                            <TableCell sx={{ color: "common.white" }}>
                              {err.message}
                            </TableCell>
                            <TableCell
                              sx={{
                                color: "grey.400",
                                fontFamily: "monospace",
                              }}
                            >
                              {err.code}
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={severity}
                                size="small"
                                color={
                                  severity === "error"
                                    ? "error"
                                    : severity === "warning"
                                      ? "warning"
                                      : "info"
                                }
                              />
                            </TableCell>
                          </TableRow>
                        );
                      },
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </AccordionDetails>
          </Accordion>
        )}

        {/* Field Errors Map */}
        {isValError && error.getErrorCount() > 0 && (
          <Accordion sx={{ bgcolor: "grey.800", mt: 1 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle2">Field Errors Object</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box
                component="pre"
                sx={{
                  p: 1,
                  bgcolor: "grey.900",
                  borderRadius: 1,
                  overflow: "auto",
                  fontSize: "0.75rem",
                  fontFamily: "monospace",
                }}
              >
                {JSON.stringify(error.getFieldErrorsObject(), null, 2)}
              </Box>
            </AccordionDetails>
          </Accordion>
        )}

        {/* Raw Error Object */}
        <Accordion sx={{ bgcolor: "grey.800", mt: 1 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle2">Raw Error Object</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box
              component="pre"
              sx={{
                p: 1,
                bgcolor: "grey.900",
                borderRadius: 1,
                overflow: "auto",
                fontSize: "0.75rem",
                fontFamily: "monospace",
              }}
            >
              {JSON.stringify(
                {
                  name: error.name,
                  message: error.message,
                  status: error.status,
                  statusText: error.statusText,
                  validationErrors: error.validationErrors,
                },
                null,
                2,
              )}
            </Box>
          </AccordionDetails>
        </Accordion>

        {/* Stack Trace */}
        {error.stack && (
          <Accordion sx={{ bgcolor: "grey.800", mt: 1 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle2">Stack Trace</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box
                component="pre"
                sx={{
                  p: 1,
                  bgcolor: "grey.900",
                  borderRadius: 1,
                  overflow: "auto",
                  fontSize: "0.75rem",
                  fontFamily: "monospace",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                }}
              >
                {error.stack}
              </Box>
            </AccordionDetails>
          </Accordion>
        )}

        {/* Quick Fix Hints */}
        {validationErrors && validationErrors.length > 0 && (
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Quick Fix:
            </Typography>
            <Typography variant="body2">
              • Use <code>error.getFieldErrorsObject()</code> to set form field
              errors
              <br />• Use <code>error.getUserMessage('summary')</code> for
              Snackbar messages
              <br />• Use{" "}
              <code>
                &lt;ValidationErrorList
                errors=&#123;error.validationErrors&#125; /&gt;
              </code>{" "}
              to display all errors
            </Typography>
          </Alert>
        )}
      </Box>
    </Paper>
  );
}

/**
 * Lightweight version that floats in corner
 */
export function FloatingValidationDebugPanel(
  props: Omit<ValidationDebugPanelProps, "position">,
) {
  return (
    <ValidationDebugPanel {...props} position="fixed" defaultExpanded={false} />
  );
}
