/**
 * TDD Tests for Modern useCategoryDelete
 * Modern endpoint: DELETE /api/category/{categoryName}
 *
 * Key differences from legacy:
 * - Endpoint: /api/category/{categoryName} (vs /api/category/delete/{categoryId})
 * - Uses categoryName instead of categoryId in URL path
 * - Uses ServiceResult pattern for errors
 * - Returns null for 204, category data for 200
 */

import { ConsoleSpy } from "../../testHelpers";
import { createModernFetchMock } from "../../testHelpers.modern";
import Category from "../../model/Category";

// Modern implementation to test
const deleteCategoryModern = async (
  payload: Category,
): Promise<Category | null> => {
  try {
    const endpoint = `/api/category/${payload.categoryName}`;

    const response = await fetch(endpoint, {
      method: "DELETE",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({ error: `HTTP error! Status: ${response.status}` }));
      const errorMessage = errorBody.error || errorBody.errors?.join(", ") || `HTTP error! Status: ${response.status}`;
      throw new Error(errorMessage);
    }

    return response.status !== 204 ? await response.json() : null;
  } catch (error: any) {
    console.error(`An error occurred: ${error.message}`);
    throw error;
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

describe("useCategoryDelete Modern Endpoint (TDD)", () => {
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
      const testCategory = createTestCategory({ categoryId: 123, categoryName: "groceries" });

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 204,
      });

      await deleteCategoryModern(testCategory);

      expect(fetch).toHaveBeenCalledWith("/api/category/groceries", {
        method: "DELETE",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });
    });

    it("should delete category successfully with 204 response", async () => {
      const testCategory = createTestCategory();

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 204,
      });

      const result = await deleteCategoryModern(testCategory);

      expect(result).toBeNull();
    });

    it("should delete category successfully with 200 response", async () => {
      const testCategory = createTestCategory();

      global.fetch = createModernFetchMock(testCategory);

      const result = await deleteCategoryModern(testCategory);

      expect(result).toEqual(testCategory);
    });

    it("should use categoryName from payload in URL", async () => {
      const testCategory = createTestCategory({ categoryId: 999, categoryName: "entertainment" });

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 204,
      });

      await deleteCategoryModern(testCategory);

      expect(fetch).toHaveBeenCalledWith(
        "/api/category/entertainment",
        expect.any(Object),
      );
    });
  });

  describe("Modern error handling with ServiceResult pattern", () => {
    it("should handle 404 not found with modern error format", async () => {
      const testCategory = createTestCategory({ categoryId: 999, categoryName: "nonexistent" });

      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({ error: "Category not found" }),
      });

      consoleSpy.start();

      await expect(deleteCategoryModern(testCategory)).rejects.toThrow(
        "Category not found",
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

      await expect(deleteCategoryModern(testCategory)).rejects.toThrow(
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

      await expect(deleteCategoryModern(testCategory)).rejects.toThrow(
        "Forbidden",
      );
    });

    it("should handle 409 conflict (category in use)", async () => {
      const testCategory = createTestCategory({
        categoryName: "groceries",
      });

      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 409,
        json: async () => ({
          error: "Cannot delete category groceries - in use by transactions",
        }),
      });

      consoleSpy.start();

      await expect(deleteCategoryModern(testCategory)).rejects.toThrow(
        "Cannot delete category groceries - in use by transactions",
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

      await expect(deleteCategoryModern(testCategory)).rejects.toThrow(
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

      await expect(deleteCategoryModern(testCategory)).rejects.toThrow(
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

      await expect(deleteCategoryModern(testCategory)).rejects.toThrow(
        "HTTP error! Status: 500",
      );
    });

    it("should handle validation errors with modern format", async () => {
      const testCategory = createTestCategory();

      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({
          errors: [
            "categoryId is required",
            "categoryId must be a valid number",
          ],
        }),
      });

      consoleSpy.start();

      await expect(deleteCategoryModern(testCategory)).rejects.toThrow(
        "categoryId is required, categoryId must be a valid number",
      );
    });
  });

  describe("Network and connectivity errors", () => {
    it("should handle network errors", async () => {
      const testCategory = createTestCategory();

      global.fetch = jest
        .fn()
        .mockRejectedValue(new Error("Network error"));

      consoleSpy.start();

      await expect(deleteCategoryModern(testCategory)).rejects.toThrow(
        "Network error",
      );

      const calls = consoleSpy.getCalls();
      expect(
        calls.error.some((call) =>
          call[0].includes("An error occurred:"),
        ),
      ).toBe(true);
    });

    it("should handle timeout errors", async () => {
      const testCategory = createTestCategory();

      global.fetch = jest.fn().mockRejectedValue(new Error("Timeout"));

      consoleSpy.start();

      await expect(deleteCategoryModern(testCategory)).rejects.toThrow(
        "Timeout",
      );
    });

    it("should handle connection refused", async () => {
      const testCategory = createTestCategory();

      global.fetch = jest
        .fn()
        .mockRejectedValue(new Error("Connection refused"));

      consoleSpy.start();

      await expect(deleteCategoryModern(testCategory)).rejects.toThrow(
        "Connection refused",
      );
    });
  });

  describe("Request configuration", () => {
    it("should use DELETE method", async () => {
      const testCategory = createTestCategory();

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 204,
      });

      await deleteCategoryModern(testCategory);

      const callArgs = (fetch as jest.Mock).mock.calls[0][1];
      expect(callArgs.method).toBe("DELETE");
    });

    it("should include credentials", async () => {
      const testCategory = createTestCategory();

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 204,
      });

      await deleteCategoryModern(testCategory);

      const callArgs = (fetch as jest.Mock).mock.calls[0][1];
      expect(callArgs.credentials).toBe("include");
    });

    it("should include correct headers", async () => {
      const testCategory = createTestCategory();

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 204,
      });

      await deleteCategoryModern(testCategory);

      const callArgs = (fetch as jest.Mock).mock.calls[0][1];
      expect(callArgs.headers).toEqual({
        "Content-Type": "application/json",
        Accept: "application/json",
      });
    });

    it("should not send body in DELETE request", async () => {
      const testCategory = createTestCategory();

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 204,
      });

      await deleteCategoryModern(testCategory);

      const callArgs = (fetch as jest.Mock).mock.calls[0][1];
      expect(callArgs.body).toBeUndefined();
    });
  });

  describe("Response handling", () => {
    it("should return null for 204 No Content", async () => {
      const testCategory = createTestCategory();

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 204,
      });

      const result = await deleteCategoryModern(testCategory);

      expect(result).toBeNull();
    });

    it("should return category data for 200 OK", async () => {
      const testCategory = createTestCategory({
        categoryId: 123,
        categoryName: "deleted_category",
      });

      global.fetch = createModernFetchMock(testCategory);

      const result = await deleteCategoryModern(testCategory);

      expect(result).toEqual(testCategory);
    });

    it("should handle different categoryName values", async () => {
      const categoryNames = ["groceries", "dining", "entertainment", "shopping"];

      for (const name of categoryNames) {
        const testCategory = createTestCategory({ categoryName: name });

        global.fetch = jest.fn().mockResolvedValue({
          ok: true,
          status: 204,
        });

        await deleteCategoryModern(testCategory);

        expect(fetch).toHaveBeenCalledWith(
          `/api/category/${name}`,
          expect.any(Object),
        );
      }
    });
  });

  describe("Common deletion scenarios", () => {
    it("should delete groceries category", async () => {
      const testCategory = createTestCategory({
        categoryId: 1,
        categoryName: "groceries",
        activeStatus: true,
      });

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 204,
      });

      const result = await deleteCategoryModern(testCategory);

      expect(result).toBeNull();
      expect(fetch).toHaveBeenCalledWith("/api/category/groceries", expect.any(Object));
    });

    it("should delete dining category", async () => {
      const testCategory = createTestCategory({
        categoryId: 2,
        categoryName: "dining",
        activeStatus: true,
      });

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 204,
      });

      const result = await deleteCategoryModern(testCategory);

      expect(result).toBeNull();
    });

    it("should delete entertainment category", async () => {
      const testCategory = createTestCategory({
        categoryId: 3,
        categoryName: "entertainment",
        activeStatus: true,
      });

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 204,
      });

      const result = await deleteCategoryModern(testCategory);

      expect(result).toBeNull();
    });

    it("should delete transportation category", async () => {
      const testCategory = createTestCategory({
        categoryId: 4,
        categoryName: "transportation",
        activeStatus: true,
      });

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 204,
      });

      const result = await deleteCategoryModern(testCategory);

      expect(result).toBeNull();
    });

    it("should delete inactive category", async () => {
      const testCategory = createTestCategory({
        categoryId: 5,
        categoryName: "archived",
        activeStatus: false,
      });

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 204,
      });

      const result = await deleteCategoryModern(testCategory);

      expect(result).toBeNull();
    });

    it("should delete utilities category", async () => {
      const testCategory = createTestCategory({
        categoryId: 6,
        categoryName: "utilities",
        activeStatus: true,
      });

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 204,
      });

      const result = await deleteCategoryModern(testCategory);

      expect(result).toBeNull();
    });

    it("should delete healthcare category", async () => {
      const testCategory = createTestCategory({
        categoryId: 7,
        categoryName: "healthcare",
        activeStatus: true,
      });

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 204,
      });

      const result = await deleteCategoryModern(testCategory);

      expect(result).toBeNull();
    });

    it("should delete shopping category", async () => {
      const testCategory = createTestCategory({
        categoryId: 8,
        categoryName: "shopping",
        activeStatus: true,
      });

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 204,
      });

      const result = await deleteCategoryModern(testCategory);

      expect(result).toBeNull();
    });
  });

  describe("Edge cases", () => {
    it("should handle deletion of category with special characters in name", async () => {
      const testCategory = createTestCategory({
        categoryId: 100,
        categoryName: "category-with_special.chars",
      });

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 204,
      });

      await deleteCategoryModern(testCategory);

      expect(fetch).toHaveBeenCalledWith(
        "/api/category/category-with_special.chars",
        expect.any(Object),
      );
    });

    it("should handle deletion of category with Unicode characters", async () => {
      const testCategory = createTestCategory({
        categoryId: 101,
        categoryName: "食品 🍔",
      });

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 204,
      });

      const result = await deleteCategoryModern(testCategory);

      expect(result).toBeNull();
      expect(fetch).toHaveBeenCalledWith(
        "/api/category/食品 🍔",
        expect.any(Object),
      );
    });

    it("should handle deletion of category with long name", async () => {
      const longName = "a".repeat(255);
      const testCategory = createTestCategory({
        categoryId: 102,
        categoryName: longName,
      });

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 204,
      });

      const result = await deleteCategoryModern(testCategory);

      expect(result).toBeNull();
    });

    it("should handle deletion of category with empty name", async () => {
      const testCategory = createTestCategory({
        categoryId: 103,
        categoryName: "",
      });

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 204,
      });

      const result = await deleteCategoryModern(testCategory);

      expect(result).toBeNull();
      expect(fetch).toHaveBeenCalledWith(
        "/api/category/",
        expect.any(Object),
      );
    });

    it("should handle deletion of category with spaces in name", async () => {
      const testCategory = createTestCategory({
        categoryId: 104,
        categoryName: "dining out",
      });

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 204,
      });

      await deleteCategoryModern(testCategory);

      expect(fetch).toHaveBeenCalledWith(
        "/api/category/dining out",
        expect.any(Object),
      );
    });

    it("should handle deletion of category with numbers in name", async () => {
      const testCategory = createTestCategory({
        categoryId: 105,
        categoryName: "category_123",
      });

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 204,
      });

      const result = await deleteCategoryModern(testCategory);

      expect(result).toBeNull();
    });
  });

  describe("Data integrity", () => {
    it("should use correct categoryName from payload", async () => {
      const testCategory = createTestCategory({
        categoryId: 456,
        categoryName: "test",
      });

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 204,
      });

      await deleteCategoryModern(testCategory);

      const url = (fetch as jest.Mock).mock.calls[0][0];
      expect(url).toBe("/api/category/test");
    });

    it("should return exact category data when API returns 200", async () => {
      const testCategory = createTestCategory({
        categoryId: 789,
        categoryName: "exact_category",
        activeStatus: true,
      });

      global.fetch = createModernFetchMock(testCategory);

      const result = await deleteCategoryModern(testCategory);

      expect(result).toEqual(testCategory);
    });
  });

  describe("Error logging", () => {
    it("should log error message to console", async () => {
      const testCategory = createTestCategory();

      global.fetch = jest
        .fn()
        .mockRejectedValue(new Error("Test error"));

      consoleSpy.start();

      await expect(deleteCategoryModern(testCategory)).rejects.toThrow();

      const calls = consoleSpy.getCalls();
      expect(
        calls.error.some((call) =>
          call[0].includes("An error occurred: Test error"),
        ),
      ).toBe(true);
    });
  });

  describe("Conflict scenarios", () => {
    it("should handle conflict when deleting category with active transactions", async () => {
      const testCategory = createTestCategory({
        categoryName: "groceries",
      });

      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 409,
        json: async () => ({
          error: "Cannot delete category groceries - 25 transactions reference this category",
        }),
      });

      consoleSpy.start();

      await expect(deleteCategoryModern(testCategory)).rejects.toThrow(
        "Cannot delete category groceries - 25 transactions reference this category",
      );
    });

    it("should handle conflict when deleting system category", async () => {
      const testCategory = createTestCategory({
        categoryName: "uncategorized",
      });

      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 409,
        json: async () => ({
          error: "Cannot delete system category uncategorized",
        }),
      });

      consoleSpy.start();

      await expect(deleteCategoryModern(testCategory)).rejects.toThrow(
        "Cannot delete system category uncategorized",
      );
    });

    it("should handle conflict when deleting default category", async () => {
      const testCategory = createTestCategory({
        categoryName: "default",
      });

      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 409,
        json: async () => ({
          error: "Cannot delete default category",
        }),
      });

      consoleSpy.start();

      await expect(deleteCategoryModern(testCategory)).rejects.toThrow(
        "Cannot delete default category",
      );
    });
  });
});
