/**
 * Form Error Handling Utilities
 *
 * Reusable utilities for handling validation errors in form components
 * Provides consistent error display patterns across the application
 */

import { HookValidationError, isValidationError } from "./hookValidation";
import type { ValidationError } from "./validation/validator";

/**
 * Extracts field-specific errors from various error types
 * Returns a Record object suitable for form field error state
 *
 * @param error - Any error object (HookValidationError, FetchError, Error, etc.)
 * @returns Record of field names to error messages
 *
 * @example
 * ```typescript
 * try {
 *   await insertPayment({ payload: data });
 * } catch (error) {
 *   const fieldErrors = extractFormFieldErrors(error);
 *   setFieldErrors(fieldErrors);
 *   // fieldErrors = { transactionDate: "Date must be in YYYY-MM-DD format...", amount: "..." }
 * }
 * ```
 */
export function extractFormFieldErrors(error: any): Record<string, string> {
  // Check if it's a HookValidationError with validationErrors
  if (isValidationError(error)) {
    return error.getFieldErrorsObject();
  }

  // Check if error has validationErrors property
  if (error.validationErrors && Array.isArray(error.validationErrors)) {
    const fieldErrors: Record<string, string> = {};
    for (const validationError of error.validationErrors) {
      if (!fieldErrors[validationError.field]) {
        fieldErrors[validationError.field] = validationError.message;
      }
    }
    return fieldErrors;
  }

  // No field-specific errors found
  return {};
}

/**
 * Gets a user-friendly error message for display in Snackbar/Toast
 * Handles validation errors, network errors, and generic errors
 *
 * @param error - Any error object
 * @param fallbackMessage - Fallback message if error has no message
 * @returns User-friendly error message
 *
 * @example
 * ```typescript
 * try {
 *   await insertPayment({ payload: data });
 * } catch (error) {
 *   const message = getUserFriendlyErrorMessage(error, "Failed to add payment");
 *   setSnackbarMessage(message);
 *   setSnackbarSeverity("error");
 * }
 * ```
 */
export function getUserFriendlyErrorMessage(
  error: any,
  fallbackMessage: string = "An error occurred"
): string {
  // Check if it's a HookValidationError
  if (isValidationError(error)) {
    // Use summary format for Snackbar (concise)
    return error.getUserMessage("summary");
  }

  // Check if it's a regular error with message
  if (error?.message) {
    return error.message;
  }

  // Fallback
  return fallbackMessage;
}

/**
 * Determines if an error has field-specific validation errors
 *
 * @param error - Any error object
 * @returns True if error contains field-specific validation errors
 *
 * @example
 * ```typescript
 * if (hasFieldValidationErrors(error)) {
 *   // Show field-specific errors in form
 *   setFieldErrors(extractFormFieldErrors(error));
 * } else {
 *   // Show generic error message
 *   setSnackbarMessage(error.message);
 * }
 * ```
 */
export function hasFieldValidationErrors(error: any): boolean {
  if (isValidationError(error)) {
    return error.getErrorCount() > 0;
  }

  if (error.validationErrors && Array.isArray(error.validationErrors)) {
    return error.validationErrors.length > 0;
  }

  return false;
}

/**
 * Creates a comprehensive error handler for form submissions
 * Handles both field-specific errors and generic errors
 *
 * @param options - Configuration options
 * @returns Object with error state and handler functions
 *
 * @example
 * ```typescript
 * const {
 *   fieldErrors,
 *   setFieldErrors,
 *   clearFieldError,
 *   clearAllFieldErrors,
 *   handleFormError,
 * } = useFormErrorHandler({
 *   onError: (message) => {
 *     setSnackbarMessage(message);
 *     setSnackbarSeverity("error");
 *     setShowSnackbar(true);
 *   }
 * });
 *
 * try {
 *   await insertPayment({ payload: data });
 * } catch (error) {
 *   handleFormError(error, "Failed to add payment");
 * }
 * ```
 */
export function useFormErrorHandler(options?: {
  onError?: (message: string) => void;
}) {
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});

  const handleFormError = React.useCallback(
    (error: any, fallbackMessage?: string) => {
      // Extract field-specific errors
      const errors = extractFormFieldErrors(error);

      if (Object.keys(errors).length > 0) {
        // Set field errors for display in form
        setFieldErrors(errors);
      }

      // Get user-friendly message for Snackbar/Toast
      const message = getUserFriendlyErrorMessage(
        error,
        fallbackMessage || "An error occurred"
      );

      // Call onError callback if provided
      if (options?.onError) {
        options.onError(message);
      }
    },
    [options]
  );

  const clearFieldError = React.useCallback((field: string) => {
    setFieldErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  const clearAllFieldErrors = React.useCallback(() => {
    setFieldErrors({});
  }, []);

  return {
    fieldErrors,
    setFieldErrors,
    clearFieldError,
    clearAllFieldErrors,
    handleFormError,
  };
}

// React import is needed for hooks
import React from "react";

/**
 * Type guard to check if error is a validation error
 */
export function isFormValidationError(error: any): boolean {
  return hasFieldValidationErrors(error);
}

/**
 * Gets all validation errors as an array
 * Useful for displaying all errors in a list
 *
 * @param error - Any error object
 * @returns Array of validation errors
 *
 * @example
 * ```typescript
 * const validationErrors = getValidationErrorsArray(error);
 * if (validationErrors.length > 0) {
 *   return <ValidationErrorList errors={validationErrors} />;
 * }
 * ```
 */
export function getValidationErrorsArray(error: any): ValidationError[] {
  if (isValidationError(error)) {
    return error.validationErrors || [];
  }

  if (error.validationErrors && Array.isArray(error.validationErrors)) {
    return error.validationErrors;
  }

  return [];
}

/**
 * Formats field errors for display in a consistent way
 * Returns formatted error messages with field labels
 *
 * @param fieldErrors - Record of field errors
 * @returns Array of formatted error strings
 *
 * @example
 * ```typescript
 * const formatted = formatFieldErrorsForDisplay(fieldErrors);
 * // ["Transaction Date: Date must be in YYYY-MM-DD format", "Amount: Must be positive"]
 * ```
 */
export function formatFieldErrorsForDisplay(
  fieldErrors: Record<string, string>
): string[] {
  return Object.entries(fieldErrors).map(([field, message]) => {
    // Convert camelCase to Title Case
    const fieldLabel = field
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (str) => str.toUpperCase())
      .trim();

    return `${fieldLabel}: ${message}`;
  });
}

/**
 * Combines form validation errors with custom business logic errors
 * Useful when you have both client-side validation and server-side validation
 *
 * @param validationErrors - Field errors from validation
 * @param customErrors - Custom business logic errors
 * @returns Combined error object
 *
 * @example
 * ```typescript
 * const customErrors = {
 *   accounts: "Source and destination must be different"
 * };
 * const combinedErrors = combineFieldErrors(extractFormFieldErrors(error), customErrors);
 * setFieldErrors(combinedErrors);
 * ```
 */
export function combineFieldErrors(
  validationErrors: Record<string, string>,
  customErrors: Record<string, string>
): Record<string, string> {
  return {
    ...validationErrors,
    ...customErrors,
  };
}
