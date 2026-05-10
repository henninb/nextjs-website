import React from "react";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import useMedicalExpenseDelete, { deleteMedicalExpense } from "../../hooks/useMedicalExpenseDelete";
import { MedicalExpense, ClaimStatus } from "../../model/MedicalExpense";

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
    medicalExpense: jest.fn(() => ["medicalExpense"]),
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
const mockSanitizeNumericId = InputSanitizer.sanitizeNumericId as jest.MockedFunction<
  typeof InputSanitizer.sanitizeNumericId
>;

const createTestMedicalExpense = (
  overrides: Partial<MedicalExpense> = {},
): MedicalExpense => ({
  medicalExpenseId: 1,
  transactionId: 100,
  serviceDate: new Date("2024-01-15"),
  billedAmount: 500.0,
  insuranceDiscount: 50.0,
  insurancePaid: 300.0,
  patientResponsibility: 150.0,
  isOutOfNetwork: false,
  claimStatus: ClaimStatus.Approved,
  activeStatus: true,
  paidAmount: 0,
  ...overrides,
});

describe("useMedicalExpenseDelete - deleteMedicalExpense", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchWithErrorHandling.mockResolvedValue({ status: 204 } as Response);
    mockSanitizeNumericId.mockImplementation((value: number) => value);
  });

  describe("successful deletion", () => {
    it("should call fetchWithErrorHandling with correct DELETE endpoint", async () => {
      const expense = createTestMedicalExpense({ medicalExpenseId: 42 });

      await deleteMedicalExpense(expense);

      expect(mockFetchWithErrorHandling).toHaveBeenCalledWith(
        "/api/medical-expenses/42",
        { method: "DELETE" },
      );
    });

    it("should sanitize medicalExpenseId before constructing endpoint", async () => {
      const expense = createTestMedicalExpense({ medicalExpenseId: 99 });

      await deleteMedicalExpense(expense);

      expect(mockSanitizeNumericId).toHaveBeenCalledWith(99, "medicalExpenseId");
    });

    it("should return void (undefined) on success", async () => {
      const expense = createTestMedicalExpense();

      const result = await deleteMedicalExpense(expense);

      expect(result).toBeUndefined();
    });

    it("should use sanitized ID in endpoint URL", async () => {
      mockSanitizeNumericId.mockReturnValue(15);
      const expense = createTestMedicalExpense({ medicalExpenseId: 15 });

      await deleteMedicalExpense(expense);

      expect(mockFetchWithErrorHandling).toHaveBeenCalledWith(
        "/api/medical-expenses/15",
        expect.any(Object),
      );
    });

    it("should delete approved expense", async () => {
      const expense = createTestMedicalExpense({
        medicalExpenseId: 5,
        claimStatus: ClaimStatus.Approved,
      });

      await deleteMedicalExpense(expense);

      expect(mockFetchWithErrorHandling).toHaveBeenCalledWith(
        "/api/medical-expenses/5",
        expect.any(Object),
      );
    });

    it("should delete denied expense", async () => {
      const expense = createTestMedicalExpense({
        medicalExpenseId: 6,
        claimStatus: ClaimStatus.Denied,
      });

      await deleteMedicalExpense(expense);

      expect(mockFetchWithErrorHandling).toHaveBeenCalledWith(
        "/api/medical-expenses/6",
        expect.any(Object),
      );
    });

    it("should delete out-of-network expense", async () => {
      const expense = createTestMedicalExpense({
        medicalExpenseId: 7,
        isOutOfNetwork: true,
      });

      await deleteMedicalExpense(expense);

      expect(mockFetchWithErrorHandling).toHaveBeenCalledWith(
        "/api/medical-expenses/7",
        expect.any(Object),
      );
    });

    it("should delete inactive expense", async () => {
      const expense = createTestMedicalExpense({
        medicalExpenseId: 8,
        activeStatus: false,
      });

      await deleteMedicalExpense(expense);

      expect(mockFetchWithErrorHandling).toHaveBeenCalledWith(
        "/api/medical-expenses/8",
        expect.any(Object),
      );
    });
  });

  describe("error handling", () => {
    it("should propagate 404 not found error", async () => {
      const { FetchError } = jest.requireMock("../../utils/fetchUtils");
      mockFetchWithErrorHandling.mockRejectedValue(
        new FetchError("Medical expense not found", 404),
      );
      const expense = createTestMedicalExpense();

      await expect(deleteMedicalExpense(expense)).rejects.toThrow(
        "Medical expense not found",
      );
    });

    it("should propagate 500 server error", async () => {
      const { FetchError } = jest.requireMock("../../utils/fetchUtils");
      mockFetchWithErrorHandling.mockRejectedValue(
        new FetchError("Internal server error", 500),
      );
      const expense = createTestMedicalExpense();

      await expect(deleteMedicalExpense(expense)).rejects.toThrow(
        "Internal server error",
      );
    });

    it("should propagate network errors", async () => {
      mockFetchWithErrorHandling.mockRejectedValue(
        new Error("Network request failed"),
      );
      const expense = createTestMedicalExpense();

      await expect(deleteMedicalExpense(expense)).rejects.toThrow(
        "Network request failed",
      );
    });

    it("should propagate 401 unauthorized error", async () => {
      const { FetchError } = jest.requireMock("../../utils/fetchUtils");
      mockFetchWithErrorHandling.mockRejectedValue(
        new FetchError("Unauthorized", 401),
      );
      const expense = createTestMedicalExpense();

      await expect(deleteMedicalExpense(expense)).rejects.toThrow("Unauthorized");
    });
  });

  describe("request format", () => {
    it("should use DELETE method", async () => {
      const expense = createTestMedicalExpense();

      await deleteMedicalExpense(expense);

      const [, options] = mockFetchWithErrorHandling.mock.calls[0];
      expect(options?.method).toBe("DELETE");
    });

    it("should not send a body in the DELETE request", async () => {
      const expense = createTestMedicalExpense();

      await deleteMedicalExpense(expense);

      const [, options] = mockFetchWithErrorHandling.mock.calls[0];
      expect(options?.body).toBeUndefined();
    });
  });

  describe("different IDs", () => {
    it.each([1, 5, 50, 500, 9999])(
      "should construct correct endpoint for ID %d",
      async (id) => {
        const expense = createTestMedicalExpense({ medicalExpenseId: id });

        await deleteMedicalExpense(expense);

        expect(mockFetchWithErrorHandling).toHaveBeenCalledWith(
          `/api/medical-expenses/${id}`,
          expect.any(Object),
        );
      },
    );
  });
});

// ---------------------------------------------------------------------------
// renderHook tests for useMedicalExpenseDelete default export
// ---------------------------------------------------------------------------

const createMedExpDeleteQueryClient = () =>
  new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

const createMedExpDeleteWrapper = (queryClient: QueryClient) =>
  function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  };

describe("useMedicalExpenseDelete hook", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchWithErrorHandling.mockResolvedValue({ status: 204 } as Response);
    mockSanitizeNumericId.mockImplementation((value: number) => value);
  });

  it("onSuccess invalidates medicalExpense queries", async () => {
    const queryClient = createMedExpDeleteQueryClient();
    const expense = createTestMedicalExpense({ medicalExpenseId: 42 });
    const invalidateSpy = jest.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useMedicalExpenseDelete(), {
      wrapper: createMedExpDeleteWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync({ oldRow: expense });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["medicalExpense"] }),
    );
  });

  it("onError puts mutation into error state", async () => {
    const queryClient = createMedExpDeleteQueryClient();
    mockFetchWithErrorHandling.mockRejectedValue(new Error("Delete failed"));

    const { result } = renderHook(() => useMedicalExpenseDelete(), {
      wrapper: createMedExpDeleteWrapper(queryClient),
    });

    const expense = createTestMedicalExpense();

    await act(async () => {
      try {
        await result.current.mutateAsync({ oldRow: expense });
      } catch {
        // expected
      }
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
