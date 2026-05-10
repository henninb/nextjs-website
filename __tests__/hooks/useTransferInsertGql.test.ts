import React from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import useTransferInsertGql from "../../hooks/useTransferInsertGql";
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

describe("useTransferInsertGql", () => {
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

  it("should insert a transfer successfully", async () => {
    const queryClient = createTestQueryClient();
    const transfer = createTestTransfer({ transferId: 5, amount: 1000 });
    mockGraphqlRequest.mockResolvedValue({
      createTransfer: createGqlTransferResponse(transfer),
    });

    const { result } = renderHook(() => useTransferInsertGql(), {
      wrapper: createWrapper(queryClient),
    });

    const inserted = await result.current.mutateAsync({ payload: transfer });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(inserted.amount).toBe(1000);
    expect(mockGraphqlRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: expect.objectContaining({
          transfer: expect.objectContaining({
            sourceAccount: "checking_john",
            owner: "john",
          }),
        }),
      }),
    );
  });

  it("should add new transfer to cache on success", async () => {
    const queryClient = createTestQueryClient();
    const existingTransfers = [createTestTransfer({ transferId: 1 })];
    queryClient.setQueryData(["transferGQL"], existingTransfers);

    const newTransfer = createTestTransfer({ transferId: 2, amount: 750 });
    mockGraphqlRequest.mockResolvedValue({
      createTransfer: createGqlTransferResponse(newTransfer),
    });

    const { result } = renderHook(() => useTransferInsertGql(), {
      wrapper: createWrapper(queryClient),
    });

    await result.current.mutateAsync({ payload: newTransfer });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const cached = queryClient.getQueryData<Transfer[]>(["transferGQL"]);
    expect(cached).toHaveLength(2);
  });

  it("should throw error when user is not logged in", async () => {
    const { useAuth } = jest.requireMock("../../components/AuthProvider");
    useAuth.mockReturnValue({ user: null });

    const queryClient = createTestQueryClient();

    const { result } = renderHook(() => useTransferInsertGql(), {
      wrapper: createWrapper(queryClient),
    });

    await expect(
      result.current.mutateAsync({ payload: createTestTransfer() }),
    ).rejects.toThrow("User must be logged in");
  });

  it("should propagate graphql error", async () => {
    const queryClient = createTestQueryClient();
    mockGraphqlRequest.mockRejectedValue(new Error("GraphQL error"));

    const { result } = renderHook(() => useTransferInsertGql(), {
      wrapper: createWrapper(queryClient),
    });

    await expect(
      result.current.mutateAsync({ payload: createTestTransfer() }),
    ).rejects.toThrow("GraphQL error");
  });

  it("should convert transactionDate to YYYY-MM-DD format", async () => {
    const queryClient = createTestQueryClient();
    const transfer = createTestTransfer({ transactionDate: new Date("2024-06-15T12:00:00Z") });
    mockGraphqlRequest.mockResolvedValue({
      createTransfer: createGqlTransferResponse(transfer),
    });

    const { result } = renderHook(() => useTransferInsertGql(), {
      wrapper: createWrapper(queryClient),
    });

    await result.current.mutateAsync({ payload: transfer });

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
