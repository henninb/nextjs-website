import {
  UserSchema,
  AccountSchema,
  TransactionSchema,
  PaymentSchema,
  TransferSchema,
  validateSchema,
  ValidationError,
  FINANCIAL_LIMITS,
} from "./schemas";
import { sanitize, SecurityLogger } from "./sanitization";
import { toErrorResult, ValidationResult, ValidatedData } from "../../types";
import User from "../../model/User";
import Account from "../../model/Account";
import Transaction from "../../model/Transaction";
import Payment from "../../model/Payment";
import Transfer from "../../model/Transfer";
import Category from "../../model/Category";
import Description from "../../model/Description";

// Re-export ValidationError for external use
export type { ValidationError };

/**
 * Comprehensive validation utility that combines sanitization and schema validation
 */
export class DataValidator {
  /**
   * Validate and sanitize user data
   */
  static validateUser(data: unknown): ValidationResult<User> {
    try {
      // First sanitize the input
      const sanitizedData = sanitize.user(data);

      // Then validate with schema
      const result = validateSchema(UserSchema, sanitizedData);

      if (!result.success) {
        SecurityLogger.logValidationFailure(result.errors || [], data);
      }

      return result as ValidationResult<User>;
    } catch (error: unknown) {
      const errorResult = toErrorResult(error);
      return {
        success: false,
        errors: [
          {
            field: "validation",
            message: errorResult.message,
            code: errorResult.code,
          },
        ],
      };
    }
  }

  /**
   * Validate and sanitize account data
   */
  static validateAccount(data: unknown): ValidationResult<Account> {
    try {
      const sanitizedData = sanitize.account(data);
      const result = validateSchema(AccountSchema, sanitizedData);

      if (!result.success) {
        SecurityLogger.logValidationFailure(result.errors || [], data);
      }

      return result as ValidationResult<Account>;
    } catch (error: unknown) {
      const errorResult = toErrorResult(error);
      return {
        success: false,
        errors: [
          {
            field: "validation",
            message: errorResult.message,
            code: errorResult.code,
          },
        ],
      };
    }
  }

  /**
   * Validate and sanitize transaction data with enhanced financial checks
   */
  static validateTransaction(data: unknown): ValidationResult<Transaction> {
    try {
      const sanitizedData = sanitize.transaction(data);

      // Additional financial boundary checks
      const financialValidation = DataValidator.validateFinancialBoundaries({
        amount: sanitizedData.amount,
        transactionDate: sanitizedData.transactionDate,
      });

      if (!financialValidation.success) {
        return financialValidation;
      }

      const result = validateSchema(TransactionSchema, sanitizedData);

      if (!result.success) {
        SecurityLogger.logValidationFailure(result.errors || [], data);
      }

      return result as ValidationResult<Transaction>;
    } catch (error: unknown) {
      const errorResult = toErrorResult(error);
      return {
        success: false,
        errors: [
          {
            field: "validation",
            message: errorResult.message,
            code: errorResult.code,
          },
        ],
      };
    }
  }

  /**
   * Validate and sanitize payment data
   */
  static validatePayment(data: unknown): ValidationResult<Payment> {
    try {
      console.log(
        "[validator.ts] validatePayment INPUT:",
        JSON.stringify(data),
      );
      const sanitizedData = sanitize.payment(data);
      console.log(
        "[validator.ts] validatePayment SANITIZED:",
        JSON.stringify(sanitizedData),
      );

      // Additional checks for payments
      const financialValidation = DataValidator.validateFinancialBoundaries({
        amount: sanitizedData.amount,
        transactionDate: sanitizedData.transactionDate,
      });

      if (!financialValidation.success) {
        console.log(
          "[validator.ts] Payment financial validation FAILED:",
          JSON.stringify(financialValidation.errors),
        );
        return financialValidation;
      }

      // Ensure source and destination accounts are different
      if (sanitizedData.sourceAccount === sanitizedData.destinationAccount) {
        console.log("[validator.ts] Payment same account error");
        return {
          success: false,
          errors: [
            {
              field: "accounts",
              message: "Source and destination accounts must be different",
              code: "SAME_ACCOUNT_ERROR",
            },
          ],
        };
      }

      const result = validateSchema(PaymentSchema, sanitizedData);
      console.log(
        "[validator.ts] Payment schema validation result:",
        JSON.stringify({
          success: result.success,
          errors: result.errors,
          data: result.data,
        }),
      );

      if (!result.success) {
        SecurityLogger.logValidationFailure(result.errors || [], data);
      }

      return result as ValidationResult<Payment>;
    } catch (error: unknown) {
      const errorResult = toErrorResult(error);
      console.error(
        "[validator.ts] validatePayment EXCEPTION:",
        errorResult.message,
      );
      return {
        success: false,
        errors: [
          {
            field: "validation",
            message: errorResult.message,
            code: errorResult.code,
          },
        ],
      };
    }
  }

  /**
   * Validate and sanitize transfer data
   */
  static validateTransfer(data: unknown): ValidationResult<Transfer> {
    try {
      console.log(
        "[validator.ts] validateTransfer INPUT:",
        JSON.stringify(data),
      );
      const sanitizedData = sanitize.transfer(data);
      console.log(
        "[validator.ts] validateTransfer SANITIZED:",
        JSON.stringify(sanitizedData),
      );

      // Additional checks for transfers
      const financialValidation = DataValidator.validateFinancialBoundaries({
        amount: sanitizedData.amount,
        transactionDate: sanitizedData.transactionDate,
      });

      if (!financialValidation.success) {
        console.log(
          "[validator.ts] Financial validation FAILED:",
          JSON.stringify(financialValidation.errors),
        );
        return financialValidation;
      }

      // Ensure source and destination accounts are different
      if (sanitizedData.sourceAccount === sanitizedData.destinationAccount) {
        console.log("[validator.ts] Same account error");
        return {
          success: false,
          errors: [
            {
              field: "accounts",
              message: "Source and destination accounts must be different",
              code: "SAME_ACCOUNT_ERROR",
            },
          ],
        };
      }

      const result = validateSchema(TransferSchema, sanitizedData);
      console.log(
        "[validator.ts] Schema validation result:",
        JSON.stringify({
          success: result.success,
          errors: result.errors,
          data: result.data,
        }),
      );

      if (!result.success) {
        SecurityLogger.logValidationFailure(result.errors || [], data);
      }

      return result as ValidationResult<Transfer>;
    } catch (error: unknown) {
      const errorResult = toErrorResult(error);
      console.error(
        "[validator.ts] validateTransfer EXCEPTION:",
        errorResult.message,
      );
      return {
        success: false,
        errors: [
          {
            field: "validation",
            message: errorResult.message,
            code: errorResult.code,
          },
        ],
      };
    }
  }

  /**
   * Validate and sanitize category data
   */
  static validateCategory(data: unknown): ValidationResult<Category> {
    try {
      const sanitizedData = sanitize.category(data);
      const { validateSchema } = require("./schemas");
      const { CategorySchema } = require("./schemas");
      const result = validateSchema(CategorySchema, sanitizedData);
      if (!result.success) {
        SecurityLogger.logValidationFailure(result.errors || [], data);
      }
      return result as ValidationResult<Category>;
    } catch (error: unknown) {
      const errorResult = toErrorResult(error);
      return {
        success: false,
        errors: [
          {
            field: "validation",
            message: errorResult.message,
            code: errorResult.code,
          },
        ],
      };
    }
  }

  /**
   * Validate and sanitize description data
   */
  static validateDescription(data: unknown): ValidationResult<Description> {
    try {
      const sanitizedData = sanitize.description(data);
      const { validateSchema } = require("./schemas");
      const { DescriptionSchema } = require("./schemas");
      const result = validateSchema(DescriptionSchema, sanitizedData);
      if (!result.success) {
        SecurityLogger.logValidationFailure(result.errors || [], data);
      }
      return result as ValidationResult<Description>;
    } catch (error: unknown) {
      const errorResult = toErrorResult(error);
      return {
        success: false,
        errors: [
          {
            field: "validation",
            message: errorResult.message,
            code: errorResult.code,
          },
        ],
      };
    }
  }

  /**
   * Enhanced financial boundary checks
   */
  static validateFinancialBoundaries(data: {
    amount: number;
    transactionDate: string | Date;
  }): {
    success: boolean;
    errors?: ValidationError[];
  } {
    const errors: ValidationError[] = [];

    // Amount checks - allow zero values, only check upper limit
    if (Math.abs(data.amount) > FINANCIAL_LIMITS.MAX_AMOUNT) {
      errors.push({
        field: "amount",
        message: `Amount exceeds maximum allowed limit of ${FINANCIAL_LIMITS.MAX_AMOUNT}`,
        code: "AMOUNT_TOO_LARGE",
      });
    }

    // Date checks
    const transactionDate = new Date(data.transactionDate);
    const now = new Date();
    const oneYearAgo = new Date(
      now.getFullYear() - 1,
      now.getMonth(),
      now.getDate(),
    );
    const oneYearFromNow = new Date(
      now.getFullYear() + 1,
      now.getMonth(),
      now.getDate(),
    );

    if (transactionDate < oneYearAgo) {
      errors.push({
        field: "transactionDate",
        message: "Transaction date cannot be more than one year in the past",
        code: "DATE_TOO_OLD",
      });
    }

    if (transactionDate > oneYearFromNow) {
      errors.push({
        field: "transactionDate",
        message: "Transaction date cannot be more than one year in the future",
        code: "DATE_TOO_FUTURE",
      });
    }

    // Suspicious amount patterns (potential fraud detection)
    // Disabled by default to reduce false positives on legitimate transactions
    // Uncomment if fraud detection is required:
    // if (DataValidator.isSuspiciousAmount(data.amount)) {
    //   errors.push({
    //     field: "amount",
    //     message: "Amount flagged for review due to suspicious pattern",
    //     code: "SUSPICIOUS_AMOUNT",
    //   });
    // }

    return {
      success: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  /**
   * Detect suspicious financial amounts (basic fraud detection)
   * Relaxed to reduce false positives on legitimate transactions
   */
  static isSuspiciousAmount(amount: number): boolean {
    const absAmount = Math.abs(amount);

    // Flag extremely large round numbers over $100,000
    if (absAmount >= 100000 && absAmount % 10000 === 0) {
      return true;
    }

    // Flag amounts very close to common reporting thresholds (within $1)
    // Only flag amounts extremely close to avoid false positives
    const suspiciousThresholds = [10000, 9999];
    if (
      suspiciousThresholds.some(
        (threshold) => absAmount >= threshold - 1 && absAmount <= threshold,
      )
    ) {
      return true;
    }

    // Flag very precise amounts over $100,000 that might be calculated to avoid detection
    const decimalPlaces = (absAmount.toString().split(".")[1] || "").length;
    if (absAmount > 100000 && decimalPlaces > 2) {
      return true;
    }

    return false;
  }

  /**
   * Validate array of financial data
   */
  static validateFinancialArray<T, R>(
    data: T[],
    validator: (item: T) => ValidationResult<R>,
  ): {
    success: boolean;
    validItems: R[];
    errors: Array<{ index: number; errors: ValidationError[] }>;
  } {
    const validItems: R[] = [];
    const errors: Array<{ index: number; errors: ValidationError[] }> = [];

    data.forEach((item, index) => {
      const result = validator(item);

      if (result.success && result.data) {
        validItems.push(result.data);
      } else if (result.errors) {
        errors.push({ index, errors: result.errors });
      }
    });

    return {
      success: errors.length === 0,
      validItems,
      errors,
    };
  }

  /**
   * Rate limiting validation (basic)
   */
  static validateRateLimit(identifier: string, action: string): boolean {
    // This is a basic implementation - in production, use Redis or similar
    const key = `${identifier}:${action}`;
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute window
    const maxAttempts = 10;

    if (typeof window !== "undefined") {
      // Client-side rate limiting (basic)
      const stored = localStorage.getItem(`rateLimit:${key}`);
      if (stored) {
        const { count, timestamp } = JSON.parse(stored);

        if (now - timestamp < windowMs) {
          if (count >= maxAttempts) {
            return false;
          }
          localStorage.setItem(
            `rateLimit:${key}`,
            JSON.stringify({
              count: count + 1,
              timestamp,
            }),
          );
        } else {
          localStorage.setItem(
            `rateLimit:${key}`,
            JSON.stringify({
              count: 1,
              timestamp: now,
            }),
          );
        }
      } else {
        localStorage.setItem(
          `rateLimit:${key}`,
          JSON.stringify({
            count: 1,
            timestamp: now,
          }),
        );
      }
    }

    return true;
  }
}

/**
 * Hook-specific validation helpers
 */
export const hookValidators = {
  /**
   * Validate data before API calls in hooks
   */
  validateApiPayload<T, R>(
    data: T,
    validator: (item: T) => ValidationResult<R>,
    hookName: string,
  ): { isValid: boolean; validatedData?: R; errors?: ValidationError[] } {
    // Rate limiting check
    if (!DataValidator.validateRateLimit("user", hookName)) {
      return {
        isValid: false,
        errors: [
          {
            field: "rateLimit",
            message: "Too many requests. Please wait before trying again.",
            code: "RATE_LIMIT_EXCEEDED",
          },
        ],
      };
    }

    const result = validator(data);

    return {
      isValid: result.success,
      validatedData: result.data,
      errors: result.errors,
    };
  },
};
