/**
 * Unit Tests for Error Formatting Utilities
 */

import {
  formatFieldName,
  groupErrorsByField,
  getFieldError,
  getFieldErrors,
  hasFieldError,
  createFieldErrorMap,
  formatValidationErrors,
  getErrorSummary,
  formatSingleError,
  getUserFriendlyErrorMessage,
  getErrorSeverity,
  areAllErrorsWarnings,
  separateErrorsBySeverity,
  formatErrorsForConsole,
  createErrorReport,
} from "../../utils/validation/errorFormatting";
import type { ValidationError } from "../../utils/validation/validator";

describe("Error Formatting Utilities", () => {
  // Sample validation errors for testing
  const sampleErrors: ValidationError[] = [
    {
      field: "transactionDate",
      message: "Date must be in YYYY-MM-DD format",
      code: "DATE_FORMAT_INVALID",
    },
    {
      field: "amount",
      message: "Amount must be a positive number",
      code: "INVALID_AMOUNT",
    },
    {
      field: "transactionDate",
      message: "Date cannot be more than 1 year in the past",
      code: "DATE_TOO_OLD",
    },
  ];

  const warningError: ValidationError = {
    field: "amount",
    message: "This amount looks suspicious",
    code: "SUSPICIOUS_AMOUNT",
  };

  describe("formatFieldName", () => {
    it("should format camelCase field names to Title Case", () => {
      expect(formatFieldName("transactionDate")).toBe("Transaction Date");
      expect(formatFieldName("accountNameOwner")).toBe("Account Name"); // Uses predefined label
      expect(formatFieldName("amount")).toBe("Amount");
    });

    it("should use predefined labels when available", () => {
      expect(formatFieldName("transactionDate")).toBe("Transaction Date");
      expect(formatFieldName("accountNameOwner")).toBe("Account Name");
    });

    it("should handle single-word fields", () => {
      expect(formatFieldName("description")).toBe("Description");
    });
  });

  describe("groupErrorsByField", () => {
    it("should group errors by field name", () => {
      const grouped = groupErrorsByField(sampleErrors);

      expect(grouped.size).toBe(2);
      expect(grouped.get("transactionDate")).toHaveLength(2);
      expect(grouped.get("amount")).toHaveLength(1);
    });

    it("should handle empty array", () => {
      const grouped = groupErrorsByField([]);
      expect(grouped.size).toBe(0);
    });
  });

  describe("getFieldError", () => {
    it("should get the first error for a field", () => {
      const error = getFieldError(sampleErrors, "transactionDate");
      expect(error).toBe("Date must be in YYYY-MM-DD format");
    });

    it("should return undefined if field has no error", () => {
      const error = getFieldError(sampleErrors, "description");
      expect(error).toBeUndefined();
    });
  });

  describe("getFieldErrors", () => {
    it("should get all errors for a field", () => {
      const errors = getFieldErrors(sampleErrors, "transactionDate");
      expect(errors).toHaveLength(2);
    });

    it("should return empty array if field has no errors", () => {
      const errors = getFieldErrors(sampleErrors, "description");
      expect(errors).toHaveLength(0);
    });
  });

  describe("hasFieldError", () => {
    it("should return true if field has error", () => {
      expect(hasFieldError(sampleErrors, "transactionDate")).toBe(true);
      expect(hasFieldError(sampleErrors, "amount")).toBe(true);
    });

    it("should return false if field has no error", () => {
      expect(hasFieldError(sampleErrors, "description")).toBe(false);
    });
  });

  describe("createFieldErrorMap", () => {
    it("should create a Record object from errors", () => {
      const errorMap = createFieldErrorMap(sampleErrors);

      expect(errorMap).toEqual({
        transactionDate: "Date must be in YYYY-MM-DD format",
        amount: "Amount must be a positive number",
      });
    });

    it("should only include first error for each field", () => {
      const errorMap = createFieldErrorMap(sampleErrors);

      // transactionDate has 2 errors but should only include the first
      expect(errorMap.transactionDate).toBe("Date must be in YYYY-MM-DD format");
    });

    it("should handle empty array", () => {
      const errorMap = createFieldErrorMap([]);
      expect(errorMap).toEqual({});
    });
  });

  describe("formatValidationErrors", () => {
    it("should format single error", () => {
      const formatted = formatValidationErrors([sampleErrors[1]]);
      expect(formatted).toBe("Amount: Amount must be a positive number");
    });

    it("should format multiple errors as bulleted list", () => {
      const formatted = formatValidationErrors(sampleErrors);

      expect(formatted).toContain("• Transaction Date:");
      expect(formatted).toContain("• Amount:");
      expect(formatted).toContain("Date must be in YYYY-MM-DD format");
    });

    it("should group multiple errors for same field", () => {
      const formatted = formatValidationErrors(sampleErrors);

      // Should show both errors for transactionDate
      expect(formatted).toContain("Date must be in YYYY-MM-DD format");
      expect(formatted).toContain("Date cannot be more than 1 year in the past");
    });

    it("should handle empty array", () => {
      const formatted = formatValidationErrors([]);
      expect(formatted).toBe("Validation failed");
    });
  });

  describe("getErrorSummary", () => {
    it("should limit to maxErrors", () => {
      const summary = getErrorSummary(sampleErrors, 2);

      // Should show first 2 errors
      expect(summary).toContain("Transaction Date:");
      expect(summary).toContain("Amount:");
      expect(summary).toContain("...and 1 more error(s)");
    });

    it("should show all errors if under limit", () => {
      const summary = getErrorSummary(sampleErrors, 5);

      expect(summary).not.toContain("more error");
    });

    it("should handle single error", () => {
      const summary = getErrorSummary([sampleErrors[0]]);
      expect(summary).toBe("Transaction Date: Date must be in YYYY-MM-DD format");
    });
  });

  describe("formatSingleError", () => {
    it("should format error with field label", () => {
      const formatted = formatSingleError(sampleErrors[0]);
      expect(formatted).toBe("Transaction Date: Date must be in YYYY-MM-DD format");
    });
  });

  describe("getUserFriendlyErrorMessage", () => {
    it("should format HookValidationError", () => {
      const error = {
        validationErrors: [sampleErrors[0]],
      };

      const message = getUserFriendlyErrorMessage(error);
      expect(message).toContain("Transaction Date:");
    });

    it("should handle array of validation errors", () => {
      const message = getUserFriendlyErrorMessage(sampleErrors);
      expect(message).toContain("Transaction Date:");
    });

    it("should handle regular Error object", () => {
      const error = new Error("Something went wrong");
      const message = getUserFriendlyErrorMessage(error);
      expect(message).toBe("Something went wrong");
    });

    it("should return fallback for unknown error", () => {
      const message = getUserFriendlyErrorMessage(null);
      expect(message).toBe("An error occurred");
    });
  });

  describe("getErrorSeverity", () => {
    it("should detect error severity", () => {
      expect(getErrorSeverity(sampleErrors[0])).toBe("error");
    });

    it("should detect warning codes", () => {
      expect(getErrorSeverity(warningError)).toBe("warning");
    });

    it("should default to error for unknown codes", () => {
      const error: ValidationError = {
        field: "test",
        message: "Test error",
        code: "UNKNOWN_CODE",
      };
      expect(getErrorSeverity(error)).toBe("error");
    });
  });

  describe("areAllErrorsWarnings", () => {
    it("should return false if any error is not a warning", () => {
      expect(areAllErrorsWarnings(sampleErrors)).toBe(false);
    });

    it("should return true if all errors are warnings", () => {
      expect(areAllErrorsWarnings([warningError])).toBe(true);
    });
  });

  describe("separateErrorsBySeverity", () => {
    it("should separate errors by severity", () => {
      const allErrors = [...sampleErrors, warningError];
      const separated = separateErrorsBySeverity(allErrors);

      expect(separated.errors.length).toBe(3);
      expect(separated.warnings.length).toBe(1);
      expect(separated.info.length).toBe(0);
    });
  });

  describe("formatErrorsForConsole", () => {
    it("should format errors for console logging", () => {
      const formatted = formatErrorsForConsole(sampleErrors);

      expect(formatted).toContain("Field: transactionDate");
      expect(formatted).toContain("Message: Date must be in YYYY-MM-DD format");
      expect(formatted).toContain("Code: DATE_FORMAT_INVALID");
    });
  });

  describe("createErrorReport", () => {
    it("should create comprehensive error report", () => {
      const report = createErrorReport(sampleErrors);

      expect(report.summary).toContain("Transaction Date:");
      expect(report.fieldCount).toBe(2);
      expect(report.errorCount).toBe(3);
      expect(report.fields).toEqual(["transactionDate", "amount"]);
      expect(report.errors).toEqual(sampleErrors);
    });

    it("should handle empty errors", () => {
      const report = createErrorReport([]);

      expect(report.fieldCount).toBe(0);
      expect(report.errorCount).toBe(0);
      expect(report.fields).toEqual([]);
    });
  });
});
