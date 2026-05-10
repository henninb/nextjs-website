import usePendingTransactionDelete, { deletePendingTransaction } from "../../hooks/usePendingTransactionDelete";
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

jest.mock("../../utils/validation/sanitization", () => ({
  InputSanitizer: {
    sanitizeNumericId: jest.fn((value: number) => value),
  },
}));

jest.mock("../../utils/cacheUtils", () => ({
  QueryKeys: {
    pendingTransaction: jest.fn(() => ["pendingTransaction"]),
  },
  removeFromList: jest.fn(),
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
import { InputSanitizer } from "../../utils/validation/sanitization";

const mockFetchWithErrorHandling = fetchWithErrorHandling as jest.MockedFunction<
  typeof fetchWithErrorHandling
>;
const mockSanitizeNumericId =
  InputSanitizer.sanitizeNumericId as jest.MockedFunction<
    typeof InputSanitizer.sanitizeNumericId
  >;

describe("usePendingTransactionDelete - deletePendingTransaction", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchWithErrorHandling.mockResolvedValue({ status: 204 } as Response);
    mockSanitizeNumericId.mockImplementation((value: number) => value);
  });

  describe("sanitization", () => {
    it("should sanitize the transaction ID before building endpoint", async () => {
      await deletePendingTransaction(42);

      expect(mockSanitizeNumericId).toHaveBeenCalledWith(42, "pendingTransactionId");
    });

    it("should use sanitized ID in endpoint URL", async () => {
      mockSanitizeNumericId.mockReturnValue(99);

      await deletePendingTransaction(42);

      const [url] = mockFetchWithErrorHandling.mock.calls[0];
      expect(url).toBe("/api/pending/transaction/99");
    });
  });

  describe("successful deletion", () => {
    it("should call fetchWithErrorHandling with correct DELETE endpoint", async () => {
      await deletePendingTransaction(42);

      expect(mockFetchWithErrorHandling).toHaveBeenCalledWith(
        "/api/pending/transaction/42",
        { method: "DELETE" },
      );
    });

    it("should return void on success", async () => {
      const result = await deletePendingTransaction(42);

      expect(result).toBeUndefined();
    });

    it("should handle deletion of different transaction IDs", async () => {
      const testIds = [1, 100, 999, 12345];

      for (const id of testIds) {
        jest.clearAllMocks();
        mockFetchWithErrorHandling.mockResolvedValue({ status: 204 } as Response);
        mockSanitizeNumericId.mockImplementation((value: number) => value);

        await deletePendingTransaction(id);

        expect(mockFetchWithErrorHandling).toHaveBeenCalledWith(
          `/api/pending/transaction/${id}`,
          expect.any(Object),
        );
      }
    });
  });

  describe("error handling", () => {
    it("should propagate 404 not found error", async () => {
      const { FetchError } = jest.requireMock("../../utils/fetchUtils");
      mockFetchWithErrorHandling.mockRejectedValue(
        new FetchError("Transaction not found", 404),
      );

      await expect(deletePendingTransaction(42)).rejects.toThrow(
        "Transaction not found",
      );
    });

    it("should propagate 500 server error", async () => {
      const { FetchError } = jest.requireMock("../../utils/fetchUtils");
      mockFetchWithErrorHandling.mockRejectedValue(
        new FetchError("Internal server error", 500),
      );

      await expect(deletePendingTransaction(42)).rejects.toThrow(
        "Internal server error",
      );
    });

    it("should propagate network errors", async () => {
      mockFetchWithErrorHandling.mockRejectedValue(
        new Error("Network request failed"),
      );

      await expect(deletePendingTransaction(42)).rejects.toThrow(
        "Network request failed",
      );
    });

    it("should propagate 403 forbidden error", async () => {
      const { FetchError } = jest.requireMock("../../utils/fetchUtils");
      mockFetchWithErrorHandling.mockRejectedValue(
        new FetchError("Forbidden", 403),
      );

      await expect(deletePendingTransaction(42)).rejects.toThrow("Forbidden");
    });
  });

  describe("request format", () => {
    it("should use DELETE method", async () => {
      await deletePendingTransaction(42);

      const [, options] = mockFetchWithErrorHandling.mock.calls[0];
      expect(options?.method).toBe("DELETE");
    });

    it("should not send a body in DELETE request", async () => {
      await deletePendingTransaction(42);

      const [, options] = mockFetchWithErrorHandling.mock.calls[0];
      expect(options?.body).toBeUndefined();
    });
  });
});

// ---------------------------------------------------------------------------
// renderHook tests for usePendingTransactionDelete default export
// ---------------------------------------------------------------------------

const createPendingTxDeleteHookQueryClient = () =>
  new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

const createPendingTxDeleteHookWrapper = (queryClient: QueryClient) =>
  function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  };

describe("usePendingTransactionDelete hook", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchWithErrorHandling.mockResolvedValue({ status: 204 } as Response);
    mockSanitizeNumericId.mockImplementation((value: number) => value);
  });

  it("onSuccess sets query data removing the deleted transaction", async () => {
    const queryClient = createPendingTxDeleteHookQueryClient();
    const { QueryKeys } = jest.requireMock("../../utils/cacheUtils");
    queryClient.setQueryData(QueryKeys.pendingTransaction(), [
      { pendingTransactionId: 42, accountNameOwner: "test", amount: 10, description: "tx", transactionDate: new Date(), reviewStatus: "pending" },
      { pendingTransactionId: 99, accountNameOwner: "test", amount: 20, description: "other", transactionDate: new Date(), reviewStatus: "pending" },
    ]);

    const { result } = renderHook(() => usePendingTransactionDelete(), {
      wrapper: createPendingTxDeleteHookWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync(42);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const cached = queryClient.getQueryData<{ pendingTransactionId: number }[]>(
      QueryKeys.pendingTransaction(),
    );
    expect(cached?.find((t) => t.pendingTransactionId === 42)).toBeUndefined();
    expect(cached?.find((t) => t.pendingTransactionId === 99)).toBeDefined();
  });

  it("onError puts mutation into error state", async () => {
    const queryClient = createPendingTxDeleteHookQueryClient();
    mockFetchWithErrorHandling.mockRejectedValue(new Error("Delete failed"));

    const { result } = renderHook(() => usePendingTransactionDelete(), {
      wrapper: createPendingTxDeleteHookWrapper(queryClient),
    });

    await act(async () => {
      try {
        await result.current.mutateAsync(42);
      } catch {
        // expected
      }
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
