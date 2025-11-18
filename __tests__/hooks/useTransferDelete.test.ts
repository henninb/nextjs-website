/**
 * TDD Tests for Modern useTransferDelete
 * Modern endpoint: DELETE /api/transfer/{transferId}
 *
 * Key differences from legacy:
 * - Endpoint: DELETE /api/transfer/{transferId} (vs DELETE /api/transfer/delete/{transferId})
 * - Uses ServiceResult pattern for errors
 * - Returns deleted transfer object (not null/204)
 */

import React from "react";
import {
  createModernFetchMock,
  createModernErrorFetchMock,
  createTestTransfer,
} from "../../testHelpers";
import Transfer from "../../model/Transfer";

// Import the actual implementation
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import useTransferDelete from "../../hooks/useTransferDelete";

function createMockLogger() {
  return {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
}

jest.mock("../../utils/hookValidation", () => ({
  HookValidator: {
    validateInsert: jest.fn((data) => data),
    validateUpdate: jest.fn((data) => data),
    validateDelete: jest.fn(() => ({})),
  },
  HookValidationError: class HookValidationError extends Error {
    constructor(message: string) {
      super(message);
      this.name = "HookValidationError";
    }
  },
}));

jest.mock("../../utils/logger", () => {
  const logger = createMockLogger();
  return {
    createHookLogger: jest.fn(() => logger),
    __mockLogger: logger,
  };
});

const { __mockLogger: mockLogger } = jest.requireMock("../../utils/logger") as {
  __mockLogger: ReturnType<typeof createMockLogger>;
};

// Helper to create wrapper for React Query
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(
      QueryClientProvider,
      { client: queryClient },
      children,
    );
  }

  return Wrapper;
};

describe("useTransferDelete Modern Endpoint (TDD)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLogger.debug.mockClear();
    mockLogger.error.mockClear();
  });

  describe("Modern endpoint behavior", () => {
    it("should use modern endpoint DELETE /api/transfer/{transferId}", async () => {
      const testTransfer = createTestTransfer({
        transferId: 1,
        sourceAccount: "checking",
      });

      global.fetch = createModernFetchMock(testTransfer);

      const { result } = renderHook(() => useTransferDelete(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ oldRow: testTransfer });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(fetch).toHaveBeenCalledWith(
        "/api/transfer/1",
        expect.objectContaining({
          method: "DELETE",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }),
      );
    });

    it("should delete transfer successfully", async () => {
      const testTransfer = createTestTransfer({
        transferId: 1,
        sourceAccount: "checking",
      });

      global.fetch = createModernFetchMock(testTransfer);

      const { result } = renderHook(() => useTransferDelete(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ oldRow: testTransfer });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(testTransfer);
    });

    it("should return deleted transfer object", async () => {
      const testTransfer = createTestTransfer({
        transferId: 1,
        sourceAccount: "checking",
        amount: 100.0,
      });

      global.fetch = createModernFetchMock(testTransfer);

      const { result } = renderHook(() => useTransferDelete(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ oldRow: testTransfer });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.transferId).toBe(1);
      expect(result.current.data?.sourceAccount).toBe("checking");
      expect(result.current.data?.amount).toBe(100.0);
    });
  });

  describe("Modern error handling", () => {
    it("should handle 401 Unauthorized error", async () => {
      global.fetch = createModernErrorFetchMock("Unauthorized", 401);

      const { result } = renderHook(() => useTransferDelete(), {
        wrapper: createWrapper(),
      });

      const testTransfer = createTestTransfer({ transferId: 1 });

      await expect(
        result.current.mutateAsync({ oldRow: testTransfer }),
      ).rejects.toThrow("Unauthorized");
      expect(mockLogger.error).toHaveBeenCalledWith(
        "Delete failed",
        expect.any(Error),
      );
    });

    it("should handle 403 Forbidden error", async () => {
      global.fetch = createModernErrorFetchMock("Forbidden", 403);

      const { result } = renderHook(() => useTransferDelete(), {
        wrapper: createWrapper(),
      });

      const testTransfer = createTestTransfer({ transferId: 1 });

      await expect(
        result.current.mutateAsync({ oldRow: testTransfer }),
      ).rejects.toThrow("Forbidden");
    });

    it("should handle 404 Not Found error (transfer doesn't exist)", async () => {
      global.fetch = createModernErrorFetchMock("Transfer not found", 404);

      const { result } = renderHook(() => useTransferDelete(), {
        wrapper: createWrapper(),
      });

      const testTransfer = createTestTransfer({ transferId: 999 });

      await expect(
        result.current.mutateAsync({ oldRow: testTransfer }),
      ).rejects.toThrow("Transfer not found");
    });

    it("should handle 500 Internal Server Error", async () => {
      global.fetch = createModernErrorFetchMock("Internal server error", 500);

      const { result } = renderHook(() => useTransferDelete(), {
        wrapper: createWrapper(),
      });

      const testTransfer = createTestTransfer({ transferId: 1 });

      await expect(
        result.current.mutateAsync({ oldRow: testTransfer }),
      ).rejects.toThrow("Internal server error");
    });

    it("should handle network errors", async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error("Network error"));

      const { result } = renderHook(() => useTransferDelete(), {
        wrapper: createWrapper(),
      });

      const testTransfer = createTestTransfer({ transferId: 1 });

      await expect(
        result.current.mutateAsync({ oldRow: testTransfer }),
      ).rejects.toThrow("Network error");
    });

    it("should handle error response without error field", async () => {
      const mockResponse = {
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
        json: jest.fn().mockResolvedValue({}),
        text: jest.fn().mockResolvedValue("{}"),
      };
      global.fetch = jest.fn().mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useTransferDelete(), {
        wrapper: createWrapper(),
      });

      const testTransfer = createTestTransfer({ transferId: 1 });

      await expect(
        result.current.mutateAsync({ oldRow: testTransfer }),
      ).rejects.toThrow("HTTP 500: Internal Server Error");
    });

    it("should handle JSON parse error in error response", async () => {
      const mockResponse = {
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
        json: jest.fn().mockRejectedValue(new Error("Invalid JSON")),
        text: jest.fn().mockResolvedValue("Invalid response"),
      };
      global.fetch = jest.fn().mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useTransferDelete(), {
        wrapper: createWrapper(),
      });

      const testTransfer = createTestTransfer({ transferId: 1 });

      await expect(
        result.current.mutateAsync({ oldRow: testTransfer }),
      ).rejects.toThrow("HTTP 500: Internal Server Error");
    });
  });

  describe("Cache updates", () => {
    it("should remove deleted transfer from React Query cache", async () => {
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false },
          mutations: { retry: false },
        },
      });

      // Pre-populate cache with existing transfers
      const existingTransfers = [
        createTestTransfer({ transferId: 1, sourceAccount: "checking" }),
        createTestTransfer({ transferId: 2, sourceAccount: "savings" }),
      ];
      queryClient.setQueryData(["transfer"], existingTransfers);

      function wrapper({ children }: { children: React.ReactNode }) {
        return React.createElement(
          QueryClientProvider,
          { client: queryClient },
          children,
        );
      }

      const transferToDelete = existingTransfers[0];
      global.fetch = createModernFetchMock(transferToDelete);

      const { result } = renderHook(() => useTransferDelete(), { wrapper });

      result.current.mutate({ oldRow: transferToDelete });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      const cacheData = queryClient.getQueryData<Transfer[]>(["transfer"]);
      expect(cacheData).toHaveLength(1);
      expect(cacheData?.[0].transferId).toBe(2); // Only second transfer remains
    });

    it("should handle empty cache after deletion", async () => {
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false },
          mutations: { retry: false },
        },
      });

      // Pre-populate cache with one transfer
      const existingTransfers = [
        createTestTransfer({ transferId: 1, sourceAccount: "checking" }),
      ];
      queryClient.setQueryData(["transfer"], existingTransfers);

      function wrapper({ children }: { children: React.ReactNode }) {
        return React.createElement(
          QueryClientProvider,
          { client: queryClient },
          children,
        );
      }

      const transferToDelete = existingTransfers[0];
      global.fetch = createModernFetchMock(transferToDelete);

      const { result } = renderHook(() => useTransferDelete(), { wrapper });

      result.current.mutate({ oldRow: transferToDelete });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      const cacheData = queryClient.getQueryData<Transfer[]>(["transfer"]);
      expect(cacheData).toHaveLength(0);
      expect(cacheData).toEqual([]);
    });
  });
});
