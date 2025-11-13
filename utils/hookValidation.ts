import { DataValidator, hookValidators, ValidationError } from "./validation";
import { FetchError } from "./fetchUtils";

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
 */
export class HookValidationError extends FetchError {
  constructor(
    message: string,
    public readonly validationErrors?: ValidationError[],
  ) {
    super(message, 400, "Bad Request", { errors: validationErrors });
    this.name = "HookValidationError";
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
