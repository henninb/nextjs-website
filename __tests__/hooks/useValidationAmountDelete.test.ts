import React from "react";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { deleteValidationAmount } from "../../hooks/useValidationAmountDelete";
import useValidationAmountDelete from "../../hooks/useValidationAmountDelete";
import ValidationAmount from "../../model/ValidationAmount";
import { TransactionState } from "../../model/TransactionState";

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

const createTestValidationAmount = (
  overrides: Partial<ValidationAmount> = {},
): ValidationAmount => ({
  validationId: 1,
  validationDate: new Date("2024-01-01T00:00:00.000Z"),
  accountId: 100,
  amount: 1000.0,
  transactionState: "cleared" as TransactionState,
  activeStatus: true,
  dateAdded: new Date("2024-01-01T10:00:00.000Z"),
  dateUpdated: new Date("2024-01-01T10:00:00.000Z"),
  ...overrides,
});

describe("useValidationAmountDelete - deleteValidationAmount", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchWithErrorHandling.mockResolvedValue({ status: 204 } as Response);
    mockSanitizeNumericId.mockImplementation((value: number) => value);
  });

  describe("endpoint and sanitization", () => {
    it("should sanitize validationId before constructing endpoint", async () => {
      const payload = createTestValidationAmount({ validationId: 42 });

      await deleteValidationAmount(payload);

      expect(mockSanitizeNumericId).toHaveBeenCalledWith(42, "validationId");
    });

    it("should call fetchWithErrorHandling with correct DELETE endpoint", async () => {
      const payload = createTestValidationAmount({ validationId: 42 });

      await deleteValidationAmount(payload);

      expect(mockFetchWithErrorHandling).toHaveBeenCalledWith(
        "/api/validation/amount/42",
        { method: "DELETE" },
      );
    });

    it("should use sanitized ID in endpoint URL", async () => {
      mockSanitizeNumericId.mockReturnValue(99);
      const payload = createTestValidationAmount({ validationId: 99 });

      await deleteValidationAmount(payload);

      const [url] = mockFetchWithErrorHandling.mock.calls[0];
      expect(url).toBe("/api/validation/amount/99");
    });
  });

  describe("successful deletion", () => {
    it("should return void (undefined) on success", async () => {
      const payload = createTestValidationAmount();

      const result = await deleteValidationAmount(payload);

      expect(result).toBeUndefined();
    });

    it("should delete cleared validation amount", async () => {
      const payload = createTestValidationAmount({
        validationId: 10,
        transactionState: "cleared" as TransactionState,
      });

      await deleteValidationAmount(payload);

      expect(mockFetchWithErrorHandling).toHaveBeenCalledWith(
        "/api/validation/amount/10",
        expect.any(Object),
      );
    });

    it("should delete outstanding validation amount", async () => {
      const payload = createTestValidationAmount({
        validationId: 20,
        transactionState: "outstanding" as TransactionState,
      });

      await deleteValidationAmount(payload);

      expect(mockFetchWithErrorHandling).toHaveBeenCalledWith(
        "/api/validation/amount/20",
        expect.any(Object),
      );
    });

    it("should delete inactive validation amount", async () => {
      const payload = createTestValidationAmount({
        validationId: 5,
        activeStatus: false,
      });

      await deleteValidationAmount(payload);

      expect(mockFetchWithErrorHandling).toHaveBeenCalledWith(
        "/api/validation/amount/5",
        expect.any(Object),
      );
    });

    it("should delete validation amount with zero amount", async () => {
      const payload = createTestValidationAmount({ validationId: 3, amount: 0 });

      await deleteValidationAmount(payload);

      expect(mockFetchWithErrorHandling).toHaveBeenCalledWith(
        "/api/validation/amount/3",
        expect.any(Object),
      );
    });

    it("should delete validation amount with large ID", async () => {
      const payload = createTestValidationAmount({ validationId: 999999 });

      await deleteValidationAmount(payload);

      expect(mockFetchWithErrorHandling).toHaveBeenCalledWith(
        "/api/validation/amount/999999",
        expect.any(Object),
      );
    });
  });

  describe("error handling", () => {
    it("should propagate 404 not found error", async () => {
      const { FetchError } = jest.requireMock("../../utils/fetchUtils");
      mockFetchWithErrorHandling.mockRejectedValue(
        new FetchError("Validation amount not found", 404),
      );
      const payload = createTestValidationAmount();

      await expect(deleteValidationAmount(payload)).rejects.toThrow(
        "Validation amount not found",
      );
    });

    it("should propagate 400 bad request error", async () => {
      const { FetchError } = jest.requireMock("../../utils/fetchUtils");
      mockFetchWithErrorHandling.mockRejectedValue(
        new FetchError("Invalid request", 400),
      );
      const payload = createTestValidationAmount();

      await expect(deleteValidationAmount(payload)).rejects.toThrow(
        "Invalid request",
      );
    });

    it("should propagate 500 server error", async () => {
      const { FetchError } = jest.requireMock("../../utils/fetchUtils");
      mockFetchWithErrorHandling.mockRejectedValue(
        new FetchError("Internal server error", 500),
      );
      const payload = createTestValidationAmount();

      await expect(deleteValidationAmount(payload)).rejects.toThrow(
        "Internal server error",
      );
    });

    it("should propagate network errors", async () => {
      mockFetchWithErrorHandling.mockRejectedValue(
        new Error("Network request failed"),
      );
      const payload = createTestValidationAmount();

      await expect(deleteValidationAmount(payload)).rejects.toThrow(
        "Network request failed",
      );
    });

    it("should propagate 409 conflict error", async () => {
      const { FetchError } = jest.requireMock("../../utils/fetchUtils");
      mockFetchWithErrorHandling.mockRejectedValue(
        new FetchError("Cannot delete validation amount with dependencies", 409),
      );
      const payload = createTestValidationAmount();

      await expect(deleteValidationAmount(payload)).rejects.toThrow(
        "Cannot delete validation amount with dependencies",
      );
    });
  });

  describe("request format", () => {
    it("should use DELETE method", async () => {
      const payload = createTestValidationAmount();

      await deleteValidationAmount(payload);

      const [, options] = mockFetchWithErrorHandling.mock.calls[0];
      expect(options?.method).toBe("DELETE");
    });

    it("should not send a body in DELETE request", async () => {
      const payload = createTestValidationAmount();

      await deleteValidationAmount(payload);

      const [, options] = mockFetchWithErrorHandling.mock.calls[0];
      expect(options?.body).toBeUndefined();
    });
  });

  describe("various IDs", () => {
    it.each([1, 10, 100, 1000, 99999])(
      "should construct correct endpoint for ID %d",
      async (id) => {
        const payload = createTestValidationAmount({ validationId: id });

        await deleteValidationAmount(payload);

        expect(mockFetchWithErrorHandling).toHaveBeenCalledWith(
          `/api/validation/amount/${id}`,
          expect.any(Object),
        );
      },
    );
  });
});

// ---------------------------------------------------------------------------
// renderHook tests for useValidationAmountDelete default export
// ---------------------------------------------------------------------------

const createHookQueryClient = () =>
  new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

const createHookWrapper = (queryClient: QueryClient) =>
  function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  };

describe("useValidationAmountDelete hook - renderHook tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchWithErrorHandling.mockResolvedValue({ status: 204 } as Response);
    mockSanitizeNumericId.mockImplementation((value: number) => value);
  });

  it("onSuccess invalidates validationAmount queries", async () => {
    const queryClient = createHookQueryClient();
    const invalidateSpy = jest.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useValidationAmountDelete(), {
      wrapper: createHookWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync(createTestValidationAmount({ validationId: 42 }));
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["validationAmount"] }),
    );
  });

  it("onError puts mutation into error state", async () => {
    const queryClient = createHookQueryClient();
    const { FetchError } = jest.requireMock("../../utils/fetchUtils");
    mockFetchWithErrorHandling.mockRejectedValue(new FetchError("Delete failed", 400));

    const { result } = renderHook(() => useValidationAmountDelete(), {
      wrapper: createHookWrapper(queryClient),
    });

    await act(async () => {
      try {
        await result.current.mutateAsync(createTestValidationAmount());
      } catch {
        // expected
      }
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
