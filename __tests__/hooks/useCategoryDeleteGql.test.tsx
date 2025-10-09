import React from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import useCategoryDeleteGql from "../../hooks/useCategoryDeleteGql";
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

const createWrapper =
  (queryClient: QueryClient) =>
  ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

describe("useCategoryDeleteGql", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should delete a category successfully", async () => {
    const queryClient = createTestQueryClient();

    const categoryToDelete: Category = {
      categoryId: 1,
      categoryName: "groceries",
      activeStatus: true,
    };

    const mockDeleteResponse = {
      deleteCategory: true,
    };

    mockGraphqlRequest.mockResolvedValueOnce(mockDeleteResponse);

    const { result } = renderHook(() => useCategoryDeleteGql(), {
      wrapper: createWrapper(queryClient),
    });

    await result.current.mutateAsync(categoryToDelete);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockGraphqlRequest).toHaveBeenCalledTimes(1);
    expect(mockGraphqlRequest).toHaveBeenCalledWith({
      query: expect.stringContaining("mutation DeleteCategory"),
      variables: {
        categoryName: "groceries",
      },
    });

    expect(result.current.data).toEqual({
      ok: true,
      categoryName: "groceries",
    });
  });

  it("should update query cache after successful delete", async () => {
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

    const categoryToDelete: Category = {
      categoryId: 1,
      categoryName: "groceries",
      activeStatus: true,
    };

    const mockDeleteResponse = {
      deleteCategory: true,
    };

    mockGraphqlRequest.mockResolvedValueOnce(mockDeleteResponse);

    const { result } = renderHook(() => useCategoryDeleteGql(), {
      wrapper: createWrapper(queryClient),
    });

    await result.current.mutateAsync(categoryToDelete);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Check that cache was updated
    const updatedCache = queryClient.getQueryData<Category[]>(["categoryGQL"]);
    expect(updatedCache).toHaveLength(1);
    expect(updatedCache?.[0].categoryName).toBe("utilities");
  });

  it("should handle GraphQL errors properly", async () => {
    const queryClient = createTestQueryClient();

    const categoryToDelete: Category = {
      categoryId: 1,
      categoryName: "groceries",
      activeStatus: true,
    };

    mockGraphqlRequest.mockRejectedValue(new Error("GraphQL error"));

    const { result } = renderHook(() => useCategoryDeleteGql(), {
      wrapper: createWrapper(queryClient),
    });

    await expect(result.current.mutateAsync(categoryToDelete)).rejects.toThrow(
      "GraphQL error",
    );

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error?.message).toBe("GraphQL error");
  });

  it("should handle empty cache gracefully", async () => {
    const queryClient = createTestQueryClient();

    // Start with empty cache
    queryClient.setQueryData(["categoryGQL"], []);

    const categoryToDelete: Category = {
      categoryId: 1,
      categoryName: "groceries",
      activeStatus: true,
    };

    const mockDeleteResponse = {
      deleteCategory: true,
    };

    mockGraphqlRequest.mockResolvedValueOnce(mockDeleteResponse);

    const { result } = renderHook(() => useCategoryDeleteGql(), {
      wrapper: createWrapper(queryClient),
    });

    await result.current.mutateAsync(categoryToDelete);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Cache should still be empty
    const updatedCache = queryClient.getQueryData<Category[]>(["categoryGQL"]);
    expect(updatedCache).toEqual([]);
  });

  it("should handle delete with null cache", async () => {
    const queryClient = createTestQueryClient();

    const categoryToDelete: Category = {
      categoryId: 1,
      categoryName: "groceries",
      activeStatus: true,
    };

    const mockDeleteResponse = {
      deleteCategory: true,
    };

    mockGraphqlRequest.mockResolvedValueOnce(mockDeleteResponse);

    const { result } = renderHook(() => useCategoryDeleteGql(), {
      wrapper: createWrapper(queryClient),
    });

    await result.current.mutateAsync(categoryToDelete);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Cache should remain undefined or become empty array
    const updatedCache = queryClient.getQueryData<Category[]>(["categoryGQL"]);
    expect(updatedCache === undefined || updatedCache.length === 0).toBe(true);
  });

  it("should handle delete response with success false", async () => {
    const queryClient = createTestQueryClient();

    const categoryToDelete: Category = {
      categoryId: 1,
      categoryName: "groceries",
      activeStatus: true,
    };

    const mockDeleteResponse = {
      deleteCategory: false,
    };

    mockGraphqlRequest.mockResolvedValueOnce(mockDeleteResponse);

    const { result } = renderHook(() => useCategoryDeleteGql(), {
      wrapper: createWrapper(queryClient),
    });

    await result.current.mutateAsync(categoryToDelete);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual({
      ok: false,
      categoryName: "groceries",
    });
  });
});
