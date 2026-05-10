import React from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import useParameterInsertGql from "../../hooks/useParameterInsertGql";
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

jest.mock("../../components/AuthProvider", () => ({
  useAuth: jest.fn(() => ({
    isAuthenticated: true,
    loading: false,
    user: { username: "john" },
    login: jest.fn(),
    logout: jest.fn(),
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

describe("useParameterInsertGql", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const { useAuth } = jest.requireMock("../../components/AuthProvider");
    useAuth.mockReturnValue({
      isAuthenticated: true,
      loading: false,
      user: { username: "john" },
      login: jest.fn(),
      logout: jest.fn(),
    });
  });

  it("should insert a parameter successfully", async () => {
    const queryClient = createTestQueryClient();
    const param = createTestParameter({ parameterId: 5, parameterName: "new_param" });
    mockGraphqlRequest.mockResolvedValue({
      createParameter: createGqlParameterResponse(param),
    });

    const { result } = renderHook(() => useParameterInsertGql(), {
      wrapper: createWrapper(queryClient),
    });

    const inserted = await result.current.mutateAsync({ payload: param });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(inserted.parameterName).toBe("new_param");
    expect(mockGraphqlRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: expect.objectContaining({
          parameter: expect.objectContaining({
            parameterName: "new_param",
            owner: "john",
          }),
        }),
      }),
    );
  });

  it("should add new parameter to cache on success", async () => {
    const queryClient = createTestQueryClient();
    const existingParams = [createTestParameter({ parameterId: 1, parameterName: "param1" })];
    queryClient.setQueryData(["parameterGQL"], existingParams);

    const newParam = createTestParameter({ parameterId: 2, parameterName: "param2" });
    mockGraphqlRequest.mockResolvedValue({
      createParameter: createGqlParameterResponse(newParam),
    });

    const { result } = renderHook(() => useParameterInsertGql(), {
      wrapper: createWrapper(queryClient),
    });

    await result.current.mutateAsync({ payload: newParam });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const cached = queryClient.getQueryData<Parameter[]>(["parameterGQL"]);
    expect(cached).toHaveLength(2);
    expect(cached![0].parameterName).toBe("param2");
  });

  it("should throw error when user is not logged in", async () => {
    const { useAuth } = jest.requireMock("../../components/AuthProvider");
    useAuth.mockReturnValue({ user: null });

    const queryClient = createTestQueryClient();

    const { result } = renderHook(() => useParameterInsertGql(), {
      wrapper: createWrapper(queryClient),
    });

    await expect(
      result.current.mutateAsync({ payload: createTestParameter() }),
    ).rejects.toThrow("User must be logged in");
  });

  it("should propagate graphql error", async () => {
    const queryClient = createTestQueryClient();
    mockGraphqlRequest.mockRejectedValue(new Error("GraphQL error"));

    const { result } = renderHook(() => useParameterInsertGql(), {
      wrapper: createWrapper(queryClient),
    });

    await expect(
      result.current.mutateAsync({ payload: createTestParameter() }),
    ).rejects.toThrow("GraphQL error");
  });
});
