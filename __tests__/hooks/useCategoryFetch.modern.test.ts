/**
 * TDD Tests for Modern useCategoryFetch
 * Modern endpoint: GET /api/category/active
 *
 * Key differences from legacy:
 * - Endpoint: /api/category/active (vs /api/category/select/active)
 * - Uses ServiceResult pattern for errors
 * - Error format: { error: "message" }
 */

import { ConsoleSpy } from "../../testHelpers";
import { createModernFetchMock } from "../../testHelpers.modern";
import Category from "../../model/Category";

// Modern implementation to test
const fetchCategoryDataModern = async (): Promise<Category[]> => {
  try {
    const response = await fetch("/api/category/active", {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({ error: `HTTP error! Status: ${response.status}` }));
      throw new Error(errorBody.error || `HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error("Error fetching category data:", error);
    throw new Error(`Failed to fetch category data: ${error.message}`);
  }
};

// Helper function to create test category data
const createTestCategory = (
  overrides: Partial<Category> = {},
): Category => ({
  categoryId: 1,
  categoryName: "test_category",
  activeStatus: true,
  ...overrides,
});

describe("useCategoryFetch Modern Endpoint (TDD)", () => {
  let consoleSpy: ConsoleSpy;

  beforeEach(() => {
    consoleSpy = new ConsoleSpy();
    jest.clearAllMocks();
  });

  afterEach(() => {
    consoleSpy.stop();
  });

  describe("Modern endpoint behavior", () => {
    it("should use modern endpoint /api/category/active", async () => {
      global.fetch = createModernFetchMock([]);

      await fetchCategoryDataModern();

      expect(fetch).toHaveBeenCalledWith("/api/category/active", {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });
    });

    it("should return empty array when no categories exist", async () => {
      global.fetch = createModernFetchMock([]);

      const result = await fetchCategoryDataModern();

      expect(result).toEqual([]);
      expect(Array.isArray(result)).toBe(true);
    });

    it("should fetch categories successfully", async () => {
      const testCategories = [
        createTestCategory({ categoryId: 1, categoryName: "groceries" }),
        createTestCategory({ categoryId: 2, categoryName: "dining" }),
      ];

      global.fetch = createModernFetchMock(testCategories);

      const result = await fetchCategoryDataModern();

      expect(result).toEqual(testCategories);
      expect(result).toHaveLength(2);
    });
  });

  describe("Modern error handling with ServiceResult pattern", () => {
    it("should handle 401 unauthorized with modern error format", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ error: "Unauthorized access" }),
      });

      consoleSpy.start();

      await expect(fetchCategoryDataModern()).rejects.toThrow(
        "Failed to fetch category data: Unauthorized access",
      );
    });

    it("should handle 403 forbidden with modern error format", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 403,
        json: async () => ({ error: "Forbidden" }),
      });

      consoleSpy.start();

      await expect(fetchCategoryDataModern()).rejects.toThrow(
        "Failed to fetch category data: Forbidden",
      );
    });

    it("should handle 500 server error with modern error format", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ error: "Internal server error" }),
      });

      consoleSpy.start();

      await expect(fetchCategoryDataModern()).rejects.toThrow(
        "Failed to fetch category data: Internal server error",
      );
    });

    it("should handle 404 error with modern format", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({ error: "Not found" }),
      });

      consoleSpy.start();

      await expect(fetchCategoryDataModern()).rejects.toThrow(
        "Failed to fetch category data: Not found",
      );
    });

    it("should handle error response without error field", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({}),
      });

      consoleSpy.start();

      await expect(fetchCategoryDataModern()).rejects.toThrow(
        "HTTP error! Status: 500",
      );
    });

    it("should handle invalid JSON in error response", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: jest.fn().mockRejectedValue(new Error("Invalid JSON")),
      });

      consoleSpy.start();

      await expect(fetchCategoryDataModern()).rejects.toThrow(
        "HTTP error! Status: 500",
      );
    });
  });

  describe("Network and connectivity errors", () => {
    it("should handle network errors", async () => {
      global.fetch = jest
        .fn()
        .mockRejectedValue(new Error("Network error"));

      consoleSpy.start();

      await expect(fetchCategoryDataModern()).rejects.toThrow(
        "Failed to fetch category data: Network error",
      );

      const calls = consoleSpy.getCalls();
      expect(
        calls.error.some((call) =>
          call[0].includes("Error fetching category data:"),
        ),
      ).toBe(true);
    });

    it("should handle timeout errors", async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error("Timeout"));

      consoleSpy.start();

      await expect(fetchCategoryDataModern()).rejects.toThrow(
        "Failed to fetch category data: Timeout",
      );
    });

    it("should handle connection refused", async () => {
      global.fetch = jest
        .fn()
        .mockRejectedValue(new Error("Connection refused"));

      consoleSpy.start();

      await expect(fetchCategoryDataModern()).rejects.toThrow(
        "Failed to fetch category data: Connection refused",
      );
    });
  });

  describe("Data integrity and validation", () => {
    it("should return categories with all required fields", async () => {
      const testCategories = [
        createTestCategory({
          categoryId: 1,
          categoryName: "groceries",
          activeStatus: true,
        }),
      ];

      global.fetch = createModernFetchMock(testCategories);

      const result = await fetchCategoryDataModern();

      expect(result[0]).toHaveProperty("categoryId");
      expect(result[0]).toHaveProperty("categoryName");
      expect(result[0]).toHaveProperty("activeStatus");
    });

    it("should preserve category data exactly as received", async () => {
      const testCategories = [
        createTestCategory({
          categoryId: 999,
          categoryName: "special_category",
          activeStatus: true,
        }),
      ];

      global.fetch = createModernFetchMock(testCategories);

      const result = await fetchCategoryDataModern();

      expect(result).toEqual(testCategories);
    });
  });

  describe("Edge cases", () => {
    it("should handle large number of categories", async () => {
      const testCategories = Array.from({ length: 100 }, (_, i) =>
        createTestCategory({
          categoryId: i + 1,
          categoryName: `category_${i + 1}`,
        }),
      );

      global.fetch = createModernFetchMock(testCategories);

      const result = await fetchCategoryDataModern();

      expect(result).toHaveLength(100);
    });

    it("should handle categories with special characters", async () => {
      const testCategories = [
        createTestCategory({
          categoryName: "category-with_special.chars",
        }),
      ];

      global.fetch = createModernFetchMock(testCategories);

      const result = await fetchCategoryDataModern();

      expect(result[0].categoryName).toBe("category-with_special.chars");
    });

    it("should handle categories with Unicode characters", async () => {
      const testCategories = [
        createTestCategory({
          categoryName: "食品 🍔",
        }),
      ];

      global.fetch = createModernFetchMock(testCategories);

      const result = await fetchCategoryDataModern();

      expect(result[0].categoryName).toBe("食品 🍔");
    });
  });

  describe("HTTP request configuration", () => {
    it("should use GET method", async () => {
      global.fetch = createModernFetchMock([]);

      await fetchCategoryDataModern();

      const callArgs = (fetch as jest.Mock).mock.calls[0][1];
      expect(callArgs.method).toBe("GET");
    });

    it("should include credentials", async () => {
      global.fetch = createModernFetchMock([]);

      await fetchCategoryDataModern();

      const callArgs = (fetch as jest.Mock).mock.calls[0][1];
      expect(callArgs.credentials).toBe("include");
    });

    it("should include correct headers", async () => {
      global.fetch = createModernFetchMock([]);

      await fetchCategoryDataModern();

      const callArgs = (fetch as jest.Mock).mock.calls[0][1];
      expect(callArgs.headers).toEqual({
        "Content-Type": "application/json",
        Accept: "application/json",
      });
    });

    it("should only call API once per fetch", async () => {
      global.fetch = createModernFetchMock([]);

      await fetchCategoryDataModern();

      expect(fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe("Common category scenarios", () => {
    it("should fetch expense categories", async () => {
      const testCategories = [
        createTestCategory({ categoryName: "groceries" }),
        createTestCategory({ categoryName: "dining" }),
        createTestCategory({ categoryName: "entertainment" }),
      ];

      global.fetch = createModernFetchMock(testCategories);

      const result = await fetchCategoryDataModern();

      expect(result).toHaveLength(3);
      expect(result.find((c) => c.categoryName === "groceries")).toBeDefined();
      expect(result.find((c) => c.categoryName === "dining")).toBeDefined();
      expect(result.find((c) => c.categoryName === "entertainment")).toBeDefined();
    });
  });
});
