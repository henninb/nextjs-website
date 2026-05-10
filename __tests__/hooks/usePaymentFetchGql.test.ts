import React from "react";
import { renderHook } from "@testing-library/react";
import usePaymentFetchGql from "../../hooks/usePaymentFetchGql";

jest.mock("../../utils/graphqlClient", () => ({
  graphqlRequest: jest.fn(),
}));

jest.mock("../../utils/queryConfig", () => ({
  usePublicQuery: jest.fn(),
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
import { usePublicQuery } from "../../utils/queryConfig";

const mockGraphqlRequest = graphqlRequest as jest.MockedFunction<typeof graphqlRequest>;
const mockUsePublicQuery = usePublicQuery as jest.MockedFunction<typeof usePublicQuery>;

const createGqlPayment = (overrides = {}) => ({
  paymentId: 1,
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

describe("usePaymentFetchGql", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePublicQuery.mockReturnValue({ data: undefined, isLoading: false } as any);
  });

  describe("hook configuration", () => {
    it("should call usePublicQuery with correct query key", () => {
      renderHook(() => usePaymentFetchGql());

      expect(mockUsePublicQuery).toHaveBeenCalledWith(
        ["paymentGQL"],
        expect.any(Function),
      );
    });
  });

  describe("query function", () => {
    let capturedQueryFn: () => Promise<any>;

    beforeEach(() => {
      mockUsePublicQuery.mockImplementation((_key, queryFn) => {
        capturedQueryFn = queryFn as () => Promise<any>;
        return { data: undefined, isLoading: false } as any;
      });
    });

    it("should call graphqlRequest with Payments query", async () => {
      renderHook(() => usePaymentFetchGql());

      mockGraphqlRequest.mockResolvedValue({ payments: [createGqlPayment()] });
      await capturedQueryFn!();

      expect(mockGraphqlRequest).toHaveBeenCalledWith(
        expect.objectContaining({ query: expect.stringContaining("payments") }),
      );
    });

    it("should map graphql response to Payment objects", async () => {
      renderHook(() => usePaymentFetchGql());

      const gqlPayment = createGqlPayment({
        paymentId: 5,
        transactionDate: "2024-06-15",
        amount: 1000.0,
      });
      mockGraphqlRequest.mockResolvedValue({ payments: [gqlPayment] });

      const result = await capturedQueryFn!();

      expect(result).toHaveLength(1);
      expect(result[0].paymentId).toBe(5);
      expect(result[0].transactionDate).toBeInstanceOf(Date);
      expect(result[0].amount).toBe(1000.0);
    });

    it("should handle null/undefined optional fields with ?? undefined", async () => {
      renderHook(() => usePaymentFetchGql());

      const gqlPayment = createGqlPayment({
        owner: null,
        guidSource: null,
        guidDestination: null,
        dateAdded: null,
        dateUpdated: null,
      });
      mockGraphqlRequest.mockResolvedValue({ payments: [gqlPayment] });

      const result = await capturedQueryFn!();

      expect(result[0].owner).toBeUndefined();
      expect(result[0].guidSource).toBeUndefined();
      expect(result[0].guidDestination).toBeUndefined();
      expect(result[0].dateAdded).toBeUndefined();
      expect(result[0].dateUpdated).toBeUndefined();
    });

    it("should return empty array when payments is empty", async () => {
      renderHook(() => usePaymentFetchGql());

      mockGraphqlRequest.mockResolvedValue({ payments: [] });

      const result = await capturedQueryFn!();

      expect(result).toEqual([]);
    });

    it("should handle null payments response", async () => {
      renderHook(() => usePaymentFetchGql());

      mockGraphqlRequest.mockResolvedValue({ payments: null });

      const result = await capturedQueryFn!();

      expect(result).toEqual([]);
    });

    it("should convert dateAdded and dateUpdated to Date objects when present", async () => {
      renderHook(() => usePaymentFetchGql());

      const gqlPayment = createGqlPayment({
        dateAdded: "2024-01-01T10:00:00Z",
        dateUpdated: "2024-01-02T10:00:00Z",
      });
      mockGraphqlRequest.mockResolvedValue({ payments: [gqlPayment] });

      const result = await capturedQueryFn!();

      expect(result[0].dateAdded).toBeInstanceOf(Date);
      expect(result[0].dateUpdated).toBeInstanceOf(Date);
    });

    it("should propagate graphql errors", async () => {
      renderHook(() => usePaymentFetchGql());

      mockGraphqlRequest.mockRejectedValue(new Error("GraphQL error"));

      await expect(capturedQueryFn!()).rejects.toThrow("GraphQL error");
    });

    it("should map multiple payments", async () => {
      renderHook(() => usePaymentFetchGql());

      const gqlPayments = [
        createGqlPayment({ paymentId: 1 }),
        createGqlPayment({ paymentId: 2 }),
        createGqlPayment({ paymentId: 3 }),
      ];
      mockGraphqlRequest.mockResolvedValue({ payments: gqlPayments });

      const result = await capturedQueryFn!();

      expect(result).toHaveLength(3);
      expect(result.map((p: any) => p.paymentId)).toEqual([1, 2, 3]);
    });
  });
});
