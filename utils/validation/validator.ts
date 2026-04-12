import {
  UserSchema,
  AccountSchema,
  TransactionSchema,
  PaymentSchema,
  TransferSchema,
  CategorySchema,
  DescriptionSchema,
  validateSchema,
  ValidationError,
  FINANCIAL_LIMITS,
} from "./schemas";
import { logger } from "../logger";
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
      const sanitizedData = sanitize.user(data as Record<string, unknown>);

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
      const sanitizedData = sanitize.account(data as Record<string, unknown>);
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
      const sanitizedData = sanitize.transaction(data as Record<string, unknown>);

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
      logger.debug("[validator.ts] validatePayment INPUT", { data });
      const sanitizedData = sanitize.payment(data as Record<string, unknown>);
      logger.debug("[validator.ts] validatePayment SANITIZED", { sanitizedData });

      // Additional checks for payments
      const financialValidation = DataValidator.validateFinancialBoundaries({
        amount: sanitizedData.amount,
        transactionDate: sanitizedData.transactionDate,
      });

      if (!financialValidation.success) {
        logger.debug("[validator.ts] Payment financial validation FAILED", { errors: financialValidation.errors });
        return financialValidation;
      }

      // Ensure source and destination accounts are different
      if (sanitizedData.sourceAccount === sanitizedData.destinationAccount) {
        logger.debug("[validator.ts] Payment same account error");
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
      logger.debug("[validator.ts] Payment schema validation result", {
        success: result.success,
        errors: result.errors,
      });

      if (!result.success) {
        SecurityLogger.logValidationFailure(result.errors || [], data);
      }

      return result as ValidationResult<Payment>;
    } catch (error: unknown) {
      const errorResult = toErrorResult(error);
      logger.error("[validator.ts] validatePayment EXCEPTION", error);
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
      logger.debug("[validator.ts] validateTransfer INPUT", { data });
      const sanitizedData = sanitize.transfer(data as Record<string, unknown>);
      logger.debug("[validator.ts] validateTransfer SANITIZED", { sanitizedData });

      // Additional checks for transfers
      const financialValidation = DataValidator.validateFinancialBoundaries({
        amount: sanitizedData.amount,
        transactionDate: sanitizedData.transactionDate,
      });

      if (!financialValidation.success) {
        logger.debug("[validator.ts] Transfer financial validation FAILED", { errors: financialValidation.errors });
        return financialValidation;
      }

      // Ensure source and destination accounts are different
      if (sanitizedData.sourceAccount === sanitizedData.destinationAccount) {
        logger.debug("[validator.ts] Transfer same account error");
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
      logger.debug("[validator.ts] Transfer schema validation result", {
        success: result.success,
        errors: result.errors,
      });

      if (!result.success) {
        SecurityLogger.logValidationFailure(result.errors || [], data);
      }

      return result as ValidationResult<Transfer>;
    } catch (error: unknown) {
      const errorResult = toErrorResult(error);
      logger.error("[validator.ts] validateTransfer EXCEPTION", error);
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
      const sanitizedData = sanitize.category(data as Record<string, unknown>);
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
      const sanitizedData = sanitize.description(data as Record<string, unknown>);
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
    const oneYearFromNow = new Date(
      now.getFullYear() + 1,
      now.getMonth(),
      now.getDate(),
    );

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
