/**
 * Date Validation Utilities
 *
 * Specialized date validators with clear error messages and format hints
 */

import type { ValidationError } from "./validator";

/**
 * Date format types supported by the application
 */
export type DateFormat = "YYYY-MM-DD" | "ISO" | "DATE_OBJECT";

/**
 * Date validation result
 */
export interface DateValidationResult {
  isValid: boolean;
  error?: ValidationError;
  parsedDate?: Date;
}

/**
 * Date boundary options for validation
 */
export interface DateBoundaryOptions {
  pastYears?: number;
  futureYears?: number;
  minDate?: Date;
  maxDate?: Date;
}

/**
 * Validates if a string matches YYYY-MM-DD format
 */
export function isValidYYYYMMDDFormat(dateString: string): boolean {
  const pattern = /^\d{4}-\d{2}-\d{2}$/;
  return pattern.test(dateString);
}

/**
 * Validates if a string matches ISO 8601 format
 */
export function isValidISOFormat(dateString: string): boolean {
  const pattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
  return pattern.test(dateString);
}

/**
 * Validates if a date string is parseable by JavaScript Date
 */
export function isParseable(dateValue: string | Date): boolean {
  try {
    const date = new Date(dateValue);
    return date instanceof Date && !isNaN(date.getTime());
  } catch {
    return false;
  }
}

/**
 * Validates date format with specific error messages
 */
export function validateDateFormat(
  dateValue: unknown,
  fieldName: string,
  expectedFormat: DateFormat = "YYYY-MM-DD",
): DateValidationResult {
  // Check if value exists
  if (dateValue === null || dateValue === undefined) {
    return {
      isValid: false,
      error: {
        field: fieldName,
        message: "Date is required",
        code: "DATE_REQUIRED",
      },
    };
  }

  // Check if it's empty string
  if (typeof dateValue === "string" && dateValue.trim() === "") {
    return {
      isValid: false,
      error: {
        field: fieldName,
        message: "Date cannot be empty",
        code: "DATE_EMPTY",
      },
    };
  }

  // Handle Date objects
  if (dateValue instanceof Date) {
    if (isNaN(dateValue.getTime())) {
      return {
        isValid: false,
        error: {
          field: fieldName,
          message: "Invalid date value",
          code: "DATE_INVALID",
        },
      };
    }
    return {
      isValid: true,
      parsedDate: dateValue,
    };
  }

  // Must be string at this point
  if (typeof dateValue !== "string") {
    return {
      isValid: false,
      error: {
        field: fieldName,
        message: "Date must be a string or Date object",
        code: "DATE_WRONG_TYPE",
      },
    };
  }

  const dateString = dateValue.trim();

  // Check format based on expected format
  if (expectedFormat === "YYYY-MM-DD") {
    if (!isValidYYYYMMDDFormat(dateString)) {
      // Provide specific feedback about what's wrong
      let hint = "";
      if (dateString.includes("T") || dateString.includes(":")) {
        hint = " (remove time component)";
      } else if (dateString.includes("/")) {
        hint = " (use hyphens, not slashes)";
      } else if (dateString.split("-").length !== 3) {
        hint = " (format should be YYYY-MM-DD)";
      }

      return {
        isValid: false,
        error: {
          field: fieldName,
          message: `Date must be in YYYY-MM-DD format without time${hint}. Example: 2025-01-15. You entered: ${dateString}`,
          code: "DATE_FORMAT_INVALID",
        },
      };
    }
  } else if (expectedFormat === "ISO") {
    if (!isValidISOFormat(dateString)) {
      return {
        isValid: false,
        error: {
          field: fieldName,
          message: `Date must be in ISO 8601 format. Example: 2025-01-15T10:30:00Z. You entered: ${dateString}`,
          code: "DATE_FORMAT_INVALID",
        },
      };
    }
  }

  // Verify the date is actually parseable
  if (!isParseable(dateString)) {
    return {
      isValid: false,
      error: {
        field: fieldName,
        message: `Date is not valid. Example: 2025-01-15. You entered: ${dateString}`,
        code: "DATE_NOT_PARSEABLE",
      },
    };
  }

  // Parse YYYY-MM-DD as local date to avoid timezone issues
  // new Date("2025-11-20") treats it as UTC, which shifts in negative offset timezones
  let parsedDate: Date;
  if (expectedFormat === "YYYY-MM-DD" && isValidYYYYMMDDFormat(dateString)) {
    const [year, month, day] = dateString.split("-").map(Number);
    parsedDate = new Date(year, month - 1, day); // month is 0-indexed
  } else {
    parsedDate = new Date(dateString);
  }

  return {
    isValid: true,
    parsedDate,
  };
}

/**
 * Validates if date is within specified boundaries
 */
export function validateDateBoundaries(
  date: Date,
  fieldName: string,
  options: DateBoundaryOptions = {},
): ValidationError | null {
  const now = new Date();
  now.setHours(0, 0, 0, 0); // Set to start of day for fair comparison

  const dateToCheck = new Date(date);
  dateToCheck.setHours(0, 0, 0, 0);

  // Check past years boundary
  if (options.pastYears !== undefined) {
    const minDate = new Date(now);
    minDate.setFullYear(now.getFullYear() - options.pastYears);

    if (dateToCheck < minDate) {
      return {
        field: fieldName,
        message: `Date cannot be more than ${options.pastYears} year${
          options.pastYears > 1 ? "s" : ""
        } in the past. Earliest allowed: ${minDate.toISOString().split("T")[0]}`,
        code: "DATE_TOO_OLD",
      };
    }
  }

  // Check future years boundary
  if (options.futureYears !== undefined) {
    const maxDate = new Date(now);
    maxDate.setFullYear(now.getFullYear() + options.futureYears);

    if (dateToCheck > maxDate) {
      return {
        field: fieldName,
        message: `Date cannot be more than ${options.futureYears} year${
          options.futureYears > 1 ? "s" : ""
        } in the future. Latest allowed: ${maxDate.toISOString().split("T")[0]}`,
        code: "DATE_TOO_FUTURE",
      };
    }
  }

  // Check custom min date
  if (options.minDate) {
    const minDate = new Date(options.minDate);
    minDate.setHours(0, 0, 0, 0);

    if (dateToCheck < minDate) {
      return {
        field: fieldName,
        message: `Date must be on or after ${minDate.toISOString().split("T")[0]}`,
        code: "DATE_BEFORE_MIN",
      };
    }
  }

  // Check custom max date
  if (options.maxDate) {
    const maxDate = new Date(options.maxDate);
    maxDate.setHours(0, 0, 0, 0);

    if (dateToCheck > maxDate) {
      return {
        field: fieldName,
        message: `Date must be on or before ${maxDate.toISOString().split("T")[0]}`,
        code: "DATE_AFTER_MAX",
      };
    }
  }

  return null;
}

/**
 * Complete date validation with format and boundary checks
 */
export function validateDate(
  dateValue: unknown,
  fieldName: string,
  expectedFormat: DateFormat = "YYYY-MM-DD",
  boundaryOptions?: DateBoundaryOptions,
): DateValidationResult {
  // First validate format
  const formatResult = validateDateFormat(dateValue, fieldName, expectedFormat);

  if (!formatResult.isValid || !formatResult.parsedDate) {
    return formatResult;
  }

  // Then validate boundaries if options provided
  if (boundaryOptions) {
    const boundaryError = validateDateBoundaries(
      formatResult.parsedDate,
      fieldName,
      boundaryOptions,
    );

    if (boundaryError) {
      return {
        isValid: false,
        error: boundaryError,
        parsedDate: formatResult.parsedDate,
      };
    }
  }

  return formatResult;
}

/**
 * Validates multiple dates and returns all errors
 */
export function validateDates(
  dates: Array<{
    value: unknown;
    fieldName: string;
    format?: DateFormat;
    boundaries?: DateBoundaryOptions;
  }>,
): ValidationError[] {
  const errors: ValidationError[] = [];

  for (const { value, fieldName, format, boundaries } of dates) {
    const result = validateDate(value, fieldName, format, boundaries);
    if (!result.isValid && result.error) {
      errors.push(result.error);
    }
  }

  return errors;
}

/**
 * Validates date range (start and end dates)
 */
export function validateDateRange(
  startDate: unknown,
  endDate: unknown,
  startFieldName: string = "startDate",
  endFieldName: string = "endDate",
  format: DateFormat = "YYYY-MM-DD",
): ValidationError[] {
  const errors: ValidationError[] = [];

  // Validate both dates individually
  const startResult = validateDateFormat(startDate, startFieldName, format);
  const endResult = validateDateFormat(endDate, endFieldName, format);

  if (!startResult.isValid && startResult.error) {
    errors.push(startResult.error);
  }

  if (!endResult.isValid && endResult.error) {
    errors.push(endResult.error);
  }

  // If both valid, check that start is before end
  if (
    startResult.isValid &&
    endResult.isValid &&
    startResult.parsedDate &&
    endResult.parsedDate
  ) {
    if (startResult.parsedDate > endResult.parsedDate) {
      errors.push({
        field: startFieldName,
        message: `Start date must be before end date`,
        code: "DATE_RANGE_INVALID",
      });
    }
  }

  return errors;
}

/**
 * Extracts date from various input formats and returns standardized format
 */
export function normalizeDate(
  dateValue: unknown,
  targetFormat: DateFormat,
): string | null {
  if (!dateValue) {
    return null;
  }

  let date: Date;

  if (dateValue instanceof Date) {
    date = dateValue;
  } else if (typeof dateValue === "string") {
    date = new Date(dateValue);
  } else {
    return null;
  }

  if (isNaN(date.getTime())) {
    return null;
  }

  if (targetFormat === "YYYY-MM-DD") {
    return date.toISOString().split("T")[0];
  } else if (targetFormat === "ISO") {
    return date.toISOString();
  }

  return null;
}

/**
 * Gets format hint message for a specific date format
 */
export function getDateFormatHint(format: DateFormat): string {
  switch (format) {
    case "YYYY-MM-DD":
      return "Use format YYYY-MM-DD (e.g., 2025-01-15)";
    case "ISO":
      return "Use ISO 8601 format (e.g., 2025-01-15T10:30:00Z)";
    case "DATE_OBJECT":
      return "Must be a valid Date object";
    default:
      return "Use a valid date format";
  }
}

/**
 * Detects the format of a date string
 */
export function detectDateFormat(dateString: string): DateFormat | null {
  if (isValidYYYYMMDDFormat(dateString)) {
    return "YYYY-MM-DD";
  }

  if (isValidISOFormat(dateString)) {
    return "ISO";
  }

  return null;
}

/**
 * Validates that date is not in the future (for historical records)
 */
export function validateDateNotFuture(
  dateValue: unknown,
  fieldName: string,
  format: DateFormat = "YYYY-MM-DD",
): DateValidationResult {
  const formatResult = validateDateFormat(dateValue, fieldName, format);

  if (!formatResult.isValid || !formatResult.parsedDate) {
    return formatResult;
  }

  // Normalize both dates to start of day in local timezone for fair comparison
  const dateToCheck = new Date(formatResult.parsedDate);
  dateToCheck.setHours(0, 0, 0, 0);

  const now = new Date();
  now.setHours(0, 0, 0, 0); // Start of today

  // Check if date is after today (tomorrow or later)
  if (dateToCheck > now) {
    return {
      isValid: false,
      error: {
        field: fieldName,
        message: "Date cannot be in the future",
        code: "DATE_IN_FUTURE",
      },
      parsedDate: formatResult.parsedDate,
    };
  }

  return formatResult;
}
