import React from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import useCategoryUpdateGql from "../../hooks/useCategoryUpdateGql";
import Category from "../../model/Category";

// Mock the graphqlRequest function
jest.mock("../../utils/graphqlClient", () => ({
  graphqlRequest: jest.fn(),
}));

import { graphqlRequest } from "../../utils/graphqlClient";
const mockGraphqlRequest = graphqlRequest as jest.MockedFunction<
  typeof graphqlRequest
>;

// Create a fresh QueryClient for each test
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });

const createWrapper = (queryClient: QueryClient) =>
  function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(
      QueryClientProvider,
      { client: queryClient },
      children as any,
    );
  };

describe("useCategoryUpdateGql", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should update a category successfully", async () => {
    const queryClient = createTestQueryClient();

    const oldCategory: Category = {
      categoryId: 1,
      categoryName: "groceries",
      activeStatus: true,
    };

    const newCategory: Category = {
      categoryId: 1,
      categoryName: "food",
      activeStatus: true,
    };

    const mockUpdateResponse = {
      updateCategory: {
        categoryId: 1,
        categoryName: "food",
        activeStatus: true,
        categoryCount: 5,
        dateAdded: "2024-01-01T00:00:00Z",
        dateUpdated: "2024-01-15T00:00:00Z",
      },
    };

    mockGraphqlRequest.mockResolvedValueOnce(mockUpdateResponse);

    const { result } = renderHook(() => useCategoryUpdateGql(), {
      wrapper: createWrapper(queryClient),
    });

    await result.current.mutateAsync({
      oldCategory,
      newCategory,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockGraphqlRequest).toHaveBeenCalledTimes(1);
    expect(mockGraphqlRequest).toHaveBeenCalledWith({
      query: expect.stringContaining("mutation UpdateCategory"),
      variables: {
        category: {
          categoryId: 1,
          categoryName: "food",
          activeStatus: true,
        },
        oldCategoryName: "groceries",
      },
    });

    expect(result.current.data).toEqual(
      expect.objectContaining({
        categoryId: 1,
        categoryName: "food",
        activeStatus: true,
      }),
    );
  });

  it("should update query cache after successful update", async () => {
    const queryClient = createTestQueryClient();

    // Set initial cache data
    const initialCategories: Category[] = [
      {
        categoryId: 1,
        categoryName: "groceries",
        activeStatus: true,
      },
      {
        categoryId: 2,
        categoryName: "utilities",
        activeStatus: true,
      },
    ];
    queryClient.setQueryData(["categoryGQL"], initialCategories);

    const oldCategory: Category = {
      categoryId: 1,
      categoryName: "groceries",
      activeStatus: true,
    };

    const newCategory: Category = {
      categoryId: 1,
      categoryName: "food",
      activeStatus: true,
    };

    const mockUpdateResponse = {
      updateCategory: {
        categoryId: 1,
        categoryName: "food",
        activeStatus: true,
        categoryCount: 5,
        dateAdded: "2024-01-01T00:00:00Z",
        dateUpdated: "2024-01-15T00:00:00Z",
      },
    };

    mockGraphqlRequest.mockResolvedValueOnce(mockUpdateResponse);

    const { result } = renderHook(() => useCategoryUpdateGql(), {
      wrapper: createWrapper(queryClient),
    });

    await result.current.mutateAsync({
      oldCategory,
      newCategory,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Check that cache was updated
    const updatedCache = queryClient.getQueryData<Category[]>(["categoryGQL"]);
    expect(updatedCache).toHaveLength(2);
    expect(updatedCache?.[0].categoryName).toBe("food");
    expect(updatedCache?.[1].categoryName).toBe("utilities");
  });

  it("should handle GraphQL errors properly", async () => {
    const queryClient = createTestQueryClient();

    const oldCategory: Category = {
      categoryId: 1,
      categoryName: "groceries",
      activeStatus: true,
    };

    const newCategory: Category = {
      categoryId: 1,
      categoryName: "food",
      activeStatus: true,
    };

    mockGraphqlRequest.mockRejectedValue(new Error("GraphQL error"));

    const { result } = renderHook(() => useCategoryUpdateGql(), {
      wrapper: createWrapper(queryClient),
    });

    await expect(
      result.current.mutateAsync({
        oldCategory,
        newCategory,
      }),
    ).rejects.toThrow("GraphQL error");

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error?.message).toBe("GraphQL error");
  });

  it("should handle updating activeStatus", async () => {
    const queryClient = createTestQueryClient();

    const oldCategory: Category = {
      categoryId: 1,
      categoryName: "groceries",
      activeStatus: true,
    };

    const newCategory: Category = {
      categoryId: 1,
      categoryName: "groceries",
      activeStatus: false,
    };

    const mockUpdateResponse = {
      updateCategory: {
        categoryId: 1,
        categoryName: "groceries",
        activeStatus: false,
        categoryCount: 5,
        dateAdded: "2024-01-01T00:00:00Z",
        dateUpdated: "2024-01-15T00:00:00Z",
      },
    };

    mockGraphqlRequest.mockResolvedValueOnce(mockUpdateResponse);

    const { result } = renderHook(() => useCategoryUpdateGql(), {
      wrapper: createWrapper(queryClient),
    });

    await result.current.mutateAsync({
      oldCategory,
      newCategory,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockGraphqlRequest).toHaveBeenCalledWith({
      query: expect.stringContaining("mutation UpdateCategory"),
      variables: {
        category: {
          categoryId: 1,
          categoryName: "groceries",
          activeStatus: false,
        },
        oldCategoryName: null,
      },
    });

    expect(result.current.data?.activeStatus).toBe(false);
  });

  it("should not update cache if category not found", async () => {
    const queryClient = createTestQueryClient();

    // Set initial cache data
    const initialCategories: Category[] = [
      {
        categoryId: 2,
        categoryName: "utilities",
        activeStatus: true,
      },
    ];
    queryClient.setQueryData(["categoryGQL"], initialCategories);

    const oldCategory: Category = {
      categoryId: 99,
      categoryName: "nonexistent",
      activeStatus: true,
    };

    const newCategory: Category = {
      categoryId: 99,
      categoryName: "updated",
      activeStatus: true,
    };

    const mockUpdateResponse = {
      updateCategory: {
        categoryId: 99,
        categoryName: "updated",
        activeStatus: true,
        categoryCount: 0,
        dateAdded: "2024-01-01T00:00:00Z",
        dateUpdated: "2024-01-15T00:00:00Z",
      },
    };

    mockGraphqlRequest.mockResolvedValueOnce(mockUpdateResponse);

    const { result } = renderHook(() => useCategoryUpdateGql(), {
      wrapper: createWrapper(queryClient),
    });

    await result.current.mutateAsync({
      oldCategory,
      newCategory,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Cache should still have only the original entry
    const updatedCache = queryClient.getQueryData<Category[]>(["categoryGQL"]);
    expect(updatedCache).toHaveLength(1);
    expect(updatedCache?.[0].categoryName).toBe("utilities");
  });
});
