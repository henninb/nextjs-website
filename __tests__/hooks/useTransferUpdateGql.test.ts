import React from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import useTransferUpdateGql from "../../hooks/useTransferUpdateGql";
import Transfer from "../../model/Transfer";

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

const createTestTransfer = (overrides: Partial<Transfer> = {}): Transfer => ({
  transferId: 1,
  sourceAccount: "checking_john",
  destinationAccount: "savings_john",
  transactionDate: new Date("2024-01-15"),
  amount: 500.0,
  activeStatus: true,
  ...overrides,
});

const createGqlTransferResponse = (transfer: Transfer) => ({
  transferId: transfer.transferId ?? 1,
  owner: null,
  sourceAccount: transfer.sourceAccount,
  destinationAccount: transfer.destinationAccount,
  transactionDate: "2024-01-15",
  amount: transfer.amount,
  guidSource: null,
  guidDestination: null,
  activeStatus: transfer.activeStatus ?? true,
  dateAdded: null,
  dateUpdated: null,
});

describe("useTransferUpdateGql", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should update a transfer successfully", async () => {
    const queryClient = createTestQueryClient();
    const oldTransfer = createTestTransfer({ transferId: 1, amount: 500 });
    const newTransfer = createTestTransfer({ transferId: 1, amount: 750 });

    mockGraphqlRequest.mockResolvedValue({
      updateTransfer: createGqlTransferResponse(newTransfer),
    });

    const { result } = renderHook(() => useTransferUpdateGql(), {
      wrapper: createWrapper(queryClient),
    });

    const updated = await result.current.mutateAsync({ oldTransfer, newTransfer });

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
    const existingTransfers = [
      createTestTransfer({ transferId: 1, amount: 500 }),
      createTestTransfer({ transferId: 2, amount: 300 }),
    ];
    queryClient.setQueryData(["transferGQL"], existingTransfers);

    const newTransfer = createTestTransfer({ transferId: 1, amount: 750 });
    mockGraphqlRequest.mockResolvedValue({
      updateTransfer: createGqlTransferResponse(newTransfer),
    });

    const { result } = renderHook(() => useTransferUpdateGql(), {
      wrapper: createWrapper(queryClient),
    });

    await result.current.mutateAsync({ oldTransfer: existingTransfers[0], newTransfer });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const cached = queryClient.getQueryData<Transfer[]>(["transferGQL"]);
    expect(cached).toHaveLength(2);
    expect(cached![0].amount).toBe(750);
  });

  it("should not update cache if no cached data", async () => {
    const queryClient = createTestQueryClient();
    const transfer = createTestTransfer({ transferId: 1 });
    mockGraphqlRequest.mockResolvedValue({
      updateTransfer: createGqlTransferResponse(transfer),
    });

    const { result } = renderHook(() => useTransferUpdateGql(), {
      wrapper: createWrapper(queryClient),
    });

    await result.current.mutateAsync({ oldTransfer: transfer, newTransfer: transfer });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const cached = queryClient.getQueryData<Transfer[]>(["transferGQL"]);
    expect(cached).toBeUndefined();
  });

  it("should propagate graphql error", async () => {
    const queryClient = createTestQueryClient();
    mockGraphqlRequest.mockRejectedValue(new Error("GraphQL error"));

    const { result } = renderHook(() => useTransferUpdateGql(), {
      wrapper: createWrapper(queryClient),
    });

    const transfer = createTestTransfer();
    await expect(
      result.current.mutateAsync({ oldTransfer: transfer, newTransfer: transfer }),
    ).rejects.toThrow("GraphQL error");
  });

  it("should convert transactionDate to YYYY-MM-DD format", async () => {
    const queryClient = createTestQueryClient();
    const transfer = createTestTransfer({ transactionDate: new Date("2024-06-15T12:00:00Z") });
    mockGraphqlRequest.mockResolvedValue({
      updateTransfer: createGqlTransferResponse(transfer),
    });

    const { result } = renderHook(() => useTransferUpdateGql(), {
      wrapper: createWrapper(queryClient),
    });

    await result.current.mutateAsync({ oldTransfer: transfer, newTransfer: transfer });

    expect(mockGraphqlRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: expect.objectContaining({
          transfer: expect.objectContaining({
            transactionDate: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
          }),
        }),
      }),
    );
  });
});
