import useCategoryUpdate, { updateCategory } from "../../hooks/useCategoryUpdate";
import Category from "../../model/Category";
import React from "react";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

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
  validateUpdate: jest.fn((data: unknown) => data),
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
  updateInList: jest.fn(),
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
import { validateUpdate } from "../../utils/hookValidation";

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
const mockValidateUpdate = validateUpdate as jest.MockedFunction<
  typeof validateUpdate
>;

const createTestCategory = (overrides: Partial<Category> = {}): Category => ({
  categoryId: 1,
  categoryName: "groceries",
  activeStatus: true,
  ...overrides,
});

describe("useCategoryUpdate - updateCategory", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchWithErrorHandling.mockResolvedValue({ status: 200 } as Response);
    mockSanitizeCategory.mockImplementation((value: string) => value);
    mockValidateUpdate.mockImplementation((data: unknown) => data as Category);
  });

  describe("endpoint construction", () => {
    it("should use old category name in PUT endpoint URL", async () => {
      const oldCat = createTestCategory({ categoryName: "old_groceries" });
      const newCat = createTestCategory({ categoryName: "new_groceries" });
      mockParseResponse.mockResolvedValue(newCat);

      await updateCategory(oldCat, newCat);

      const [url] = mockFetchWithErrorHandling.mock.calls[0];
      expect(url).toBe("/api/category/old_groceries");
    });

    it("should sanitize old category name for URL", async () => {
      const oldCat = createTestCategory({ categoryName: "groceries" });
      const newCat = createTestCategory({ categoryName: "food" });
      mockParseResponse.mockResolvedValue(newCat);

      await updateCategory(oldCat, newCat);

      expect(mockSanitizeCategory).toHaveBeenCalledWith("groceries");
    });

    it("should use sanitized name in endpoint", async () => {
      mockSanitizeCategory.mockReturnValue("sanitized_cat");
      const oldCat = createTestCategory({ categoryName: "raw_cat" });
      const newCat = createTestCategory({ categoryName: "new_cat" });
      mockParseResponse.mockResolvedValue(newCat);

      await updateCategory(oldCat, newCat);

      const [url] = mockFetchWithErrorHandling.mock.calls[0];
      expect(url).toBe("/api/category/sanitized_cat");
    });

    it("should validate new category with validateUpdate", async () => {
      const oldCat = createTestCategory({ categoryName: "old" });
      const newCat = createTestCategory({ categoryName: "new" });
      mockParseResponse.mockResolvedValue(newCat);

      await updateCategory(oldCat, newCat);

      expect(mockValidateUpdate).toHaveBeenCalledWith(
        newCat,
        expect.any(Function),
        "updateCategory",
      );
    });
  });

  describe("successful update", () => {
    it("should call fetchWithErrorHandling with PUT method", async () => {
      const oldCat = createTestCategory({ categoryName: "old" });
      const newCat = createTestCategory({ categoryName: "new" });
      mockParseResponse.mockResolvedValue(newCat);

      await updateCategory(oldCat, newCat);

      expect(mockFetchWithErrorHandling).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ method: "PUT" }),
      );
    });

    it("should send validated new category as JSON body", async () => {
      const oldCat = createTestCategory({ categoryName: "old_name" });
      const newCat = createTestCategory({ categoryName: "new_name" });
      mockValidateUpdate.mockReturnValue(newCat);
      mockParseResponse.mockResolvedValue(newCat);

      await updateCategory(oldCat, newCat);

      const [, options] = mockFetchWithErrorHandling.mock.calls[0];
      const body = JSON.parse(options?.body as string);
      expect(body.categoryName).toBe("new_name");
    });

    it("should return the updated category", async () => {
      const oldCat = createTestCategory();
      const newCat = createTestCategory({
        categoryName: "updated_groceries",
        activeStatus: false,
      });
      mockParseResponse.mockResolvedValue(newCat);

      const result = await updateCategory(oldCat, newCat);

      expect(result).toStrictEqual(newCat);
    });

    it("should call parseResponse with the fetch response", async () => {
      const mockResponse = { status: 200 } as Response;
      mockFetchWithErrorHandling.mockResolvedValue(mockResponse);
      const oldCat = createTestCategory();
      const newCat = createTestCategory({ categoryName: "updated" });
      mockParseResponse.mockResolvedValue(newCat);

      await updateCategory(oldCat, newCat);

      expect(mockParseResponse).toHaveBeenCalledWith(mockResponse);
    });

    it("should update category name from groceries to food", async () => {
      const oldCat = createTestCategory({ categoryName: "groceries" });
      const newCat = createTestCategory({ categoryName: "food" });
      mockParseResponse.mockResolvedValue(newCat);

      const result = await updateCategory(oldCat, newCat);

      expect(result.categoryName).toBe("food");
      expect(mockFetchWithErrorHandling).toHaveBeenCalledWith(
        "/api/category/groceries",
        expect.any(Object),
      );
    });

    it("should update activeStatus", async () => {
      const oldCat = createTestCategory({ activeStatus: true });
      const newCat = createTestCategory({ activeStatus: false });
      mockParseResponse.mockResolvedValue(newCat);

      const result = await updateCategory(oldCat, newCat);

      expect(result.activeStatus).toBe(false);
    });
  });

  describe("error handling", () => {
    it("should propagate 404 not found error", async () => {
      const { FetchError } = jest.requireMock("../../utils/fetchUtils");
      mockFetchWithErrorHandling.mockRejectedValue(
        new FetchError("Category not found", 404),
      );
      const oldCat = createTestCategory();
      const newCat = createTestCategory({ categoryName: "updated" });

      await expect(updateCategory(oldCat, newCat)).rejects.toThrow(
        "Category not found",
      );
    });

    it("should propagate 409 conflict error", async () => {
      const { FetchError } = jest.requireMock("../../utils/fetchUtils");
      mockFetchWithErrorHandling.mockRejectedValue(
        new FetchError("Category name already exists", 409),
      );
      const oldCat = createTestCategory();
      const newCat = createTestCategory({ categoryName: "existing" });

      await expect(updateCategory(oldCat, newCat)).rejects.toThrow(
        "Category name already exists",
      );
    });

    it("should propagate 500 server error", async () => {
      const { FetchError } = jest.requireMock("../../utils/fetchUtils");
      mockFetchWithErrorHandling.mockRejectedValue(
        new FetchError("Internal server error", 500),
      );
      const oldCat = createTestCategory();
      const newCat = createTestCategory({ categoryName: "updated" });

      await expect(updateCategory(oldCat, newCat)).rejects.toThrow(
        "Internal server error",
      );
    });

    it("should propagate network errors", async () => {
      mockFetchWithErrorHandling.mockRejectedValue(
        new Error("Network request failed"),
      );
      const oldCat = createTestCategory();
      const newCat = createTestCategory({ categoryName: "updated" });

      await expect(updateCategory(oldCat, newCat)).rejects.toThrow(
        "Network request failed",
      );
    });

    it("should propagate validation errors", async () => {
      const { HookValidationError } = jest.requireMock(
        "../../utils/hookValidation",
      );
      mockValidateUpdate.mockImplementation(() => {
        throw new HookValidationError("categoryName is required");
      });
      const oldCat = createTestCategory();
      const newCat = createTestCategory({ categoryName: "" });

      await expect(updateCategory(oldCat, newCat)).rejects.toThrow(
        "categoryName is required",
      );
    });
  });

  describe("request format", () => {
    it("should use PUT method", async () => {
      const oldCat = createTestCategory();
      const newCat = createTestCategory({ categoryName: "updated" });
      mockParseResponse.mockResolvedValue(newCat);

      await updateCategory(oldCat, newCat);

      const [, options] = mockFetchWithErrorHandling.mock.calls[0];
      expect(options?.method).toBe("PUT");
    });

    it("should include category data in body", async () => {
      const oldCat = createTestCategory();
      const newCat = createTestCategory({ categoryName: "updated", activeStatus: false });
      mockParseResponse.mockResolvedValue(newCat);

      await updateCategory(oldCat, newCat);

      const [, options] = mockFetchWithErrorHandling.mock.calls[0];
      expect(options?.body).toBeDefined();
    });
  });
});

// ---------------------------------------------------------------------------
// renderHook tests for useCategoryUpdate default export
// ---------------------------------------------------------------------------

const createCatUpdateHookQueryClient = () =>
  new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

const createCatUpdateHookWrapper = (queryClient: QueryClient) =>
  function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  };

describe("useCategoryUpdate hook", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchWithErrorHandling.mockResolvedValue({ status: 200 } as Response);
    mockSanitizeCategory.mockImplementation((value: string) => value);
    mockValidateUpdate.mockImplementation((data: unknown) => data as Category);
  });

  it("onSuccess calls updateInList with the updated category", async () => {
    const queryClient = createCatUpdateHookQueryClient();
    const oldCat = createTestCategory({ categoryName: "old_groceries" });
    const updatedCat = createTestCategory({ categoryId: 1, categoryName: "new_groceries" });
    mockParseResponse.mockResolvedValue(updatedCat);

    const { result } = renderHook(() => useCategoryUpdate(), {
      wrapper: createCatUpdateHookWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync({ oldCategory: oldCat, newCategory: updatedCat });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const { updateInList } = jest.requireMock("../../utils/cacheUtils");
    expect(updateInList).toHaveBeenCalledWith(
      expect.anything(),
      ["category"],
      updatedCat,
      "categoryId",
    );
  });

  it("onError puts mutation into error state", async () => {
    const queryClient = createCatUpdateHookQueryClient();
    mockFetchWithErrorHandling.mockRejectedValue(new Error("Update failed"));

    const { result } = renderHook(() => useCategoryUpdate(), {
      wrapper: createCatUpdateHookWrapper(queryClient),
    });

    const oldCat = createTestCategory();
    const newCat = createTestCategory({ categoryName: "updated" });

    await act(async () => {
      try {
        await result.current.mutateAsync({ oldCategory: oldCat, newCategory: newCat });
      } catch {
        // expected
      }
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
