import React from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import useCategoryFetchGql from "../../hooks/useCategoryFetchGql";
import Category from "../../model/Category";
import * as AuthProvider from "../../components/AuthProvider";

// Mock the graphqlRequest function
jest.mock("../../utils/graphqlClient", () => ({
  graphqlRequest: jest.fn(),
}));

import { graphqlRequest } from "../../utils/graphqlClient";
const mockGraphqlRequest = graphqlRequest as jest.MockedFunction<
  typeof graphqlRequest
>;

// Mock the useAuth hook
jest.mock("../../components/AuthProvider");
const mockUseAuth = AuthProvider.useAuth as jest.MockedFunction<
  typeof AuthProvider.useAuth
>;

// Create a fresh QueryClient for each test
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        retryOnMount: false,
        refetchOnMount: false,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
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

describe("useCategoryFetchGql", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should not execute query when user is not authenticated", async () => {
    const queryClient = createTestQueryClient();

    // Mock unauthenticated state
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      loading: false,
      user: null,
      login: jest.fn(),
      logout: jest.fn(),
    });

    const { result } = renderHook(() => useCategoryFetchGql(), {
      wrapper: createWrapper(queryClient),
    });

    // Wait a bit to ensure the hook has time to run
    await waitFor(() => {
      expect(result.current.isFetching).toBe(false);
    });

    // GraphQL request should not have been called
    expect(mockGraphqlRequest).not.toHaveBeenCalled();
    expect(result.current.data).toBeUndefined();
    expect(result.current.isSuccess).toBe(false);
  });

  it("should not execute query when authentication is loading", async () => {
    const queryClient = createTestQueryClient();

    // Mock loading state
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      loading: true,
      user: null,
      login: jest.fn(),
      logout: jest.fn(),
    });

    const { result } = renderHook(() => useCategoryFetchGql(), {
      wrapper: createWrapper(queryClient),
    });

    // Wait a bit to ensure the hook has time to run
    await waitFor(() => {
      expect(result.current.isFetching).toBe(false);
    });

    // GraphQL request should not have been called
    expect(mockGraphqlRequest).not.toHaveBeenCalled();
    expect(result.current.data).toBeUndefined();
    expect(result.current.isSuccess).toBe(false);
  });

  it("should fetch categories successfully when authenticated", async () => {
    const queryClient = createTestQueryClient();

    // Mock authenticated state
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      loading: false,
      user: { username: "test@example.com" },
      login: jest.fn(),
      logout: jest.fn(),
    });

    const mockCategoriesResponse = {
      categories: [
        {
          categoryId: 1,
          categoryName: "groceries",
          activeStatus: true,
          categoryCount: 10,
          dateAdded: "2023-01-01T00:00:00Z",
          dateUpdated: "2024-01-15T00:00:00Z",
        },
        {
          categoryId: 2,
          categoryName: "utilities",
          activeStatus: true,
          categoryCount: 5,
          dateAdded: "2023-01-01T00:00:00Z",
          dateUpdated: "2024-01-15T00:00:00Z",
        },
      ],
    };

    mockGraphqlRequest.mockResolvedValueOnce(mockCategoriesResponse);

    const { result } = renderHook(() => useCategoryFetchGql(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockGraphqlRequest).toHaveBeenCalledTimes(1);
    expect(mockGraphqlRequest).toHaveBeenCalledWith({
      query: expect.stringContaining("query Categories"),
    });

    expect(result.current.data).toHaveLength(2);
    expect(result.current.data?.[0]).toEqual(
      expect.objectContaining({
        categoryId: 1,
        categoryName: "groceries",
        activeStatus: true,
        categoryCount: 10,
      }),
    );
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isError).toBe(false);
  });

  it("should handle GraphQL errors properly", async () => {
    const queryClient = createTestQueryClient();

    // Mock authenticated state
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      loading: false,
      user: { username: "test@example.com" },
      login: jest.fn(),
      logout: jest.fn(),
    });

    mockGraphqlRequest.mockRejectedValue(new Error("GraphQL error"));

    const { result } = renderHook(() => useCategoryFetchGql(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.isError).toBe(true), {
      timeout: 3000,
    });

    expect(result.current.data).toBeUndefined();
    expect(result.current.isSuccess).toBe(false);
    expect(result.current.error).toBeDefined();
    expect(result.current.error?.message).toBe("GraphQL error");
  });

  it("should provide refetch capability", async () => {
    const queryClient = createTestQueryClient();

    // Mock authenticated state
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      loading: false,
      user: { username: "test@example.com" },
      login: jest.fn(),
      logout: jest.fn(),
    });

    const mockCategoriesResponse = {
      categories: [
        {
          categoryId: 1,
          categoryName: "test",
          activeStatus: true,
          categoryCount: 1,
          dateAdded: null,
          dateUpdated: null,
        },
      ],
    };

    mockGraphqlRequest.mockResolvedValueOnce(mockCategoriesResponse);

    const { result } = renderHook(() => useCategoryFetchGql(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.refetch).toBeDefined();
    expect(typeof result.current.refetch).toBe("function");
  });

  it("should handle empty categories response", async () => {
    const queryClient = createTestQueryClient();

    // Mock authenticated state
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      loading: false,
      user: { username: "test@example.com" },
      login: jest.fn(),
      logout: jest.fn(),
    });

    const mockCategoriesResponse = {
      categories: [],
    };

    mockGraphqlRequest.mockResolvedValueOnce(mockCategoriesResponse);

    const { result } = renderHook(() => useCategoryFetchGql(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isError).toBe(false);
  });
});
