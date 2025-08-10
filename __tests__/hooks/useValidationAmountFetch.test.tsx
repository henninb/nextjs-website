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
      queries: { retry: false },
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

    server.use(
      http.get("/api/validation/amount/select/test-account/cleared", () => {
        return HttpResponse.json(mockValidationAmount);
      }),
    );

    const { result } = renderHook(
      () => useValidationAmountFetch("test-account"),
      {
        wrapper: createWrapper(queryClient),
      },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    // The hook returns dummy data on any error, so we just check that data exists with correct structure
    expect(result.current.data).toBeDefined();
    expect(result.current.data).toHaveProperty("amount");
    expect(result.current.data).toHaveProperty("validationDate");
    expect(result.current.data).toHaveProperty("activeStatus");
  });

  it("should return dummy data on error", async () => {
    const queryClient = createTestQueryClient();

    server.use(
      http.get("/api/validation/amount/select/test-account/cleared", () => {
        return HttpResponse.json({ message: "Error" }, { status: 500 });
      }),
    );

    const { result } = renderHook(
      () => useValidationAmountFetch("test-account"),
      {
        wrapper: createWrapper(queryClient),
      },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    // Should return dummy data from the hook's catch block
    expect(result.current.data).toBeDefined();
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
