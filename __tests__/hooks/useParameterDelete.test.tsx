import React from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { rest } from "msw";
import { setupServer } from "msw/node";
import useParameterDelete from "../../hooks/useParameterDelete";
import Parameter from "../../model/Parameter";

// Mock next/router
jest.mock("next/router", () => ({
  useRouter: () => ({
    push: jest.fn(),
    pathname: "/",
    route: "/",
    asPath: "/",
    query: {},
  }),
}));

// Mock jose package
jest.mock("jose", () => ({
  jwtVerify: jest.fn().mockResolvedValue(true),
}));

// Setup MSW server for Node environment
const server = setupServer();

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// Create a fresh QueryClient for each test
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

const createWrapper =
  (queryClient: QueryClient) =>
  ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

describe("useParameterDelete", () => {
  it("should delete a parameter successfully", async () => {
    const queryClient = createTestQueryClient();

    const mockParameter: Parameter = {
      parameterId: 1,
      parameterName: "TestParameter",
      parameterValue: "Value1",
      activeStatus: true,
      dateAdded: new Date(),
      dateUpdated: new Date(),
    };

    server.use(
      rest.delete(
        `/api/parameter/delete/${mockParameter.parameterName}`,
        (req, res, ctx) => res(ctx.status(204)),
      ),
    );

    // Set initial cache data
    queryClient.setQueryData(["parameter"], [mockParameter]);

    // Render the hook
    const { result } = renderHook(() => useParameterDelete(), {
      wrapper: createWrapper(queryClient),
    });

    // Execute the mutation
    result.current.mutate(mockParameter);

    // Wait for the mutation to complete
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Verify that the parameter was removed from the cache
    const updatedParameters = queryClient.getQueryData<Parameter[]>([
      "parameter",
    ]);
    expect(updatedParameters).toEqual([]);
  });

  it("should handle API errors correctly", async () => {
    const queryClient = createTestQueryClient();

    const mockParameter: Parameter = {
      parameterId: 1,
      parameterName: "TestParameter",
      parameterValue: "Value1",
      activeStatus: true,
      dateAdded: new Date(),
      dateUpdated: new Date(),
    };

    // Mock an API error
    server.use(
      rest.delete(
        `/api/parameter/delete/${mockParameter.parameterName}`,
        (req, res, ctx) =>
          res(
            ctx.status(400),
            ctx.json({ response: "Cannot delete this parameter" }),
          ),
      ),
    );

    // Render the hook
    const { result } = renderHook(() => useParameterDelete(), {
      wrapper: createWrapper(queryClient),
    });

    // Spy on console.log
    const consoleSpy = jest.spyOn(console, "log");

    // Execute the mutation
    result.current.mutate(mockParameter);

    // Wait for the mutation to fail
    await waitFor(() => expect(result.current.isError).toBe(true));

    // Verify error was logged
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("Cannot delete this parameter"),
    );

    consoleSpy.mockRestore();
  });

  it("should handle network errors correctly", async () => {
    const queryClient = createTestQueryClient();

    const mockParameter: Parameter = {
      parameterId: 1,
      parameterName: "TestParameter",
      parameterValue: "Value1",
      activeStatus: true,
      dateAdded: new Date(),
      dateUpdated: new Date(),
    };

    // Mock a network error
    server.use(
      rest.delete(
        `/api/parameter/delete/${mockParameter.parameterName}`,
        (req, res, ctx) =>
          res(ctx.status(500), ctx.json({ message: "Network error" })),
      ),
    );

    // Render the hook
    const { result } = renderHook(() => useParameterDelete(), {
      wrapper: createWrapper(queryClient),
    });

    // Spy on console.log
    const consoleSpy = jest.spyOn(console, "log");

    // Execute the mutation
    result.current.mutate(mockParameter);

    // Wait for the mutation to fail
    await waitFor(() => expect(result.current.isError).toBe(true));

    // Verify error was logged
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });
});
