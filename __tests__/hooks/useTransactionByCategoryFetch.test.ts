import React from "react";
import { renderHook } from "@testing-library/react";
import useTransactionByCategoryFetch from "../../hooks/useTransactionByCategoryFetch";

jest.mock("../../utils/validation/sanitization", () => ({
  InputSanitizer: {
    sanitizeForUrl: jest.fn((value: string) => value),
  },
}));

jest.mock("../../utils/cacheUtils", () => ({
  QueryKeys: {
    transactionByCategory: jest.fn((cat: string) => ["transaction", "category", cat]),
  },
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

import { useAuthenticatedQuery } from "../../utils/queryConfig";
import { InputSanitizer } from "../../utils/validation/sanitization";

const mockUseAuthenticatedQuery = useAuthenticatedQuery as jest.MockedFunction<
  typeof useAuthenticatedQuery
>;
const mockSanitizeForUrl = InputSanitizer.sanitizeForUrl as jest.MockedFunction<
  typeof InputSanitizer.sanitizeForUrl
>;

const createTestTransaction = () => ({
  guid: "test-guid-1",
  transactionDate: new Date("2024-01-01"),
  accountNameOwner: "checking_john",
  description: "Grocery Store",
  category: "groceries",
  amount: 50.0,
  transactionState: "cleared" as const,
  reoccurring: false,
  notes: "",
  activeStatus: true,
  transactionId: 1,
});

describe("useTransactionByCategoryFetch", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSanitizeForUrl.mockImplementation((value: string) => value);
    mockUseAuthenticatedQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
    } as any);
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe("hook configuration", () => {
    it("should call useAuthenticatedQuery with category query key", () => {
      renderHook(() => useTransactionByCategoryFetch("groceries"));

      expect(mockUseAuthenticatedQuery).toHaveBeenCalledWith(
        expect.arrayContaining(["groceries"]),
        expect.any(Function),
        expect.objectContaining({ enabled: true }),
      );
    });

    it("should be disabled when categoryName is empty", () => {
      renderHook(() => useTransactionByCategoryFetch(""));

      expect(mockUseAuthenticatedQuery).toHaveBeenCalledWith(
        expect.any(Array),
        expect.any(Function),
        expect.objectContaining({ enabled: false }),
      );
    });

    it("should be enabled when categoryName is provided", () => {
      renderHook(() => useTransactionByCategoryFetch("groceries"));

      expect(mockUseAuthenticatedQuery).toHaveBeenCalledWith(
        expect.any(Array),
        expect.any(Function),
        expect.objectContaining({ enabled: true }),
      );
    });
  });

  describe("fetchTransactionsByCategory function", () => {
    let capturedQueryFn: () => Promise<any>;

    beforeEach(() => {
      mockUseAuthenticatedQuery.mockImplementation((_key, queryFn) => {
        capturedQueryFn = queryFn as () => Promise<any>;
        return { data: undefined, isLoading: false, error: null } as any;
      });
    });

    it("should fetch from correct endpoint with category name", async () => {
      renderHook(() => useTransactionByCategoryFetch("groceries"));

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue([]),
      });

      await capturedQueryFn!();

      expect(global.fetch).toHaveBeenCalledWith(
        "/api/transaction/category/groceries",
        expect.objectContaining({ method: "GET" }),
      );
    });

    it("should sanitize category name for URL", async () => {
      renderHook(() => useTransactionByCategoryFetch("groceries"));

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue([]),
      });

      await capturedQueryFn!();

      expect(mockSanitizeForUrl).toHaveBeenCalledWith("groceries");
    });

    it("should use sanitized category name in URL", async () => {
      mockSanitizeForUrl.mockReturnValue("sanitized_category");
      renderHook(() => useTransactionByCategoryFetch("raw_category"));

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue([]),
      });

      await capturedQueryFn!();

      const [url] = (global.fetch as jest.Mock).mock.calls[0];
      expect(url).toContain("sanitized_category");
    });

    it("should use GET method with credentials", async () => {
      renderHook(() => useTransactionByCategoryFetch("groceries"));

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue([]),
      });

      await capturedQueryFn!();

      const [, options] = (global.fetch as jest.Mock).mock.calls[0];
      expect(options.method).toBe("GET");
      expect(options.credentials).toBe("include");
    });

    it("should return array of transactions", async () => {
      const transactions = [createTestTransaction(), createTestTransaction()];
      renderHook(() => useTransactionByCategoryFetch("groceries"));

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue(transactions),
      });

      const result = await capturedQueryFn!();

      expect(result).toStrictEqual(transactions);
    });

    it("should return null for 204 response", async () => {
      renderHook(() => useTransactionByCategoryFetch("groceries"));

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 204,
      });

      const result = await capturedQueryFn!();

      expect(result).toBeNull();
    });

    it("should throw on non-ok response", async () => {
      renderHook(() => useTransactionByCategoryFetch("groceries"));

      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
      });

      await expect(capturedQueryFn!()).rejects.toThrow();
    });

    it("should handle network errors", async () => {
      renderHook(() => useTransactionByCategoryFetch("groceries"));

      global.fetch = jest.fn().mockRejectedValue(new Error("Network failure"));

      await expect(capturedQueryFn!()).rejects.toThrow("Network failure");
    });

    it.each(["groceries", "dining", "entertainment", "transportation"])(
      "should fetch transactions for category '%s'",
      async (category) => {
        renderHook(() => useTransactionByCategoryFetch(category));

        global.fetch = jest.fn().mockResolvedValue({
          ok: true,
          status: 200,
          json: jest.fn().mockResolvedValue([]),
        });

        await capturedQueryFn!();

        expect(global.fetch).toHaveBeenCalledWith(
          `/api/transaction/category/${category}`,
          expect.any(Object),
        );
      },
    );
  });
});
