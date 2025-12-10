import React from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import useDescriptionDeleteGql from "../../hooks/useDescriptionDeleteGql";
import Description from "../../model/Description";

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

describe("useDescriptionDeleteGql", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should delete a description successfully", async () => {
    const queryClient = createTestQueryClient();

    const descriptionToDelete: Description = {
      descriptionId: 1,
      descriptionName: "amazon",
      activeStatus: true,
    };

    const mockDeleteResponse = {
      deleteDescription: true,
    };

    mockGraphqlRequest.mockResolvedValueOnce(mockDeleteResponse);

    const { result } = renderHook(() => useDescriptionDeleteGql(), {
      wrapper: createWrapper(queryClient),
    });

    await result.current.mutateAsync(descriptionToDelete);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockGraphqlRequest).toHaveBeenCalledTimes(1);
    expect(mockGraphqlRequest).toHaveBeenCalledWith({
      query: expect.stringContaining("mutation DeleteDescription"),
      variables: { descriptionName: "amazon" },
    });

    expect(result.current.data).toStrictEqual({
      ok: true,
      descriptionName: "amazon",
    });
  });

  it("should remove description from query cache after successful delete", async () => {
    const queryClient = createTestQueryClient();

    // Set initial cache data
    const initialDescriptions: Description[] = [
      {
        descriptionId: 1,
        descriptionName: "amazon",
        activeStatus: true,
      },
      {
        descriptionId: 2,
        descriptionName: "netflix",
        activeStatus: true,
      },
    ];
    queryClient.setQueryData(["descriptionGQL"], initialDescriptions);

    const descriptionToDelete: Description = {
      descriptionId: 1,
      descriptionName: "amazon",
      activeStatus: true,
    };

    const mockDeleteResponse = {
      deleteDescription: true,
    };

    mockGraphqlRequest.mockResolvedValueOnce(mockDeleteResponse);

    const { result } = renderHook(() => useDescriptionDeleteGql(), {
      wrapper: createWrapper(queryClient),
    });

    await result.current.mutateAsync(descriptionToDelete);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Check that cache was updated
    const updatedCache = queryClient.getQueryData<Description[]>([
      "descriptionGQL",
    ]);
    expect(updatedCache).toHaveLength(1);
    expect(updatedCache?.[0].descriptionName).toBe("netflix");
  });

  it("should handle GraphQL errors properly", async () => {
    const queryClient = createTestQueryClient();

    const descriptionToDelete: Description = {
      descriptionId: 1,
      descriptionName: "amazon",
      activeStatus: true,
    };

    mockGraphqlRequest.mockRejectedValue(new Error("GraphQL error"));

    const { result } = renderHook(() => useDescriptionDeleteGql(), {
      wrapper: createWrapper(queryClient),
    });

    await expect(
      result.current.mutateAsync(descriptionToDelete),
    ).rejects.toThrow("GraphQL error");

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error?.message).toBe("GraphQL error");
  });

  it("should handle deletion when description not in cache", async () => {
    const queryClient = createTestQueryClient();

    // Set initial cache data without the description we're deleting
    const initialDescriptions: Description[] = [
      {
        descriptionId: 2,
        descriptionName: "netflix",
        activeStatus: true,
      },
    ];
    queryClient.setQueryData(["descriptionGQL"], initialDescriptions);

    const descriptionToDelete: Description = {
      descriptionId: 1,
      descriptionName: "amazon",
      activeStatus: true,
    };

    const mockDeleteResponse = {
      deleteDescription: true,
    };

    mockGraphqlRequest.mockResolvedValueOnce(mockDeleteResponse);

    const { result } = renderHook(() => useDescriptionDeleteGql(), {
      wrapper: createWrapper(queryClient),
    });

    await result.current.mutateAsync(descriptionToDelete);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Cache should still have the original description
    const updatedCache = queryClient.getQueryData<Description[]>([
      "descriptionGQL",
    ]);
    expect(updatedCache).toHaveLength(1);
    expect(updatedCache?.[0].descriptionName).toBe("netflix");
  });

  it("should pass descriptionName to mutation", async () => {
    const queryClient = createTestQueryClient();

    const descriptionToDelete: Description = {
      descriptionId: 1,
      descriptionName: "test-description",
      activeStatus: true,
    };

    const mockDeleteResponse = {
      deleteDescription: true,
    };

    mockGraphqlRequest.mockResolvedValueOnce(mockDeleteResponse);

    const { result } = renderHook(() => useDescriptionDeleteGql(), {
      wrapper: createWrapper(queryClient),
    });

    await result.current.mutateAsync(descriptionToDelete);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockGraphqlRequest).toHaveBeenCalledWith({
      query: expect.stringContaining("mutation DeleteDescription"),
      variables: { descriptionName: "test-description" },
    });
  });

  it("should handle backend returning false for delete", async () => {
    const queryClient = createTestQueryClient();

    const descriptionToDelete: Description = {
      descriptionId: 1,
      descriptionName: "amazon",
      activeStatus: true,
    };

    const mockDeleteResponse = {
      deleteDescription: false,
    };

    mockGraphqlRequest.mockResolvedValueOnce(mockDeleteResponse);

    const { result } = renderHook(() => useDescriptionDeleteGql(), {
      wrapper: createWrapper(queryClient),
    });

    await result.current.mutateAsync(descriptionToDelete);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toStrictEqual({
      ok: false,
      descriptionName: "amazon",
    });
  });
});
