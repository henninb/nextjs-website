import React from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import useDescriptionInsertGql from "../../hooks/useDescriptionInsertGql";
import Description from "../../model/Description";

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

describe("useDescriptionInsertGql", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should insert a description successfully", async () => {
    const queryClient = createTestQueryClient();

    const newDescription: Description = {
      descriptionId: 0,
      descriptionName: "Amazon Prime Test",
      activeStatus: true,
    };

    const mockCreateResponse = {
      createDescription: {
        descriptionId: 1,
        descriptionName: "amazonprimetest",
        activeStatus: true,
        descriptionCount: 0,
        dateAdded: "2024-01-01T00:00:00Z",
        dateUpdated: "2024-01-01T00:00:00Z",
      },
    };

    mockGraphqlRequest.mockResolvedValueOnce(mockCreateResponse);

    const { result } = renderHook(() => useDescriptionInsertGql(), {
      wrapper: createWrapper(queryClient),
    });

    await result.current.mutateAsync({ description: newDescription });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockGraphqlRequest).toHaveBeenCalledTimes(1);
    expect(mockGraphqlRequest).toHaveBeenCalledWith({
      query: expect.stringContaining("mutation CreateDescription"),
      variables: {
        description: {
          descriptionName: "amazonprimetest", // Normalized: spaces removed, lowercase
          activeStatus: true,
        },
      },
    });

    expect(result.current.data).toEqual(
      expect.objectContaining({
        descriptionId: 1,
        descriptionName: "amazonprimetest",
        activeStatus: true,
      }),
    );
  });

  it("should update query cache after successful insert", async () => {
    const queryClient = createTestQueryClient();

    // Set initial cache data
    const initialDescriptions: Description[] = [
      {
        descriptionId: 1,
        descriptionName: "existing",
        activeStatus: true,
      },
    ];
    queryClient.setQueryData(["descriptionGQL"], initialDescriptions);

    const newDescription: Description = {
      descriptionId: 0,
      descriptionName: "netflix",
      activeStatus: true,
    };

    const mockCreateResponse = {
      createDescription: {
        descriptionId: 2,
        descriptionName: "netflix",
        activeStatus: true,
        descriptionCount: 0,
        dateAdded: "2024-01-01T00:00:00Z",
        dateUpdated: "2024-01-01T00:00:00Z",
      },
    };

    mockGraphqlRequest.mockResolvedValueOnce(mockCreateResponse);

    const { result } = renderHook(() => useDescriptionInsertGql(), {
      wrapper: createWrapper(queryClient),
    });

    await result.current.mutateAsync({ description: newDescription });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Check that cache was updated
    const updatedCache = queryClient.getQueryData<Description[]>([
      "descriptionGQL",
    ]);
    expect(updatedCache).toHaveLength(2);
    expect(updatedCache?.[0].descriptionName).toBe("netflix");
    expect(updatedCache?.[1].descriptionName).toBe("existing");
  });

  it("should handle GraphQL errors properly", async () => {
    const queryClient = createTestQueryClient();

    const newDescription: Description = {
      descriptionId: 0,
      descriptionName: "netflix",
      activeStatus: true,
    };

    mockGraphqlRequest.mockRejectedValue(new Error("GraphQL error"));

    const { result } = renderHook(() => useDescriptionInsertGql(), {
      wrapper: createWrapper(queryClient),
    });

    await expect(
      result.current.mutateAsync({ description: newDescription }),
    ).rejects.toThrow("GraphQL error");

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error?.message).toBe("GraphQL error");
  });

  it("should handle description with activeStatus false", async () => {
    const queryClient = createTestQueryClient();

    const newDescription: Description = {
      descriptionId: 0,
      descriptionName: "inactive",
      activeStatus: false,
    };

    const mockCreateResponse = {
      createDescription: {
        descriptionId: 1,
        descriptionName: "inactive",
        activeStatus: false,
        descriptionCount: 0,
        dateAdded: "2024-01-01T00:00:00Z",
        dateUpdated: "2024-01-01T00:00:00Z",
      },
    };

    mockGraphqlRequest.mockResolvedValueOnce(mockCreateResponse);

    const { result } = renderHook(() => useDescriptionInsertGql(), {
      wrapper: createWrapper(queryClient),
    });

    await result.current.mutateAsync({ description: newDescription });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockGraphqlRequest).toHaveBeenCalledWith({
      query: expect.stringContaining("mutation CreateDescription"),
      variables: {
        description: {
          descriptionName: "inactive",
          activeStatus: false,
        },
      },
    });
  });

  it("should normalize description name by removing spaces and converting to lowercase", async () => {
    const queryClient = createTestQueryClient();

    const newDescription: Description = {
      descriptionId: 0,
      descriptionName: "Test Description With Spaces",
      activeStatus: true,
    };

    const mockCreateResponse = {
      createDescription: {
        descriptionId: 1,
        descriptionName: "testdescriptionwithspaces",
        activeStatus: true,
        descriptionCount: 0,
        dateAdded: "2024-01-01T00:00:00Z",
        dateUpdated: "2024-01-01T00:00:00Z",
      },
    };

    mockGraphqlRequest.mockResolvedValueOnce(mockCreateResponse);

    const { result } = renderHook(() => useDescriptionInsertGql(), {
      wrapper: createWrapper(queryClient),
    });

    await result.current.mutateAsync({ description: newDescription });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockGraphqlRequest).toHaveBeenCalledWith({
      query: expect.stringContaining("mutation CreateDescription"),
      variables: {
        description: {
          descriptionName: "testdescriptionwithspaces",
          activeStatus: true,
        },
      },
    });
  });
});
