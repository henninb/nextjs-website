import React from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import usePaymentDeleteGql from "../../hooks/usePaymentDeleteGql";
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

describe("usePaymentDeleteGql", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should delete a payment successfully", async () => {
    const queryClient = createTestQueryClient();
    mockGraphqlRequest.mockResolvedValue({ deletePayment: true });

    const { result } = renderHook(() => usePaymentDeleteGql(), {
      wrapper: createWrapper(queryClient),
    });

    const payment = createTestPayment({ paymentId: 1 });
    await result.current.mutateAsync({ oldRow: payment });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockGraphqlRequest).toHaveBeenCalledWith(
      expect.objectContaining({ variables: { id: 1 } }),
    );
  });

  it("should update cache on success by removing deleted payment", async () => {
    const queryClient = createTestQueryClient();
    const existingPayments = [
      createTestPayment({ paymentId: 1 }),
      createTestPayment({ paymentId: 2 }),
    ];
    queryClient.setQueryData(["paymentGQL"], existingPayments);

    mockGraphqlRequest.mockResolvedValue({ deletePayment: true });

    const { result } = renderHook(() => usePaymentDeleteGql(), {
      wrapper: createWrapper(queryClient),
    });

    await result.current.mutateAsync({ oldRow: existingPayments[0] });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const cached = queryClient.getQueryData<Payment[]>(["paymentGQL"]);
    expect(cached).toHaveLength(1);
    expect(cached![0].paymentId).toBe(2);
  });

  it("should handle empty cache gracefully on success", async () => {
    const queryClient = createTestQueryClient();
    mockGraphqlRequest.mockResolvedValue({ deletePayment: true });

    const { result } = renderHook(() => usePaymentDeleteGql(), {
      wrapper: createWrapper(queryClient),
    });

    await result.current.mutateAsync({ oldRow: createTestPayment({ paymentId: 99 }) });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const cached = queryClient.getQueryData<Payment[]>(["paymentGQL"]);
    expect(cached).toEqual([]);
  });

  it("should propagate graphql error", async () => {
    const queryClient = createTestQueryClient();
    mockGraphqlRequest.mockRejectedValue(new Error("GraphQL error"));

    const { result } = renderHook(() => usePaymentDeleteGql(), {
      wrapper: createWrapper(queryClient),
    });

    await expect(
      result.current.mutateAsync({ oldRow: createTestPayment() }),
    ).rejects.toThrow("GraphQL error");
  });

  it("should handle deletePayment returning false", async () => {
    const queryClient = createTestQueryClient();
    mockGraphqlRequest.mockResolvedValue({ deletePayment: false });

    const { result } = renderHook(() => usePaymentDeleteGql(), {
      wrapper: createWrapper(queryClient),
    });

    const deleteResult = await result.current.mutateAsync({ oldRow: createTestPayment({ paymentId: 1 }) });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(deleteResult.id).toBe(1);
  });
});
