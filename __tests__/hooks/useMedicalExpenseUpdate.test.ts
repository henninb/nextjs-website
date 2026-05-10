import React from "react";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MedicalExpense, ClaimStatus } from "../../model/MedicalExpense";

jest.mock("../../utils/csrf", () => ({
  getCsrfHeaders: jest.fn().mockResolvedValue({}),
  getCsrfToken: jest.fn().mockResolvedValue(null),
  fetchCsrfToken: jest.fn().mockResolvedValue(undefined),
  clearCsrfToken: jest.fn(),
  initCsrfToken: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("../../utils/logger", () => ({
  createHookLogger: jest.fn(() => ({
    debug: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
  })),
  logger: {
    debug: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
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

import { updateMedicalExpense } from "../../hooks/useMedicalExpenseUpdate";
import useMedicalExpenseUpdate from "../../hooks/useMedicalExpenseUpdate";
import { InputSanitizer } from "../../utils/validation/sanitization";

const mockSanitizeNumericId = InputSanitizer.sanitizeNumericId as jest.MockedFunction<
  typeof InputSanitizer.sanitizeNumericId
>;

const createTestMedicalExpense = (
  overrides: Partial<MedicalExpense> = {},
): MedicalExpense => ({
  medicalExpenseId: 1,
  transactionId: 100,
  providerId: 1,
  familyMemberId: 1,
  serviceDate: new Date("2024-01-15"),
  serviceDescription: "Annual physical exam",
  procedureCode: "99213",
  diagnosisCode: "Z00.00",
  billedAmount: 250.0,
  insuranceDiscount: 50.0,
  insurancePaid: 150.0,
  patientResponsibility: 50.0,
  isOutOfNetwork: false,
  claimNumber: "CL123456",
  claimStatus: ClaimStatus.Submitted,
  activeStatus: true,
  paidAmount: 0,
  ...overrides,
});

describe("updateMedicalExpense", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSanitizeNumericId.mockImplementation((value: number) => value);
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("calls PUT /api/medical-expenses/{id} with update data", async () => {
    const oldExpense = createTestMedicalExpense({ medicalExpenseId: 42 });
    const newExpense = createTestMedicalExpense({ medicalExpenseId: 42 });
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue(newExpense),
    });

    const result = await updateMedicalExpense(newExpense, oldExpense);

    expect(result).toStrictEqual(newExpense);
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/medical-expenses/42",
      expect.objectContaining({ method: "PUT" }),
    );
  });

  it("sanitizes medicalExpenseId before constructing endpoint", async () => {
    const expense = createTestMedicalExpense({ medicalExpenseId: 5 });
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue(expense),
    });

    await updateMedicalExpense(expense, expense);

    expect(mockSanitizeNumericId).toHaveBeenCalledWith(5, "medicalExpenseId");
  });

  it("uses sanitized ID in endpoint URL", async () => {
    mockSanitizeNumericId.mockReturnValue(99);
    const expense = createTestMedicalExpense({ medicalExpenseId: 99 });
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue(expense),
    });

    await updateMedicalExpense(expense, expense);

    const [url] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toBe("/api/medical-expenses/99");
  });

  it("throws when financial validation fails (totalAllocated > billedAmount)", async () => {
    const fetchSpy = jest.fn();
    global.fetch = fetchSpy;
    const invalidExpense = createTestMedicalExpense({
      billedAmount: 100,
      insuranceDiscount: 50,
      insurancePaid: 100,
      patientResponsibility: 50,
    });

    await expect(
      updateMedicalExpense(invalidExpense, createTestMedicalExpense()),
    ).rejects.toThrow("Total allocated amount");
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("propagates server errors", async () => {
    const expense = createTestMedicalExpense();
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: jest.fn().mockResolvedValue({ response: "Update failed" }),
    });

    await expect(updateMedicalExpense(expense, expense)).rejects.toThrow();
  });

  it("propagates network errors", async () => {
    const expense = createTestMedicalExpense();
    global.fetch = jest.fn().mockRejectedValue(new Error("Network error"));

    await expect(updateMedicalExpense(expense, expense)).rejects.toThrow(
      "Network error",
    );
  });

  it("sends PUT method in request", async () => {
    const expense = createTestMedicalExpense();
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue(expense),
    });

    await updateMedicalExpense(expense, expense);

    const [, options] = (global.fetch as jest.Mock).mock.calls[0];
    expect(options.method).toBe("PUT");
  });
});

// ---------------------------------------------------------------------------
// renderHook tests for useMedicalExpenseUpdate default export
// ---------------------------------------------------------------------------

const createHookQueryClient = () =>
  new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

const createHookWrapper = (queryClient: QueryClient) =>
  function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  };

describe("useMedicalExpenseUpdate hook - renderHook tests", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSanitizeNumericId.mockImplementation((value: number) => value);
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("onSuccess invalidates medicalExpense queries", async () => {
    const queryClient = createHookQueryClient();
    const expense = createTestMedicalExpense();
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue(expense),
    });
    const invalidateSpy = jest.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useMedicalExpenseUpdate(), {
      wrapper: createHookWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync({ newRow: expense, oldRow: expense });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["medicalExpense"] }),
    );
  });

  it("onError puts mutation into error state", async () => {
    const queryClient = createHookQueryClient();
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: jest.fn().mockResolvedValue({ response: "Update failed" }),
    });

    const { result } = renderHook(() => useMedicalExpenseUpdate(), {
      wrapper: createHookWrapper(queryClient),
    });

    const expense = createTestMedicalExpense();

    await act(async () => {
      try {
        await result.current.mutateAsync({ newRow: expense, oldRow: expense });
      } catch {
        // expected
      }
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
