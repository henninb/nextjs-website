import React from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import useParameterDeleteGql from "../../hooks/useParameterDeleteGql";
import Parameter from "../../model/Parameter";

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

import { graphqlRequest } from "../../utils/graphqlClient";

const mockGraphqlRequest = graphqlRequest as jest.MockedFunction<typeof graphqlRequest>;

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

const createWrapper = (queryClient: QueryClient) =>
  function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children as any);
  };

const createTestParameter = (overrides: Partial<Parameter> = {}): Parameter => ({
  parameterId: 1,
  parameterName: "test_param",
  parameterValue: "test_value",
  activeStatus: true,
  ...overrides,
});

describe("useParameterDeleteGql", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should delete a parameter successfully", async () => {
    const queryClient = createTestQueryClient();
    mockGraphqlRequest.mockResolvedValue({ deleteParameter: true });

    const { result } = renderHook(() => useParameterDeleteGql(), {
      wrapper: createWrapper(queryClient),
    });

    const param = createTestParameter({ parameterId: 1 });
    await result.current.mutateAsync({ oldRow: param });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockGraphqlRequest).toHaveBeenCalledWith(
      expect.objectContaining({ variables: { parameterId: 1 } }),
    );
  });

  it("should update cache on success by removing deleted parameter", async () => {
    const queryClient = createTestQueryClient();
    const existingParams = [
      createTestParameter({ parameterId: 1, parameterName: "param1" }),
      createTestParameter({ parameterId: 2, parameterName: "param2" }),
    ];
    queryClient.setQueryData(["parameterGQL"], existingParams);

    mockGraphqlRequest.mockResolvedValue({ deleteParameter: true });

    const { result } = renderHook(() => useParameterDeleteGql(), {
      wrapper: createWrapper(queryClient),
    });

    await result.current.mutateAsync({ oldRow: existingParams[0] });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const cached = queryClient.getQueryData<Parameter[]>(["parameterGQL"]);
    expect(cached).toHaveLength(1);
    expect(cached![0].parameterId).toBe(2);
  });

  it("should propagate error on graphql failure", async () => {
    const queryClient = createTestQueryClient();
    mockGraphqlRequest.mockRejectedValue(new Error("GraphQL error"));

    const { result } = renderHook(() => useParameterDeleteGql(), {
      wrapper: createWrapper(queryClient),
    });

    await expect(
      result.current.mutateAsync({ oldRow: createTestParameter() }),
    ).rejects.toThrow("GraphQL error");
  });

  it("should handle empty cache gracefully on success", async () => {
    const queryClient = createTestQueryClient();
    mockGraphqlRequest.mockResolvedValue({ deleteParameter: true });

    const { result } = renderHook(() => useParameterDeleteGql(), {
      wrapper: createWrapper(queryClient),
    });

    await result.current.mutateAsync({ oldRow: createTestParameter({ parameterId: 99 }) });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const cached = queryClient.getQueryData<Parameter[]>(["parameterGQL"]);
    expect(cached).toEqual([]);
  });
});
