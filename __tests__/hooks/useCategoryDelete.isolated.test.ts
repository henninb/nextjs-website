import Category from "../../model/Category";
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

import { deleteCategory } from "../../hooks/useCategoryDelete";
import { HookValidator } from "../../utils/hookValidation";

describe("deleteCategory (Isolated)", () => {
  const mockCategory: Category = {
    categoryId: 1,
    categoryName: "electronics",
    activeStatus: true,
    categoryCount: 10,
    dateAdded: new Date(),
    dateUpdated: new Date(),
  };

  const mockValidateDelete = HookValidator.validateDelete as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset validation mock
    mockValidateDelete.mockImplementation(() => {});
  });

  it("should delete category successfully with 204 status", async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      status: 204,
      json: jest.fn(),
    });

    const result = await deleteCategory(mockCategory);

    expect(fetch).toHaveBeenCalledWith(
      `/api/category/${mockCategory.categoryName}`,
      {
        method: "DELETE",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
            Accept: "application/json",
        },
      },
    );
    expect(result).toBeNull();
  });

  it("should return JSON data when status is not 204", async () => {
    const mockResponse = { message: "Category deleted" };
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValueOnce(mockResponse),
    });

    const result = await deleteCategory(mockCategory);

    expect(result).toEqual(mockResponse);
  });

  it("should throw error when API returns error response", async () => {
    global.fetch = createModernErrorFetchMock(
      "Cannot delete this category",
      400,
    );

    await expect(deleteCategory(mockCategory)).rejects.toThrow(
      "Cannot delete this category",
    );
  });

  it("should handle error response without message", async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: jest.fn().mockResolvedValueOnce({}),
    });

    await expect(deleteCategory(mockCategory)).rejects.toThrow(
      "HTTP 400",
    );
  });

  it("should handle JSON parsing errors", async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: jest.fn().mockRejectedValueOnce(new Error("Invalid JSON")),
    });

    await expect(deleteCategory(mockCategory)).rejects.toThrow(
      "HTTP 400",
    );
  });

  it("should handle network errors", async () => {
    global.fetch = jest.fn().mockRejectedValueOnce(new Error("Network error"));

    await expect(deleteCategory(mockCategory)).rejects.toThrow("Network error");
  });

  it("should handle fetch timeout errors", async () => {
    global.fetch = jest
      .fn()
      .mockRejectedValueOnce(new Error("Request timeout"));

    await expect(deleteCategory(mockCategory)).rejects.toThrow(
      "Request timeout",
    );
  });

  it("should construct correct endpoint URL", async () => {
    const categoryWithSpecialChars: Category = {
      ...mockCategory,
      categoryName: "electronics & gadgets",
    };

    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      status: 204,
      json: jest.fn(),
    });

    await deleteCategory(categoryWithSpecialChars);

    // Special characters are sanitized in category names
    expect(fetch).toHaveBeenCalledWith(
      `/api/category/electronics gadgets`,
      expect.any(Object),
    );
  });

  it("should handle empty error message gracefully", async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: jest.fn().mockResolvedValueOnce({}),
    });

    await expect(deleteCategory(mockCategory)).rejects.toThrow(
      "HTTP 500",
    );
  });

  it("should use correct HTTP method and headers", async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      status: 204,
      json: jest.fn(),
    });

    await deleteCategory(mockCategory);

    expect(fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        method: "DELETE",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
            Accept: "application/json",
        },
      }),
    );
  });
});
