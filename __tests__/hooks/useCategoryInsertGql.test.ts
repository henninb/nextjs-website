import React from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import useCategoryInsertGql from "../../hooks/useCategoryInsertGql";
import Category from "../../model/Category";

// Mock the graphqlRequest function
jest.mock("../../utils/graphqlClient", () => ({
  graphqlRequest: jest.fn(),
}));

import { graphqlRequest } from "../../utils/graphqlClient";

// Mock the useAuth hook
jest.mock("../../components/AuthProvider", () => ({
  useAuth: () => ({
    isAuthenticated: true,
    loading: false,
    user: null,
    login: jest.fn(),
    logout: jest.fn(),
  }),
}));
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

describe("useCategoryInsertGql", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should insert a category successfully", async () => {
    const queryClient = createTestQueryClient();

    const newCategory: Category = {
      categoryId: 0,
      categoryName: "Groceries Test",
      activeStatus: true,
    };

    const mockCreateResponse = {
      createCategory: {
        categoryId: 1,
        categoryName: "groceriestest",
        activeStatus: true,
        categoryCount: 0,
        dateAdded: "2024-01-01T00:00:00Z",
        dateUpdated: "2024-01-01T00:00:00Z",
      },
    };

    mockGraphqlRequest.mockResolvedValueOnce(mockCreateResponse);

    const { result } = renderHook(() => useCategoryInsertGql(), {
      wrapper: createWrapper(queryClient),
    });

    await result.current.mutateAsync({ category: newCategory });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockGraphqlRequest).toHaveBeenCalledTimes(1);
    expect(mockGraphqlRequest).toHaveBeenCalledWith({
      query: expect.stringContaining("mutation CreateCategory"),
      variables: {
        category: {
          categoryName: "groceriestest", // Normalized: spaces removed, lowercase
          activeStatus: true,
          owner: "",
        },
      },
    });

    expect(result.current.data).toStrictEqual(
      expect.objectContaining({
        categoryId: 1,
        categoryName: "groceriestest",
        activeStatus: true,
      }),
    );
  });

  it("should update query cache after successful insert", async () => {
    const queryClient = createTestQueryClient();

    // Set initial cache data
    const initialCategories: Category[] = [
      {
        categoryId: 1,
        categoryName: "existing",
        activeStatus: true,
      },
    ];
    queryClient.setQueryData(["categoryGQL"], initialCategories);

    const newCategory: Category = {
      categoryId: 0,
      categoryName: "groceries",
      activeStatus: true,
    };

    const mockCreateResponse = {
      createCategory: {
        categoryId: 2,
        categoryName: "groceries",
        activeStatus: true,
        categoryCount: 0,
        dateAdded: "2024-01-01T00:00:00Z",
        dateUpdated: "2024-01-01T00:00:00Z",
      },
    };

    mockGraphqlRequest.mockResolvedValueOnce(mockCreateResponse);

    const { result } = renderHook(() => useCategoryInsertGql(), {
      wrapper: createWrapper(queryClient),
    });

    await result.current.mutateAsync({ category: newCategory });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Check that cache was updated
    const updatedCache = queryClient.getQueryData<Category[]>(["categoryGQL"]);
    expect(updatedCache).toHaveLength(2);
    expect(updatedCache?.[0].categoryName).toBe("groceries");
    expect(updatedCache?.[1].categoryName).toBe("existing");
  });

  it("should handle GraphQL errors properly", async () => {
    const queryClient = createTestQueryClient();

    const newCategory: Category = {
      categoryId: 0,
      categoryName: "groceries",
      activeStatus: true,
    };

    mockGraphqlRequest.mockRejectedValue(new Error("GraphQL error"));

    const { result } = renderHook(() => useCategoryInsertGql(), {
      wrapper: createWrapper(queryClient),
    });

    await expect(
      result.current.mutateAsync({ category: newCategory }),
    ).rejects.toThrow("GraphQL error");

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error?.message).toBe("GraphQL error");
  });

  it("should handle category with activeStatus false", async () => {
    const queryClient = createTestQueryClient();

    const newCategory: Category = {
      categoryId: 0,
      categoryName: "inactive",
      activeStatus: false,
    };

    const mockCreateResponse = {
      createCategory: {
        categoryId: 1,
        categoryName: "inactive",
        activeStatus: false,
        categoryCount: 0,
        dateAdded: "2024-01-01T00:00:00Z",
        dateUpdated: "2024-01-01T00:00:00Z",
      },
    };

    mockGraphqlRequest.mockResolvedValueOnce(mockCreateResponse);

    const { result } = renderHook(() => useCategoryInsertGql(), {
      wrapper: createWrapper(queryClient),
    });

    await result.current.mutateAsync({ category: newCategory });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockGraphqlRequest).toHaveBeenCalledWith({
      query: expect.stringContaining("mutation CreateCategory"),
      variables: {
        category: {
          categoryName: "inactive",
          activeStatus: false,
          owner: "",
        },
      },
    });
  });
});
