/**
 * TDD Tests for Modern useCategoryInsert
 * Modern endpoint: POST /api/category
 *
 * Key differences from legacy:
 * - Endpoint: /api/category (vs /api/category/insert)
 * - Uses ServiceResult pattern for errors
 * - Error format: { error: "message" } or { errors: [...] }
 */

import { ConsoleSpy } from "../../testHelpers";
import { createModernFetchMock } from "../../testHelpers";
import Category from "../../model/Category";

// Modern implementation to test
const insertCategoryModern = async (payload: Category): Promise<Category> => {
  try {
    const endpoint = "/api/category";

    const response = await fetch(endpoint, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
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

    return response.status !== 204 ? await response.json() : payload;
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

describe("useCategoryInsert Modern Endpoint (TDD)", () => {
  let consoleSpy: ConsoleSpy;

  beforeEach(() => {
    consoleSpy = new ConsoleSpy();
    jest.clearAllMocks();
  });

  afterEach(() => {
    consoleSpy.stop();
  });

  describe("Modern endpoint behavior", () => {
    it("should use modern endpoint /api/category", async () => {
      const testCategory = createTestCategory();
      global.fetch = createModernFetchMock(testCategory);

      await insertCategoryModern(testCategory);

      expect(fetch).toHaveBeenCalledWith("/api/category", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(testCategory),
      });
    });

    it("should insert category successfully", async () => {
      const testCategory = createTestCategory({
        categoryName: "groceries",
        activeStatus: true,
      });

      global.fetch = createModernFetchMock(testCategory);

      const result = await insertCategoryModern(testCategory);

      expect(result).toEqual(testCategory);
    });

    it("should handle 204 No Content response", async () => {
      const testCategory = createTestCategory();

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 204,
        json: async () => {
          throw new Error("No content");
        },
      });

      const result = await insertCategoryModern(testCategory);

      expect(result).toEqual(testCategory);
    });

    it("should return category with 201 Created status", async () => {
      const testCategory = createTestCategory({
        categoryId: 1,
        categoryName: "dining",
      });

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 201,
        json: async () => testCategory,
      });

      const result = await insertCategoryModern(testCategory);

      expect(result).toEqual(testCategory);
    });
  });

  describe("Modern error handling with ServiceResult pattern", () => {
    it("should handle validation errors with modern format", async () => {
      const testCategory = createTestCategory();

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

      await expect(insertCategoryModern(testCategory)).rejects.toThrow(
        "categoryName is required, categoryName must be non-empty",
      );
    });

    it("should handle duplicate category error", async () => {
      const testCategory = createTestCategory({
        categoryName: "groceries",
      });

      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 409,
        json: async () => ({
          error: "Category groceries already exists",
        }),
      });

      consoleSpy.start();

      await expect(insertCategoryModern(testCategory)).rejects.toThrow(
        "Category groceries already exists",
      );
    });

    it("should handle 401 unauthorized", async () => {
      const testCategory = createTestCategory();

      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ error: "Unauthorized" }),
      });

      consoleSpy.start();

      await expect(insertCategoryModern(testCategory)).rejects.toThrow(
        "Unauthorized",
      );
    });

    it("should handle 403 forbidden", async () => {
      const testCategory = createTestCategory();

      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 403,
        json: async () => ({ error: "Forbidden" }),
      });

      consoleSpy.start();

      await expect(insertCategoryModern(testCategory)).rejects.toThrow(
        "Forbidden",
      );
    });

    it("should handle 500 server error", async () => {
      const testCategory = createTestCategory();

      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ error: "Internal server error" }),
      });

      consoleSpy.start();

      await expect(insertCategoryModern(testCategory)).rejects.toThrow(
        "Internal server error",
      );
    });

    it("should handle error response without error field", async () => {
      const testCategory = createTestCategory();

      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({}),
      });

      consoleSpy.start();

      await expect(insertCategoryModern(testCategory)).rejects.toThrow(
        "HTTP error! Status: 400",
      );
    });

    it("should handle invalid JSON in error response", async () => {
      const testCategory = createTestCategory();

      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: jest.fn().mockRejectedValue(new Error("Invalid JSON")),
      });

      consoleSpy.start();

      await expect(insertCategoryModern(testCategory)).rejects.toThrow(
        "HTTP error! Status: 500",
      );
    });
  });

  describe("Network and connectivity errors", () => {
    it("should handle network errors", async () => {
      const testCategory = createTestCategory();

      global.fetch = jest.fn().mockRejectedValue(new Error("Network error"));

      consoleSpy.start();

      await expect(insertCategoryModern(testCategory)).rejects.toThrow(
        "Network error",
      );

      const calls = consoleSpy.getCalls();
      expect(
        calls.error.some((call) => call[0].includes("An error occurred:")),
      ).toBe(true);
    });

    it("should handle timeout errors", async () => {
      const testCategory = createTestCategory();

      global.fetch = jest.fn().mockRejectedValue(new Error("Timeout"));

      consoleSpy.start();

      await expect(insertCategoryModern(testCategory)).rejects.toThrow(
        "Timeout",
      );
    });

    it("should handle connection refused", async () => {
      const testCategory = createTestCategory();

      global.fetch = jest
        .fn()
        .mockRejectedValue(new Error("Connection refused"));

      consoleSpy.start();

      await expect(insertCategoryModern(testCategory)).rejects.toThrow(
        "Connection refused",
      );
    });
  });

  describe("Request body and headers", () => {
    it("should use POST method", async () => {
      const testCategory = createTestCategory();
      global.fetch = createModernFetchMock(testCategory);

      await insertCategoryModern(testCategory);

      const callArgs = (fetch as jest.Mock).mock.calls[0][1];
      expect(callArgs.method).toBe("POST");
    });

    it("should include credentials", async () => {
      const testCategory = createTestCategory();
      global.fetch = createModernFetchMock(testCategory);

      await insertCategoryModern(testCategory);

      const callArgs = (fetch as jest.Mock).mock.calls[0][1];
      expect(callArgs.credentials).toBe("include");
    });

    it("should include correct headers", async () => {
      const testCategory = createTestCategory();
      global.fetch = createModernFetchMock(testCategory);

      await insertCategoryModern(testCategory);

      const callArgs = (fetch as jest.Mock).mock.calls[0][1];
      expect(callArgs.headers).toEqual({
        "Content-Type": "application/json",
        Accept: "application/json",
      });
    });

    it("should send category as JSON in request body", async () => {
      const testCategory = createTestCategory({
        categoryName: "entertainment",
        activeStatus: true,
      });

      global.fetch = createModernFetchMock(testCategory);

      await insertCategoryModern(testCategory);

      const callArgs = (fetch as jest.Mock).mock.calls[0][1];
      expect(callArgs.body).toBe(JSON.stringify(testCategory));
    });
  });

  describe("Data integrity and validation", () => {
    it("should preserve all category fields", async () => {
      const testCategory = createTestCategory({
        categoryId: 999,
        categoryName: "complete_category",
        activeStatus: true,
      });

      global.fetch = createModernFetchMock(testCategory);

      const result = await insertCategoryModern(testCategory);

      expect(result).toEqual(testCategory);
      expect(result.categoryId).toBe(999);
      expect(result.categoryName).toBe("complete_category");
      expect(result.activeStatus).toBe(true);
    });

    it("should handle active categories", async () => {
      const testCategory = createTestCategory({
        categoryName: "groceries",
        activeStatus: true,
      });

      global.fetch = createModernFetchMock(testCategory);

      const result = await insertCategoryModern(testCategory);

      expect(result.activeStatus).toBe(true);
    });

    it("should handle inactive categories", async () => {
      const testCategory = createTestCategory({
        categoryName: "archived",
        activeStatus: false,
      });

      global.fetch = createModernFetchMock(testCategory);

      const result = await insertCategoryModern(testCategory);

      expect(result.activeStatus).toBe(false);
    });
  });

  describe("Edge cases", () => {
    it("should handle categories with special characters", async () => {
      const testCategory = createTestCategory({
        categoryName: "category-with_special.chars",
      });

      global.fetch = createModernFetchMock(testCategory);

      const result = await insertCategoryModern(testCategory);

      expect(result.categoryName).toBe("category-with_special.chars");
    });

    it("should handle categories with Unicode characters", async () => {
      const testCategory = createTestCategory({
        categoryName: "食品 🍔",
      });

      global.fetch = createModernFetchMock(testCategory);

      const result = await insertCategoryModern(testCategory);

      expect(result.categoryName).toBe("食品 🍔");
    });

    it("should handle categories with empty values", async () => {
      const testCategory = createTestCategory({
        categoryName: "",
      });

      global.fetch = createModernFetchMock(testCategory);

      const result = await insertCategoryModern(testCategory);

      expect(result.categoryName).toBe("");
    });

    it("should handle categories with long names", async () => {
      const longName = "a".repeat(255);
      const testCategory = createTestCategory({
        categoryName: longName,
      });

      global.fetch = createModernFetchMock(testCategory);

      const result = await insertCategoryModern(testCategory);

      expect(result.categoryName).toBe(longName);
      expect(result.categoryName.length).toBe(255);
    });

    it("should handle categories with whitespace", async () => {
      const testCategory = createTestCategory({
        categoryName: "  category with spaces  ",
      });

      global.fetch = createModernFetchMock(testCategory);

      const result = await insertCategoryModern(testCategory);

      expect(result.categoryName).toBe("  category with spaces  ");
    });

    it("should handle categories with numbers", async () => {
      const testCategory = createTestCategory({
        categoryName: "category_123",
      });

      global.fetch = createModernFetchMock(testCategory);

      const result = await insertCategoryModern(testCategory);

      expect(result.categoryName).toBe("category_123");
    });
  });

  describe("Common category scenarios", () => {
    it("should insert groceries category", async () => {
      const testCategory = createTestCategory({
        categoryName: "groceries",
        activeStatus: true,
      });

      global.fetch = createModernFetchMock(testCategory);

      const result = await insertCategoryModern(testCategory);

      expect(result.categoryName).toBe("groceries");
      expect(result.activeStatus).toBe(true);
    });

    it("should insert dining category", async () => {
      const testCategory = createTestCategory({
        categoryName: "dining",
        activeStatus: true,
      });

      global.fetch = createModernFetchMock(testCategory);

      const result = await insertCategoryModern(testCategory);

      expect(result.categoryName).toBe("dining");
    });

    it("should insert entertainment category", async () => {
      const testCategory = createTestCategory({
        categoryName: "entertainment",
        activeStatus: true,
      });

      global.fetch = createModernFetchMock(testCategory);

      const result = await insertCategoryModern(testCategory);

      expect(result.categoryName).toBe("entertainment");
    });

    it("should insert transportation category", async () => {
      const testCategory = createTestCategory({
        categoryName: "transportation",
        activeStatus: true,
      });

      global.fetch = createModernFetchMock(testCategory);

      const result = await insertCategoryModern(testCategory);

      expect(result.categoryName).toBe("transportation");
    });

    it("should insert utilities category", async () => {
      const testCategory = createTestCategory({
        categoryName: "utilities",
        activeStatus: true,
      });

      global.fetch = createModernFetchMock(testCategory);

      const result = await insertCategoryModern(testCategory);

      expect(result.categoryName).toBe("utilities");
    });

    it("should insert healthcare category", async () => {
      const testCategory = createTestCategory({
        categoryName: "healthcare",
        activeStatus: true,
      });

      global.fetch = createModernFetchMock(testCategory);

      const result = await insertCategoryModern(testCategory);

      expect(result.categoryName).toBe("healthcare");
    });

    it("should insert shopping category", async () => {
      const testCategory = createTestCategory({
        categoryName: "shopping",
        activeStatus: true,
      });

      global.fetch = createModernFetchMock(testCategory);

      const result = await insertCategoryModern(testCategory);

      expect(result.categoryName).toBe("shopping");
    });

    it("should insert multiple expense categories", async () => {
      const expenseCategories = [
        { categoryName: "groceries" },
        { categoryName: "dining" },
        { categoryName: "entertainment" },
        { categoryName: "transportation" },
      ];

      for (const config of expenseCategories) {
        const testCategory = createTestCategory(config);
        global.fetch = createModernFetchMock(testCategory);

        const result = await insertCategoryModern(testCategory);

        expect(result.categoryName).toBe(config.categoryName);
        expect(result.activeStatus).toBe(true);
      }
    });
  });
});
