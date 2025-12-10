/**
 * Application Error Types and Utilities
 *
 * This module provides a centralized error handling system with type guards
 * and conversion utilities to replace 'any' types in error handling.
 */

/**
 * Custom application error class with structured error information
 */
export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode?: number,
    public readonly field?: string
  ) {
    super(message);
    this.name = 'AppError';
    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }
}

/**
 * Structured error result for consistent error handling
 */
export interface ErrorResult {
  message: string;
  code: string;
  field?: string;
  statusCode?: number;
}

/**
 * Type guard to check if an unknown value is an AppError
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/**
 * Type guard to check if an unknown value is a standard Error
 */
export function isError(error: unknown): error is Error {
  return error instanceof Error;
}

/**
 * Type guard to check if an unknown value has a message property
 */
export function hasMessage(error: unknown): error is { message: string } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as { message: unknown }).message === 'string'
  );
}

/**
 * Convert an unknown error to a structured ErrorResult
 * This is the primary utility for replacing 'catch (error: any)' patterns
 *
 * @example
 * ```typescript
 * try {
 *   // risky operation
 * } catch (error: unknown) {
 *   const errorResult = toErrorResult(error);
 *   console.error(errorResult.message);
 *   setMessage(errorResult.message);
 * }
 * ```
 */
export function toErrorResult(error: unknown): ErrorResult {
  // Handle AppError instances
  if (isAppError(error)) {
    return {
      message: error.message,
      code: error.code,
      field: error.field,
      statusCode: error.statusCode,
    };
  }

  // Handle standard Error instances
  if (isError(error)) {
    return {
      message: error.message,
      code: 'ERROR',
    };
  }

  // Handle objects with message property
  if (hasMessage(error)) {
    return {
      message: error.message,
      code: 'UNKNOWN_ERROR',
    };
  }

  // Handle all other cases (strings, numbers, null, etc.)
  return {
    message: String(error),
    code: 'UNKNOWN_ERROR',
  };
}

/**
 * Extract error message from unknown error type
 * Convenience function for cases where only the message is needed
 */
export function getErrorMessage(error: unknown): string {
  return toErrorResult(error).message;
}
