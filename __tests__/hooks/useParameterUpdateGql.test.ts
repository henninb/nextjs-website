import React from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import useParameterUpdateGql from "../../hooks/useParameterUpdateGql";
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

const createGqlParameterResponse = (param: Parameter) => ({
  parameterId: param.parameterId ?? 1,
  owner: null,
  parameterName: param.parameterName,
  parameterValue: param.parameterValue,
  activeStatus: param.activeStatus ?? true,
  dateAdded: null,
  dateUpdated: null,
});

describe("useParameterUpdateGql", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should update a parameter successfully", async () => {
    const queryClient = createTestQueryClient();
    const oldParam = createTestParameter({ parameterId: 1, parameterName: "old_name" });
    const newParam = createTestParameter({ parameterId: 1, parameterName: "new_name", parameterValue: "new_value" });

    mockGraphqlRequest.mockResolvedValue({
      updateParameter: createGqlParameterResponse(newParam),
    });

    const { result } = renderHook(() => useParameterUpdateGql(), {
      wrapper: createWrapper(queryClient),
    });

    const updated = await result.current.mutateAsync({
      oldParameter: oldParam,
      newParameter: newParam,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(updated.parameterName).toBe("new_name");
    expect(updated.parameterValue).toBe("new_value");
  });

  it("should update cache on success", async () => {
    const queryClient = createTestQueryClient();
    const existingParams = [
      createTestParameter({ parameterId: 1, parameterName: "param1", parameterValue: "old_val" }),
      createTestParameter({ parameterId: 2, parameterName: "param2" }),
    ];
    queryClient.setQueryData(["parameterGQL"], existingParams);

    const updatedParam = createTestParameter({ parameterId: 1, parameterName: "param1", parameterValue: "new_val" });
    mockGraphqlRequest.mockResolvedValue({
      updateParameter: createGqlParameterResponse(updatedParam),
    });

    const { result } = renderHook(() => useParameterUpdateGql(), {
      wrapper: createWrapper(queryClient),
    });

    await result.current.mutateAsync({
      oldParameter: existingParams[0],
      newParameter: updatedParam,
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const cached = queryClient.getQueryData<Parameter[]>(["parameterGQL"]);
    expect(cached).toHaveLength(2);
    expect(cached![0].parameterValue).toBe("new_val");
  });

  it("should not update cache if no cached data exists", async () => {
    const queryClient = createTestQueryClient();
    const param = createTestParameter({ parameterId: 1 });
    mockGraphqlRequest.mockResolvedValue({
      updateParameter: createGqlParameterResponse(param),
    });

    const { result } = renderHook(() => useParameterUpdateGql(), {
      wrapper: createWrapper(queryClient),
    });

    await result.current.mutateAsync({ oldParameter: param, newParameter: param });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const cached = queryClient.getQueryData<Parameter[]>(["parameterGQL"]);
    expect(cached).toBeUndefined();
  });

  it("should propagate graphql error", async () => {
    const queryClient = createTestQueryClient();
    mockGraphqlRequest.mockRejectedValue(new Error("GraphQL error"));

    const { result } = renderHook(() => useParameterUpdateGql(), {
      wrapper: createWrapper(queryClient),
    });

    const param = createTestParameter();
    await expect(
      result.current.mutateAsync({ oldParameter: param, newParameter: param }),
    ).rejects.toThrow("GraphQL error");
  });

  it("should send old parameter ID with new parameter values", async () => {
    const queryClient = createTestQueryClient();
    const oldParam = createTestParameter({ parameterId: 42 });
    const newParam = createTestParameter({ parameterId: 42, parameterName: "updated", parameterValue: "new_val" });

    mockGraphqlRequest.mockResolvedValue({
      updateParameter: createGqlParameterResponse(newParam),
    });

    const { result } = renderHook(() => useParameterUpdateGql(), {
      wrapper: createWrapper(queryClient),
    });

    await result.current.mutateAsync({ oldParameter: oldParam, newParameter: newParam });

    expect(mockGraphqlRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: expect.objectContaining({
          parameter: expect.objectContaining({
            parameterId: 42,
            parameterName: "updated",
            parameterValue: "new_val",
          }),
        }),
      }),
    );
  });
});
