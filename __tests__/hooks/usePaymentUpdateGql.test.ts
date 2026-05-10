import React from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import usePaymentUpdateGql from "../../hooks/usePaymentUpdateGql";
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

describe("usePaymentUpdateGql", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should update a payment successfully", async () => {
    const queryClient = createTestQueryClient();
    const oldPayment = createTestPayment({ paymentId: 1, amount: 500 });
    const newPayment = createTestPayment({ paymentId: 1, amount: 750 });

    mockGraphqlRequest.mockResolvedValue({
      updatePayment: createGqlPaymentResponse(newPayment),
    });

    const { result } = renderHook(() => usePaymentUpdateGql(), {
      wrapper: createWrapper(queryClient),
    });

    const updated = await result.current.mutateAsync({ oldPayment, newPayment });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(updated.amount).toBe(750);
    expect(mockGraphqlRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: expect.objectContaining({ id: 1 }),
      }),
    );
  });

  it("should update cache on success", async () => {
    const queryClient = createTestQueryClient();
    const existingPayments = [
      createTestPayment({ paymentId: 1, amount: 500 }),
      createTestPayment({ paymentId: 2, amount: 300 }),
    ];
    queryClient.setQueryData(["paymentGQL"], existingPayments);

    const newPayment = createTestPayment({ paymentId: 1, amount: 750 });
    mockGraphqlRequest.mockResolvedValue({
      updatePayment: createGqlPaymentResponse(newPayment),
    });

    const { result } = renderHook(() => usePaymentUpdateGql(), {
      wrapper: createWrapper(queryClient),
    });

    await result.current.mutateAsync({ oldPayment: existingPayments[0], newPayment });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const cached = queryClient.getQueryData<Payment[]>(["paymentGQL"]);
    expect(cached).toHaveLength(2);
    expect(cached![0].amount).toBe(750);
  });

  it("should not update cache if no cached data", async () => {
    const queryClient = createTestQueryClient();
    const payment = createTestPayment({ paymentId: 1 });
    mockGraphqlRequest.mockResolvedValue({
      updatePayment: createGqlPaymentResponse(payment),
    });

    const { result } = renderHook(() => usePaymentUpdateGql(), {
      wrapper: createWrapper(queryClient),
    });

    await result.current.mutateAsync({ oldPayment: payment, newPayment: payment });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const cached = queryClient.getQueryData<Payment[]>(["paymentGQL"]);
    expect(cached).toBeUndefined();
  });

  it("should propagate graphql error", async () => {
    const queryClient = createTestQueryClient();
    mockGraphqlRequest.mockRejectedValue(new Error("GraphQL error"));

    const { result } = renderHook(() => usePaymentUpdateGql(), {
      wrapper: createWrapper(queryClient),
    });

    const payment = createTestPayment();
    await expect(
      result.current.mutateAsync({ oldPayment: payment, newPayment: payment }),
    ).rejects.toThrow("GraphQL error");
  });

  it("should convert transactionDate to YYYY-MM-DD format", async () => {
    const queryClient = createTestQueryClient();
    const payment = createTestPayment({ transactionDate: new Date("2024-06-15T12:00:00Z") });
    mockGraphqlRequest.mockResolvedValue({
      updatePayment: createGqlPaymentResponse(payment),
    });

    const { result } = renderHook(() => usePaymentUpdateGql(), {
      wrapper: createWrapper(queryClient),
    });

    await result.current.mutateAsync({ oldPayment: payment, newPayment: payment });

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
