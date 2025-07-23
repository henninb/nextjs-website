import React from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import useDescriptionDelete from "../../hooks/useDescriptionDelete";
import Description from "../../model/Description";

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
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });

const createWrapper =
  (queryClient: QueryClient) =>
  ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

describe("useDescriptionDelete", () => {
  it("should delete a description successfully", async () => {
    const queryClient = createTestQueryClient();

    const mockDescription: Description = {
      descriptionId: 1,
      descriptionName: "electronics",
      activeStatus: true,
      dateAdded: new Date(),
      dateUpdated: new Date(),
    };

    server.use(
      http.delete(
        `https://finance.bhenning.com/api/description/delete/${mockDescription.descriptionName}`,
        () => {
          return new HttpResponse(null, { status: 204 });
        },
      ),
    );

    // Set initial cache data
    queryClient.setQueryData(["description"], [mockDescription]);

    // Render the hook
    const { result } = renderHook(() => useDescriptionDelete(), {
      wrapper: createWrapper(queryClient),
    });

    // Execute the mutation
    result.current.mutate(mockDescription);

    // Wait for the mutation to complete
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Verify that the description was removed from the cache
    const updatedDescriptions = queryClient.getQueryData<Description[]>([
      "description",
    ]);
    expect(updatedDescriptions).toEqual([]);
  });

  it("should handle API errors correctly", async () => {
    const queryClient = createTestQueryClient();

    const mockDescription: Description = {
      descriptionId: 1,
      descriptionName: "Electronics",
      activeStatus: true,
      dateAdded: new Date(),
      dateUpdated: new Date(),
    };

    // Mock an API error
    server.use(
      http.delete(
        `https://finance.bhenning.com/api/description/delete/${mockDescription.descriptionName}`,
        () => {
          return HttpResponse.json(
            { response: "Cannot delete this description" },
            { status: 400 },
          );
        },
      ),
    );

    // Render the hook
    const { result } = renderHook(() => useDescriptionDelete(), {
      wrapper: createWrapper(queryClient),
    });

    // Spy on console.log
    const consoleSpy = jest.spyOn(console, "log");

    // Execute the mutation
    result.current.mutate(mockDescription);

    // Wait for the mutation to fail
    await waitFor(() => expect(result.current.isError).toBe(true));

    // Verify error was logged
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("Cannot delete this description"),
    );

    consoleSpy.mockRestore();
  });

  it("should handle network errors correctly", async () => {
    const queryClient = createTestQueryClient();

    const mockDescription: Description = {
      descriptionId: 1,
      descriptionName: "Electronics",
      activeStatus: true,
      dateAdded: new Date(),
      dateUpdated: new Date(),
    };

    // Mock a network error
    server.use(
      http.delete(
        `https://finance.bhenning.com/api/description/delete/${mockDescription.descriptionName}`,
        () => {
          return HttpResponse.json(
            { message: "Network error" },
            { status: 500 },
          );
        },
      ),
    );

    // Render the hook
    const { result } = renderHook(() => useDescriptionDelete(), {
      wrapper: createWrapper(queryClient),
    });

    // Spy on console.log
    const consoleSpy = jest.spyOn(console, "log");

    // Execute the mutation
    result.current.mutate(mockDescription);

    // Wait for the mutation to fail
    await waitFor(() => expect(result.current.isError).toBe(true));

    // Verify error was logged
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });
});
