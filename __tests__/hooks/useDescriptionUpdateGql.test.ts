import React from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import useDescriptionUpdateGql from "../../hooks/useDescriptionUpdateGql";
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

describe("useDescriptionUpdateGql", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should update a description successfully", async () => {
    const queryClient = createTestQueryClient();

    const oldDescription: Description = {
      descriptionId: 1,
      descriptionName: "amazon",
      activeStatus: true,
    };

    const newDescription: Description = {
      descriptionId: 1,
      descriptionName: "amazon",
      activeStatus: false,
    };

    const mockUpdateResponse = {
      updateDescription: {
        descriptionId: 1,
        descriptionName: "amazon",
        activeStatus: false,
        descriptionCount: 5,
        dateAdded: "2024-01-01T00:00:00Z",
        dateUpdated: "2024-02-01T00:00:00Z",
      },
    };

    mockGraphqlRequest.mockResolvedValueOnce(mockUpdateResponse);

    const { result } = renderHook(() => useDescriptionUpdateGql(), {
      wrapper: createWrapper(queryClient),
    });

    await result.current.mutateAsync({ oldDescription, newDescription });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockGraphqlRequest).toHaveBeenCalledTimes(1);
    expect(mockGraphqlRequest).toHaveBeenCalledWith({
      query: expect.stringContaining("mutation UpdateDescription"),
      variables: {
        description: {
          descriptionId: 1,
          descriptionName: "amazon",
          activeStatus: false,
        },
        oldDescriptionName: null, // Not a rename
      },
    });

    expect(result.current.data).toEqual(
      expect.objectContaining({
        descriptionId: 1,
        descriptionName: "amazon",
        activeStatus: false,
      }),
    );
  });

  it("should handle rename operation with oldDescriptionName", async () => {
    const queryClient = createTestQueryClient();

    const oldDescription: Description = {
      descriptionId: 1,
      descriptionName: "Amazon Prime",
      activeStatus: true,
    };

    const newDescription: Description = {
      descriptionId: 1,
      descriptionName: "Netflix",
      activeStatus: true,
    };

    const mockUpdateResponse = {
      updateDescription: {
        descriptionId: 1,
        descriptionName: "netflix",
        activeStatus: true,
        descriptionCount: 5,
        dateAdded: "2024-01-01T00:00:00Z",
        dateUpdated: "2024-02-01T00:00:00Z",
      },
    };

    mockGraphqlRequest.mockResolvedValueOnce(mockUpdateResponse);

    const { result } = renderHook(() => useDescriptionUpdateGql(), {
      wrapper: createWrapper(queryClient),
    });

    await result.current.mutateAsync({ oldDescription, newDescription });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockGraphqlRequest).toHaveBeenCalledWith({
      query: expect.stringContaining("mutation UpdateDescription"),
      variables: {
        description: {
          descriptionId: 1,
          descriptionName: "netflix", // Normalized
          activeStatus: true,
        },
        oldDescriptionName: "amazonprime", // Normalized old name
      },
    });

    expect(result.current.data?.descriptionName).toBe("netflix");
  });

  it("should normalize description names before comparison", async () => {
    const queryClient = createTestQueryClient();

    const oldDescription: Description = {
      descriptionId: 1,
      descriptionName: "Test Description",
      activeStatus: true,
    };

    const newDescription: Description = {
      descriptionId: 1,
      descriptionName: "Test New Name",
      activeStatus: true,
    };

    const mockUpdateResponse = {
      updateDescription: {
        descriptionId: 1,
        descriptionName: "testnewname",
        activeStatus: true,
        descriptionCount: 0,
        dateAdded: "2024-01-01T00:00:00Z",
        dateUpdated: "2024-02-01T00:00:00Z",
      },
    };

    mockGraphqlRequest.mockResolvedValueOnce(mockUpdateResponse);

    const { result } = renderHook(() => useDescriptionUpdateGql(), {
      wrapper: createWrapper(queryClient),
    });

    await result.current.mutateAsync({ oldDescription, newDescription });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockGraphqlRequest).toHaveBeenCalledWith({
      query: expect.stringContaining("mutation UpdateDescription"),
      variables: {
        description: {
          descriptionId: 1,
          descriptionName: "testnewname",
          activeStatus: true,
        },
        oldDescriptionName: "testdescription", // This is a rename
      },
    });
  });

  it("should update query cache after successful update", async () => {
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

    const oldDescription: Description = {
      descriptionId: 1,
      descriptionName: "amazon",
      activeStatus: true,
    };

    const newDescription: Description = {
      descriptionId: 1,
      descriptionName: "amazon",
      activeStatus: false,
    };

    const mockUpdateResponse = {
      updateDescription: {
        descriptionId: 1,
        descriptionName: "amazon",
        activeStatus: false,
        descriptionCount: 5,
        dateAdded: "2024-01-01T00:00:00Z",
        dateUpdated: "2024-02-01T00:00:00Z",
      },
    };

    mockGraphqlRequest.mockResolvedValueOnce(mockUpdateResponse);

    const { result } = renderHook(() => useDescriptionUpdateGql(), {
      wrapper: createWrapper(queryClient),
    });

    await result.current.mutateAsync({ oldDescription, newDescription });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Check that cache was updated
    const updatedCache = queryClient.getQueryData<Description[]>([
      "descriptionGQL",
    ]);
    expect(updatedCache).toHaveLength(2);
    expect(updatedCache?.[0].activeStatus).toBe(false);
    expect(updatedCache?.[1].descriptionName).toBe("netflix");
  });

  it("should handle GraphQL errors properly", async () => {
    const queryClient = createTestQueryClient();

    const oldDescription: Description = {
      descriptionId: 1,
      descriptionName: "amazon",
      activeStatus: true,
    };

    const newDescription: Description = {
      descriptionId: 1,
      descriptionName: "netflix",
      activeStatus: true,
    };

    mockGraphqlRequest.mockRejectedValue(new Error("GraphQL error"));

    const { result } = renderHook(() => useDescriptionUpdateGql(), {
      wrapper: createWrapper(queryClient),
    });

    await expect(
      result.current.mutateAsync({ oldDescription, newDescription }),
    ).rejects.toThrow("GraphQL error");

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error?.message).toBe("GraphQL error");
  });

  it("should handle activeStatus changes", async () => {
    const queryClient = createTestQueryClient();

    const oldDescription: Description = {
      descriptionId: 1,
      descriptionName: "amazon",
      activeStatus: true,
    };

    const newDescription: Description = {
      descriptionId: 1,
      descriptionName: "amazon",
      activeStatus: false,
    };

    const mockUpdateResponse = {
      updateDescription: {
        descriptionId: 1,
        descriptionName: "amazon",
        activeStatus: false,
        descriptionCount: 5,
        dateAdded: "2024-01-01T00:00:00Z",
        dateUpdated: "2024-02-01T00:00:00Z",
      },
    };

    mockGraphqlRequest.mockResolvedValueOnce(mockUpdateResponse);

    const { result } = renderHook(() => useDescriptionUpdateGql(), {
      wrapper: createWrapper(queryClient),
    });

    await result.current.mutateAsync({ oldDescription, newDescription });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.activeStatus).toBe(false);
  });
});
