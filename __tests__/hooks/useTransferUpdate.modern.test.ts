/**
 * TDD Tests for Modern useTransferUpdate
 * Modern endpoint: PUT /api/transfer/{transferId}
 *
 * Key differences from legacy:
 * - Endpoint: PUT /api/transfer/{transferId} (vs PUT /api/transfer/update/{transferId})
 * - Uses ServiceResult pattern for errors
 * - Sends newTransfer object in body (not empty object)
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
import useTransferUpdate from "../../hooks/useTransferUpdate";

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

describe("useTransferUpdate Modern Endpoint (TDD)", () => {
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
    it("should use modern endpoint PUT /api/transfer/{transferId}", async () => {
      const oldTransfer = createTestTransfer({
        transferId: 1,
        sourceAccount: "checking",
        amount: 100.0,
      });
      const newTransfer = createTestTransfer({
        transferId: 1,
        sourceAccount: "checking",
        amount: 150.0,
      });

      global.fetch = createModernFetchMock(newTransfer);

      const { result } = renderHook(() => useTransferUpdate(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ oldTransfer, newTransfer });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(fetch).toHaveBeenCalledWith(
        "/api/transfer/1",
        expect.objectContaining({
          method: "PUT",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }),
      );
    });

    it("should update transfer successfully", async () => {
      const oldTransfer = createTestTransfer({
        transferId: 1,
        sourceAccount: "checking",
        amount: 100.0,
      });
      const newTransfer = createTestTransfer({
        transferId: 1,
        sourceAccount: "savings",
        amount: 150.0,
      });

      global.fetch = createModernFetchMock(newTransfer);

      const { result } = renderHook(() => useTransferUpdate(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ oldTransfer, newTransfer });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(newTransfer);
    });

    it("should send newTransfer data in request body", async () => {
      const oldTransfer = createTestTransfer({
        transferId: 1,
        sourceAccount: "checking",
        amount: 100.0,
      });
      const newTransfer = createTestTransfer({
        transferId: 1,
        sourceAccount: "savings",
        amount: 200.0,
        transactionDate: "2024-01-15",
      });

      global.fetch = createModernFetchMock(newTransfer);

      const { result } = renderHook(() => useTransferUpdate(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ oldTransfer, newTransfer });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      const callArgs = (fetch as jest.Mock).mock.calls[0];
      const requestBody = JSON.parse(callArgs[1].body);

      expect(requestBody.sourceAccount).toBe("savings");
      expect(requestBody.amount).toBe(200.0);
      expect(requestBody.transactionDate).toBe("2024-01-15");
    });
  });

  describe("Modern error handling", () => {
    it("should handle 400 Bad Request error", async () => {
      global.fetch = createModernErrorFetchMock("Invalid transfer data", 400);

      const { result } = renderHook(() => useTransferUpdate(), {
        wrapper: createWrapper(),
      });

      const oldTransfer = createTestTransfer({ transferId: 1 });
      const newTransfer = createTestTransfer({ transferId: 1 });

      result.current.mutate({ oldTransfer, newTransfer });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error?.message).toBe("Invalid transfer data");
      expect(
        consoleSpy
          .getCalls()
          .error.some((call) =>
            call.some((arg: any) =>
              String(arg).includes("Failed to update transfer:"),
            ),
          ),
      ).toBe(true);
    });

    it("should handle 401 Unauthorized error", async () => {
      global.fetch = createModernErrorFetchMock("Unauthorized", 401);

      const { result } = renderHook(() => useTransferUpdate(), {
        wrapper: createWrapper(),
      });

      const oldTransfer = createTestTransfer({ transferId: 1 });
      const newTransfer = createTestTransfer({ transferId: 1 });

      result.current.mutate({ oldTransfer, newTransfer });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error?.message).toBe("Unauthorized");
    });

    it("should handle 403 Forbidden error", async () => {
      global.fetch = createModernErrorFetchMock("Forbidden", 403);

      const { result } = renderHook(() => useTransferUpdate(), {
        wrapper: createWrapper(),
      });

      const oldTransfer = createTestTransfer({ transferId: 1 });
      const newTransfer = createTestTransfer({ transferId: 1 });

      result.current.mutate({ oldTransfer, newTransfer });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error?.message).toBe("Forbidden");
    });

    it("should handle 404 Not Found error (transfer doesn't exist)", async () => {
      global.fetch = createModernErrorFetchMock("Transfer not found", 404);

      const { result } = renderHook(() => useTransferUpdate(), {
        wrapper: createWrapper(),
      });

      const oldTransfer = createTestTransfer({ transferId: 999 });
      const newTransfer = createTestTransfer({ transferId: 999 });

      result.current.mutate({ oldTransfer, newTransfer });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error?.message).toBe("Transfer not found");
    });

    it("should handle 409 Conflict error", async () => {
      global.fetch = createModernErrorFetchMock(
        "Conflict updating transfer",
        409,
      );

      const { result } = renderHook(() => useTransferUpdate(), {
        wrapper: createWrapper(),
      });

      const oldTransfer = createTestTransfer({ transferId: 1 });
      const newTransfer = createTestTransfer({ transferId: 1 });

      result.current.mutate({ oldTransfer, newTransfer });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error?.message).toBe("Conflict updating transfer");
    });

    it("should handle 500 Internal Server Error", async () => {
      global.fetch = createModernErrorFetchMock("Internal server error", 500);

      const { result } = renderHook(() => useTransferUpdate(), {
        wrapper: createWrapper(),
      });

      const oldTransfer = createTestTransfer({ transferId: 1 });
      const newTransfer = createTestTransfer({ transferId: 1 });

      result.current.mutate({ oldTransfer, newTransfer });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error?.message).toBe("Internal server error");
    });

    it("should handle network errors", async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error("Network error"));

      const { result } = renderHook(() => useTransferUpdate(), {
        wrapper: createWrapper(),
      });

      const oldTransfer = createTestTransfer({ transferId: 1 });
      const newTransfer = createTestTransfer({ transferId: 1 });

      result.current.mutate({ oldTransfer, newTransfer });

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

      const { result } = renderHook(() => useTransferUpdate(), {
        wrapper: createWrapper(),
      });

      const oldTransfer = createTestTransfer({ transferId: 1 });
      const newTransfer = createTestTransfer({ transferId: 1 });

      result.current.mutate({ oldTransfer, newTransfer });

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

      const { result } = renderHook(() => useTransferUpdate(), {
        wrapper: createWrapper(),
      });

      const oldTransfer = createTestTransfer({ transferId: 1 });
      const newTransfer = createTestTransfer({ transferId: 1 });

      result.current.mutate({ oldTransfer, newTransfer });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error?.message).toContain(
        "HTTP error! Status: 500",
      );
    });
  });

  describe("Error logging", () => {
    it("should log errors to console.error (not console.log)", async () => {
      global.fetch = createModernErrorFetchMock("Test error", 500);

      const { result } = renderHook(() => useTransferUpdate(), {
        wrapper: createWrapper(),
      });

      const oldTransfer = createTestTransfer({ transferId: 1 });
      const newTransfer = createTestTransfer({ transferId: 1 });

      result.current.mutate({ oldTransfer, newTransfer });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(
        consoleSpy
          .getCalls()
          .error.some((call) =>
            call.some((arg: any) =>
              String(arg).includes("Failed to update transfer:"),
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
      expect(
        consoleSpy
          .getCalls()
          .error.some((call) =>
            call.some((arg: any) =>
              String(arg).includes("Error occurred during mutation:"),
            ),
          ),
      ).toBe(true);
    });
  });

  describe("Cache updates", () => {
    it("should update React Query cache on successful update", async () => {
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false },
          mutations: { retry: false },
        },
      });

      // Pre-populate cache with existing transfers
      const existingTransfers = [
        createTestTransfer({ transferId: 1, amount: 100.0 }),
        createTestTransfer({ transferId: 2, amount: 200.0 }),
      ];
      queryClient.setQueryData(["transfer"], existingTransfers);

      function wrapper({ children }: { children: React.ReactNode }) {
        return React.createElement(
          QueryClientProvider,
          { client: queryClient },
          children,
        );
      }

      const oldTransfer = existingTransfers[0];
      const newTransfer = { ...oldTransfer, amount: 150.0 };
      global.fetch = createModernFetchMock(newTransfer);

      const { result } = renderHook(() => useTransferUpdate(), { wrapper });

      result.current.mutate({ oldTransfer, newTransfer });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      const cacheData = queryClient.getQueryData<Transfer[]>(["transfer"]);
      expect(cacheData).toHaveLength(2);
      expect(cacheData?.[0].amount).toBe(150.0); // Updated
      expect(cacheData?.[1]).toEqual(existingTransfers[1]); // Unchanged
    });
  });
});
