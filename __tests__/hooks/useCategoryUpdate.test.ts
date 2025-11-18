/**
 * TDD Tests for Modern useCategoryUpdate
 * Modern endpoint: PUT /api/category/{categoryName}
 *
 * Key differences from legacy:
 * - Endpoint: /api/category/{categoryName} (vs /api/category/update/{categoryId})
 * - Uses categoryName instead of categoryId in URL path
 * - Sends newCategory in request body
 * - Uses ServiceResult pattern for errors
 */

import { ConsoleSpy } from "../../testHelpers";
import { createModernFetchMock } from "../../testHelpers";
import Category from "../../model/Category";

// Modern implementation to test
const updateCategoryModern = async (
  oldCategory: Category,
  newCategory: Category,
): Promise<Category> => {
  const endpoint = `/api/category/${oldCategory.categoryName}`;
  try {
    const response = await fetch(endpoint, {
      method: "PUT",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(newCategory),
    });

    if (!response.ok) {
      const errorBody = await response
        .json()
        .catch(() => ({ error: `HTTP error! Status: ${response.status}` }));
      const errorMessage =
        errorBody.error ||
        errorBody.errors?.join(", ") ||
        `HTTP error! Status: ${response.status}`;
      throw new Error(errorMessage);
    }

    return await response.json();
  } catch (error: any) {
    console.error(`An error occurred: ${error.message}`);
    throw error;
  }
};

// Helper function to create test category data
const createTestCategory = (overrides: Partial<Category> = {}): Category => ({
  categoryId: 1,
  categoryName: "test_category",
  activeStatus: true,
  ...overrides,
});

describe("useCategoryUpdate Modern Endpoint (TDD)", () => {
  let consoleSpy: ConsoleSpy;

  beforeEach(() => {
    consoleSpy = new ConsoleSpy();
    jest.clearAllMocks();
  });

  afterEach(() => {
    consoleSpy.stop();
  });

  describe("Modern endpoint behavior", () => {
    it("should use modern endpoint /api/category/{categoryName}", async () => {
      const oldCategory = createTestCategory({
        categoryId: 123,
        categoryName: "groceries",
      });
      const newCategory = createTestCategory({
        categoryId: 123,
        categoryName: "groceries",
        activeStatus: false,
      });

      global.fetch = createModernFetchMock(newCategory);

      await updateCategoryModern(oldCategory, newCategory);

      expect(fetch).toHaveBeenCalledWith("/api/category/groceries", {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(newCategory),
      });
    });

    it("should update category successfully", async () => {
      const oldCategory = createTestCategory({
        categoryId: 1,
        categoryName: "groceries",
        activeStatus: true,
      });
      const newCategory = createTestCategory({
        categoryId: 1,
        categoryName: "groceries",
        activeStatus: false,
      });

      global.fetch = createModernFetchMock(newCategory);

      const result = await updateCategoryModern(oldCategory, newCategory);

      expect(result).toEqual(newCategory);
      expect(result.activeStatus).toBe(false);
    });

    it("should send newCategory in request body", async () => {
      const oldCategory = createTestCategory({
        categoryId: 1,
        categoryName: "dining",
      });
      const newCategory = createTestCategory({
        categoryId: 1,
        categoryName: "dining",
        activeStatus: false,
      });

      global.fetch = createModernFetchMock(newCategory);

      await updateCategoryModern(oldCategory, newCategory);

      const callArgs = (fetch as jest.Mock).mock.calls[0][1];
      expect(callArgs.body).toBe(JSON.stringify(newCategory));
    });

    it("should use categoryName from oldCategory in URL", async () => {
      const oldCategory = createTestCategory({
        categoryId: 999,
        categoryName: "entertainment",
      });
      const newCategory = createTestCategory({
        categoryId: 999,
        categoryName: "entertainment",
      });

      global.fetch = createModernFetchMock(newCategory);

      await updateCategoryModern(oldCategory, newCategory);

      expect(fetch).toHaveBeenCalledWith(
        "/api/category/entertainment",
        expect.any(Object),
      );
    });
  });

  describe("Modern error handling with ServiceResult pattern", () => {
    it("should handle 404 not found with modern error format", async () => {
      const oldCategory = createTestCategory({
        categoryId: 999,
        categoryName: "nonexistent",
      });
      const newCategory = createTestCategory({
        categoryId: 999,
        categoryName: "nonexistent",
      });

      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({ error: "Category not found" }),
      });

      consoleSpy.start();

      await expect(
        updateCategoryModern(oldCategory, newCategory),
      ).rejects.toThrow("Category not found");
    });

    it("should handle validation errors with modern format", async () => {
      const oldCategory = createTestCategory({ categoryName: "groceries" });
      const newCategory = createTestCategory({ categoryName: "" });

      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({
          errors: [
            "categoryName is required",
            "categoryName must be non-empty",
          ],
        }),
      });

      consoleSpy.start();

      await expect(
        updateCategoryModern(oldCategory, newCategory),
      ).rejects.toThrow(
        "categoryName is required, categoryName must be non-empty",
      );
    });

    it("should handle 401 unauthorized", async () => {
      const oldCategory = createTestCategory();
      const newCategory = createTestCategory();

      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ error: "Unauthorized" }),
      });

      consoleSpy.start();

      await expect(
        updateCategoryModern(oldCategory, newCategory),
      ).rejects.toThrow("Unauthorized");
    });

    it("should handle 403 forbidden", async () => {
      const oldCategory = createTestCategory();
      const newCategory = createTestCategory();

      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 403,
        json: async () => ({ error: "Forbidden" }),
      });

      consoleSpy.start();

      await expect(
        updateCategoryModern(oldCategory, newCategory),
      ).rejects.toThrow("Forbidden");
    });

    it("should handle 500 server error", async () => {
      const oldCategory = createTestCategory();
      const newCategory = createTestCategory();

      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ error: "Internal server error" }),
      });

      consoleSpy.start();

      await expect(
        updateCategoryModern(oldCategory, newCategory),
      ).rejects.toThrow("Internal server error");
    });

    it("should handle error response without error field", async () => {
      const oldCategory = createTestCategory();
      const newCategory = createTestCategory();

      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({}),
      });

      consoleSpy.start();

      await expect(
        updateCategoryModern(oldCategory, newCategory),
      ).rejects.toThrow("HTTP error! Status: 400");
    });

    it("should handle invalid JSON in error response", async () => {
      const oldCategory = createTestCategory();
      const newCategory = createTestCategory();

      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: jest.fn().mockRejectedValue(new Error("Invalid JSON")),
      });

      consoleSpy.start();

      await expect(
        updateCategoryModern(oldCategory, newCategory),
      ).rejects.toThrow("HTTP error! Status: 500");
    });
  });

  describe("Network and connectivity errors", () => {
    it("should handle network errors", async () => {
      const oldCategory = createTestCategory();
      const newCategory = createTestCategory();

      global.fetch = jest.fn().mockRejectedValue(new Error("Network error"));

      consoleSpy.start();

      await expect(
        updateCategoryModern(oldCategory, newCategory),
      ).rejects.toThrow("Network error");

      const calls = consoleSpy.getCalls();
      expect(
        calls.error.some((call) => call[0].includes("An error occurred:")),
      ).toBe(true);
    });

    it("should handle timeout errors", async () => {
      const oldCategory = createTestCategory();
      const newCategory = createTestCategory();

      global.fetch = jest.fn().mockRejectedValue(new Error("Timeout"));

      consoleSpy.start();

      await expect(
        updateCategoryModern(oldCategory, newCategory),
      ).rejects.toThrow("Timeout");
    });

    it("should handle connection refused", async () => {
      const oldCategory = createTestCategory();
      const newCategory = createTestCategory();

      global.fetch = jest
        .fn()
        .mockRejectedValue(new Error("Connection refused"));

      consoleSpy.start();

      await expect(
        updateCategoryModern(oldCategory, newCategory),
      ).rejects.toThrow("Connection refused");
    });
  });

  describe("Request configuration", () => {
    it("should use PUT method", async () => {
      const oldCategory = createTestCategory();
      const newCategory = createTestCategory();

      global.fetch = createModernFetchMock(newCategory);

      await updateCategoryModern(oldCategory, newCategory);

      const callArgs = (fetch as jest.Mock).mock.calls[0][1];
      expect(callArgs.method).toBe("PUT");
    });

    it("should include credentials", async () => {
      const oldCategory = createTestCategory();
      const newCategory = createTestCategory();

      global.fetch = createModernFetchMock(newCategory);

      await updateCategoryModern(oldCategory, newCategory);

      const callArgs = (fetch as jest.Mock).mock.calls[0][1];
      expect(callArgs.credentials).toBe("include");
    });

    it("should include correct headers", async () => {
      const oldCategory = createTestCategory();
      const newCategory = createTestCategory();

      global.fetch = createModernFetchMock(newCategory);

      await updateCategoryModern(oldCategory, newCategory);

      const callArgs = (fetch as jest.Mock).mock.calls[0][1];
      expect(callArgs.headers).toEqual({
        "Content-Type": "application/json",
        Accept: "application/json",
      });
    });
  });

  describe("Category field updates", () => {
    it("should update category name", async () => {
      const oldCategory = createTestCategory({
        categoryName: "groceries",
      });
      const newCategory = createTestCategory({
        categoryName: "food",
      });

      global.fetch = createModernFetchMock(newCategory);

      const result = await updateCategoryModern(oldCategory, newCategory);

      expect(result.categoryName).toBe("food");
    });

    it("should update activeStatus", async () => {
      const oldCategory = createTestCategory({
        categoryName: "dining",
        activeStatus: true,
      });
      const newCategory = createTestCategory({
        categoryName: "dining",
        activeStatus: false,
      });

      global.fetch = createModernFetchMock(newCategory);

      const result = await updateCategoryModern(oldCategory, newCategory);

      expect(result.activeStatus).toBe(false);
    });

    it("should update multiple fields simultaneously", async () => {
      const oldCategory = createTestCategory({
        categoryId: 1,
        categoryName: "groceries",
        activeStatus: true,
      });
      const newCategory = createTestCategory({
        categoryId: 1,
        categoryName: "food",
        activeStatus: false,
      });

      global.fetch = createModernFetchMock(newCategory);

      const result = await updateCategoryModern(oldCategory, newCategory);

      expect(result.categoryName).toBe("food");
      expect(result.activeStatus).toBe(false);
    });

    it("should activate inactive category", async () => {
      const oldCategory = createTestCategory({
        categoryName: "archived",
        activeStatus: false,
      });
      const newCategory = createTestCategory({
        categoryName: "archived",
        activeStatus: true,
      });

      global.fetch = createModernFetchMock(newCategory);

      const result = await updateCategoryModern(oldCategory, newCategory);

      expect(result.activeStatus).toBe(true);
    });
  });

  describe("Edge cases", () => {
    it("should handle categories with special characters", async () => {
      const oldCategory = createTestCategory({ categoryName: "old-cat" });
      const newCategory = createTestCategory({
        categoryName: "category-with_special.chars",
      });

      global.fetch = createModernFetchMock(newCategory);

      const result = await updateCategoryModern(oldCategory, newCategory);

      expect(result.categoryName).toBe("category-with_special.chars");
    });

    it("should handle categories with Unicode characters", async () => {
      const oldCategory = createTestCategory({ categoryName: "food" });
      const newCategory = createTestCategory({
        categoryName: "食品 🍔",
      });

      global.fetch = createModernFetchMock(newCategory);

      const result = await updateCategoryModern(oldCategory, newCategory);

      expect(result.categoryName).toBe("食品 🍔");
    });

    it("should handle categories with empty values", async () => {
      const oldCategory = createTestCategory({ categoryName: "groceries" });
      const newCategory = createTestCategory({ categoryName: "" });

      global.fetch = createModernFetchMock(newCategory);

      const result = await updateCategoryModern(oldCategory, newCategory);

      expect(result.categoryName).toBe("");
    });

    it("should handle categories with very long names", async () => {
      const longName = "a".repeat(10000);
      const oldCategory = createTestCategory({ categoryName: "short" });
      const newCategory = createTestCategory({ categoryName: longName });

      global.fetch = createModernFetchMock(newCategory);

      const result = await updateCategoryModern(oldCategory, newCategory);

      expect(result.categoryName).toBe(longName);
      expect(result.categoryName.length).toBe(10000);
    });

    it("should handle URL encoding for category names with spaces", async () => {
      const oldCategory = createTestCategory({ categoryName: "dining out" });
      const newCategory = createTestCategory({ categoryName: "dining out" });

      global.fetch = createModernFetchMock(newCategory);

      await updateCategoryModern(oldCategory, newCategory);

      expect(fetch).toHaveBeenCalledWith(
        "/api/category/dining out",
        expect.any(Object),
      );
    });

    it("should handle categories with numbers", async () => {
      const oldCategory = createTestCategory({ categoryName: "category_1" });
      const newCategory = createTestCategory({ categoryName: "category_2" });

      global.fetch = createModernFetchMock(newCategory);

      const result = await updateCategoryModern(oldCategory, newCategory);

      expect(result.categoryName).toBe("category_2");
    });
  });

  describe("Common update scenarios", () => {
    it("should rename groceries to food", async () => {
      const oldCategory = createTestCategory({
        categoryId: 1,
        categoryName: "groceries",
        activeStatus: true,
      });
      const newCategory = createTestCategory({
        categoryId: 1,
        categoryName: "food",
        activeStatus: true,
      });

      global.fetch = createModernFetchMock(newCategory);

      const result = await updateCategoryModern(oldCategory, newCategory);

      expect(result.categoryName).toBe("food");
      expect(result.activeStatus).toBe(true);
    });

    it("should deactivate dining category", async () => {
      const oldCategory = createTestCategory({
        categoryName: "dining",
        activeStatus: true,
      });
      const newCategory = createTestCategory({
        categoryName: "dining",
        activeStatus: false,
      });

      global.fetch = createModernFetchMock(newCategory);

      const result = await updateCategoryModern(oldCategory, newCategory);

      expect(result.categoryName).toBe("dining");
      expect(result.activeStatus).toBe(false);
    });

    it("should reactivate archived category", async () => {
      const oldCategory = createTestCategory({
        categoryName: "entertainment",
        activeStatus: false,
      });
      const newCategory = createTestCategory({
        categoryName: "entertainment",
        activeStatus: true,
      });

      global.fetch = createModernFetchMock(newCategory);

      const result = await updateCategoryModern(oldCategory, newCategory);

      expect(result.activeStatus).toBe(true);
    });

    it("should update transportation category", async () => {
      const oldCategory = createTestCategory({
        categoryName: "transportation",
        activeStatus: true,
      });
      const newCategory = createTestCategory({
        categoryName: "travel",
        activeStatus: true,
      });

      global.fetch = createModernFetchMock(newCategory);

      const result = await updateCategoryModern(oldCategory, newCategory);

      expect(result.categoryName).toBe("travel");
    });

    it("should update utilities category", async () => {
      const oldCategory = createTestCategory({
        categoryName: "utilities",
        activeStatus: true,
      });
      const newCategory = createTestCategory({
        categoryName: "bills",
        activeStatus: true,
      });

      global.fetch = createModernFetchMock(newCategory);

      const result = await updateCategoryModern(oldCategory, newCategory);

      expect(result.categoryName).toBe("bills");
    });

    it("should update healthcare category status", async () => {
      const oldCategory = createTestCategory({
        categoryName: "healthcare",
        activeStatus: true,
      });
      const newCategory = createTestCategory({
        categoryName: "healthcare",
        activeStatus: false,
      });

      global.fetch = createModernFetchMock(newCategory);

      const result = await updateCategoryModern(oldCategory, newCategory);

      expect(result.categoryName).toBe("healthcare");
      expect(result.activeStatus).toBe(false);
    });

    it("should update shopping category name", async () => {
      const oldCategory = createTestCategory({
        categoryName: "shopping",
        activeStatus: true,
      });
      const newCategory = createTestCategory({
        categoryName: "retail",
        activeStatus: true,
      });

      global.fetch = createModernFetchMock(newCategory);

      const result = await updateCategoryModern(oldCategory, newCategory);

      expect(result.categoryName).toBe("retail");
    });
  });

  describe("Data integrity", () => {
    it("should preserve categoryId", async () => {
      const oldCategory = createTestCategory({
        categoryId: 123,
        categoryName: "test",
      });
      const newCategory = createTestCategory({
        categoryId: 123,
        categoryName: "test",
      });

      global.fetch = createModernFetchMock(newCategory);

      const result = await updateCategoryModern(oldCategory, newCategory);

      expect(result.categoryId).toBe(123);
    });

    it("should return updated category exactly as received from API", async () => {
      const oldCategory = createTestCategory({ categoryName: "old" });
      const newCategory = createTestCategory({
        categoryId: 1,
        categoryName: "updated_category",
        activeStatus: false,
      });

      global.fetch = createModernFetchMock(newCategory);

      const result = await updateCategoryModern(oldCategory, newCategory);

      expect(result).toEqual(newCategory);
    });
  });
});
