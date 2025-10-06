import Category from "../../model/Category";
import { ConsoleSpy, createTestCategory } from "../../testHelpers";
import {
  createModernFetchMock,
  createModernErrorFetchMock,
} from "../../testHelpers.modern";

import { updateCategory } from "../../hooks/useCategoryUpdate";

describe("updateCategory (Isolated)", () => {
  const mockOldCategory = createTestCategory({
    categoryId: 123,
    categoryName: "old_category",
    activeStatus: true,
    categoryCount: 5,
    dateAdded: new Date("2024-01-01"),
    dateUpdated: new Date("2024-01-01"),
  });

  const mockNewCategory = createTestCategory({
    ...mockOldCategory,
    categoryName: "updated_category",
    activeStatus: false,
    categoryCount: 10,
    dateUpdated: new Date("2024-01-15"),
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

  describe("Successful updates", () => {
    it("should update category successfully", async () => {
      const responseCategory = createTestCategory({
        ...mockNewCategory,
        dateUpdated: new Date("2024-01-20"),
      });
      global.fetch = createModernFetchMock(responseCategory);

      const result = await updateCategory(mockOldCategory, mockNewCategory);

      expect(result).toEqual(responseCategory);
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/category/old_category",
        expect.objectContaining({
          method: "PUT",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(mockNewCategory),
        }),
      );
    });

    it("should construct correct endpoint URL with old category name", async () => {
      const categoryWithDifferentName = createTestCategory({
        ...mockOldCategory,
        categoryName: "specific_category",
      });
      global.fetch = createModernFetchMock(mockNewCategory);

      await updateCategory(categoryWithDifferentName, mockNewCategory);

      expect(global.fetch).toHaveBeenCalledWith(
        "/api/category/specific_category",
        expect.any(Object),
      );
    });

    it("should send new category data in request body", async () => {
      const updatedCategoryData = createTestCategory({
        ...mockNewCategory,
        categoryName: "completely_new_name",
        categoryCount: 100,
      });
      global.fetch = createModernFetchMock(updatedCategoryData);

      await updateCategory(mockOldCategory, updatedCategoryData);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify(updatedCategoryData),
        }),
      );
    });

    it("should handle category name with special characters", async () => {
      const specialCategory = createTestCategory({
        ...mockOldCategory,
        categoryName: "category & subcategory",
      });
      global.fetch = createModernFetchMock(mockNewCategory);

      await updateCategory(specialCategory, mockNewCategory);

      expect(global.fetch).toHaveBeenCalledWith(
        "/api/category/category & subcategory",
        expect.any(Object),
      );
    });

    it("should return parsed JSON response", async () => {
      const responseData = createTestCategory({
        categoryId: 456,
        categoryName: "response_category",
        categoryCount: 25,
        additionalField: "extra data",
      });
      global.fetch = createModernFetchMock(responseData);

      const result = await updateCategory(mockOldCategory, mockNewCategory);

      expect(result).toEqual(responseData);
    });
  });

  describe("Error handling", () => {
    it("should handle 404 errors", async () => {
      global.fetch = createModernErrorFetchMock("Category not found", 404);

      await expect(
        updateCategory(mockOldCategory, mockNewCategory),
      ).rejects.toThrow("Category not found");
    });

    it("should handle server error responses", async () => {
      global.fetch = createModernErrorFetchMock("Invalid data", 400);

      await expect(
        updateCategory(mockOldCategory, mockNewCategory),
      ).rejects.toThrow("Invalid data");
    });

    it("should handle various HTTP error statuses", async () => {
      const errorStatuses = [
        { status: 400, message: "Bad Request" },
        { status: 401, message: "Unauthorized" },
        { status: 403, message: "Forbidden" },
        { status: 409, message: "Conflict" },
        { status: 422, message: "Unprocessable Entity" },
        { status: 500, message: "Internal Server Error" },
      ];

      for (const { status, message } of errorStatuses) {
        global.fetch = createModernErrorFetchMock(message, status);

        await expect(
          updateCategory(mockOldCategory, mockNewCategory),
        ).rejects.toThrow(message);
      }
    });

    it("should handle network errors", async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error("Network error"));

      await expect(
        updateCategory(mockOldCategory, mockNewCategory),
      ).rejects.toThrow("Network error");
    });

    it("should handle JSON parsing errors", async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: "OK",
        json: jest.fn().mockRejectedValueOnce(new Error("Invalid JSON")),
      });

      await expect(
        updateCategory(mockOldCategory, mockNewCategory),
      ).rejects.toThrow("Invalid JSON");
    });

    it("should handle fetch rejection", async () => {
      global.fetch = jest
        .fn()
        .mockRejectedValueOnce(new Error("Connection failed"));

      await expect(
        updateCategory(mockOldCategory, mockNewCategory),
      ).rejects.toThrow("Connection failed");
    });
  });

  describe("Request format validation", () => {
    it("should use PUT method", async () => {
      global.fetch = createModernFetchMock(mockNewCategory);

      await updateCategory(mockOldCategory, mockNewCategory);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: "PUT",
        }),
      );
    });

    it("should include credentials", async () => {
      global.fetch = createModernFetchMock(mockNewCategory);

      await updateCategory(mockOldCategory, mockNewCategory);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          credentials: "include",
        }),
      );
    });

    it("should include correct headers", async () => {
      global.fetch = createModernFetchMock(mockNewCategory);

      await updateCategory(mockOldCategory, mockNewCategory);

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

    it("should serialize new category data to JSON", async () => {
      global.fetch = createModernFetchMock(mockNewCategory);

      await updateCategory(mockOldCategory, mockNewCategory);

      const expectedBody = JSON.stringify(mockNewCategory);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expectedBody,
        }),
      );
    });
  });

  describe("Edge cases", () => {
    it("should handle category with empty old category name", async () => {
      const categoryWithEmptyName = createTestCategory({
        ...mockOldCategory,
        categoryName: "",
      });
      global.fetch = createModernFetchMock(mockNewCategory);

      await updateCategory(categoryWithEmptyName, mockNewCategory);

      expect(global.fetch).toHaveBeenCalledWith(
        "/api/category/",
        expect.any(Object),
      );
    });

    it("should handle complex category data updates", async () => {
      const complexOldCategory = createTestCategory({
        categoryId: 999,
        categoryName: "complex_old",
        activeStatus: true,
        categoryCount: 50,
        dateAdded: new Date("2023-01-01"),
        dateUpdated: new Date("2023-06-01"),
      });

      const complexNewCategory = createTestCategory({
        ...complexOldCategory,
        categoryName: "complex_new",
        activeStatus: false,
        categoryCount: 75,
        dateUpdated: new Date("2024-01-01"),
      });

      global.fetch = createModernFetchMock(complexNewCategory);

      const result = await updateCategory(
        complexOldCategory,
        complexNewCategory,
      );

      expect(result).toEqual(complexNewCategory);
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/category/complex_old",
        expect.objectContaining({
          body: JSON.stringify(complexNewCategory),
        }),
      );
    });

    it("should handle null values in category data", async () => {
      const categoryWithNulls = {
        ...mockNewCategory,
        categoryCount: null as any,
        dateAdded: null as any,
      };
      global.fetch = createModernFetchMock(mockNewCategory);

      await updateCategory(mockOldCategory, categoryWithNulls);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify(categoryWithNulls),
        }),
      );
    });

    it("should handle very long category names", async () => {
      const longCategoryName = "A".repeat(255);
      const longNameCategory = createTestCategory({
        ...mockOldCategory,
        categoryName: longCategoryName,
      });
      global.fetch = createModernFetchMock(mockNewCategory);

      await updateCategory(longNameCategory, mockNewCategory);

      expect(global.fetch).toHaveBeenCalledWith(
        `/api/category/${longCategoryName}`,
        expect.any(Object),
      );
    });

    it("should handle updating all category properties", async () => {
      const fullyUpdatedCategory = createTestCategory({
        categoryId: mockOldCategory.categoryId, // Should preserve ID
        categoryName: "completely_different",
        activeStatus: !mockOldCategory.activeStatus,
        categoryCount: 999,
        dateAdded: new Date("2025-01-01"),
        dateUpdated: new Date("2025-01-15"),
      });
      global.fetch = createModernFetchMock(fullyUpdatedCategory);

      const result = await updateCategory(
        mockOldCategory,
        fullyUpdatedCategory,
      );

      expect(result).toEqual(fullyUpdatedCategory);
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/category/old_category", // Uses old category name in endpoint
        expect.objectContaining({
          body: JSON.stringify(fullyUpdatedCategory), // Sends new data
        }),
      );
    });
  });

  describe("Response handling", () => {
    it("should handle empty response body", async () => {
      global.fetch = createModernFetchMock({});

      const result = await updateCategory(mockOldCategory, mockNewCategory);

      expect(result).toEqual({});
    });

    it("should handle response with additional fields", async () => {
      const responseWithExtras = createTestCategory({
        ...mockNewCategory,
        serverTimestamp: "2024-01-20T10:00:00Z",
        version: 2,
        metadata: { lastModifiedBy: "admin" },
      });
      global.fetch = createModernFetchMock(responseWithExtras);

      const result = await updateCategory(mockOldCategory, mockNewCategory);

      expect(result).toEqual(responseWithExtras);
    });

    it("should handle different success status codes", async () => {
      const successStatuses = [200, 202];

      for (const status of successStatuses) {
        const responseCategory = createTestCategory({
          categoryId: status, // Use status as ID for uniqueness
        });
        global.fetch = createModernFetchMock(responseCategory, { status });

        const result = await updateCategory(mockOldCategory, mockNewCategory);

        expect(result).toEqual(responseCategory);
      }
    });
  });

  describe("Business logic validation", () => {
    it("should use old category name for endpoint regardless of new name", async () => {
      const newCategoryWithDifferentName = createTestCategory({
        ...mockNewCategory,
        categoryName: "totally_different_name",
      });
      global.fetch = createModernFetchMock(newCategoryWithDifferentName);

      await updateCategory(mockOldCategory, newCategoryWithDifferentName);

      // Should still use old category name in endpoint
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/category/old_category",
        expect.any(Object),
      );

      // But send new data in body
      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify(newCategoryWithDifferentName),
        }),
      );
    });

    it("should preserve category ID in update operations", async () => {
      const updatedCategory = createTestCategory({
        ...mockNewCategory,
        categoryId: mockOldCategory.categoryId, // Should preserve ID
      });
      global.fetch = createModernFetchMock(updatedCategory);

      const result = await updateCategory(mockOldCategory, updatedCategory);

      expect(result.categoryId).toBe(mockOldCategory.categoryId);
    });

    it("should allow updating status from active to inactive", async () => {
      const activeCategory = createTestCategory({
        categoryName: "active_category",
        activeStatus: true,
      });
      const inactiveCategory = createTestCategory({
        ...activeCategory,
        activeStatus: false,
      });
      global.fetch = createModernFetchMock(inactiveCategory);

      const result = await updateCategory(activeCategory, inactiveCategory);

      expect(result.activeStatus).toBe(false);
    });

    it("should allow updating category count", async () => {
      const categoryWithCount = createTestCategory({
        categoryName: "counted_category",
        categoryCount: 5,
      });
      const updatedCountCategory = createTestCategory({
        ...categoryWithCount,
        categoryCount: 15,
      });
      global.fetch = createModernFetchMock(updatedCountCategory);

      const result = await updateCategory(
        categoryWithCount,
        updatedCountCategory,
      );

      expect(result.categoryCount).toBe(15);
    });
  });
});
