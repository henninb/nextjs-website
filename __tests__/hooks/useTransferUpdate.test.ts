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
import {
  createModernFetchMock,
  createModernErrorFetchMock,
  createTestTransfer,
} from "../../testHelpers";
import Transfer from "../../model/Transfer";

function createMockLogger() {
  return {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
}

// Import the actual implementation
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import useTransferUpdate from "../../hooks/useTransferUpdate";

// Mock the useAuth hook

// Mock CSRF utilities
jest.mock("../../utils/csrf", () => ({
  getCsrfHeaders: jest.fn().mockResolvedValue({}),
  getCsrfToken: jest.fn().mockResolvedValue(null),
  fetchCsrfToken: jest.fn().mockResolvedValue(undefined),
  clearCsrfToken: jest.fn(),
  initCsrfToken: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("../../components/AuthProvider", () => ({
  useAuth: () => ({
    isAuthenticated: true,
    loading: false,
    user: null,
    login: jest.fn(),
    logout: jest.fn(),
  }),
}));

jest.mock("../../utils/hookValidation", () => ({
  HookValidator: {
    validateInsert: jest.fn((data) => data),
    validateUpdate: jest.fn((newData) => newData),
    validateDelete: jest.fn(),
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

jest.mock("../../utils/validation/sanitization", () => ({
  InputSanitizer: {
    sanitizeNumericId: jest.fn((value) => value),
  },
}));

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

describe("useTransferUpdate Modern Endpoint (TDD)", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockLogger.debug.mockClear();
    mockLogger.error.mockClear();
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

      expect(result.current.data).toStrictEqual(newTransfer);
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

      await expect(
        result.current.mutateAsync({ oldTransfer, newTransfer }),
      ).rejects.toThrow("Invalid transfer data");
      expect(mockLogger.error).toHaveBeenCalledWith(
        "Update failed",
        expect.any(Error),
      );
    });

    it("should handle 401 Unauthorized error", async () => {
      global.fetch = createModernErrorFetchMock("Unauthorized", 401);

      const { result } = renderHook(() => useTransferUpdate(), {
        wrapper: createWrapper(),
      });

      const oldTransfer = createTestTransfer({ transferId: 1 });
      const newTransfer = createTestTransfer({ transferId: 1 });

      await expect(
        result.current.mutateAsync({ oldTransfer, newTransfer }),
      ).rejects.toThrow("Unauthorized");
    });

    it("should handle 403 Forbidden error", async () => {
      global.fetch = createModernErrorFetchMock("Forbidden", 403);

      const { result } = renderHook(() => useTransferUpdate(), {
        wrapper: createWrapper(),
      });

      const oldTransfer = createTestTransfer({ transferId: 1 });
      const newTransfer = createTestTransfer({ transferId: 1 });

      await expect(
        result.current.mutateAsync({ oldTransfer, newTransfer }),
      ).rejects.toThrow("Forbidden");
    });

    it("should handle 404 Not Found error (transfer doesn't exist)", async () => {
      global.fetch = createModernErrorFetchMock("Transfer not found", 404);

      const { result } = renderHook(() => useTransferUpdate(), {
        wrapper: createWrapper(),
      });

      const oldTransfer = createTestTransfer({ transferId: 999 });
      const newTransfer = createTestTransfer({ transferId: 999 });

      await expect(
        result.current.mutateAsync({ oldTransfer, newTransfer }),
      ).rejects.toThrow("Transfer not found");
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

      await expect(
        result.current.mutateAsync({ oldTransfer, newTransfer }),
      ).rejects.toThrow("Conflict updating transfer");
    });

    it("should handle 500 Internal Server Error", async () => {
      global.fetch = createModernErrorFetchMock("Internal server error", 500);

      const { result } = renderHook(() => useTransferUpdate(), {
        wrapper: createWrapper(),
      });

      const oldTransfer = createTestTransfer({ transferId: 1 });
      const newTransfer = createTestTransfer({ transferId: 1 });

      await expect(
        result.current.mutateAsync({ oldTransfer, newTransfer }),
      ).rejects.toThrow("Internal server error");
    });

    it("should handle network errors", async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error("Network error"));

      const { result } = renderHook(() => useTransferUpdate(), {
        wrapper: createWrapper(),
      });

      const oldTransfer = createTestTransfer({ transferId: 1 });
      const newTransfer = createTestTransfer({ transferId: 1 });

      await expect(
        result.current.mutateAsync({ oldTransfer, newTransfer }),
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

      const { result } = renderHook(() => useTransferUpdate(), {
        wrapper: createWrapper(),
      });

      const oldTransfer = createTestTransfer({ transferId: 1 });
      const newTransfer = createTestTransfer({ transferId: 1 });

      await expect(
        result.current.mutateAsync({ oldTransfer, newTransfer }),
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

      const { result } = renderHook(() => useTransferUpdate(), {
        wrapper: createWrapper(),
      });

      const oldTransfer = createTestTransfer({ transferId: 1 });
      const newTransfer = createTestTransfer({ transferId: 1 });

      await expect(
        result.current.mutateAsync({ oldTransfer, newTransfer }),
      ).rejects.toThrow("HTTP 500: Internal Server Error");
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
      expect(cacheData?.[1]).toStrictEqual(existingTransfers[1]); // Unchanged
    });
  });
});
