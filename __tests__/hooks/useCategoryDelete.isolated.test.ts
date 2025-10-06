import Category from "../../model/Category";
import {
  createModernFetchMock,
  createModernErrorFetchMock,
} from "../../testHelpers.modern";

import { deleteCategory } from "../../hooks/useCategoryDelete";

describe("deleteCategory (Isolated)", () => {
  const mockCategory: Category = {
    categoryId: 1,
    categoryName: "electronics",
    activeStatus: true,
    categoryCount: 10,
    dateAdded: new Date(),
    dateUpdated: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset console.log spy if it exists
    if (jest.isMockFunction(console.log)) {
      (console.log as jest.Mock).mockRestore();
    }
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
      "HTTP error! Status: 400",
    );
  });

  it("should handle JSON parsing errors", async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: jest.fn().mockRejectedValueOnce(new Error("Invalid JSON")),
    });

    await expect(deleteCategory(mockCategory)).rejects.toThrow(
      "HTTP error! Status: 400",
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

    expect(fetch).toHaveBeenCalledWith(
      `/api/category/electronics & gadgets`,
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
      "HTTP error! Status: 500",
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
        },
      }),
    );
  });
});
