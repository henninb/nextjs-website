/**
 * TDD Tests for Modern useTransferInsert
 * Modern endpoint: POST /api/transfer
 *
 * Key differences from legacy:
 * - Endpoint: POST /api/transfer (vs POST /api/transfer/insert)
 * - Uses ServiceResult pattern for errors
 * - Returns 201 Created on success
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
import useTransferInsert from "../../hooks/useTransferInsert";

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

describe("useTransferInsert Modern Endpoint (TDD)", () => {
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
    it("should use modern endpoint POST /api/transfer", async () => {
      const testTransfer = createTestTransfer({
        transferId: 1,
        sourceAccount: "checking",
        destinationAccount: "savings",
        amount: 100.0,
      });

      global.fetch = createModernFetchMock(testTransfer, { status: 201 });

      const { result } = renderHook(() => useTransferInsert(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ payload: testTransfer });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(fetch).toHaveBeenCalledWith(
        "/api/transfer",
        expect.objectContaining({
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }),
      );
    });

    it("should insert transfer successfully", async () => {
      const inputTransfer = createTestTransfer({
        sourceAccount: "checking",
        destinationAccount: "savings",
        amount: 100.0,
      });
      const returnedTransfer = { ...inputTransfer, transferId: 1 };

      global.fetch = createModernFetchMock(returnedTransfer, { status: 201 });

      const { result } = renderHook(() => useTransferInsert(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ payload: inputTransfer });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(returnedTransfer);
    });

    it("should send transfer data in request body", async () => {
      const testTransfer = createTestTransfer({
        sourceAccount: "checking",
        destinationAccount: "savings",
        amount: 100.0,
        transactionDate: "2024-01-15",
      });

      global.fetch = createModernFetchMock({ ...testTransfer, transferId: 1 });

      const { result } = renderHook(() => useTransferInsert(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ payload: testTransfer });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      const callArgs = (fetch as jest.Mock).mock.calls[0];
      const requestBody = JSON.parse(callArgs[1].body);

      expect(requestBody.sourceAccount).toBe("checking");
      expect(requestBody.destinationAccount).toBe("savings");
      expect(requestBody.amount).toBe(100.0);
      expect(requestBody.transactionDate).toBe("2024-01-15");
    });
  });

  describe("Modern error handling", () => {
    it("should handle 400 Bad Request error", async () => {
      global.fetch = createModernErrorFetchMock("Invalid transfer data", 400);

      const { result } = renderHook(() => useTransferInsert(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ payload: createTestTransfer() });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error?.message).toBe("Invalid transfer data");
      expect(
        consoleSpy
          .getCalls()
          .error.some((call) =>
            call.some((arg: any) =>
              String(arg).includes("Failed to insert transfer:"),
            ),
          ),
      ).toBe(true);
    });

    it("should handle 401 Unauthorized error", async () => {
      global.fetch = createModernErrorFetchMock("Unauthorized", 401);

      const { result } = renderHook(() => useTransferInsert(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ payload: createTestTransfer() });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error?.message).toBe("Unauthorized");
    });

    it("should handle 403 Forbidden error", async () => {
      global.fetch = createModernErrorFetchMock("Forbidden", 403);

      const { result } = renderHook(() => useTransferInsert(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ payload: createTestTransfer() });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error?.message).toBe("Forbidden");
    });

    it("should handle 409 Conflict error (duplicate transfer)", async () => {
      global.fetch = createModernErrorFetchMock(
        "Duplicate transfer found",
        409,
      );

      const { result } = renderHook(() => useTransferInsert(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ payload: createTestTransfer() });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error?.message).toBe("Duplicate transfer found");
    });

    it("should handle 500 Internal Server Error", async () => {
      global.fetch = createModernErrorFetchMock("Internal server error", 500);

      const { result } = renderHook(() => useTransferInsert(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ payload: createTestTransfer() });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error?.message).toBe("Internal server error");
    });

    it("should handle network errors", async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error("Network error"));

      const { result } = renderHook(() => useTransferInsert(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ payload: createTestTransfer() });

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

      const { result } = renderHook(() => useTransferInsert(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ payload: createTestTransfer() });

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

      const { result } = renderHook(() => useTransferInsert(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ payload: createTestTransfer() });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error?.message).toContain(
        "HTTP error! Status: 500",
      );
    });
  });

  describe("Error logging", () => {
    it("should log errors to console.error (not console.log)", async () => {
      global.fetch = createModernErrorFetchMock("Test error", 500);

      const { result } = renderHook(() => useTransferInsert(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ payload: createTestTransfer() });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(
        consoleSpy
          .getCalls()
          .error.some((call) =>
            call.some((arg: any) =>
              String(arg).includes("Failed to insert transfer:"),
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
    it("should update React Query cache on successful insert", async () => {
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false },
          mutations: { retry: false },
        },
      });

      // Pre-populate cache with existing transfers
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

      const newTransfer = createTestTransfer({
        transferId: 2,
        sourceAccount: "savings",
      });
      global.fetch = createModernFetchMock(newTransfer, { status: 201 });

      const { result } = renderHook(() => useTransferInsert(), { wrapper });

      result.current.mutate({ payload: newTransfer });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      const cacheData = queryClient.getQueryData<Transfer[]>(["transfer"]);
      expect(cacheData).toHaveLength(2);
      expect(cacheData?.[0]).toEqual(newTransfer); // New transfer prepended
      expect(cacheData?.[1]).toEqual(existingTransfers[0]);
    });
  });
});
