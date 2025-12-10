/**
 * Validation Type Definitions
 *
 * This module provides generic types for validation results to replace
 * 'any' types in the validation system.
 */

import { ValidationError } from '../../utils/validation/schemas';

/**
 * Generic validation result type
 * Used as the return type for all validation functions
 *
 * @template T - The type of the validated data
 */
export interface ValidationResult<T = unknown> {
  success: boolean;
  data?: T;
  errors?: ValidationError[];
}

/**
 * Discriminated union for validated data
 * Provides type-safe access to data only when validation succeeds
 *
 * @example
 * ```typescript
 * const result = validateUser(rawData);
 * if (result.isValid) {
 *   // TypeScript knows result.data is User here
 *   console.log(result.data.username);
 * } else {
 *   // TypeScript knows result.errors exists here
 *   console.log(result.errors);
 * }
 * ```
 */
export type ValidatedData<T> =
  | {
      isValid: true;
      data: T;
    }
  | {
      isValid: false;
      errors: ValidationError[];
    };

/**
 * Array validation result type
 * Used for validating collections of items
 */
export interface ArrayValidationResult<T> {
  success: boolean;
  validItems: T[];
  errors: Array<{
    index: number;
    errors: ValidationError[];
  }>;
}

/**
 * Validator function type
 * Represents a function that validates data and returns a ValidationResult
 */
export type ValidatorFunction<TInput, TOutput = TInput> = (
  data: TInput
) => ValidationResult<TOutput>;

/**
 * Type guard to check if a validation result succeeded
 */
export function isValidationSuccess<T>(
  result: ValidationResult<T>
): result is ValidationResult<T> & { success: true; data: T } {
  return result.success && result.data !== undefined;
}

/**
 * Type guard to check if a validation result failed
 */
export function isValidationFailure<T>(
  result: ValidationResult<T>
): result is ValidationResult<T> & { success: false; errors: ValidationError[] } {
  return !result.success && result.errors !== undefined;
}
