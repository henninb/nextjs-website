import type { ValidationError } from "../../../utils/validation/schemas";
import {
  isValidationFailure,
  isValidationSuccess,
  type ArrayValidationResult,
  type ValidatedData,
  type ValidationResult,
  type ValidatorFunction,
} from "../../../types/validation/ValidationTypes";

describe("ValidationTypes", () => {
  const validationError: ValidationError = {
    field: "email",
    message: "Email is required",
  };

  it("identifies successful validation results", () => {
    const result: ValidationResult<{ email: string }> = {
      success: true,
      data: { email: "test@example.com" },
    };

    expect(isValidationSuccess(result)).toBe(true);
    expect(isValidationFailure(result)).toBe(false);

    if (isValidationSuccess(result)) {
      expect(result.data.email).toBe("test@example.com");
    }
  });

  it("identifies failed validation results", () => {
    const result: ValidationResult<{ email: string }> = {
      success: false,
      errors: [validationError],
    };

    expect(isValidationSuccess(result)).toBe(false);
    expect(isValidationFailure(result)).toBe(true);

    if (isValidationFailure(result)) {
      expect(result.errors).toEqual([validationError]);
    }
  });

  it("rejects ambiguous validation results without the expected payload", () => {
    const successWithoutData: ValidationResult<string> = { success: true };
    const failureWithoutErrors: ValidationResult<string> = { success: false };

    expect(isValidationSuccess(successWithoutData)).toBe(false);
    expect(isValidationFailure(failureWithoutErrors)).toBe(false);
  });

  it("supports the remaining validation helper types", () => {
    const validData: ValidatedData<{ count: number }> = {
      isValid: true,
      data: { count: 2 },
    };
    const invalidData: ValidatedData<{ count: number }> = {
      isValid: false,
      errors: [validationError],
    };
    const arrayResult: ArrayValidationResult<{ count: number }> = {
      success: false,
      validItems: [{ count: 1 }],
      errors: [{ index: 2, errors: [validationError] }],
    };
    const validator: ValidatorFunction<string, { trimmed: string }> = (
      value,
    ) => ({
      success: true,
      data: { trimmed: value.trim() },
    });

    expect(validData.isValid).toBe(true);
    expect(invalidData.isValid).toBe(false);
    expect(arrayResult.errors[0]).toEqual({
      index: 2,
      errors: [validationError],
    });
    expect(validator("  value  ")).toEqual({
      success: true,
      data: { trimmed: "value" },
    });
  });
});
