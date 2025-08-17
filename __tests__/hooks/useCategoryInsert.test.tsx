import React from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import useCategoryInsert from "../../hooks/useCategoryInsert";
import Category from "../../model/Category";

// Mock fetch globally
global.fetch = jest.fn();

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
    logger: {
      log: console.log,
      warn: console.warn,
      error: () => {}, // Suppress error logs in tests
    },
  });

const createWrapper =
  (queryClient: QueryClient) =>
  ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

describe("useCategoryInsert", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    jest.clearAllMocks();
    queryClient = createTestQueryClient();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("Successful Category Insertion", () => {
    it("inserts a category successfully", async () => {
      const inputCategory: Category = {
        categoryId: 0,
        category: "groceries",
        activeStatus: true,
        accountNameOwner: "test_user",
      };

      const mockResponse: Category = {
        categoryId: 123,
        category: "groceries",
        activeStatus: true,
        accountNameOwner: "test_user",
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => useCategoryInsert(), {
        wrapper: createWrapper(queryClient),
      });

      result.current.mutate({
        category: inputCategory,
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(fetch).toHaveBeenCalledWith("/api/category/insert", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(inputCategory),
      });

      expect(result.current.data).toEqual(mockResponse);
    });

    it("logs the category data being passed", async () => {
      const consoleSpy = jest.spyOn(console, "log").mockImplementation();

      const inputCategory: Category = {
        categoryId: 0,
        category: "entertainment",
        activeStatus: true,
        accountNameOwner: "test_user",
      };

      const mockResponse = { ...inputCategory, categoryId: 456 };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => useCategoryInsert(), {
        wrapper: createWrapper(queryClient),
      });

      result.current.mutate({
        category: inputCategory,
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        `passed: ${JSON.stringify(inputCategory)}`,
      );

      consoleSpy.mockRestore();
    });

    it("updates query cache correctly after successful insertion", async () => {
      const existingCategories: Category[] = [
        {
          categoryId: 1,
          category: "food",
          activeStatus: true,
          accountNameOwner: "user1",
        },
        {
          categoryId: 2,
          category: "transport",
          activeStatus: true,
          accountNameOwner: "user1",
        },
      ];

      // Set initial query data
      queryClient.setQueryData(["category"], existingCategories);

      const newCategory: Category = {
        categoryId: 0,
        category: "utilities",
        activeStatus: true,
        accountNameOwner: "user1",
      };

      const mockResponse: Category = {
        categoryId: 3,
        category: "utilities",
        activeStatus: true,
        accountNameOwner: "user1",
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => useCategoryInsert(), {
        wrapper: createWrapper(queryClient),
      });

      result.current.mutate({
        category: newCategory,
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Check that cache was updated with new category at the beginning
      const updatedCategories = queryClient.getQueryData(["category"]);
      expect(updatedCategories).toEqual([mockResponse, ...existingCategories]);
    });

    it("initializes cache with empty array if no existing data", async () => {
      // No initial data in cache
      expect(queryClient.getQueryData(["category"])).toBeUndefined();

      const newCategory: Category = {
        categoryId: 0,
        category: "shopping",
        activeStatus: true,
        accountNameOwner: "user1",
      };

      const mockResponse = { ...newCategory, categoryId: 1 };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => useCategoryInsert(), {
        wrapper: createWrapper(queryClient),
      });

      result.current.mutate({
        category: newCategory,
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Check that cache was initialized with the new category
      const updatedCategories = queryClient.getQueryData(["category"]);
      expect(updatedCategories).toEqual([mockResponse]);
    });
  });

  describe("Error Handling", () => {
    it("handles API error responses with error message", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          response: "Category name already exists",
        }),
      });

      const { result } = renderHook(() => useCategoryInsert(), {
        wrapper: createWrapper(queryClient),
      });

      const category: Category = {
        categoryId: 0,
        category: "duplicate_category",
        activeStatus: true,
        accountNameOwner: "test_user",
      };

      result.current.mutate({
        category,
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(
        new Error("Category name already exists"),
      );
    });

    it("handles API error responses without error message", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({}),
      });

      const { result } = renderHook(() => useCategoryInsert(), {
        wrapper: createWrapper(queryClient),
      });

      result.current.mutate({
        category: {} as Category,
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(
        new Error("Failed to parse error response: No error message returned."),
      );
    });

    it("handles JSON parsing errors in error response", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => {
          throw new Error("Malformed JSON");
        },
      });

      const { result } = renderHook(() => useCategoryInsert(), {
        wrapper: createWrapper(queryClient),
      });

      result.current.mutate({
        category: {} as Category,
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(
        new Error("Failed to parse error response: Malformed JSON"),
      );
    });

    it("handles network errors", async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error("Connection timeout"),
      );

      const { result } = renderHook(() => useCategoryInsert(), {
        wrapper: createWrapper(queryClient),
      });

      result.current.mutate({
        category: {} as Category,
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(new Error("Connection timeout"));
    });

    it("logs errors correctly in onError callback", async () => {
      const consoleSpy = jest.spyOn(console, "log").mockImplementation();

      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error("Test error message"),
      );

      const { result } = renderHook(() => useCategoryInsert(), {
        wrapper: createWrapper(queryClient),
      });

      result.current.mutate({
        category: {} as Category,
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(consoleSpy).toHaveBeenCalledWith(expect.any(Error));

      consoleSpy.mockRestore();
    });

    it("handles null/undefined errors in onError callback", async () => {
      const consoleSpy = jest.spyOn(console, "log").mockImplementation();

      // Mock a scenario where error might be null/undefined
      const { result } = renderHook(() => useCategoryInsert(), {
        wrapper: createWrapper(queryClient),
      });

      result.current.mutate({
        category: {} as Category,
      });

      (global.fetch as jest.Mock).mockRejectedValueOnce(null);

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      consoleSpy.mockRestore();
    });
  });

  describe("Input Validation and Edge Cases", () => {
    it("handles categories with minimal required fields", async () => {
      const minimalCategory: Category = {
        categoryId: 0,
        category: "minimal",
        activeStatus: true,
      };

      const mockResponse = { ...minimalCategory, categoryId: 999 };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => useCategoryInsert(), {
        wrapper: createWrapper(queryClient),
      });

      result.current.mutate({
        category: minimalCategory,
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockResponse);
    });

    it("handles categories with all optional fields", async () => {
      const fullCategory: Category = {
        categoryId: 0,
        category: "comprehensive_category",
        activeStatus: true,
        accountNameOwner: "detailed_user",
        description: "A category with all possible fields",
        createdDate: new Date("2024-01-01"),
        modifiedDate: new Date("2024-01-15"),
        color: "#FF5733",
        sortOrder: 5,
      };

      const mockResponse = { ...fullCategory, categoryId: 555 };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => useCategoryInsert(), {
        wrapper: createWrapper(queryClient),
      });

      result.current.mutate({
        category: fullCategory,
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockResponse);
    });

    it("handles empty category names", async () => {
      const emptyCategory: Category = {
        categoryId: 0,
        category: "",
        activeStatus: true,
        accountNameOwner: "test_user",
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          response: "Category name cannot be empty",
        }),
      });

      const { result } = renderHook(() => useCategoryInsert(), {
        wrapper: createWrapper(queryClient),
      });

      result.current.mutate({
        category: emptyCategory,
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(
        new Error("Category name cannot be empty"),
      );
    });

    it("handles special characters in category names", async () => {
      const specialCategory: Category = {
        categoryId: 0,
        category: "Health & Wellness (2024)",
        activeStatus: true,
        accountNameOwner: "test_user",
      };

      const mockResponse = { ...specialCategory, categoryId: 777 };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => useCategoryInsert(), {
        wrapper: createWrapper(queryClient),
      });

      result.current.mutate({
        category: specialCategory,
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockResponse);
    });

    it("handles very long category names", async () => {
      const longCategoryName = "A".repeat(255); // Very long category name
      const longCategory: Category = {
        categoryId: 0,
        category: longCategoryName,
        activeStatus: true,
        accountNameOwner: "test_user",
      };

      const mockResponse = { ...longCategory, categoryId: 888 };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => useCategoryInsert(), {
        wrapper: createWrapper(queryClient),
      });

      result.current.mutate({
        category: longCategory,
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockResponse);
    });

    it("handles categories with activeStatus false", async () => {
      const inactiveCategory: Category = {
        categoryId: 0,
        category: "inactive_category",
        activeStatus: false,
        accountNameOwner: "test_user",
      };

      const mockResponse = { ...inactiveCategory, categoryId: 444 };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => useCategoryInsert(), {
        wrapper: createWrapper(queryClient),
      });

      result.current.mutate({
        category: inactiveCategory,
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockResponse);
    });
  });

  describe("HTTP Status Code Handling", () => {
    it("handles 201 Created response", async () => {
      const category: Category = {
        categoryId: 0,
        category: "new_category",
        activeStatus: true,
      };

      const mockResponse = { ...category, categoryId: 123 };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => useCategoryInsert(), {
        wrapper: createWrapper(queryClient),
      });

      result.current.mutate({
        category,
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockResponse);
    });

    it("handles 409 Conflict response", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 409,
        json: async () => ({
          response: "Category already exists for this user",
        }),
      });

      const { result } = renderHook(() => useCategoryInsert(), {
        wrapper: createWrapper(queryClient),
      });

      result.current.mutate({
        category: {} as Category,
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(
        new Error("Category already exists for this user"),
      );
    });

    it("handles 422 Unprocessable Entity response", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 422,
        json: async () => ({
          response: "Invalid category data format",
        }),
      });

      const { result } = renderHook(() => useCategoryInsert(), {
        wrapper: createWrapper(queryClient),
      });

      result.current.mutate({
        category: {} as Category,
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(
        new Error("Invalid category data format"),
      );
    });
  });

  describe("Mutation State Management", () => {
    it("resets state correctly between mutations", async () => {
      const { result } = renderHook(() => useCategoryInsert(), {
        wrapper: createWrapper(queryClient),
      });

      // First mutation - success
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ categoryId: 1, category: "success" }),
      });

      result.current.mutate({
        category: { category: "success" } as Category,
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.isError).toBe(false);
      expect(result.current.error).toBeNull();

      // Second mutation - error
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ response: "Validation error" }),
      });

      result.current.mutate({
        category: { category: "error" } as Category,
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.isSuccess).toBe(false);
      expect(result.current.error).toEqual(new Error("Validation error"));
    });

    it("maintains correct state throughout mutation lifecycle", async () => {
      const { result } = renderHook(() => useCategoryInsert(), {
        wrapper: createWrapper(queryClient),
      });

      // Initial state
      expect(result.current.isIdle).toBe(true);
      expect(result.current.isSuccess).toBe(false);
      expect(result.current.isError).toBe(false);

      // Mock successful response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ categoryId: 1, category: "test" }),
      });

      result.current.mutate({
        category: { category: "test" } as Category,
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.isError).toBe(false);
      expect(result.current.data).toEqual({ categoryId: 1, category: "test" });
    });
  });
});
