/**
 * Error Formatting Utilities
 *
 * Transforms technical validation errors into user-friendly messages
 */

import type { ValidationError } from "./validator";

/**
 * Field name mapping from camelCase to human-readable labels
 */
const FIELD_LABELS: Record<string, string> = {
  // Transaction fields
  transactionDate: "Transaction Date",
  accountNameOwner: "Account Name",
  accountType: "Account Type",
  cleared: "Cleared Status",
  notes: "Notes",
  reoccurring: "Reoccurring",

  // Payment fields
  paymentDate: "Payment Date",
  accountNameFrom: "From Account",
  accountNameTo: "To Account",
  transactionId: "Transaction ID",

  // Transfer fields
  transferDate: "Transfer Date",
  source: "Source Account",
  destination: "Destination Account",

  // Account fields
  accountName: "Account Name",
  activeStatus: "Active Status",
  moniker: "Moniker",
  totals: "Totals",
  totalsBalanced: "Totals Balanced",
  dateClosed: "Date Closed",
  dateUpdated: "Date Updated",
  dateAdded: "Date Added",

  // User fields
  username: "Username",
  password: "Password",
  firstName: "First Name",
  lastName: "Last Name",

  // Common fields
  guid: "ID",
  amount: "Amount",
  description: "Description",
  category: "Category",

  // Medical expense fields
  serviceDate: "Service Date",
  billedAmount: "Billed Amount",
  insuranceDiscount: "Insurance Discount",
  insurancePaid: "Insurance Paid",
  patientResponsibility: "Patient Responsibility",
  familyMemberId: "Family Member",

  // Validation fields
  validationDate: "Validation Date",
  validationAmount: "Validation Amount",
};

/**
 * Converts camelCase field name to human-readable label
 */
export function formatFieldName(fieldName: string): string {
  // Check if we have a predefined label
  if (FIELD_LABELS[fieldName]) {
    return FIELD_LABELS[fieldName];
  }

  // Fall back to converting camelCase to Title Case
  return fieldName
    .replace(/([A-Z])/g, " $1") // Insert space before capital letters
    .replace(/^./, (str) => str.toUpperCase()) // Capitalize first letter
    .trim();
}

/**
 * Groups validation errors by field
 */
export function groupErrorsByField(
  errors: ValidationError[],
): Map<string, ValidationError[]> {
  const grouped = new Map<string, ValidationError[]>();

  for (const error of errors) {
    const field = error.field;
    if (!grouped.has(field)) {
      grouped.set(field, []);
    }
    grouped.get(field)!.push(error);
  }

  return grouped;
}

/**
 * Extracts error message for a specific field
 */
export function getFieldError(
  errors: ValidationError[],
  fieldName: string,
): string | undefined {
  const error = errors.find((e) => e.field === fieldName);
  return error?.message;
}

/**
 * Extracts all errors for a specific field
 */
export function getFieldErrors(
  errors: ValidationError[],
  fieldName: string,
): ValidationError[] {
  return errors.filter((e) => e.field === fieldName);
}

/**
 * Checks if a specific field has errors
 */
export function hasFieldError(
  errors: ValidationError[],
  fieldName: string,
): boolean {
  return errors.some((e) => e.field === fieldName);
}

/**
 * Creates a Record object for easy form field integration
 * Maps field names to their first error message
 */
export function createFieldErrorMap(
  errors: ValidationError[],
): Record<string, string> {
  const errorMap: Record<string, string> = {};

  for (const error of errors) {
    // Only store the first error for each field to avoid duplication
    if (!errorMap[error.field]) {
      errorMap[error.field] = error.message;
    }
  }

  return errorMap;
}

/**
 * Formats validation errors into a user-friendly bulleted list
 */
export function formatValidationErrors(errors: ValidationError[]): string {
  if (errors.length === 0) {
    return "Validation failed";
  }

  if (errors.length === 1) {
    const error = errors[0];
    const fieldLabel = formatFieldName(error.field);
    return `${fieldLabel}: ${error.message}`;
  }

  // Multiple errors - create a formatted list
  const grouped = groupErrorsByField(errors);
  const lines: string[] = [];

  for (const [field, fieldErrors] of grouped) {
    const fieldLabel = formatFieldName(field);

    if (fieldErrors.length === 1) {
      lines.push(`• ${fieldLabel}: ${fieldErrors[0].message}`);
    } else {
      // Multiple errors for the same field
      lines.push(`• ${fieldLabel}:`);
      for (const error of fieldErrors) {
        lines.push(`  - ${error.message}`);
      }
    }
  }

  return lines.join("\n");
}

/**
 * Creates a concise error summary suitable for Snackbar/Toast notifications
 * Limits to first 3 errors and indicates if there are more
 */
export function getErrorSummary(
  errors: ValidationError[],
  maxErrors: number = 3,
): string {
  if (errors.length === 0) {
    return "Validation failed";
  }

  if (errors.length === 1) {
    const error = errors[0];
    const fieldLabel = formatFieldName(error.field);
    return `${fieldLabel}: ${error.message}`;
  }

  // Show first N errors
  const displayErrors = errors.slice(0, maxErrors);
  const lines = displayErrors.map((error) => {
    const fieldLabel = formatFieldName(error.field);
    return `${fieldLabel}: ${error.message}`;
  });

  if (errors.length > maxErrors) {
    lines.push(`...and ${errors.length - maxErrors} more error(s)`);
  }

  return lines.join("\n");
}

/**
 * Formats a single validation error with field name
 */
export function formatSingleError(error: ValidationError): string {
  const fieldLabel = formatFieldName(error.field);
  return `${fieldLabel}: ${error.message}`;
}

/**
 * Extracts user-friendly error message from any error object
 * Handles ValidationError[], HookValidationError, FetchError, and standard Error
 */
export function getUserFriendlyErrorMessage(error: any): string {
  // Handle null/undefined
  if (!error) {
    return "An error occurred";
  }

  // Check if error has validationErrors array
  if (error.validationErrors && Array.isArray(error.validationErrors)) {
    return formatValidationErrors(error.validationErrors);
  }

  // Check if error is a validation error array directly
  if (Array.isArray(error) && error.length > 0 && error[0].field) {
    return formatValidationErrors(error);
  }

  // Fall back to error message
  if (error.message) {
    return error.message;
  }

  // Last resort
  return "An error occurred";
}

/**
 * Gets severity level for error display
 * Some validation errors are warnings (e.g., suspicious amounts)
 */
export function getErrorSeverity(
  error: ValidationError,
): "error" | "warning" | "info" {
  // Check error code for severity hints
  const warningCodes = [
    "SUSPICIOUS_AMOUNT",
    "UNUSUAL_DATE",
    "POTENTIAL_DUPLICATE",
  ];
  const infoCodes = ["OPTIMIZATION_SUGGESTION", "TIP"];

  if (error.code && warningCodes.includes(error.code)) {
    return "warning";
  }

  if (error.code && infoCodes.includes(error.code)) {
    return "info";
  }

  return "error";
}

/**
 * Checks if all errors are warnings (not blocking errors)
 */
export function areAllErrorsWarnings(errors: ValidationError[]): boolean {
  return errors.every((error) => getErrorSeverity(error) === "warning");
}

/**
 * Separates errors by severity
 */
export function separateErrorsBySeverity(errors: ValidationError[]): {
  errors: ValidationError[];
  warnings: ValidationError[];
  info: ValidationError[];
} {
  const result = {
    errors: [] as ValidationError[],
    warnings: [] as ValidationError[],
    info: [] as ValidationError[],
  };

  for (const error of errors) {
    const severity = getErrorSeverity(error);
    result[`${severity}s` as "errors" | "warnings" | "info"].push(error);
  }

  return result;
}

/**
 * Formats validation errors for developer console (with technical details)
 */
export function formatErrorsForConsole(errors: ValidationError[]): string {
  return errors
    .map((error) => {
      const parts = [`Field: ${error.field}`, `Message: ${error.message}`];

      if (error.code) {
        parts.push(`Code: ${error.code}`);
      }

      return parts.join(" | ");
    })
    .join("\n");
}

/**
 * Creates a detailed error report (for debugging or error logging)
 */
export function createErrorReport(errors: ValidationError[]): {
  summary: string;
  fieldCount: number;
  errorCount: number;
  fields: string[];
  errors: ValidationError[];
} {
  const grouped = groupErrorsByField(errors);

  return {
    summary: getErrorSummary(errors),
    fieldCount: grouped.size,
    errorCount: errors.length,
    fields: Array.from(grouped.keys()),
    errors: errors,
  };
}
