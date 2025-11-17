import Category from "../../model/Category";
import { ConsoleSpy, createTestCategory } from "../../testHelpers";
import {
  createModernFetchMock,
  createModernErrorFetchMock,
} from "../../testHelpers.modern";

// Mock HookValidator
jest.mock("../../utils/hookValidation", () => ({
  HookValidator: {
    validateInsert: jest.fn((data) => data),
    validateUpdate: jest.fn((newData) => newData),
    validateDelete: jest.fn(),
  },
  HookValidationError: class HookValidationError extends Error {
    constructor(message: string) {
      super(message);
      this.name = "HookValidationError";
    }
  },
}));

// Mock logger
jest.mock("../../utils/logger", () => ({
  createHookLogger: jest.fn(() => ({
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  })),
}));

// Mock validation utilities
jest.mock("../../utils/validation", () => ({
  DataValidator: {
    validateCategory: jest.fn(),
  },
  ValidationError: jest.fn(),
}));

import { insertCategory } from "../../hooks/useCategoryInsert";
import { HookValidator } from "../../utils/hookValidation";
import { DataValidator } from "../../utils/validation";

describe("insertCategory (Isolated)", () => {
  const mockCategory = createTestCategory({
    categoryId: 0,
    categoryName: "groceries",
    activeStatus: true,
    categoryCount: 0,
    dateAdded: new Date(),
    dateUpdated: new Date(),
  });

  const mockValidateInsert = HookValidator.validateInsert as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset validation mocks to default success state (pass-through)
    mockValidateInsert.mockImplementation((data) => data);
  });

  describe("Successful insertion", () => {
    it("should insert category successfully", async () => {
      const mockResponse = createTestCategory({
        categoryId: 123,
        categoryName: "groceries",
        activeStatus: true,
        categoryCount: 1,
      });

      global.fetch = createModernFetchMock(mockResponse);

      const result = await insertCategory(mockCategory);

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/category",
        expect.objectContaining({
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(mockCategory),
        }),
      );
    });

    it("should log the category data being passed", async () => {
      const mockResponse = createTestCategory({ categoryId: 456 });

      global.fetch = createModernFetchMock(mockResponse);

      await insertCategory(mockCategory);

      // Logging tested in logger.test.ts
    });

    it("should use validated data in request body", async () => {
      const validatedCategory = createTestCategory({
        ...mockCategory,
        categoryName: "sanitized_groceries",
      });

      mockValidateInsert.mockReturnValue(validatedCategory);
      global.fetch = createModernFetchMock(validatedCategory);

      await insertCategory(mockCategory);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify(validatedCategory),
        }),
      );
    });

    it("should handle different HTTP success statuses", async () => {
      const successStatuses = [200, 201];

      for (const status of successStatuses) {
        const mockResponse = createTestCategory({ categoryId: status });
        global.fetch = createModernFetchMock(mockResponse, { status });

        const result = await insertCategory(mockCategory);

        expect(result).toEqual(mockResponse);
      }
    });
  });

  describe("Validation handling", () => {
    it("should handle validation failures", async () => {
      mockValidateInsert.mockImplementation(() => {
        throw new Error(
          "insertCategory validation failed: Category name is required",
        );
      });

      await expect(insertCategory(mockCategory)).rejects.toThrow(
        "insertCategory validation failed: Category name is required",
      );

      expect(global.fetch).not.toHaveBeenCalled();
    });

    it("should handle validation failures with multiple errors", async () => {
      mockValidateInsert.mockImplementation(() => {
        throw new Error(
          "insertCategory validation failed: Category name is required, Active status must be boolean",
        );
      });

      await expect(insertCategory(mockCategory)).rejects.toThrow(
        "insertCategory validation failed: Category name is required, Active status must be boolean",
      );
    });

    it("should handle validation failures without error details", async () => {
      mockValidateInsert.mockImplementation(() => {
        throw new Error("insertCategory validation failed: Validation failed");
      });

      await expect(insertCategory(mockCategory)).rejects.toThrow(
        "insertCategory validation failed: Validation failed",
      );
    });

    it("should call validation with correct parameters", async () => {
      global.fetch = createModernFetchMock(mockCategory);

      await insertCategory(mockCategory);

      expect(mockValidateInsert).toHaveBeenCalledWith(
        mockCategory,
        expect.any(Function), // DataValidator.validateCategory
        "insertCategory",
      );
    });
  });

  describe("Error handling", () => {
    beforeEach(() => {});

    it("should handle server error with error message", async () => {
      const errorMessage = "Category name already exists";
      global.fetch = createModernErrorFetchMock(errorMessage, 400);

      await expect(insertCategory(mockCategory)).rejects.toThrow(errorMessage);
    });

    it("should handle server error without error message", async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: jest.fn().mockResolvedValueOnce({}),
      });

      await expect(insertCategory(mockCategory)).rejects.toThrow("HTTP 400");
    });

    it("should handle JSON parsing errors in error response", async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: jest.fn().mockRejectedValueOnce(new Error("Invalid JSON")),
      });

      await expect(insertCategory(mockCategory)).rejects.toThrow("HTTP 400");
    });

    it("should handle empty error message gracefully", async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: jest.fn().mockResolvedValueOnce({}),
      });

      await expect(insertCategory(mockCategory)).rejects.toThrow("HTTP 500");
    });

    it("should handle network errors", async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error("Network error"));

      await expect(insertCategory(mockCategory)).rejects.toThrow(
        "Network error",
      );
    });

    it("should handle various HTTP error statuses", async () => {
      const errorStatuses = [400, 401, 403, 409, 422, 500];

      for (const status of errorStatuses) {
        const errorMessage = `Error ${status}`;
        global.fetch = createModernErrorFetchMock(errorMessage, status);

        await expect(insertCategory(mockCategory)).rejects.toThrow(
          errorMessage,
        );
      }
    });
  });

  describe("Request format validation", () => {
    beforeEach(() => {});

    it("should use POST method", async () => {
      global.fetch = createModernFetchMock(mockCategory);

      await insertCategory(mockCategory);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: "POST",
        }),
      );
    });

    it("should include credentials", async () => {
      global.fetch = createModernFetchMock(mockCategory);

      await insertCategory(mockCategory);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          credentials: "include",
        }),
      );
    });

    it("should include correct headers", async () => {
      global.fetch = createModernFetchMock(mockCategory);

      await insertCategory(mockCategory);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }),
      );
    });

    it("should use correct endpoint", async () => {
      global.fetch = createModernFetchMock(mockCategory);

      await insertCategory(mockCategory);

      expect(global.fetch).toHaveBeenCalledWith(
        "/api/category",
        expect.any(Object),
      );
    });
  });

  describe("Response handling", () => {
    beforeEach(() => {});

    it("should return parsed JSON response", async () => {
      const responseData = createTestCategory({
        categoryId: 789,
        categoryName: "entertainment",
        categoryCount: 5,
      });
      global.fetch = createModernFetchMock(responseData);

      const result = await insertCategory(mockCategory);

      expect(result).toEqual(responseData);
    });

    it("should handle empty response body", async () => {
      global.fetch = createModernFetchMock({});

      const result = await insertCategory(mockCategory);

      expect(result).toEqual({});
    });

    it("should handle complex response data", async () => {
      const complexResponse = createTestCategory({
        ...mockCategory,
        categoryId: 999,
        additionalField: "extra data",
        nested: { property: "value" },
      });
      global.fetch = createModernFetchMock(complexResponse);

      const result = await insertCategory(mockCategory);

      expect(result).toEqual(complexResponse);
    });
  });

  describe("Edge cases", () => {
    beforeEach(() => {});

    it("should handle minimal category data", async () => {
      const minimalCategory = createTestCategory({
        categoryId: 0,
        categoryName: "minimal",
        activeStatus: true,
      });

      const mockResponse = createTestCategory({ categoryId: 111 });
      global.fetch = createModernFetchMock(mockResponse);

      const result = await insertCategory(minimalCategory);

      expect(result).toEqual(mockResponse);
    });

    it("should handle category with all optional fields", async () => {
      const fullCategory = createTestCategory({
        categoryId: 0,
        categoryName: "comprehensive_category",
        activeStatus: true,
        categoryCount: 10,
        dateAdded: new Date("2024-01-01"),
        dateUpdated: new Date("2024-01-15"),
      });

      const mockResponse = createTestCategory({ categoryId: 555 });
      global.fetch = createModernFetchMock(mockResponse);

      const result = await insertCategory(fullCategory);

      expect(result).toEqual(mockResponse);
    });

    it("should handle special characters in category names", async () => {
      const specialCategory = createTestCategory({
        categoryName: "Health & Wellness (2024)",
        activeStatus: true,
      });

      const mockResponse = createTestCategory({ categoryId: 777 });
      global.fetch = createModernFetchMock(mockResponse);

      const result = await insertCategory(specialCategory);

      expect(result).toEqual(mockResponse);
    });

    it("should handle very long category names", async () => {
      const longCategoryName = "A".repeat(255);
      const longCategory = createTestCategory({
        categoryName: longCategoryName,
        activeStatus: true,
      });

      const mockResponse = createTestCategory({ categoryId: 888 });
      global.fetch = createModernFetchMock(mockResponse);

      const result = await insertCategory(longCategory);

      expect(result).toEqual(mockResponse);
    });

    it("should handle categories with activeStatus false", async () => {
      const inactiveCategory = createTestCategory({
        categoryName: "inactive_category",
        activeStatus: false,
      });

      const mockResponse = createTestCategory({ categoryId: 444 });
      global.fetch = createModernFetchMock(mockResponse);

      const result = await insertCategory(inactiveCategory);

      expect(result).toEqual(mockResponse);
    });

    it("should handle null values in category data", async () => {
      const categoryWithNulls = {
        ...mockCategory,
        categoryCount: null as any,
        dateAdded: null as any,
      };

      global.fetch = createModernFetchMock(mockCategory);

      await insertCategory(categoryWithNulls);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify(categoryWithNulls),
        }),
      );
    });
  });

  describe("Business logic validation", () => {
    beforeEach(() => {});

    it("should enforce validation before API call", async () => {
      const mockResponse = createTestCategory({ categoryId: 123 });
      global.fetch = createModernFetchMock(mockResponse);

      await insertCategory(mockCategory);

      expect(mockValidateInsert).toHaveBeenCalled();
      expect(global.fetch).toHaveBeenCalled();
    });

    it("should use validated data in API request", async () => {
      const originalCategory = createTestCategory({
        categoryName: "original<script>",
      });
      const sanitizedCategory = createTestCategory({
        categoryName: "original_sanitized",
      });

      mockValidateInsert.mockReturnValue(sanitizedCategory);
      global.fetch = createModernFetchMock(sanitizedCategory);

      await insertCategory(originalCategory);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify(sanitizedCategory),
        }),
      );
    });

    it("should preserve category ID of 0 for new categories", async () => {
      const newCategory = createTestCategory({
        categoryId: 0,
        categoryName: "new_category",
      });

      const responseCategory = createTestCategory({
        categoryId: 999,
        categoryName: "new_category",
      });
      global.fetch = createModernFetchMock(responseCategory);

      const result = await insertCategory(newCategory);

      expect(result.categoryId).toBe(999); // Server assigns new ID
    });
  });
});
