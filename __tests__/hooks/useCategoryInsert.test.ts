import { insertCategory } from "../../hooks/useCategoryInsert";
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

jest.mock("../../utils/hookValidation", () => ({
  validateInsert: jest.fn((data: unknown) => data),
  HookValidationError: class HookValidationError extends Error {
    constructor(message: string) {
      super(message);
      this.name = "HookValidationError";
    }
  },
}));

jest.mock("../../utils/validation", () => ({
  DataValidator: {
    validateCategory: jest.fn((data: unknown) => data),
  },
}));

jest.mock("../../utils/cacheUtils", () => ({
  QueryKeys: {
    category: jest.fn(() => ["category"]),
  },
  addToList: jest.fn(),
}));

jest.mock("../../utils/logger", () => ({
  createHookLogger: jest.fn(() => ({
    debug: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
  })),
}));

jest.mock("../../components/AuthProvider", () => ({
  useAuth: jest.fn(() => ({
    isAuthenticated: true,
    loading: false,
    user: { username: "john" },
    login: jest.fn(),
    logout: jest.fn(),
  })),
}));

import { fetchWithErrorHandling, parseResponse } from "../../utils/fetchUtils";
import { validateInsert } from "../../utils/hookValidation";

const mockFetchWithErrorHandling = fetchWithErrorHandling as jest.MockedFunction<
  typeof fetchWithErrorHandling
>;
const mockParseResponse = parseResponse as jest.MockedFunction<
  typeof parseResponse
>;
const mockValidateInsert = validateInsert as jest.MockedFunction<
  typeof validateInsert
>;

const createTestCategory = (overrides: Partial<Category> = {}): Category => ({
  categoryId: 1,
  categoryName: "groceries",
  activeStatus: true,
  ...overrides,
});

describe("useCategoryInsert - insertCategory", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchWithErrorHandling.mockResolvedValue({ status: 201 } as Response);
    mockValidateInsert.mockImplementation((data: unknown) => data as Category);
  });

  describe("validation", () => {
    it("should call validateInsert with the category data", async () => {
      const category = createTestCategory({ categoryName: "dining" });
      mockParseResponse.mockResolvedValue(category);

      await insertCategory(category);

      expect(mockValidateInsert).toHaveBeenCalledWith(
        category,
        expect.any(Function),
        "insertCategory",
      );
    });

    it("should use validated data in request body", async () => {
      const category = createTestCategory({ categoryName: "dining" });
      const validatedCategory = { ...category, categoryName: "validated_dining" };
      mockValidateInsert.mockReturnValue(validatedCategory);
      mockParseResponse.mockResolvedValue(validatedCategory);

      await insertCategory(category);

      const [, options] = mockFetchWithErrorHandling.mock.calls[0];
      const body = JSON.parse(options?.body as string);
      expect(body.categoryName).toBe("validated_dining");
    });
  });

  describe("successful insertion", () => {
    it("should POST to /api/category", async () => {
      const category = createTestCategory();
      mockParseResponse.mockResolvedValue(category);

      await insertCategory(category);

      const [url] = mockFetchWithErrorHandling.mock.calls[0];
      expect(url).toBe("/api/category");
    });

    it("should use POST method", async () => {
      const category = createTestCategory();
      mockParseResponse.mockResolvedValue(category);

      await insertCategory(category);

      const [, options] = mockFetchWithErrorHandling.mock.calls[0];
      expect(options?.method).toBe("POST");
    });

    it("should return the created category", async () => {
      const category = createTestCategory({ categoryId: 5, categoryName: "sports" });
      mockParseResponse.mockResolvedValue(category);

      const result = await insertCategory(category);

      expect(result).toStrictEqual(category);
    });

    it("should call parseResponse with the fetch response", async () => {
      const mockResponse = { status: 201 } as Response;
      mockFetchWithErrorHandling.mockResolvedValue(mockResponse);
      const category = createTestCategory();
      mockParseResponse.mockResolvedValue(category);

      await insertCategory(category);

      expect(mockParseResponse).toHaveBeenCalledWith(mockResponse);
    });

    it("should return null when API returns null (204)", async () => {
      mockParseResponse.mockResolvedValue(null);
      const category = createTestCategory();

      const result = await insertCategory(category);

      expect(result).toBeNull();
    });

    it.each(["groceries", "dining", "entertainment", "utilities", "healthcare"])(
      "should insert '%s' category",
      async (name) => {
        const category = createTestCategory({ categoryName: name });
        mockParseResponse.mockResolvedValue(category);

        const result = await insertCategory(category);

        expect(mockFetchWithErrorHandling).toHaveBeenCalledWith(
          "/api/category",
          expect.objectContaining({ method: "POST" }),
        );
        expect(result?.categoryName).toBe(name);
      },
    );
  });

  describe("error handling", () => {
    it("should propagate 400 bad request error", async () => {
      const { FetchError } = jest.requireMock("../../utils/fetchUtils");
      mockFetchWithErrorHandling.mockRejectedValue(
        new FetchError("Invalid category data", 400),
      );
      const category = createTestCategory();

      await expect(insertCategory(category)).rejects.toThrow(
        "Invalid category data",
      );
    });

    it("should propagate 409 conflict error", async () => {
      const { FetchError } = jest.requireMock("../../utils/fetchUtils");
      mockFetchWithErrorHandling.mockRejectedValue(
        new FetchError("Category already exists", 409),
      );
      const category = createTestCategory({ categoryName: "groceries" });

      await expect(insertCategory(category)).rejects.toThrow(
        "Category already exists",
      );
    });

    it("should propagate 500 server error", async () => {
      const { FetchError } = jest.requireMock("../../utils/fetchUtils");
      mockFetchWithErrorHandling.mockRejectedValue(
        new FetchError("Internal server error", 500),
      );
      const category = createTestCategory();

      await expect(insertCategory(category)).rejects.toThrow(
        "Internal server error",
      );
    });

    it("should propagate network errors", async () => {
      mockFetchWithErrorHandling.mockRejectedValue(
        new Error("Network request failed"),
      );
      const category = createTestCategory();

      await expect(insertCategory(category)).rejects.toThrow(
        "Network request failed",
      );
    });

    it("should propagate validation errors", async () => {
      const { HookValidationError } = jest.requireMock(
        "../../utils/hookValidation",
      );
      mockValidateInsert.mockImplementation(() => {
        throw new HookValidationError("categoryName is required");
      });
      const category = createTestCategory({ categoryName: "" });

      await expect(insertCategory(category)).rejects.toThrow(
        "categoryName is required",
      );
    });
  });
});
