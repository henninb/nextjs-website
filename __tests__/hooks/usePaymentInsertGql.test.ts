import React from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import usePaymentInsertGql from "../../hooks/usePaymentInsertGql";
import Payment from "../../model/Payment";

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

const createTestPayment = (overrides: Partial<Payment> = {}): Payment => ({
  paymentId: 1,
  sourceAccount: "checking_john",
  destinationAccount: "savings_john",
  transactionDate: new Date("2024-01-15"),
  amount: 500.0,
  activeStatus: true,
  ...overrides,
});

const createGqlPaymentResponse = (payment: Payment) => ({
  paymentId: payment.paymentId ?? 1,
  owner: null,
  sourceAccount: payment.sourceAccount,
  destinationAccount: payment.destinationAccount,
  transactionDate: "2024-01-15",
  amount: payment.amount,
  guidSource: null,
  guidDestination: null,
  activeStatus: payment.activeStatus ?? true,
  dateAdded: null,
  dateUpdated: null,
});

describe("usePaymentInsertGql", () => {
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

  it("should insert a payment successfully", async () => {
    const queryClient = createTestQueryClient();
    const payment = createTestPayment({ paymentId: 5, amount: 1000 });
    mockGraphqlRequest.mockResolvedValue({
      createPayment: createGqlPaymentResponse(payment),
    });

    const { result } = renderHook(() => usePaymentInsertGql(), {
      wrapper: createWrapper(queryClient),
    });

    const inserted = await result.current.mutateAsync({ payload: payment });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(inserted.amount).toBe(1000);
    expect(mockGraphqlRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: expect.objectContaining({
          payment: expect.objectContaining({
            sourceAccount: "checking_john",
            owner: "john",
          }),
        }),
      }),
    );
  });

  it("should add new payment to cache on success", async () => {
    const queryClient = createTestQueryClient();
    const existingPayments = [createTestPayment({ paymentId: 1 })];
    queryClient.setQueryData(["paymentGQL"], existingPayments);

    const newPayment = createTestPayment({ paymentId: 2, amount: 750 });
    mockGraphqlRequest.mockResolvedValue({
      createPayment: createGqlPaymentResponse(newPayment),
    });

    const { result } = renderHook(() => usePaymentInsertGql(), {
      wrapper: createWrapper(queryClient),
    });

    await result.current.mutateAsync({ payload: newPayment });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const cached = queryClient.getQueryData<Payment[]>(["paymentGQL"]);
    expect(cached).toHaveLength(2);
  });

  it("should throw error when user is not logged in", async () => {
    const { useAuth } = jest.requireMock("../../components/AuthProvider");
    useAuth.mockReturnValue({ user: null });

    const queryClient = createTestQueryClient();

    const { result } = renderHook(() => usePaymentInsertGql(), {
      wrapper: createWrapper(queryClient),
    });

    await expect(
      result.current.mutateAsync({ payload: createTestPayment() }),
    ).rejects.toThrow("User must be logged in");
  });

  it("should propagate graphql error", async () => {
    const queryClient = createTestQueryClient();
    mockGraphqlRequest.mockRejectedValue(new Error("GraphQL error"));

    const { result } = renderHook(() => usePaymentInsertGql(), {
      wrapper: createWrapper(queryClient),
    });

    await expect(
      result.current.mutateAsync({ payload: createTestPayment() }),
    ).rejects.toThrow("GraphQL error");
  });

  it("should convert transactionDate to YYYY-MM-DD format", async () => {
    const queryClient = createTestQueryClient();
    const payment = createTestPayment({ transactionDate: new Date("2024-06-15T12:00:00Z") });
    mockGraphqlRequest.mockResolvedValue({
      createPayment: createGqlPaymentResponse(payment),
    });

    const { result } = renderHook(() => usePaymentInsertGql(), {
      wrapper: createWrapper(queryClient),
    });

    await result.current.mutateAsync({ payload: payment });

    expect(mockGraphqlRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: expect.objectContaining({
          payment: expect.objectContaining({
            transactionDate: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
          }),
        }),
      }),
    );
  });
});
