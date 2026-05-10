import React from "react";
import { renderHook } from "@testing-library/react";
import useTransferFetchGql from "../../hooks/useTransferFetchGql";

jest.mock("../../utils/graphqlClient", () => ({
  graphqlRequest: jest.fn(),
}));

jest.mock("../../utils/queryConfig", () => ({
  useAuthenticatedQuery: jest.fn(),
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
import { useAuthenticatedQuery } from "../../utils/queryConfig";

const mockGraphqlRequest = graphqlRequest as jest.MockedFunction<typeof graphqlRequest>;
const mockUseAuthenticatedQuery = useAuthenticatedQuery as jest.MockedFunction<typeof useAuthenticatedQuery>;

const createGqlTransfer = (overrides = {}) => ({
  transferId: 1,
  owner: null,
  sourceAccount: "checking_john",
  destinationAccount: "savings_john",
  transactionDate: "2024-01-15",
  amount: 500.0,
  guidSource: null,
  guidDestination: null,
  activeStatus: true,
  dateAdded: null,
  dateUpdated: null,
  ...overrides,
});

describe("useTransferFetchGql", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuthenticatedQuery.mockReturnValue({ data: undefined, isLoading: false } as any);
  });

  describe("hook configuration", () => {
    it("should call useAuthenticatedQuery with correct query key", () => {
      renderHook(() => useTransferFetchGql());

      expect(mockUseAuthenticatedQuery).toHaveBeenCalledWith(
        ["transferGQL"],
        expect.any(Function),
      );
    });
  });

  describe("query function", () => {
    let capturedQueryFn: () => Promise<any>;

    beforeEach(() => {
      mockUseAuthenticatedQuery.mockImplementation((_key, queryFn) => {
        capturedQueryFn = queryFn as () => Promise<any>;
        return { data: undefined, isLoading: false } as any;
      });
    });

    it("should call graphqlRequest with Transfers query", async () => {
      renderHook(() => useTransferFetchGql());

      mockGraphqlRequest.mockResolvedValue({ transfers: [createGqlTransfer()] });
      await capturedQueryFn!();

      expect(mockGraphqlRequest).toHaveBeenCalledWith(
        expect.objectContaining({ query: expect.stringContaining("transfers") }),
      );
    });

    it("should map graphql response to Transfer objects", async () => {
      renderHook(() => useTransferFetchGql());

      const gqlTransfer = createGqlTransfer({
        transferId: 5,
        transactionDate: "2024-06-15",
        amount: 1000.0,
      });
      mockGraphqlRequest.mockResolvedValue({ transfers: [gqlTransfer] });

      const result = await capturedQueryFn!();

      expect(result).toHaveLength(1);
      expect(result[0].transferId).toBe(5);
      expect(result[0].transactionDate).toBeInstanceOf(Date);
      expect(result[0].amount).toBe(1000.0);
    });

    it("should handle null optional fields with ?? undefined", async () => {
      renderHook(() => useTransferFetchGql());

      const gqlTransfer = createGqlTransfer({
        owner: null,
        guidSource: null,
        guidDestination: null,
        dateAdded: null,
        dateUpdated: null,
      });
      mockGraphqlRequest.mockResolvedValue({ transfers: [gqlTransfer] });

      const result = await capturedQueryFn!();

      expect(result[0].owner).toBeUndefined();
      expect(result[0].guidSource).toBeUndefined();
      expect(result[0].guidDestination).toBeUndefined();
      expect(result[0].dateAdded).toBeUndefined();
      expect(result[0].dateUpdated).toBeUndefined();
    });

    it("should return empty array when transfers is empty", async () => {
      renderHook(() => useTransferFetchGql());

      mockGraphqlRequest.mockResolvedValue({ transfers: [] });

      const result = await capturedQueryFn!();

      expect(result).toEqual([]);
    });

    it("should handle null transfers response", async () => {
      renderHook(() => useTransferFetchGql());

      mockGraphqlRequest.mockResolvedValue({ transfers: null });

      const result = await capturedQueryFn!();

      expect(result).toEqual([]);
    });

    it("should convert dateAdded and dateUpdated to Date objects when present", async () => {
      renderHook(() => useTransferFetchGql());

      const gqlTransfer = createGqlTransfer({
        dateAdded: "2024-01-01T10:00:00Z",
        dateUpdated: "2024-01-02T10:00:00Z",
      });
      mockGraphqlRequest.mockResolvedValue({ transfers: [gqlTransfer] });

      const result = await capturedQueryFn!();

      expect(result[0].dateAdded).toBeInstanceOf(Date);
      expect(result[0].dateUpdated).toBeInstanceOf(Date);
    });

    it("should propagate graphql errors", async () => {
      renderHook(() => useTransferFetchGql());

      mockGraphqlRequest.mockRejectedValue(new Error("GraphQL error"));

      await expect(capturedQueryFn!()).rejects.toThrow("GraphQL error");
    });

    it("should map multiple transfers", async () => {
      renderHook(() => useTransferFetchGql());

      const gqlTransfers = [
        createGqlTransfer({ transferId: 1 }),
        createGqlTransfer({ transferId: 2 }),
        createGqlTransfer({ transferId: 3 }),
      ];
      mockGraphqlRequest.mockResolvedValue({ transfers: gqlTransfers });

      const result = await capturedQueryFn!();

      expect(result).toHaveLength(3);
      expect(result.map((t: any) => t.transferId)).toEqual([1, 2, 3]);
    });
  });
});
