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
import { ConsoleSpy } from "../../testHelpers";
import {
  createModernFetchMock,
  createModernErrorFetchMock,
  createTestTransfer,
} from "../../testHelpers.modern";
import Transfer from "../../model/Transfer";

// Import the actual implementation
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import useTransferDelete from "../../hooks/useTransferDelete";

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
  let consoleSpy: ConsoleSpy;

  beforeEach(() => {
    consoleSpy = new ConsoleSpy();
    consoleSpy.start();
    jest.clearAllMocks();
  });

  afterEach(() => {
    consoleSpy.stop();
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

      result.current.mutate({ oldRow: testTransfer });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error?.message).toBe("Unauthorized");
      expect(
        consoleSpy
          .getCalls()
          .error.some((call) =>
            call.some((arg: any) =>
              String(arg).includes("Failed to delete transfer:"),
            ),
          ),
      ).toBe(true);
    });

    it("should handle 403 Forbidden error", async () => {
      global.fetch = createModernErrorFetchMock("Forbidden", 403);

      const { result } = renderHook(() => useTransferDelete(), {
        wrapper: createWrapper(),
      });

      const testTransfer = createTestTransfer({ transferId: 1 });

      result.current.mutate({ oldRow: testTransfer });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error?.message).toBe("Forbidden");
    });

    it("should handle 404 Not Found error (transfer doesn't exist)", async () => {
      global.fetch = createModernErrorFetchMock("Transfer not found", 404);

      const { result } = renderHook(() => useTransferDelete(), {
        wrapper: createWrapper(),
      });

      const testTransfer = createTestTransfer({ transferId: 999 });

      result.current.mutate({ oldRow: testTransfer });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error?.message).toBe("Transfer not found");
    });

    it("should handle 500 Internal Server Error", async () => {
      global.fetch = createModernErrorFetchMock("Internal server error", 500);

      const { result } = renderHook(() => useTransferDelete(), {
        wrapper: createWrapper(),
      });

      const testTransfer = createTestTransfer({ transferId: 1 });

      result.current.mutate({ oldRow: testTransfer });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error?.message).toBe("Internal server error");
    });

    it("should handle network errors", async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error("Network error"));

      const { result } = renderHook(() => useTransferDelete(), {
        wrapper: createWrapper(),
      });

      const testTransfer = createTestTransfer({ transferId: 1 });

      result.current.mutate({ oldRow: testTransfer });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error?.message).toContain("Network error");
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

      result.current.mutate({ oldRow: testTransfer });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error?.message).toContain(
        "HTTP error! Status: 500",
      );
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

      result.current.mutate({ oldRow: testTransfer });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error?.message).toContain(
        "HTTP error! Status: 500",
      );
    });
  });

  describe("Error logging", () => {
    it("should log errors to console.error (not console.log)", async () => {
      global.fetch = createModernErrorFetchMock("Test error", 500);

      const { result } = renderHook(() => useTransferDelete(), {
        wrapper: createWrapper(),
      });

      const testTransfer = createTestTransfer({ transferId: 1 });

      result.current.mutate({ oldRow: testTransfer });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(
        consoleSpy
          .getCalls()
          .error.some((call) =>
            call.some((arg: any) =>
              String(arg).includes("Failed to delete transfer:"),
            ),
          ),
      ).toBe(true);
      expect(
        consoleSpy
          .getCalls()
          .error.some((call) =>
            call.some((arg: any) => String(arg).includes("An error occurred:")),
          ),
      ).toBe(true);
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
