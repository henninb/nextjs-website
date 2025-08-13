import React from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import useValidationAmountFetch from "../../hooks/useValidationAmountFetch";
import ValidationAmount from "../../model/ValidationAmount";

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

// Setup MSW server
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
        retryOnMount: false,
        refetchOnMount: false,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
      },
      mutations: { retry: false },
    },
  });

const createWrapper =
  (queryClient: QueryClient) =>
  ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

describe("useValidationAmountFetch", () => {
  it("should fetch validation amount successfully", async () => {
    const queryClient = createTestQueryClient();
    const mockValidationAmount: ValidationAmount = {
      validationId: 1,
      activeStatus: true,
      amount: 100.0,
      transactionState: "cleared",
      validationDate: new Date("2024-01-01"),
    };

    // Mock the global fetch function
    const originalFetch = global.fetch;
    global.fetch = jest
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify(mockValidationAmount), { status: 200 }),
      );

    const { result } = renderHook(
      () => useValidationAmountFetch("test-account"),
      {
        wrapper: createWrapper(queryClient),
      },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true), {
      timeout: 5000,
    });

    // Check that data has the correct structure - dates are serialized as strings
    expect(result.current.data).toBeDefined();
    expect(result.current.data).toHaveProperty("validationId", 1);
    expect(result.current.data).toHaveProperty("activeStatus", true);
    expect(result.current.data).toHaveProperty("amount", 100.0);
    expect(result.current.data).toHaveProperty("transactionState", "cleared");
    expect(result.current.data).toHaveProperty(
      "validationDate",
      "2024-01-01T00:00:00.000Z",
    );
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isError).toBe(false);

    global.fetch = originalFetch;
  });

  it("should handle server errors properly", async () => {
    const queryClient = createTestQueryClient();

    // Mock the global fetch function to return 500 error
    const originalFetch = global.fetch;
    global.fetch = jest
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ message: "Error" }), { status: 500 }),
      );

    const consoleSpy = jest.spyOn(console, "error");

    const { result } = renderHook(
      () => useValidationAmountFetch("test-account"),
      {
        wrapper: createWrapper(queryClient),
      },
    );

    await waitFor(() => expect(result.current.isError).toBe(true), {
      timeout: 5000,
    });

    // Should be in error state
    expect(result.current.data).toBeUndefined();
    expect(result.current.isSuccess).toBe(false);
    expect(result.current.error).toBeDefined();
    expect(result.current.error?.message).toContain("Failed to fetch");
    expect(consoleSpy).toHaveBeenCalledWith(
      "Error fetching validation amount data:",
      expect.anything(),
    );

    consoleSpy.mockRestore();
    global.fetch = originalFetch;
  });

  it("should handle network errors properly", async () => {
    const queryClient = createTestQueryClient();

    // Mock fetch to throw network error
    const originalFetch = global.fetch;
    global.fetch = jest.fn().mockRejectedValue(new Error("Network failure"));

    const consoleSpy = jest.spyOn(console, "error");

    const { result } = renderHook(
      () => useValidationAmountFetch("test-account"),
      {
        wrapper: createWrapper(queryClient),
      },
    );

    await waitFor(() => expect(result.current.isError).toBe(true), {
      timeout: 5000,
    });

    // Should be in error state
    expect(result.current.data).toBeUndefined();
    expect(result.current.isSuccess).toBe(false);
    expect(result.current.error).toBeDefined();
    expect(consoleSpy).toHaveBeenCalledWith(
      "Error fetching validation amount data:",
      expect.anything(),
    );

    consoleSpy.mockRestore();
    global.fetch = originalFetch;
  });

  it("should provide refetch capability", async () => {
    const queryClient = createTestQueryClient();
    const mockValidationAmount: ValidationAmount = {
      validationId: 1,
      activeStatus: true,
      amount: 100.0,
      transactionState: "cleared",
      validationDate: new Date("2024-01-01"),
    };

    // Mock the global fetch function
    const originalFetch = global.fetch;
    global.fetch = jest
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify(mockValidationAmount), { status: 200 }),
      );

    const { result } = renderHook(
      () => useValidationAmountFetch("test-account"),
      {
        wrapper: createWrapper(queryClient),
      },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true), {
      timeout: 5000,
    });

    expect(result.current.refetch).toBeDefined();
    expect(typeof result.current.refetch).toBe("function");

    global.fetch = originalFetch;
  });

  it("should not fetch when not authenticated", () => {
    const queryClient = createTestQueryClient();
    const { result } = renderHook(
      () => useValidationAmountFetch("test-account"),
      {
        wrapper: createWrapper(queryClient),
      },
    );

    expect(result.current.isPending).toBe(true);
    expect(result.current.data).toBeUndefined();
  });
});
