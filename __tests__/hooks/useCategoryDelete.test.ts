import { deleteCategory } from "../../hooks/useCategoryDelete";
import Category from "../../model/Category";

jest.mock("../../utils/fetchUtils", () => ({
  fetchWithErrorHandling: jest.fn(),
  parseResponse: jest.fn(),
  FetchError: class FetchError extends Error {
    constructor(
      message: string,
      public status?: number,
    ) {
      super(message);
      this.name = "FetchError";
    }
  },
}));

jest.mock("../../utils/validation/sanitization", () => ({
  InputSanitizer: {
    sanitizeCategory: jest.fn((value: string) => value),
  },
}));

jest.mock("../../utils/hookValidation", () => ({
  validateDelete: jest.fn(),
  HookValidationError: class HookValidationError extends Error {
    constructor(message: string) {
      super(message);
      this.name = "HookValidationError";
    }
  },
}));

jest.mock("../../utils/cacheUtils", () => ({
  QueryKeys: {
    category: jest.fn(() => ["category"]),
  },
  removeFromList: jest.fn(),
}));

jest.mock("../../utils/logger", () => ({
  createHookLogger: jest.fn(() => ({
    debug: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
  })),
}));

import { fetchWithErrorHandling, parseResponse } from "../../utils/fetchUtils";
import { InputSanitizer } from "../../utils/validation/sanitization";
import { validateDelete } from "../../utils/hookValidation";

const mockFetchWithErrorHandling = fetchWithErrorHandling as jest.MockedFunction<
  typeof fetchWithErrorHandling
>;
const mockParseResponse = parseResponse as jest.MockedFunction<
  typeof parseResponse
>;
const mockSanitizeCategory =
  InputSanitizer.sanitizeCategory as jest.MockedFunction<
    typeof InputSanitizer.sanitizeCategory
  >;
const mockValidateDelete = validateDelete as jest.MockedFunction<
  typeof validateDelete
>;

const createTestCategory = (overrides: Partial<Category> = {}): Category => ({
  categoryId: 1,
  categoryName: "groceries",
  activeStatus: true,
  ...overrides,
});

describe("useCategoryDelete - deleteCategory", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchWithErrorHandling.mockResolvedValue({ status: 204 } as Response);
    mockParseResponse.mockResolvedValue(null);
    mockSanitizeCategory.mockImplementation((value: string) => value);
    mockValidateDelete.mockImplementation(() => {});
  });

  describe("validation and sanitization", () => {
    it("should call validateDelete with categoryName field", async () => {
      const category = createTestCategory({ categoryName: "groceries" });

      await deleteCategory(category);

      expect(mockValidateDelete).toHaveBeenCalledWith(
        category,
        "categoryName",
        "deleteCategory",
      );
    });

    it("should sanitize categoryName before building endpoint", async () => {
      const category = createTestCategory({ categoryName: "groceries" });

      await deleteCategory(category);

      expect(mockSanitizeCategory).toHaveBeenCalledWith("groceries");
    });

    it("should use sanitized name in endpoint URL", async () => {
      mockSanitizeCategory.mockReturnValue("sanitized_cat");
      const category = createTestCategory({ categoryName: "raw_cat" });

      await deleteCategory(category);

      const [url] = mockFetchWithErrorHandling.mock.calls[0];
      expect(url).toBe("/api/category/sanitized_cat");
    });
  });

  describe("successful deletion", () => {
    it("should call fetchWithErrorHandling with correct DELETE endpoint", async () => {
      const category = createTestCategory({ categoryName: "groceries" });

      await deleteCategory(category);

      expect(mockFetchWithErrorHandling).toHaveBeenCalledWith(
        "/api/category/groceries",
        { method: "DELETE" },
      );
    });

    it("should return null for 204 response", async () => {
      mockParseResponse.mockResolvedValue(null);
      const category = createTestCategory();

      const result = await deleteCategory(category);

      expect(result).toBeNull();
    });

    it("should return category data for 200 OK", async () => {
      const category = createTestCategory({ categoryName: "dining" });
      mockParseResponse.mockResolvedValue(category);

      const result = await deleteCategory(category);

      expect(result).toStrictEqual(category);
    });

    it("should call parseResponse with the fetch response", async () => {
      const mockResponse = { status: 200 } as Response;
      mockFetchWithErrorHandling.mockResolvedValue(mockResponse);
      const category = createTestCategory();

      await deleteCategory(category);

      expect(mockParseResponse).toHaveBeenCalledWith(mockResponse);
    });

    it.each(["groceries", "dining", "entertainment", "transportation", "utilities"])(
      "should delete category '%s'",
      async (name) => {
        const category = createTestCategory({ categoryName: name });

        await deleteCategory(category);

        expect(mockFetchWithErrorHandling).toHaveBeenCalledWith(
          `/api/category/${name}`,
          expect.any(Object),
        );
      },
    );

    it("should delete inactive category", async () => {
      const category = createTestCategory({
        categoryName: "archived",
        activeStatus: false,
      });

      await deleteCategory(category);

      expect(mockFetchWithErrorHandling).toHaveBeenCalledWith(
        "/api/category/archived",
        expect.any(Object),
      );
    });
  });

  describe("error handling", () => {
    it("should propagate 404 not found error", async () => {
      const { FetchError } = jest.requireMock("../../utils/fetchUtils");
      mockFetchWithErrorHandling.mockRejectedValue(
        new FetchError("Category not found", 404),
      );
      const category = createTestCategory();

      await expect(deleteCategory(category)).rejects.toThrow(
        "Category not found",
      );
    });

    it("should propagate 409 conflict error", async () => {
      const { FetchError } = jest.requireMock("../../utils/fetchUtils");
      mockFetchWithErrorHandling.mockRejectedValue(
        new FetchError("Cannot delete category - in use by transactions", 409),
      );
      const category = createTestCategory({ categoryName: "groceries" });

      await expect(deleteCategory(category)).rejects.toThrow(
        "Cannot delete category - in use by transactions",
      );
    });

    it("should propagate 500 server error", async () => {
      const { FetchError } = jest.requireMock("../../utils/fetchUtils");
      mockFetchWithErrorHandling.mockRejectedValue(
        new FetchError("Internal server error", 500),
      );
      const category = createTestCategory();

      await expect(deleteCategory(category)).rejects.toThrow(
        "Internal server error",
      );
    });

    it("should propagate network errors", async () => {
      mockFetchWithErrorHandling.mockRejectedValue(
        new Error("Network request failed"),
      );
      const category = createTestCategory();

      await expect(deleteCategory(category)).rejects.toThrow(
        "Network request failed",
      );
    });

    it("should propagate validation errors from validateDelete", async () => {
      mockValidateDelete.mockImplementation(() => {
        const { HookValidationError } = jest.requireMock(
          "../../utils/hookValidation",
        );
        throw new HookValidationError("categoryName is required");
      });
      const category = createTestCategory({ categoryName: "" });

      await expect(deleteCategory(category)).rejects.toThrow(
        "categoryName is required",
      );
    });
  });

  describe("request format", () => {
    it("should use DELETE method", async () => {
      const category = createTestCategory();

      await deleteCategory(category);

      const [, options] = mockFetchWithErrorHandling.mock.calls[0];
      expect(options?.method).toBe("DELETE");
    });

    it("should not send body in DELETE request", async () => {
      const category = createTestCategory();

      await deleteCategory(category);

      const [, options] = mockFetchWithErrorHandling.mock.calls[0];
      expect(options?.body).toBeUndefined();
    });
  });
});
