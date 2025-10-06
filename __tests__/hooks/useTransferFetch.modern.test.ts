/**
 * TDD Tests for Modern useTransferFetch
 * Modern endpoint: GET /api/transfer/active
 *
 * Key differences from legacy:
 * - Endpoint: /api/transfer/active (vs /api/transfer/select)
 * - Uses ServiceResult pattern for errors
 * - Returns empty array instead of 404 when no transfers exist
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
import useTransferFetch from "../../hooks/useTransferFetch";

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

describe("useTransferFetch Modern Endpoint (TDD)", () => {
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
    it("should use modern endpoint /api/transfer/active", async () => {
      global.fetch = createModernFetchMock([]);

      const { result } = renderHook(() => useTransferFetch(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(fetch).toHaveBeenCalledWith("/api/transfer/active", {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });
    });

    it("should return empty array when no transfers exist", async () => {
      global.fetch = createModernFetchMock([]);

      const { result } = renderHook(() => useTransferFetch(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual([]);
      expect(Array.isArray(result.current.data)).toBe(true);
    });

    it("should fetch transfers successfully", async () => {
      const testTransfers = [
        createTestTransfer({ transferId: 1, sourceAccount: "checking" }),
        createTestTransfer({ transferId: 2, sourceAccount: "savings" }),
      ];

      global.fetch = createModernFetchMock(testTransfers);

      const { result } = renderHook(() => useTransferFetch(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(testTransfers);
      expect(result.current.data?.length).toBe(2);
    });
  });

  describe("Modern error handling", () => {
    it("should handle 401 Unauthorized error with modern format", async () => {
      global.fetch = createModernErrorFetchMock("Unauthorized", 401);

      const { result } = renderHook(() => useTransferFetch(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error?.message).toBe("Unauthorized");
      expect(
        consoleSpy
          .getCalls()
          .error.some((call) =>
            call.some((arg: any) =>
              String(arg).includes("Error fetching transfer data:"),
            ),
          ),
      ).toBe(true);
    });

    it("should handle 403 Forbidden error", async () => {
      global.fetch = createModernErrorFetchMock("Forbidden", 403);

      const { result } = renderHook(() => useTransferFetch(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error?.message).toBe("Forbidden");
    });

    it("should handle 404 Not Found error (modern pattern)", async () => {
      global.fetch = createModernErrorFetchMock("Transfers not found", 404);

      const { result } = renderHook(() => useTransferFetch(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error?.message).toBe("Transfers not found");
    });

    it("should handle 500 Internal Server Error", async () => {
      global.fetch = createModernErrorFetchMock("Internal server error", 500);

      const { result } = renderHook(() => useTransferFetch(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error?.message).toBe("Internal server error");
    });

    it("should handle network errors", async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error("Network error"));

      const { result } = renderHook(() => useTransferFetch(), {
        wrapper: createWrapper(),
      });

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

      const { result } = renderHook(() => useTransferFetch(), {
        wrapper: createWrapper(),
      });

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

      const { result } = renderHook(() => useTransferFetch(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error?.message).toContain(
        "HTTP error! Status: 500",
      );
    });
  });

  describe("Error logging", () => {
    it("should log errors to console.error (not console.log)", async () => {
      global.fetch = createModernErrorFetchMock("Test error", 500);

      const { result } = renderHook(() => useTransferFetch(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(
        consoleSpy
          .getCalls()
          .error.some((call) =>
            call.some((arg: any) =>
              String(arg).includes("Error fetching transfer data:"),
            ),
          ),
      ).toBe(true);
      expect(
        consoleSpy
          .getCalls()
          .error.some((call) =>
            call.some((arg: any) =>
              String(arg).includes(
                "Error occurred while fetching transfer data:",
              ),
            ),
          ),
      ).toBe(true);
    });
  });
});
