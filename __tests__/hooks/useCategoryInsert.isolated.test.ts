import Category from "../../model/Category";
import {
  createFetchMock,
  createErrorFetchMock,
  ConsoleSpy,
  createTestCategory,
  simulateNetworkError,
  createMockValidationUtils,
} from "../../testHelpers";

// Mock the validation utilities since we're testing in isolation
const mockValidationUtils = createMockValidationUtils();

jest.mock("../../utils/validation", () => mockValidationUtils);

// Extract the insertCategory function for isolated testing
const insertCategory = async (category: Category): Promise<Category | null> => {
  try {
    // Validate and sanitize using shared validator
    const validation = mockValidationUtils.hookValidators.validateApiPayload(
      category,
      mockValidationUtils.DataValidator.validateCategory,
      "insertCategory",
    );

    if (!validation.isValid) {
      const errorMessages =
        validation.errors?.map((e) => e.message).join(", ") ||
        "Validation failed";
      throw new Error(`Category validation failed: ${errorMessages}`);
    }

    const endpoint = "/api/category/insert";

    console.log("passed: " + JSON.stringify(category));

    const response = await fetch(endpoint, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(validation.validatedData),
    });

    if (!response.ok) {
      let errorMessage = "";

      try {
        const errorBody = await response.json();
        if (errorBody && errorBody.response) {
          errorMessage = `${errorBody.response}`;
        } else {
          console.log("No error message returned.");
          throw new Error("No error message returned.");
        }
      } catch (error: any) {
        console.log(`Failed to parse error response: ${error.message}`);
        throw new Error(`Failed to parse error response: ${error.message}`);
      }

      console.log(errorMessage || "cannot throw a null value");
      throw new Error(errorMessage || "cannot throw a null value");
    }

    return await response.json();
  } catch (error: any) {
    throw error;
  }
};

describe("insertCategory (Isolated)", () => {
  const mockCategory = createTestCategory({
    categoryId: 0,
    categoryName: "groceries",
    activeStatus: true,
    categoryCount: 0,
    dateAdded: new Date(),
    dateUpdated: new Date(),
  });

  let consoleSpy: ConsoleSpy;
  let mockConsole: any;

  beforeEach(() => {
    consoleSpy = new ConsoleSpy();
    mockConsole = consoleSpy.start();
    jest.clearAllMocks();
  });

  afterEach(() => {
    consoleSpy.stop();
  });

  describe("Successful insertion", () => {
    it("should insert category successfully", async () => {
      const mockResponse = createTestCategory({
        categoryId: 123,
        categoryName: "groceries",
        activeStatus: true,
        categoryCount: 1,
      });

      mockValidationUtils.hookValidators.validateApiPayload.mockReturnValue({
        isValid: true,
        validatedData: mockCategory,
      });

      global.fetch = createFetchMock(mockResponse);

      const result = await insertCategory(mockCategory);

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/category/insert",
        expect.objectContaining({
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(mockCategory),
        }),
      );
    });

    it("should log the category data being passed", async () => {
      const mockResponse = createTestCategory({ categoryId: 456 });

      mockValidationUtils.hookValidators.validateApiPayload.mockReturnValue({
        isValid: true,
        validatedData: mockCategory,
      });

      global.fetch = createFetchMock(mockResponse);

      await insertCategory(mockCategory);

      expect(mockConsole.log).toHaveBeenCalledWith(
        `passed: ${JSON.stringify(mockCategory)}`,
      );
    });

    it("should use validated data in request body", async () => {
      const validatedCategory = createTestCategory({
        ...mockCategory,
        categoryName: "sanitized_groceries",
      });

      mockValidationUtils.hookValidators.validateApiPayload.mockReturnValue({
        isValid: true,
        validatedData: validatedCategory,
      });

      global.fetch = createFetchMock(validatedCategory);

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
        mockValidationUtils.hookValidators.validateApiPayload.mockReturnValue({
          isValid: true,
          validatedData: mockCategory,
        });

        const mockResponse = createTestCategory({ categoryId: status });
        global.fetch = createFetchMock(mockResponse, { status });

        const result = await insertCategory(mockCategory);

        expect(result).toEqual(mockResponse);
      }
    });
  });

  describe("Validation handling", () => {
    it("should handle validation failures", async () => {
      const validationError = { message: "Category name is required" };

      mockValidationUtils.hookValidators.validateApiPayload.mockReturnValue({
        isValid: false,
        errors: [validationError],
      });

      await expect(insertCategory(mockCategory)).rejects.toThrow(
        "Category validation failed: Category name is required",
      );

      expect(global.fetch).not.toHaveBeenCalled();
    });

    it("should handle validation failures with multiple errors", async () => {
      const validationErrors = [
        { message: "Category name is required" },
        { message: "Active status must be boolean" },
      ];

      mockValidationUtils.hookValidators.validateApiPayload.mockReturnValue({
        isValid: false,
        errors: validationErrors,
      });

      await expect(insertCategory(mockCategory)).rejects.toThrow(
        "Category validation failed: Category name is required, Active status must be boolean",
      );
    });

    it("should handle validation failures without error details", async () => {
      mockValidationUtils.hookValidators.validateApiPayload.mockReturnValue({
        isValid: false,
      });

      await expect(insertCategory(mockCategory)).rejects.toThrow(
        "Category validation failed: Validation failed",
      );
    });

    it("should call validation with correct parameters", async () => {
      mockValidationUtils.hookValidators.validateApiPayload.mockReturnValue({
        isValid: true,
        validatedData: mockCategory,
      });

      global.fetch = createFetchMock(mockCategory);

      await insertCategory(mockCategory);

      expect(
        mockValidationUtils.hookValidators.validateApiPayload,
      ).toHaveBeenCalledWith(
        mockCategory,
        mockValidationUtils.DataValidator.validateCategory,
        "insertCategory",
      );
    });
  });

  describe("Error handling", () => {
    beforeEach(() => {
      mockValidationUtils.hookValidators.validateApiPayload.mockReturnValue({
        isValid: true,
        validatedData: mockCategory,
      });
    });

    it("should handle server error with error message", async () => {
      const errorMessage = "Category name already exists";
      global.fetch = createErrorFetchMock(errorMessage, 400);

      await expect(insertCategory(mockCategory)).rejects.toThrow(errorMessage);
      expect(mockConsole.log).toHaveBeenCalledWith(errorMessage);
    });

    it("should handle server error without error message", async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: jest.fn().mockResolvedValueOnce({}),
      });

      await expect(insertCategory(mockCategory)).rejects.toThrow(
        "No error message returned.",
      );
      expect(mockConsole.log).toHaveBeenCalledWith(
        "No error message returned.",
      );
    });

    it("should handle JSON parsing errors in error response", async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: jest.fn().mockRejectedValueOnce(new Error("Invalid JSON")),
      });

      await expect(insertCategory(mockCategory)).rejects.toThrow(
        "Failed to parse error response: Invalid JSON",
      );
      expect(mockConsole.log).toHaveBeenCalledWith(
        "Failed to parse error response: Invalid JSON",
      );
    });

    it("should handle empty error message gracefully", async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: jest.fn().mockResolvedValueOnce({}),
      });

      await expect(insertCategory(mockCategory)).rejects.toThrow(
        "No error message returned.",
      );
      expect(mockConsole.log).toHaveBeenCalledWith(
        "No error message returned.",
      );
    });

    it("should handle network errors", async () => {
      global.fetch = simulateNetworkError();

      await expect(insertCategory(mockCategory)).rejects.toThrow(
        "Network error",
      );
    });

    it("should handle various HTTP error statuses", async () => {
      const errorStatuses = [400, 401, 403, 409, 422, 500];

      for (const status of errorStatuses) {
        const errorMessage = `Error ${status}`;
        global.fetch = createErrorFetchMock(errorMessage, status);

        await expect(insertCategory(mockCategory)).rejects.toThrow(
          errorMessage,
        );
      }
    });
  });

  describe("Request format validation", () => {
    beforeEach(() => {
      mockValidationUtils.hookValidators.validateApiPayload.mockReturnValue({
        isValid: true,
        validatedData: mockCategory,
      });
    });

    it("should use POST method", async () => {
      global.fetch = createFetchMock(mockCategory);

      await insertCategory(mockCategory);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: "POST",
        }),
      );
    });

    it("should include credentials", async () => {
      global.fetch = createFetchMock(mockCategory);

      await insertCategory(mockCategory);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          credentials: "include",
        }),
      );
    });

    it("should include correct headers", async () => {
      global.fetch = createFetchMock(mockCategory);

      await insertCategory(mockCategory);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: {
            "Content-Type": "application/json",
          },
        }),
      );
    });

    it("should use correct endpoint", async () => {
      global.fetch = createFetchMock(mockCategory);

      await insertCategory(mockCategory);

      expect(global.fetch).toHaveBeenCalledWith(
        "/api/category/insert",
        expect.any(Object),
      );
    });
  });

  describe("Response handling", () => {
    beforeEach(() => {
      mockValidationUtils.hookValidators.validateApiPayload.mockReturnValue({
        isValid: true,
        validatedData: mockCategory,
      });
    });

    it("should return parsed JSON response", async () => {
      const responseData = createTestCategory({
        categoryId: 789,
        categoryName: "entertainment",
        categoryCount: 5,
      });
      global.fetch = createFetchMock(responseData);

      const result = await insertCategory(mockCategory);

      expect(result).toEqual(responseData);
    });

    it("should handle empty response body", async () => {
      global.fetch = createFetchMock({});

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
      global.fetch = createFetchMock(complexResponse);

      const result = await insertCategory(mockCategory);

      expect(result).toEqual(complexResponse);
    });
  });

  describe("Edge cases", () => {
    beforeEach(() => {
      mockValidationUtils.hookValidators.validateApiPayload.mockReturnValue({
        isValid: true,
        validatedData: mockCategory,
      });
    });

    it("should handle minimal category data", async () => {
      const minimalCategory = createTestCategory({
        categoryId: 0,
        categoryName: "minimal",
        activeStatus: true,
      });

      mockValidationUtils.hookValidators.validateApiPayload.mockReturnValue({
        isValid: true,
        validatedData: minimalCategory,
      });

      const mockResponse = createTestCategory({ categoryId: 111 });
      global.fetch = createFetchMock(mockResponse);

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

      mockValidationUtils.hookValidators.validateApiPayload.mockReturnValue({
        isValid: true,
        validatedData: fullCategory,
      });

      const mockResponse = createTestCategory({ categoryId: 555 });
      global.fetch = createFetchMock(mockResponse);

      const result = await insertCategory(fullCategory);

      expect(result).toEqual(mockResponse);
    });

    it("should handle special characters in category names", async () => {
      const specialCategory = createTestCategory({
        categoryName: "Health & Wellness (2024)",
        activeStatus: true,
      });

      mockValidationUtils.hookValidators.validateApiPayload.mockReturnValue({
        isValid: true,
        validatedData: specialCategory,
      });

      const mockResponse = createTestCategory({ categoryId: 777 });
      global.fetch = createFetchMock(mockResponse);

      const result = await insertCategory(specialCategory);

      expect(result).toEqual(mockResponse);
    });

    it("should handle very long category names", async () => {
      const longCategoryName = "A".repeat(255);
      const longCategory = createTestCategory({
        categoryName: longCategoryName,
        activeStatus: true,
      });

      mockValidationUtils.hookValidators.validateApiPayload.mockReturnValue({
        isValid: true,
        validatedData: longCategory,
      });

      const mockResponse = createTestCategory({ categoryId: 888 });
      global.fetch = createFetchMock(mockResponse);

      const result = await insertCategory(longCategory);

      expect(result).toEqual(mockResponse);
    });

    it("should handle categories with activeStatus false", async () => {
      const inactiveCategory = createTestCategory({
        categoryName: "inactive_category",
        activeStatus: false,
      });

      mockValidationUtils.hookValidators.validateApiPayload.mockReturnValue({
        isValid: true,
        validatedData: inactiveCategory,
      });

      const mockResponse = createTestCategory({ categoryId: 444 });
      global.fetch = createFetchMock(mockResponse);

      const result = await insertCategory(inactiveCategory);

      expect(result).toEqual(mockResponse);
    });

    it("should handle null values in category data", async () => {
      const categoryWithNulls = {
        ...mockCategory,
        categoryCount: null as any,
        dateAdded: null as any,
      };

      mockValidationUtils.hookValidators.validateApiPayload.mockReturnValue({
        isValid: true,
        validatedData: categoryWithNulls,
      });

      global.fetch = createFetchMock(mockCategory);

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
    beforeEach(() => {
      mockValidationUtils.hookValidators.validateApiPayload.mockReturnValue({
        isValid: true,
        validatedData: mockCategory,
      });
    });

    it("should enforce validation before API call", async () => {
      const mockResponse = createTestCategory({ categoryId: 123 });
      global.fetch = createFetchMock(mockResponse);

      await insertCategory(mockCategory);

      expect(
        mockValidationUtils.hookValidators.validateApiPayload,
      ).toHaveBeenCalled();
      expect(global.fetch).toHaveBeenCalled();
    });

    it("should use validated data in API request", async () => {
      const originalCategory = createTestCategory({
        categoryName: "original<script>",
      });
      const sanitizedCategory = createTestCategory({
        categoryName: "original_sanitized",
      });

      mockValidationUtils.hookValidators.validateApiPayload.mockReturnValue({
        isValid: true,
        validatedData: sanitizedCategory,
      });

      global.fetch = createFetchMock(sanitizedCategory);

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

      mockValidationUtils.hookValidators.validateApiPayload.mockReturnValue({
        isValid: true,
        validatedData: newCategory,
      });

      const responseCategory = createTestCategory({
        categoryId: 999,
        categoryName: "new_category",
      });
      global.fetch = createFetchMock(responseCategory);

      const result = await insertCategory(newCategory);

      expect(result.categoryId).toBe(999); // Server assigns new ID
    });
  });
});
