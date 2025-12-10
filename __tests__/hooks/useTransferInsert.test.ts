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
import useTransferInsert from "../../hooks/useTransferInsert";


// Mock the useAuth hook
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
    validateUpdate: jest.fn((updated) => updated),
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

describe("useTransferInsert Modern Endpoint (TDD)", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  const { __mockLogger: mockLogger } = jest.requireMock(
    "../../utils/logger",
  ) as { __mockLogger: ReturnType<typeof createMockLogger> };
  beforeEach(() => {
    jest.clearAllMocks();
    mockLogger.debug.mockClear();
    mockLogger.error.mockClear();
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

      expect(result.current.data).toStrictEqual(returnedTransfer);
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

      await expect(
        result.current.mutateAsync({ payload: createTestTransfer() }),
      ).rejects.toThrow("Invalid transfer data");
      expect(mockLogger.error).toHaveBeenCalledWith(
        "Insert failed",
        expect.any(Error),
      );
    });

    it("should handle 401 Unauthorized error", async () => {
      global.fetch = createModernErrorFetchMock("Unauthorized", 401);

      const { result } = renderHook(() => useTransferInsert(), {
        wrapper: createWrapper(),
      });

      await expect(
        result.current.mutateAsync({ payload: createTestTransfer() }),
      ).rejects.toThrow("Unauthorized");
    });

    it("should handle 403 Forbidden error", async () => {
      global.fetch = createModernErrorFetchMock("Forbidden", 403);

      const { result } = renderHook(() => useTransferInsert(), {
        wrapper: createWrapper(),
      });

      await expect(
        result.current.mutateAsync({ payload: createTestTransfer() }),
      ).rejects.toThrow("Forbidden");
    });

    it("should handle 409 Conflict error (duplicate transfer)", async () => {
      global.fetch = createModernErrorFetchMock(
        "Duplicate transfer found",
        409,
      );

      const { result } = renderHook(() => useTransferInsert(), {
        wrapper: createWrapper(),
      });

      await expect(
        result.current.mutateAsync({ payload: createTestTransfer() }),
      ).rejects.toThrow("Duplicate transfer found");
    });

    it("should handle 500 Internal Server Error", async () => {
      global.fetch = createModernErrorFetchMock("Internal server error", 500);

      const { result } = renderHook(() => useTransferInsert(), {
        wrapper: createWrapper(),
      });

      await expect(
        result.current.mutateAsync({ payload: createTestTransfer() }),
      ).rejects.toThrow("Internal server error");
    });

    it("should handle network errors", async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error("Network error"));

      const { result } = renderHook(() => useTransferInsert(), {
        wrapper: createWrapper(),
      });

      await expect(
        result.current.mutateAsync({ payload: createTestTransfer() }),
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

      const { result } = renderHook(() => useTransferInsert(), {
        wrapper: createWrapper(),
      });

      await expect(
        result.current.mutateAsync({ payload: createTestTransfer() }),
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

      const { result } = renderHook(() => useTransferInsert(), {
        wrapper: createWrapper(),
      });

      await expect(
        result.current.mutateAsync({ payload: createTestTransfer() }),
      ).rejects.toThrow("HTTP 500: Internal Server Error");
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
      expect(cacheData?.[0]).toStrictEqual(newTransfer); // New transfer prepended
      expect(cacheData?.[1]).toStrictEqual(existingTransfers[0]);
    });
  });
});
