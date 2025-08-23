import Category from "../../model/Category";

// Extract the deleteCategory function for isolated testing
const deleteCategory = async (payload: Category): Promise<Category | null> => {
  try {
    const endpoint = `/api/category/delete/${payload.categoryName}`;

    const response = await fetch(endpoint, {
      method: "DELETE",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
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

    return response.status !== 204 ? await response.json() : null;
  } catch (error) {
    throw error;
  }
};

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
      `/api/category/delete/${mockCategory.categoryName}`,
      {
        method: "DELETE",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      }
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
    const consoleSpy = jest.spyOn(console, "log");
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: jest.fn().mockResolvedValueOnce({
        response: "Cannot delete this category",
      }),
    });

    await expect(deleteCategory(mockCategory)).rejects.toThrow(
      "Cannot delete this category"
    );

    expect(consoleSpy).toHaveBeenCalledWith("Cannot delete this category");
    consoleSpy.mockRestore();
  });

  it("should handle error response without message", async () => {
    const consoleSpy = jest.spyOn(console, "log");
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: jest.fn().mockResolvedValueOnce({}),
    });

    await expect(deleteCategory(mockCategory)).rejects.toThrow(
      "No error message returned."
    );

    expect(consoleSpy).toHaveBeenCalledWith("No error message returned.");
    consoleSpy.mockRestore();
  });

  it("should handle JSON parsing errors", async () => {
    const consoleSpy = jest.spyOn(console, "log");
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: jest.fn().mockRejectedValueOnce(new Error("Invalid JSON")),
    });

    await expect(deleteCategory(mockCategory)).rejects.toThrow(
      "Failed to parse error response: Invalid JSON"
    );

    expect(consoleSpy).toHaveBeenCalledWith(
      "Failed to parse error response: Invalid JSON"
    );
    consoleSpy.mockRestore();
  });

  it("should handle network errors", async () => {
    global.fetch = jest.fn().mockRejectedValueOnce(new Error("Network error"));

    await expect(deleteCategory(mockCategory)).rejects.toThrow("Network error");
  });

  it("should handle fetch timeout errors", async () => {
    global.fetch = jest.fn().mockRejectedValueOnce(new Error("Request timeout"));

    await expect(deleteCategory(mockCategory)).rejects.toThrow("Request timeout");
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
      `/api/category/delete/electronics & gadgets`,
      expect.any(Object)
    );
  });

  it("should handle empty error message gracefully", async () => {
    const consoleSpy = jest.spyOn(console, "log");
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: jest.fn().mockResolvedValueOnce({
        response: "",
      }),
    });

    await expect(deleteCategory(mockCategory)).rejects.toThrow(
      "cannot throw a null value"
    );

    expect(consoleSpy).toHaveBeenCalledWith("cannot throw a null value");
    consoleSpy.mockRestore();
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
      })
    );
  });
});