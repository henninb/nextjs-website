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

/**
 * Comprehensive validation utility that combines sanitization and schema validation
 */
export class DataValidator {
  /**
   * Validate and sanitize user data
   */
  static validateUser(data: any): {
    success: boolean;
    data?: any;
    errors?: ValidationError[];
  } {
    try {
      // First sanitize the input
      const sanitizedData = sanitize.user(data);

      // Then validate with schema
      const result = validateSchema(UserSchema, sanitizedData);

      if (!result.success) {
        SecurityLogger.logValidationFailure(result.errors || [], data);
      }

      return result;
    } catch (error: any) {
      return {
        success: false,
        errors: [
          {
            field: "validation",
            message: error.message || "User validation failed",
            code: "VALIDATION_ERROR",
          },
        ],
      };
    }
  }

  /**
   * Validate and sanitize account data
   */
  static validateAccount(data: any): {
    success: boolean;
    data?: any;
    errors?: ValidationError[];
  } {
    try {
      const sanitizedData = sanitize.account(data);
      const result = validateSchema(AccountSchema, sanitizedData);

      if (!result.success) {
        SecurityLogger.logValidationFailure(result.errors || [], data);
      }

      return result;
    } catch (error: any) {
      return {
        success: false,
        errors: [
          {
            field: "validation",
            message: error.message || "Account validation failed",
            code: "VALIDATION_ERROR",
          },
        ],
      };
    }
  }

  /**
   * Validate and sanitize transaction data with enhanced financial checks
   */
  static validateTransaction(data: any): {
    success: boolean;
    data?: any;
    errors?: ValidationError[];
  } {
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

      return result;
    } catch (error: any) {
      return {
        success: false,
        errors: [
          {
            field: "validation",
            message: error.message || "Transaction validation failed",
            code: "VALIDATION_ERROR",
          },
        ],
      };
    }
  }

  /**
   * Validate and sanitize payment data
   */
  static validatePayment(data: any): {
    success: boolean;
    data?: any;
    errors?: ValidationError[];
  } {
    try {
      const sanitizedData = sanitize.payment(data);

      // Additional checks for payments
      const financialValidation = DataValidator.validateFinancialBoundaries({
        amount: sanitizedData.amount,
        transactionDate: sanitizedData.transactionDate,
      });

      if (!financialValidation.success) {
        return financialValidation;
      }

      // Ensure source and destination accounts are different
      if (sanitizedData.sourceAccount === sanitizedData.destinationAccount) {
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

      if (!result.success) {
        SecurityLogger.logValidationFailure(result.errors || [], data);
      }

      return result;
    } catch (error: any) {
      return {
        success: false,
        errors: [
          {
            field: "validation",
            message: error.message || "Payment validation failed",
            code: "VALIDATION_ERROR",
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

    // Amount checks
    if (data.amount === 0) {
      errors.push({
        field: "amount",
        message: "Amount cannot be zero",
        code: "ZERO_AMOUNT_ERROR",
      });
    }

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
    if (DataValidator.isSuspiciousAmount(data.amount)) {
      errors.push({
        field: "amount",
        message: "Amount flagged for review due to suspicious pattern",
        code: "SUSPICIOUS_AMOUNT",
      });
    }

    return {
      success: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  /**
   * Detect suspicious financial amounts (basic fraud detection)
   */
  static isSuspiciousAmount(amount: number): boolean {
    const absAmount = Math.abs(amount);

    // Flag round numbers over $10,000
    if (absAmount >= 10000 && absAmount % 1000 === 0) {
      return true;
    }

    // Flag amounts just under common reporting thresholds
    const suspiciousThresholds = [9999, 4999, 2999];
    if (
      suspiciousThresholds.some(
        (threshold) => absAmount >= threshold * 0.95 && absAmount <= threshold,
      )
    ) {
      return true;
    }

    // Flag very precise amounts that might be calculated to avoid detection
    const decimalPlaces = (absAmount.toString().split(".")[1] || "").length;
    if (absAmount > 1000 && decimalPlaces > 2) {
      return true;
    }

    return false;
  }

  /**
   * Validate array of financial data
   */
  static validateFinancialArray<T>(
    data: T[],
    validator: (item: T) => {
      success: boolean;
      data?: any;
      errors?: ValidationError[];
    },
  ): {
    success: boolean;
    validItems: any[];
    errors: Array<{ index: number; errors: ValidationError[] }>;
  } {
    const validItems: any[] = [];
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
  validateApiPayload<T>(
    data: T,
    validator: (item: T) => {
      success: boolean;
      data?: any;
      errors?: ValidationError[];
    },
    hookName: string,
  ): { isValid: boolean; validatedData?: any; errors?: ValidationError[] } {
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
