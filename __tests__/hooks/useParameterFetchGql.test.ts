import React from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

jest.mock("../../utils/graphqlClient", () => ({
  graphqlRequest: jest.fn(),
}));

jest.mock("../../utils/logger", () => ({
  createHookLogger: jest.fn(() => ({
    debug: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
  })),
}));

jest.mock("../../utils/queryConfig", () =>
  jest.requireActual("../../utils/queryConfig"),
);

jest.mock("../../components/AuthProvider", () => ({
  useAuth: () => ({
    isAuthenticated: true,
    loading: false,
    user: null,
    login: jest.fn(),
    logout: jest.fn(),
  }),
}));

import { graphqlRequest } from "../../utils/graphqlClient";
import useParameterFetchGql from "../../hooks/useParameterFetchGql";

const mockGraphqlRequest = graphqlRequest as jest.MockedFunction<typeof graphqlRequest>;

const createParameterGqlQueryClient = () =>
  new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

const createParameterGqlWrapper = (queryClient: QueryClient) =>
  function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  };

describe("useParameterFetchGql", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns parameter data on successful GraphQL query", async () => {
    const mockParameters = [
      {
        parameterId: 1,
        owner: "test_owner",
        parameterName: "key1",
        parameterValue: "value1",
        activeStatus: true,
        dateAdded: "2024-01-01T00:00:00Z",
        dateUpdated: "2024-01-02T00:00:00Z",
      },
      {
        parameterId: 2,
        owner: null,
        parameterName: "key2",
        parameterValue: "value2",
        activeStatus: false,
        dateAdded: null,
        dateUpdated: null,
      },
    ];

    mockGraphqlRequest.mockResolvedValue({ parameters: mockParameters } as any);

    const queryClient = createParameterGqlQueryClient();
    const { result } = renderHook(() => useParameterFetchGql(), {
      wrapper: createParameterGqlWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toHaveLength(2);
    expect(result.current.data![0].parameterId).toBe(1);
    expect(result.current.data![0].parameterName).toBe("key1");
    expect(result.current.data![0].owner).toBe("test_owner");
    expect(result.current.data![0].activeStatus).toBe(true);
    expect(result.current.data![1].owner).toBeUndefined();
    expect(result.current.data![1].dateAdded).toBeUndefined();
  });

  it("maps date strings to Date objects", async () => {
    const mockParameters = [
      {
        parameterId: 1,
        parameterName: "key1",
        parameterValue: "value1",
        activeStatus: true,
        dateAdded: "2024-06-15T12:00:00Z",
        dateUpdated: "2024-06-20T08:30:00Z",
      },
    ];

    mockGraphqlRequest.mockResolvedValue({ parameters: mockParameters } as any);

    const queryClient = createParameterGqlQueryClient();
    const { result } = renderHook(() => useParameterFetchGql(), {
      wrapper: createParameterGqlWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data![0].dateAdded).toBeInstanceOf(Date);
    expect(result.current.data![0].dateUpdated).toBeInstanceOf(Date);
  });

  it("handles empty parameters array", async () => {
    mockGraphqlRequest.mockResolvedValue({ parameters: [] } as any);

    const queryClient = createParameterGqlQueryClient();
    const { result } = renderHook(() => useParameterFetchGql(), {
      wrapper: createParameterGqlWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toStrictEqual([]);
  });

  it("handles null/undefined parameters in response", async () => {
    mockGraphqlRequest.mockResolvedValue({ parameters: null } as any);

    const queryClient = createParameterGqlQueryClient();
    const { result } = renderHook(() => useParameterFetchGql(), {
      wrapper: createParameterGqlWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toStrictEqual([]);
  });

  it("enters error state when GraphQL request fails", async () => {
    mockGraphqlRequest.mockRejectedValue(new Error("GraphQL network error"));

    const queryClient = createParameterGqlQueryClient();
    const { result } = renderHook(() => useParameterFetchGql(), {
      wrapper: createParameterGqlWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.isError).toBe(true), { timeout: 5000 });
    expect(result.current.error?.message).toBe("GraphQL network error");
  });

  it("starts in loading state", () => {
    mockGraphqlRequest.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ parameters: [] } as any), 1000)),
    );

    const queryClient = createParameterGqlQueryClient();
    const { result } = renderHook(() => useParameterFetchGql(), {
      wrapper: createParameterGqlWrapper(queryClient),
    });

    expect(result.current.isLoading).toBe(true);
  });
});
