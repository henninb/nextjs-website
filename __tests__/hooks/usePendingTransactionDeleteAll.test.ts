import usePendingTransactionDeleteAll, { deleteAllPendingTransactions } from "../../hooks/usePendingTransactionDeleteAll";
import React from "react";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

jest.mock("../../utils/fetchUtils", () => ({
  fetchWithErrorHandling: jest.fn(),
  parseResponse: jest.fn(),
  FetchError: class FetchError extends Error {
    constructor(
      message: string,
      public status?: number,
    ) {
      super(message);
      this.name = "FetchError";
    }
  },
}));

jest.mock("../../utils/cacheUtils", () => ({
  QueryKeys: {
    pendingTransaction: jest.fn(() => ["pendingTransaction"]),
  },
}));

jest.mock("../../utils/logger", () => ({
  createHookLogger: jest.fn(() => ({
    debug: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
  })),
}));

import { fetchWithErrorHandling } from "../../utils/fetchUtils";

const mockFetchWithErrorHandling = fetchWithErrorHandling as jest.MockedFunction<
  typeof fetchWithErrorHandling
>;

describe("usePendingTransactionDeleteAll - deleteAllPendingTransactions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchWithErrorHandling.mockResolvedValue({ status: 204 } as Response);
  });

  describe("successful deletion", () => {
    it("should call fetchWithErrorHandling with correct DELETE endpoint", async () => {
      await deleteAllPendingTransactions();

      expect(mockFetchWithErrorHandling).toHaveBeenCalledWith(
        "/api/pending/transaction/delete/all",
        { method: "DELETE" },
      );
    });

    it("should return void on success", async () => {
      const result = await deleteAllPendingTransactions();

      expect(result).toBeUndefined();
    });

    it("should call the delete endpoint only once", async () => {
      await deleteAllPendingTransactions();

      expect(mockFetchWithErrorHandling).toHaveBeenCalledTimes(1);
    });

    it("should use correct endpoint path", async () => {
      await deleteAllPendingTransactions();

      const [url] = mockFetchWithErrorHandling.mock.calls[0];
      expect(url).toBe("/api/pending/transaction/delete/all");
    });
  });

  describe("error handling", () => {
    it("should propagate 500 server error", async () => {
      const { FetchError } = jest.requireMock("../../utils/fetchUtils");
      mockFetchWithErrorHandling.mockRejectedValue(
        new FetchError("Database error while deleting all transactions", 500),
      );

      await expect(deleteAllPendingTransactions()).rejects.toThrow(
        "Database error while deleting all transactions",
      );
    });

    it("should propagate 401 unauthorized error", async () => {
      const { FetchError } = jest.requireMock("../../utils/fetchUtils");
      mockFetchWithErrorHandling.mockRejectedValue(
        new FetchError("Unauthorized", 401),
      );

      await expect(deleteAllPendingTransactions()).rejects.toThrow("Unauthorized");
    });

    it("should propagate 403 forbidden error", async () => {
      const { FetchError } = jest.requireMock("../../utils/fetchUtils");
      mockFetchWithErrorHandling.mockRejectedValue(
        new FetchError("Forbidden", 403),
      );

      await expect(deleteAllPendingTransactions()).rejects.toThrow("Forbidden");
    });

    it("should propagate network errors", async () => {
      mockFetchWithErrorHandling.mockRejectedValue(
        new Error("Network request failed"),
      );

      await expect(deleteAllPendingTransactions()).rejects.toThrow(
        "Network request failed",
      );
    });

    it("should propagate timeout errors", async () => {
      mockFetchWithErrorHandling.mockRejectedValue(new Error("Timeout"));

      await expect(deleteAllPendingTransactions()).rejects.toThrow("Timeout");
    });
  });

  describe("request format", () => {
    it("should use DELETE method", async () => {
      await deleteAllPendingTransactions();

      const [, options] = mockFetchWithErrorHandling.mock.calls[0];
      expect(options?.method).toBe("DELETE");
    });

    it("should not send a body in DELETE request", async () => {
      await deleteAllPendingTransactions();

      const [, options] = mockFetchWithErrorHandling.mock.calls[0];
      expect(options?.body).toBeUndefined();
    });
  });

  describe("concurrent calls", () => {
    it("should handle concurrent delete all calls", async () => {
      await Promise.all([
        deleteAllPendingTransactions(),
        deleteAllPendingTransactions(),
        deleteAllPendingTransactions(),
      ]);

      expect(mockFetchWithErrorHandling).toHaveBeenCalledTimes(3);
    });
  });
});

// ---------------------------------------------------------------------------
// renderHook tests for usePendingTransactionDeleteAll default export
// ---------------------------------------------------------------------------

const createPendingTxDeleteAllHookQueryClient = () =>
  new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

const createPendingTxDeleteAllHookWrapper = (queryClient: QueryClient) =>
  function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  };

describe("usePendingTransactionDeleteAll hook", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchWithErrorHandling.mockResolvedValue({ status: 204 } as Response);
  });

  it("onSuccess clears the pending transactions cache to empty array", async () => {
    const queryClient = createPendingTxDeleteAllHookQueryClient();
    const { QueryKeys } = jest.requireMock("../../utils/cacheUtils");
    queryClient.setQueryData(QueryKeys.pendingTransaction(), [
      { pendingTransactionId: 1, description: "tx1" },
      { pendingTransactionId: 2, description: "tx2" },
    ]);

    const { result } = renderHook(() => usePendingTransactionDeleteAll(), {
      wrapper: createPendingTxDeleteAllHookWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync();
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const cached = queryClient.getQueryData(QueryKeys.pendingTransaction());
    expect(cached).toEqual([]);
  });

  it("onError puts mutation into error state", async () => {
    const queryClient = createPendingTxDeleteAllHookQueryClient();
    mockFetchWithErrorHandling.mockRejectedValue(new Error("Delete all failed"));

    const { result } = renderHook(() => usePendingTransactionDeleteAll(), {
      wrapper: createPendingTxDeleteAllHookWrapper(queryClient),
    });

    await act(async () => {
      try {
        await result.current.mutateAsync();
      } catch {
        // expected
      }
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
