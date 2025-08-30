import React, { ReactNode } from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import useMedicalExpenseFetch from "../../hooks/useMedicalExpenseFetch";
import { MedicalExpense, ClaimStatus } from "../../model/MedicalExpense";

// Mock fetch globally
global.fetch = jest.fn();

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

const createWrapper =
  (queryClient: QueryClient) =>
  ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

describe("useMedicalExpenseFetch", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    jest.clearAllMocks();
  });

  const mockMedicalExpenses: MedicalExpense[] = [
    {
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
      paidDate: null,
      isOutOfNetwork: false,
      claimNumber: "CL123456",
      claimStatus: ClaimStatus.Approved,
      activeStatus: true,
      dateAdded: new Date("2024-01-15T10:00:00Z"),
      dateUpdated: new Date("2024-01-15T10:00:00Z"),
    },
    {
      medicalExpenseId: 2,
      transactionId: 101,
      serviceDate: new Date("2024-02-01"),
      serviceDescription: "Specialist consultation",
      billedAmount: 300.0,
      insuranceDiscount: 0,
      insurancePaid: 240.0,
      patientResponsibility: 60.0,
      isOutOfNetwork: true,
      claimStatus: ClaimStatus.Paid,
      activeStatus: true,
    },
  ];

  it("should fetch medical expenses successfully", async () => {
    const mockFetch = fetch as jest.MockedFunction<typeof fetch>;
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockMedicalExpenses,
    } as Response);

    const wrapper = createWrapper(queryClient);
    const { result } = renderHook(() => useMedicalExpenseFetch(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockMedicalExpenses);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(null);
    expect(mockFetch).toHaveBeenCalledWith("/api/medical-expenses");
  });

  it("should handle empty medical expenses response", async () => {
    const mockFetch = fetch as jest.MockedFunction<typeof fetch>;
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    } as Response);

    const wrapper = createWrapper(queryClient);
    const { result } = renderHook(() => useMedicalExpenseFetch(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it("should handle fetch error", async () => {
    const mockFetch = fetch as jest.MockedFunction<typeof fetch>;
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
    } as Response);

    const wrapper = createWrapper(queryClient);
    const { result } = renderHook(() => useMedicalExpenseFetch(), { wrapper });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.data).toBeUndefined();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeTruthy();
    expect(result.current.error?.message).toBe(
      "Failed to fetch medical expenses",
    );
  });

  it("should handle network error", async () => {
    const mockFetch = fetch as jest.MockedFunction<typeof fetch>;
    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    const wrapper = createWrapper(queryClient);
    const { result } = renderHook(() => useMedicalExpenseFetch(), { wrapper });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.data).toBeUndefined();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeTruthy();
    expect(result.current.error?.message).toBe("Network error");
  });

  it("should have correct query key", async () => {
    const mockFetch = fetch as jest.MockedFunction<typeof fetch>;
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockMedicalExpenses,
    } as Response);

    const wrapper = createWrapper(queryClient);
    renderHook(() => useMedicalExpenseFetch(), { wrapper });

    await waitFor(() => {
      const queries = queryClient.getQueriesData(["medicalExpenses"]);
      expect(queries).toHaveLength(1);
    });
  });

  it("should handle malformed JSON response", async () => {
    const mockFetch = fetch as jest.MockedFunction<typeof fetch>;
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => {
        throw new Error("Invalid JSON");
      },
    } as Response);

    const wrapper = createWrapper(queryClient);
    const { result } = renderHook(() => useMedicalExpenseFetch(), { wrapper });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error?.message).toBe("Invalid JSON");
  });

  it("should handle 401 unauthorized error", async () => {
    const mockFetch = fetch as jest.MockedFunction<typeof fetch>;
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: "Unauthorized",
    } as Response);

    const wrapper = createWrapper(queryClient);
    const { result } = renderHook(() => useMedicalExpenseFetch(), { wrapper });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error?.message).toBe(
      "Failed to fetch medical expenses",
    );
  });

  it("should handle 404 not found error", async () => {
    const mockFetch = fetch as jest.MockedFunction<typeof fetch>;
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: "Not Found",
    } as Response);

    const wrapper = createWrapper(queryClient);
    const { result } = renderHook(() => useMedicalExpenseFetch(), { wrapper });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error?.message).toBe(
      "Failed to fetch medical expenses",
    );
  });

  it("should cache data correctly", async () => {
    const mockFetch = fetch as jest.MockedFunction<typeof fetch>;
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockMedicalExpenses,
    } as Response);

    const wrapper = createWrapper(queryClient);

    // First render
    const { result: result1 } = renderHook(() => useMedicalExpenseFetch(), {
      wrapper,
    });

    await waitFor(() => {
      expect(result1.current.isSuccess).toBe(true);
    });

    // Second render should use cached data
    const { result: result2 } = renderHook(() => useMedicalExpenseFetch(), {
      wrapper,
    });

    expect(result2.current.data).toEqual(mockMedicalExpenses);
    expect(result2.current.isLoading).toBe(false);

    // Should only call fetch once due to caching
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});
