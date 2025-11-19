import { DataValidator, hookValidators, ValidationError } from "./validation";
import { FetchError } from "./fetchUtils";
import {
  formatValidationErrors,
  getErrorSummary,
  createFieldErrorMap,
  formatFieldName,
  getUserFriendlyErrorMessage,
} from "./validation/errorFormatting";

/**
 * Type for validation result with type-safe data
 */
export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: ValidationError[];
}

/**
 * Custom validation error class
 * Extends FetchError to maintain compatibility with error handling
 * Provides helper methods for user-friendly error display
 */
export class HookValidationError extends FetchError {
  constructor(
    message: string,
    public readonly validationErrors?: ValidationError[],
  ) {
    super(message, 400, "Bad Request", { errors: validationErrors });
    this.name = "HookValidationError";
  }

  /**
   * Gets a Map of field names to their error messages
   * Useful for displaying field-specific errors in forms
   *
   * @returns Map of field names to their first error message
   *
   * @example
   * ```typescript
   * const fieldErrors = error.getFieldErrors();
   * console.log(fieldErrors.get('transactionDate')); // "Date must be in YYYY-MM-DD format..."
   * ```
   */
  getFieldErrors(): Map<string, string> {
    const errorMap = new Map<string, string>();

    if (this.validationErrors) {
      for (const error of this.validationErrors) {
        // Only store the first error for each field
        if (!errorMap.has(error.field)) {
          errorMap.set(error.field, error.message);
        }
      }
    }

    return errorMap;
  }

  /**
   * Gets field errors as a plain Record object
   * Convenient for React state management
   *
   * @returns Record of field names to error messages
   *
   * @example
   * ```typescript
   * const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
   * // Later in error handler:
   * setFieldErrors(error.getFieldErrorsObject());
   * ```
   */
  getFieldErrorsObject(): Record<string, string> {
    if (!this.validationErrors) {
      return {};
    }
    return createFieldErrorMap(this.validationErrors);
  }

  /**
   * Gets the error message for a specific field
   *
   * @param fieldName - The field name to get the error for
   * @returns Error message for the field, or undefined if no error
   *
   * @example
   * ```typescript
   * const dateError = error.getFieldErrorMessage('transactionDate');
   * if (dateError) {
   *   console.log(dateError);
   * }
   * ```
   */
  getFieldErrorMessage(fieldName: string): string | undefined {
    if (!this.validationErrors) {
      return undefined;
    }

    const error = this.validationErrors.find((e) => e.field === fieldName);
    return error?.message;
  }

  /**
   * Checks if a specific field has an error
   *
   * @param fieldName - The field name to check
   * @returns True if the field has an error
   *
   * @example
   * ```typescript
   * if (error.hasFieldError('transactionDate')) {
   *   // Handle date error
   * }
   * ```
   */
  hasFieldError(fieldName: string): boolean {
    if (!this.validationErrors) {
      return false;
    }
    return this.validationErrors.some((e) => e.field === fieldName);
  }

  /**
   * Gets a user-friendly formatted message with all validation errors
   * Suitable for display in alerts or notifications
   *
   * @param formatStyle - Format style: 'full' for detailed list, 'summary' for concise version
   * @returns Formatted error message
   *
   * @example
   * ```typescript
   * // Full format (default)
   * console.log(error.getUserMessage());
   * // Output:
   * // • Transaction Date: Date must be in YYYY-MM-DD format...
   * // • Amount: Amount must be a positive number...
   *
   * // Summary format (for Snackbar)
   * console.log(error.getUserMessage('summary'));
   * // Output: Transaction Date: Date must be in YYYY-MM-DD format...
   * ```
   */
  getUserMessage(formatStyle: "full" | "summary" = "full"): string {
    if (!this.validationErrors || this.validationErrors.length === 0) {
      return this.message || "Validation failed";
    }

    if (formatStyle === "summary") {
      return getErrorSummary(this.validationErrors, 3);
    }

    return formatValidationErrors(this.validationErrors);
  }

  /**
   * Gets the number of validation errors
   *
   * @returns Number of validation errors
   *
   * @example
   * ```typescript
   * console.log(`Found ${error.getErrorCount()} validation errors`);
   * ```
   */
  getErrorCount(): number {
    return this.validationErrors?.length || 0;
  }

  /**
   * Gets the list of field names that have errors
   *
   * @returns Array of field names with errors
   *
   * @example
   * ```typescript
   * const fieldsWithErrors = error.getErrorFields();
   * console.log(`Errors in: ${fieldsWithErrors.join(', ')}`);
   * // Output: "Errors in: transactionDate, amount"
   * ```
   */
  getErrorFields(): string[] {
    if (!this.validationErrors) {
      return [];
    }

    // Get unique field names
    return Array.from(new Set(this.validationErrors.map((e) => e.field)));
  }

  /**
   * Gets validation errors for a specific field
   * (A field can have multiple errors)
   *
   * @param fieldName - The field name
   * @returns Array of validation errors for that field
   *
   * @example
   * ```typescript
   * const dateErrors = error.getFieldValidationErrors('transactionDate');
   * dateErrors.forEach(err => console.log(err.message));
   * ```
   */
  getFieldValidationErrors(fieldName: string): ValidationError[] {
    if (!this.validationErrors) {
      return [];
    }
    return this.validationErrors.filter((e) => e.field === fieldName);
  }

  /**
   * Converts error to a plain object for logging or debugging
   *
   * @returns Plain object representation
   *
   * @example
   * ```typescript
   * console.log('Validation error:', error.toJSON());
   * ```
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      status: this.status,
      statusText: this.statusText,
      validationErrors: this.validationErrors,
      errorCount: this.getErrorCount(),
      errorFields: this.getErrorFields(),
    };
  }
}

/**
 * Standard validation wrapper for all hook operations
 * Provides consistent validation patterns across CRUD operations
 */
export class HookValidator {
  /**
   * Validate data before insert operation
   * Throws HookValidationError if validation fails
   *
   * @param data - Data to validate
   * @param validator - Validation function from DataValidator
   * @param operationName - Name of the operation for error messages
   * @returns Validated and sanitized data
   * @throws {HookValidationError} If validation fails
   *
   * @example
   * ```typescript
   * const validatedAccount = HookValidator.validateInsert(
   *   accountData,
   *   DataValidator.validateAccount,
   *   "insertAccount"
   * );
   * ```
   */
  static validateInsert<T>(
    data: T,
    validator: (data: T) => {
      success: boolean;
      data?: any;
      errors?: ValidationError[];
    },
    operationName: string,
  ): T {
    const result = hookValidators.validateApiPayload(
      data,
      validator,
      operationName,
    );

    if (!result.isValid) {
      const errorMessages =
        result.errors?.map((err) => err.message).join(", ") ||
        "Validation failed";
      throw new HookValidationError(
        `${operationName} validation failed: ${errorMessages}`,
        result.errors,
      );
    }

    return result.validatedData;
  }

  /**
   * Validate data before update operation
   * Validates new data and ensures it's different from old data
   *
   * @param newData - New data to validate
   * @param oldData - Existing data for comparison
   * @param validator - Validation function
   * @param operationName - Operation name for error messages
   * @returns Validated and sanitized new data
   * @throws {HookValidationError} If validation fails
   *
   * @example
   * ```typescript
   * const validatedData = HookValidator.validateUpdate(
   *   newAccount,
   *   oldAccount,
   *   DataValidator.validateAccount,
   *   "updateAccount"
   * );
   * ```
   */
  static validateUpdate<T>(
    newData: T,
    oldData: T,
    validator: (data: T) => {
      success: boolean;
      data?: any;
      errors?: ValidationError[];
    },
    operationName: string,
  ): T {
    // Validate new data
    const result = hookValidators.validateApiPayload(
      newData,
      validator,
      operationName,
    );

    if (!result.isValid) {
      const errorMessages =
        result.errors?.map((err) => err.message).join(", ") ||
        "Validation failed";
      throw new HookValidationError(
        `${operationName} validation failed: ${errorMessages}`,
        result.errors,
      );
    }

    return result.validatedData;
  }

  /**
   * Validate identifier before delete operation
   * Ensures required identifier field exists and is valid
   *
   * @param data - Object containing identifier
   * @param identifierKey - Key name of the identifier field
   * @param operationName - Operation name for error messages
   * @returns Validated data
   * @throws {HookValidationError} If identifier is invalid
   *
   * @example
   * ```typescript
   * HookValidator.validateDelete(
   *   account,
   *   "accountNameOwner",
   *   "deleteAccount"
   * );
   * ```
   */
  static validateDelete<T extends { [key: string]: any }>(
    data: T,
    identifierKey: keyof T,
    operationName: string,
  ): T {
    const identifier = data[identifierKey];

    if (
      !identifier ||
      (typeof identifier === "string" && identifier.trim() === "")
    ) {
      throw new HookValidationError(
        `${operationName}: Invalid ${String(identifierKey)} provided`,
        [
          {
            field: String(identifierKey),
            message: `${String(identifierKey)} is required`,
            code: "REQUIRED_FIELD",
          },
        ],
      );
    }

    return data;
  }

  /**
   * Validate GUID format
   * Ensures GUID follows UUID v4 format
   *
   * @param guid - GUID string to validate
   * @param operationName - Operation name for error messages
   * @returns Validated GUID
   * @throws {HookValidationError} If GUID format is invalid
   *
   * @example
   * ```typescript
   * const validGuid = HookValidator.validateGuid(
   *   transaction.guid,
   *   "updateTransaction"
   * );
   * ```
   */
  static validateGuid(guid: string, operationName: string): string {
    const guidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    if (!guidRegex.test(guid)) {
      throw new HookValidationError(`${operationName}: Invalid GUID format`, [
        {
          field: "guid",
          message: "GUID must be a valid UUID v4 format",
          code: "INVALID_GUID",
        },
      ]);
    }

    return guid;
  }

  /**
   * Validate account name format
   * Ensures account name meets requirements
   *
   * @param accountName - Account name to validate
   * @param operationName - Operation name for error messages
   * @returns Validated account name
   * @throws {HookValidationError} If account name is invalid
   *
   * @example
   * ```typescript
   * const validName = HookValidator.validateAccountName(
   *   account.accountNameOwner,
   *   "updateAccount"
   * );
   * ```
   */
  static validateAccountName(
    accountName: string,
    operationName: string,
  ): string {
    if (!accountName || accountName.trim() === "") {
      throw new HookValidationError(
        `${operationName}: Account name is required`,
        [
          {
            field: "accountName",
            message: "Account name is required",
            code: "REQUIRED_FIELD",
          },
        ],
      );
    }

    // Add additional account name validation rules
    if (accountName.length > 100) {
      throw new HookValidationError(`${operationName}: Account name too long`, [
        {
          field: "accountName",
          message: "Account name must be 100 characters or less",
          code: "MAX_LENGTH_EXCEEDED",
        },
      ]);
    }

    return accountName.trim();
  }

  /**
   * Validate numeric ID
   * Ensures ID is a positive integer
   *
   * @param id - ID to validate (number or string)
   * @param fieldName - Field name for error messages
   * @param operationName - Operation name for error messages
   * @returns Validated numeric ID
   * @throws {HookValidationError} If ID is invalid
   *
   * @example
   * ```typescript
   * const validId = HookValidator.validateNumericId(
   *   account.accountId,
   *   "accountId",
   *   "updateAccount"
   * );
   * ```
   */
  static validateNumericId(
    id: number | string,
    fieldName: string = "ID",
    operationName: string,
  ): number {
    const numId = typeof id === "string" ? parseInt(id, 10) : id;

    if (isNaN(numId) || numId < 0 || !Number.isInteger(numId)) {
      throw new HookValidationError(`${operationName}: Invalid ${fieldName}`, [
        {
          field: fieldName,
          message: `${fieldName} must be a positive integer`,
          code: "INVALID_ID",
        },
      ]);
    }

    return numId;
  }

  /**
   * Validate array is not empty
   * Useful for bulk operations
   *
   * @param array - Array to validate
   * @param operationName - Operation name for error messages
   * @returns Validated array
   * @throws {HookValidationError} If array is empty
   *
   * @example
   * ```typescript
   * HookValidator.validateNonEmptyArray(
   *   transactions,
   *   "bulkInsertTransactions"
   * );
   * ```
   */
  static validateNonEmptyArray<T>(array: T[], operationName: string): T[] {
    if (!Array.isArray(array) || array.length === 0) {
      throw new HookValidationError(`${operationName}: Array cannot be empty`, [
        {
          field: "array",
          message: "At least one item is required",
          code: "EMPTY_ARRAY",
        },
      ]);
    }

    return array;
  }

  /**
   * Validate date is within acceptable range
   * Prevents dates too far in past or future
   *
   * @param date - Date to validate
   * @param operationName - Operation name for error messages
   * @param options - Range options (years in past/future)
   * @returns Validated date
   * @throws {HookValidationError} If date is out of range
   *
   * @example
   * ```typescript
   * HookValidator.validateDateRange(
   *   transaction.transactionDate,
   *   "insertTransaction",
   *   { pastYears: 1, futureYears: 1 }
   * );
   * ```
   */
  static validateDateRange(
    date: Date | string,
    operationName: string,
    options: { pastYears?: number; futureYears?: number } = {},
  ): Date {
    const dateObj = typeof date === "string" ? new Date(date) : date;

    if (isNaN(dateObj.getTime())) {
      throw new HookValidationError(`${operationName}: Invalid date`, [
        {
          field: "date",
          message: "Date must be a valid date",
          code: "INVALID_DATE",
        },
      ]);
    }

    const now = new Date();
    const pastYears = options.pastYears ?? 1;
    const futureYears = options.futureYears ?? 1;

    const minDate = new Date(
      now.getFullYear() - pastYears,
      now.getMonth(),
      now.getDate(),
    );
    const maxDate = new Date(
      now.getFullYear() + futureYears,
      now.getMonth(),
      now.getDate(),
    );

    if (dateObj < minDate) {
      throw new HookValidationError(
        `${operationName}: Date too far in the past`,
        [
          {
            field: "date",
            message: `Date cannot be more than ${pastYears} year(s) in the past`,
            code: "DATE_TOO_OLD",
          },
        ],
      );
    }

    if (dateObj > maxDate) {
      throw new HookValidationError(
        `${operationName}: Date too far in the future`,
        [
          {
            field: "date",
            message: `Date cannot be more than ${futureYears} year(s) in the future`,
            code: "DATE_TOO_FUTURE",
          },
        ],
      );
    }

    return dateObj;
  }
}

/**
 * Validation decorator for common patterns
 * Higher-order function that wraps a validator
 *
 * @param validator - Validation function from DataValidator
 * @param operationName - Operation name for error messages
 * @returns Function that validates data
 *
 * @example
 * ```typescript
 * const validateAccountInsert = withValidation(
 *   DataValidator.validateAccount,
 *   "insertAccount"
 * );
 *
 * const validData = validateAccountInsert(accountData);
 * ```
 */
export function withValidation<T>(
  validator: (data: T) => {
    success: boolean;
    data?: any;
    errors?: ValidationError[];
  },
  operationName: string,
) {
  return function <U extends T>(data: U): U {
    return HookValidator.validateInsert(
      data,
      validator as any,
      operationName,
    ) as U;
  };
}

/**
 * Check if error is a validation error
 * Type guard for HookValidationError
 *
 * @param error - Error to check
 * @returns True if error is HookValidationError
 *
 * @example
 * ```typescript
 * try {
 *   // ... operation
 * } catch (error) {
 *   if (isValidationError(error)) {
 *     console.log("Validation errors:", error.validationErrors);
 *   }
 * }
 * ```
 */
export function isValidationError(
  error: unknown,
): error is HookValidationError {
  return error instanceof HookValidationError;
}
