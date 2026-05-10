import { renderHook, act } from "@testing-library/react";
import {
  extractFormFieldErrors,
  getUserFriendlyErrorMessage,
  hasFieldValidationErrors,
  useFormErrorHandler,
  isFormValidationError,
  getValidationErrorsArray,
  formatFieldErrorsForDisplay,
  combineFieldErrors,
} from "../../utils/formErrorHandling";
import { HookValidationError } from "../../utils/hookValidation";

const sampleValidationErrors = [
  { field: "transactionDate", message: "Date is required" },
  { field: "amount", message: "Amount must be positive" },
  { field: "amount", message: "Amount must be numeric" },
];

describe("formErrorHandling", () => {
  describe("extractFormFieldErrors", () => {
    it("extracts first field errors from HookValidationError", () => {
      const error = new HookValidationError(
        "Validation failed",
        sampleValidationErrors,
      );

      expect(extractFormFieldErrors(error)).toEqual({
        transactionDate: "Date is required",
        amount: "Amount must be positive",
      });
    });

    it("extracts first field errors from objects with validationErrors", () => {
      expect(
        extractFormFieldErrors({ validationErrors: sampleValidationErrors }),
      ).toEqual({
        transactionDate: "Date is required",
        amount: "Amount must be positive",
      });
    });

    it("returns empty object when no field errors exist", () => {
      expect(extractFormFieldErrors(new Error("boom"))).toEqual({});
      expect(extractFormFieldErrors(null)).toEqual({});
    });
  });

  describe("getUserFriendlyErrorMessage", () => {
    it("returns summary message for HookValidationError", () => {
      const error = new HookValidationError(
        "Validation failed",
        sampleValidationErrors,
      );

      expect(getUserFriendlyErrorMessage(error)).toBe(
        "Transaction Date: Date is required\nAmount: Amount must be positive\nAmount: Amount must be numeric",
      );
    });

    it("returns generic error message for standard errors", () => {
      expect(getUserFriendlyErrorMessage(new Error("Request failed"))).toBe(
        "Request failed",
      );
    });

    it("falls back when extracted message is empty", () => {
      expect(getUserFriendlyErrorMessage("", "Fallback message")).toBe(
        "Fallback message",
      );
    });
  });

  describe("validation presence helpers", () => {
    it("detects whether field validation errors are present", () => {
      expect(
        hasFieldValidationErrors(
          new HookValidationError("Validation failed", sampleValidationErrors),
        ),
      ).toBe(true);

      expect(
        hasFieldValidationErrors(
          new HookValidationError("Validation failed", []),
        ),
      ).toBe(false);

      expect(
        hasFieldValidationErrors({ validationErrors: sampleValidationErrors }),
      ).toBe(true);

      expect(hasFieldValidationErrors({ validationErrors: [] })).toBe(false);
      expect(hasFieldValidationErrors(new Error("boom"))).toBe(false);
    });

    it("treats form validation error alias consistently", () => {
      const error = { validationErrors: sampleValidationErrors };

      expect(isFormValidationError(error)).toBe(true);
      expect(isFormValidationError(new Error("boom"))).toBe(false);
    });

    it("returns validation errors as an array", () => {
      const hookError = new HookValidationError(
        "Validation failed",
        sampleValidationErrors,
      );

      expect(getValidationErrorsArray(hookError)).toEqual(sampleValidationErrors);
      expect(
        getValidationErrorsArray({ validationErrors: sampleValidationErrors }),
      ).toEqual(sampleValidationErrors);
      expect(getValidationErrorsArray(new Error("boom"))).toEqual([]);
    });
  });

  describe("display helpers", () => {
    it("formats field errors for display", () => {
      expect(
        formatFieldErrorsForDisplay({
          transactionDate: "Date is required",
          accountNameOwner: "Account is required",
        }),
      ).toEqual([
        "Transaction Date: Date is required",
        "Account Name Owner: Account is required",
      ]);
    });

    it("combines validation and custom errors with custom values winning", () => {
      expect(
        combineFieldErrors(
          { amount: "Amount must be positive", notes: "Too long" },
          { amount: "Amount exceeds balance", account: "Account required" },
        ),
      ).toEqual({
        amount: "Amount exceeds balance",
        notes: "Too long",
        account: "Account required",
      });
    });
  });

  describe("useFormErrorHandler", () => {
    it("sets field errors and calls onError for validation errors", () => {
      const onError = jest.fn();
      const error = new HookValidationError(
        "Validation failed",
        sampleValidationErrors,
      );

      const { result } = renderHook(() => useFormErrorHandler({ onError }));

      act(() => {
        result.current.handleFormError(error, "Fallback");
      });

      expect(result.current.fieldErrors).toEqual({
        transactionDate: "Date is required",
        amount: "Amount must be positive",
      });
      expect(onError).toHaveBeenCalledWith(
        "Transaction Date: Date is required\nAmount: Amount must be positive\nAmount: Amount must be numeric",
      );
    });

    it("calls onError with fallback for non-descriptive errors", () => {
      const onError = jest.fn();
      const { result } = renderHook(() => useFormErrorHandler({ onError }));

      act(() => {
        result.current.handleFormError("", "Failed to save payment");
      });

      expect(result.current.fieldErrors).toEqual({});
      expect(onError).toHaveBeenCalledWith("Failed to save payment");
    });

    it("can clear one field, clear all fields, and set state manually", () => {
      const { result } = renderHook(() => useFormErrorHandler());

      act(() => {
        result.current.setFieldErrors({
          amount: "Amount must be positive",
          notes: "Too long",
        });
      });

      expect(result.current.fieldErrors).toEqual({
        amount: "Amount must be positive",
        notes: "Too long",
      });

      act(() => {
        result.current.clearFieldError("amount");
      });

      expect(result.current.fieldErrors).toEqual({
        notes: "Too long",
      });

      act(() => {
        result.current.clearAllFieldErrors();
      });

      expect(result.current.fieldErrors).toEqual({});
    });
  });
});
