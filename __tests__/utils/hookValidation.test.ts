import {
  HookValidator,
  HookValidationError,
  withValidation,
  isValidationError,
} from "../../utils/hookValidation";
import { ValidationError } from "../../utils/validation";

// Mock validator functions
const mockSuccessValidator = jest.fn((data: any) => ({
  success: true,
  data,
  errors: [],
}));

const mockFailValidator = jest.fn((data: any) => ({
  success: false,
  data: undefined,
  errors: [
    {
      field: "testField",
      message: "Validation failed",
      code: "INVALID_VALUE",
    } as ValidationError,
  ],
}));

// Mock hookValidators
jest.mock("../../utils/validation", () => ({
  ValidationError: class ValidationError extends Error {},
  hookValidators: {
    validateApiPayload: jest.fn((data, validator, operationName) => {
      const result = validator(data);
      return {
        isValid: result.success,
        validatedData: result.data || data,
        errors: result.errors,
      };
    }),
  },
}));

describe("hookValidation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("HookValidationError", () => {
    it("should create error with message and status", () => {
      const error = new HookValidationError("Test error");

      expect(error.message).toBe("Test error");
      expect(error.status).toBe(400);
      expect(error.statusText).toBe("Bad Request");
      expect(error.name).toBe("HookValidationError");
    });

    it("should include validation errors", () => {
      const validationErrors: ValidationError[] = [
        {
          field: "email",
          message: "Invalid email format",
          code: "INVALID_EMAIL",
        },
      ];

      const error = new HookValidationError(
        "Validation failed",
        validationErrors,
      );

      expect(error.validationErrors).toEqual(validationErrors);
      expect(error.body).toEqual({ errors: validationErrors });
    });
  });

  describe("HookValidator.validateInsert", () => {
    it("should return validated data on success", () => {
      const testData = { name: "test", value: 123 };

      const result = HookValidator.validateInsert(
        testData,
        mockSuccessValidator,
        "testOperation",
      );

      expect(result).toEqual(testData);
      expect(mockSuccessValidator).toHaveBeenCalledWith(testData);
    });

    it("should throw HookValidationError on failure", () => {
      const testData = { name: "invalid" };

      expect(() =>
        HookValidator.validateInsert(
          testData,
          mockFailValidator,
          "testOperation",
        ),
      ).toThrow(HookValidationError);

      expect(() =>
        HookValidator.validateInsert(
          testData,
          mockFailValidator,
          "testOperation",
        ),
      ).toThrow("testOperation validation failed: Validation failed");
    });

    it("should include validation errors in thrown error", () => {
      const testData = { name: "invalid" };

      try {
        HookValidator.validateInsert(
          testData,
          mockFailValidator,
          "testOperation",
        );
        fail("Should have thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(HookValidationError);
        const validationError = error as HookValidationError;
        expect(validationError.validationErrors).toBeDefined();
        expect(validationError.validationErrors![0].field).toBe("testField");
      }
    });
  });

  describe("HookValidator.validateUpdate", () => {
    it("should return validated new data on success", () => {
      const oldData = { name: "old", value: 100 };
      const newData = { name: "new", value: 200 };

      const result = HookValidator.validateUpdate(
        newData,
        oldData,
        mockSuccessValidator,
        "updateOperation",
      );

      expect(result).toEqual(newData);
      expect(mockSuccessValidator).toHaveBeenCalledWith(newData);
    });

    it("should throw HookValidationError on validation failure", () => {
      const oldData = { name: "old" };
      const newData = { name: "invalid" };

      expect(() =>
        HookValidator.validateUpdate(
          newData,
          oldData,
          mockFailValidator,
          "updateOperation",
        ),
      ).toThrow(HookValidationError);
    });
  });

  describe("HookValidator.validateDelete", () => {
    it("should return data when identifier is valid", () => {
      const testData = { id: "valid-id", name: "test" };

      const result = HookValidator.validateDelete(
        testData,
        "id",
        "deleteOperation",
      );

      expect(result).toEqual(testData);
    });

    it("should throw when identifier is missing", () => {
      const testData = { name: "test" };

      expect(() =>
        HookValidator.validateDelete(testData, "id", "deleteOperation"),
      ).toThrow(HookValidationError);

      expect(() =>
        HookValidator.validateDelete(testData, "id", "deleteOperation"),
      ).toThrow("deleteOperation: Invalid id provided");
    });

    it("should throw when identifier is empty string", () => {
      const testData = { id: "", name: "test" };

      expect(() =>
        HookValidator.validateDelete(testData, "id", "deleteOperation"),
      ).toThrow(HookValidationError);
    });

    it("should throw when identifier is whitespace-only string", () => {
      const testData = { id: "   ", name: "test" };

      expect(() =>
        HookValidator.validateDelete(testData, "id", "deleteOperation"),
      ).toThrow(HookValidationError);
    });

    it("should include validation error details", () => {
      const testData = { name: "test" };

      try {
        HookValidator.validateDelete(testData, "id", "deleteOperation");
        fail("Should have thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(HookValidationError);
        const validationError = error as HookValidationError;
        expect(validationError.validationErrors).toBeDefined();
        expect(validationError.validationErrors![0]).toMatchObject({
          field: "id",
          message: "id is required",
          code: "REQUIRED_FIELD",
        });
      }
    });
  });

  describe("HookValidator.validateGuid", () => {
    const validGuids = [
      "550e8400-e29b-41d4-a716-446655440000",
      "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
      "6ba7b811-9dad-11d1-80b4-00c04fd430c8",
      "a3bb189e-8bf9-3888-9912-ace4e6543002",
    ];

    it.each(validGuids)("should accept valid GUID: %s", (guid) => {
      const result = HookValidator.validateGuid(guid, "testOperation");
      expect(result).toBe(guid);
    });

    const invalidGuids = [
      "not-a-guid",
      "550e8400-e29b-41d4-a716",
      "550e8400-e29b-41d4-a716-446655440000-extra",
      "550e8400-e29b-41d4-x716-446655440000", // invalid character
      "550e8400e29b41d4a716446655440000", // missing dashes
      "",
      "   ",
    ];

    it.each(invalidGuids)("should reject invalid GUID: %s", (guid) => {
      expect(() => HookValidator.validateGuid(guid, "testOperation")).toThrow(
        HookValidationError,
      );

      expect(() => HookValidator.validateGuid(guid, "testOperation")).toThrow(
        "testOperation: Invalid GUID format",
      );
    });

    it("should include validation error details", () => {
      try {
        HookValidator.validateGuid("invalid-guid", "testOperation");
        fail("Should have thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(HookValidationError);
        const validationError = error as HookValidationError;
        expect(validationError.validationErrors![0]).toMatchObject({
          field: "guid",
          message: "GUID must be a valid UUID v4 format",
          code: "INVALID_GUID",
        });
      }
    });
  });

  describe("HookValidator.validateAccountName", () => {
    it("should accept valid account names", () => {
      const validNames = ["chase_brian", "savings_account", "Account123"];

      validNames.forEach((name) => {
        const result = HookValidator.validateAccountName(name, "testOperation");
        expect(result).toBe(name);
      });
    });

    it("should trim whitespace from account names", () => {
      const result = HookValidator.validateAccountName(
        "  account_name  ",
        "testOperation",
      );
      expect(result).toBe("account_name");
    });

    it("should throw when account name is empty", () => {
      expect(() =>
        HookValidator.validateAccountName("", "testOperation"),
      ).toThrow(HookValidationError);

      expect(() =>
        HookValidator.validateAccountName("", "testOperation"),
      ).toThrow("testOperation: Account name is required");
    });

    it("should throw when account name is whitespace-only", () => {
      expect(() =>
        HookValidator.validateAccountName("   ", "testOperation"),
      ).toThrow(HookValidationError);
    });

    it("should throw when account name exceeds 100 characters", () => {
      const longName = "a".repeat(101);

      expect(() =>
        HookValidator.validateAccountName(longName, "testOperation"),
      ).toThrow(HookValidationError);

      expect(() =>
        HookValidator.validateAccountName(longName, "testOperation"),
      ).toThrow("testOperation: Account name too long");
    });

    it("should accept account name of exactly 100 characters", () => {
      const maxLengthName = "a".repeat(100);

      const result = HookValidator.validateAccountName(
        maxLengthName,
        "testOperation",
      );
      expect(result).toBe(maxLengthName);
    });
  });

  describe("HookValidator.validateNumericId", () => {
    it("should accept valid numeric IDs", () => {
      expect(HookValidator.validateNumericId(123, "id", "testOp")).toBe(123);
      expect(HookValidator.validateNumericId(0, "id", "testOp")).toBe(0);
      expect(HookValidator.validateNumericId("456", "id", "testOp")).toBe(456);
    });

    it("should throw on negative IDs", () => {
      expect(() => HookValidator.validateNumericId(-1, "id", "testOp")).toThrow(
        HookValidationError,
      );

      expect(() => HookValidator.validateNumericId(-1, "id", "testOp")).toThrow(
        "testOp: Invalid id",
      );
    });

    it("should throw on non-integer IDs", () => {
      expect(() =>
        HookValidator.validateNumericId(12.5, "id", "testOp"),
      ).toThrow(HookValidationError);
    });

    it("should throw on NaN", () => {
      expect(() =>
        HookValidator.validateNumericId(NaN, "id", "testOp"),
      ).toThrow(HookValidationError);

      expect(() =>
        HookValidator.validateNumericId("not-a-number", "id", "testOp"),
      ).toThrow(HookValidationError);
    });

    it("should use custom field name in error message", () => {
      expect(() =>
        HookValidator.validateNumericId(-1, "customId", "testOp"),
      ).toThrow("testOp: Invalid customId");
    });

    it("should use default field name when not provided", () => {
      expect(() =>
        HookValidator.validateNumericId(-1, undefined as any, "testOp"),
      ).toThrow("testOp: Invalid ID");
    });
  });

  describe("HookValidator.validateNonEmptyArray", () => {
    it("should accept non-empty arrays", () => {
      const array = [1, 2, 3];
      const result = HookValidator.validateNonEmptyArray(array, "testOp");
      expect(result).toEqual(array);
    });

    it("should accept array with single element", () => {
      const array = ["single"];
      const result = HookValidator.validateNonEmptyArray(array, "testOp");
      expect(result).toEqual(array);
    });

    it("should throw on empty array", () => {
      expect(() => HookValidator.validateNonEmptyArray([], "testOp")).toThrow(
        HookValidationError,
      );

      expect(() => HookValidator.validateNonEmptyArray([], "testOp")).toThrow(
        "testOp: Array cannot be empty",
      );
    });

    it("should throw on non-array values", () => {
      expect(() =>
        HookValidator.validateNonEmptyArray(null as any, "testOp"),
      ).toThrow(HookValidationError);

      expect(() =>
        HookValidator.validateNonEmptyArray("not-array" as any, "testOp"),
      ).toThrow(HookValidationError);
    });
  });

  describe("HookValidator.validateDateRange", () => {
    const now = new Date();

    it("should accept valid dates within default range", () => {
      const validDate = new Date();
      const result = HookValidator.validateDateRange(validDate, "testOp");
      expect(result).toEqual(validDate);
    });

    it("should accept date strings", () => {
      // Use a date within the last year (default pastYears: 1)
      const dateString = "2025-06-15";
      const result = HookValidator.validateDateRange(dateString, "testOp");
      expect(result).toBeInstanceOf(Date);
      expect(result.toISOString()).toContain("2025-06-15");
    });

    it("should throw on invalid date strings", () => {
      expect(() =>
        HookValidator.validateDateRange("invalid-date", "testOp"),
      ).toThrow(HookValidationError);

      expect(() =>
        HookValidator.validateDateRange("invalid-date", "testOp"),
      ).toThrow("testOp: Invalid date");
    });

    it("should throw when date is too far in the past", () => {
      const pastDate = new Date(
        now.getFullYear() - 2,
        now.getMonth(),
        now.getDate(),
      );

      expect(() =>
        HookValidator.validateDateRange(pastDate, "testOp", { pastYears: 1 }),
      ).toThrow(HookValidationError);

      expect(() =>
        HookValidator.validateDateRange(pastDate, "testOp", { pastYears: 1 }),
      ).toThrow("testOp: Date too far in the past");
    });

    it("should throw when date is too far in the future", () => {
      const futureDate = new Date(
        now.getFullYear() + 2,
        now.getMonth(),
        now.getDate(),
      );

      expect(() =>
        HookValidator.validateDateRange(futureDate, "testOp", {
          futureYears: 1,
        }),
      ).toThrow(HookValidationError);

      expect(() =>
        HookValidator.validateDateRange(futureDate, "testOp", {
          futureYears: 1,
        }),
      ).toThrow("testOp: Date too far in the future");
    });

    it("should respect custom pastYears option", () => {
      const pastDate = new Date(
        now.getFullYear() - 3,
        now.getMonth(),
        now.getDate(),
      );

      // Should fail with 2 years
      expect(() =>
        HookValidator.validateDateRange(pastDate, "testOp", { pastYears: 2 }),
      ).toThrow(HookValidationError);

      // Should pass with 5 years
      const result = HookValidator.validateDateRange(pastDate, "testOp", {
        pastYears: 5,
      });
      expect(result).toEqual(pastDate);
    });

    it("should respect custom futureYears option", () => {
      const futureDate = new Date(
        now.getFullYear() + 3,
        now.getMonth(),
        now.getDate(),
      );

      // Should fail with 2 years
      expect(() =>
        HookValidator.validateDateRange(futureDate, "testOp", {
          futureYears: 2,
        }),
      ).toThrow(HookValidationError);

      // Should pass with 5 years
      const result = HookValidator.validateDateRange(futureDate, "testOp", {
        futureYears: 5,
      });
      expect(result).toEqual(futureDate);
    });
  });

  describe("withValidation", () => {
    it("should create validator function", () => {
      const validator = withValidation(mockSuccessValidator, "testOp");
      const testData = { name: "test" };

      const result = validator(testData);

      expect(result).toEqual(testData);
      expect(mockSuccessValidator).toHaveBeenCalled();
    });

    it("should throw on validation failure", () => {
      const validator = withValidation(mockFailValidator, "testOp");
      const testData = { name: "invalid" };

      expect(() => validator(testData)).toThrow(HookValidationError);
    });

    it("should preserve type information", () => {
      interface TestData {
        name: string;
        value: number;
      }

      const validator = withValidation<TestData>(
        mockSuccessValidator,
        "testOp",
      );
      const testData: TestData = { name: "test", value: 123 };

      const result = validator(testData);

      // TypeScript should preserve the type
      expect(result.name).toBe("test");
      expect(result.value).toBe(123);
    });
  });

  describe("isValidationError", () => {
    it("should return true for HookValidationError instances", () => {
      const error = new HookValidationError("Test error");
      expect(isValidationError(error)).toBe(true);
    });

    it("should return false for regular errors", () => {
      const error = new Error("Regular error");
      expect(isValidationError(error)).toBe(false);
    });

    it("should return false for non-error values", () => {
      expect(isValidationError(null)).toBe(false);
      expect(isValidationError(undefined)).toBe(false);
      expect(isValidationError("string")).toBe(false);
      expect(isValidationError({ message: "not an error" })).toBe(false);
    });

    it("should work in type narrowing", () => {
      const error: unknown = new HookValidationError("Test", [
        {
          field: "test",
          message: "error",
          code: "TEST",
        },
      ]);

      if (isValidationError(error)) {
        // TypeScript should know this is HookValidationError
        expect(error.validationErrors).toBeDefined();
        expect(error.validationErrors![0].field).toBe("test");
      } else {
        fail("Should be validation error");
      }
    });
  });
});
