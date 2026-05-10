import React from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import useTransferDeleteGql from "../../hooks/useTransferDeleteGql";
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

describe("useTransferDeleteGql", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should delete a transfer successfully", async () => {
    const queryClient = createTestQueryClient();
    mockGraphqlRequest.mockResolvedValue({ deleteTransfer: true });

    const { result } = renderHook(() => useTransferDeleteGql(), {
      wrapper: createWrapper(queryClient),
    });

    const transfer = createTestTransfer({ transferId: 1 });
    await result.current.mutateAsync({ oldRow: transfer });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockGraphqlRequest).toHaveBeenCalledWith(
      expect.objectContaining({ variables: { id: 1 } }),
    );
  });

  it("should update cache on success by removing deleted transfer", async () => {
    const queryClient = createTestQueryClient();
    const existingTransfers = [
      createTestTransfer({ transferId: 1 }),
      createTestTransfer({ transferId: 2 }),
    ];
    queryClient.setQueryData(["transferGQL"], existingTransfers);

    mockGraphqlRequest.mockResolvedValue({ deleteTransfer: true });

    const { result } = renderHook(() => useTransferDeleteGql(), {
      wrapper: createWrapper(queryClient),
    });

    await result.current.mutateAsync({ oldRow: existingTransfers[0] });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const cached = queryClient.getQueryData<Transfer[]>(["transferGQL"]);
    expect(cached).toHaveLength(1);
    expect(cached![0].transferId).toBe(2);
  });

  it("should handle empty cache gracefully on success", async () => {
    const queryClient = createTestQueryClient();
    mockGraphqlRequest.mockResolvedValue({ deleteTransfer: true });

    const { result } = renderHook(() => useTransferDeleteGql(), {
      wrapper: createWrapper(queryClient),
    });

    await result.current.mutateAsync({ oldRow: createTestTransfer({ transferId: 99 }) });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const cached = queryClient.getQueryData<Transfer[]>(["transferGQL"]);
    expect(cached).toEqual([]);
  });

  it("should propagate graphql error", async () => {
    const queryClient = createTestQueryClient();
    mockGraphqlRequest.mockRejectedValue(new Error("GraphQL error"));

    const { result } = renderHook(() => useTransferDeleteGql(), {
      wrapper: createWrapper(queryClient),
    });

    await expect(
      result.current.mutateAsync({ oldRow: createTestTransfer() }),
    ).rejects.toThrow("GraphQL error");
  });

  it("should handle deleteTransfer returning null (use ok: true fallback)", async () => {
    const queryClient = createTestQueryClient();
    mockGraphqlRequest.mockResolvedValue({ deleteTransfer: null });

    const { result } = renderHook(() => useTransferDeleteGql(), {
      wrapper: createWrapper(queryClient),
    });

    const deleteResult = await result.current.mutateAsync({ oldRow: createTestTransfer({ transferId: 1 }) });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(deleteResult.ok).toBe(true);
    expect(deleteResult.id).toBe(1);
  });
});
