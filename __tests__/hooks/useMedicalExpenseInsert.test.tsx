import React, { ReactNode } from "react";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import useMedicalExpenseInsert from "../../hooks/useMedicalExpenseInsert";
import {
  MedicalExpense,
  MedicalExpenseCreateRequest,
  ClaimStatus,
} from "../../model/MedicalExpense";

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

// Mock fetch globally
global.fetch = jest.fn();

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        retryOnMount: false,
        refetchOnMount: false,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
      },
      mutations: {
        retry: false,
      },
    },
  });

const createWrapper =
  (queryClient: QueryClient) =>
  ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

describe("useMedicalExpenseInsert", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    jest.clearAllMocks();
  });

  const mockCreateRequest: MedicalExpenseCreateRequest = {
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
  };

  const mockCreatedExpense: MedicalExpense = {
    medicalExpenseId: 1,
    ...mockCreateRequest,
    activeStatus: true,
    dateAdded: new Date("2024-01-15T10:00:00Z"),
    dateUpdated: new Date("2024-01-15T10:00:00Z"),
  };

  it("should create medical expense successfully", async () => {
    const mockFetch = fetch as jest.MockedFunction<typeof fetch>;
    mockFetch.mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => mockCreatedExpense,
    } as Response);

    const wrapper = createWrapper(queryClient);
    const { result } = renderHook(() => useMedicalExpenseInsert(), { wrapper });

    let createdExpense: MedicalExpense | undefined;

    await act(async () => {
      createdExpense = await result.current.mutateAsync({
        payload: mockCreateRequest,
      });
    });

    expect(createdExpense).toEqual(mockCreatedExpense);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.isError).toBe(false);
    expect(result.current.isPending).toBe(false);

    expect(mockFetch).toHaveBeenCalledWith(
      "/api/medical-expenses",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "Content-Type": "application/json",
        }),
        body: JSON.stringify(mockCreateRequest),
      }),
    );
  });

  it("should create minimal medical expense successfully", async () => {
    const minimalRequest: MedicalExpenseCreateRequest = {
      transactionId: 101,
      serviceDate: new Date("2024-02-01"),
      billedAmount: 100.0,
    };

    const minimalExpense: MedicalExpense = {
      medicalExpenseId: 2,
      ...minimalRequest,
      insuranceDiscount: 0,
      insurancePaid: 0,
      patientResponsibility: 100.0,
      isOutOfNetwork: false,
      claimStatus: ClaimStatus.Submitted,
      activeStatus: true,
    };

    const mockFetch = fetch as jest.MockedFunction<typeof fetch>;
    mockFetch.mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => minimalExpense,
    } as Response);

    const wrapper = createWrapper(queryClient);
    const { result } = renderHook(() => useMedicalExpenseInsert(), { wrapper });

    let createdExpense: MedicalExpense | undefined;

    await act(async () => {
      createdExpense = await result.current.mutateAsync({
        payload: minimalRequest,
      });
    });

    expect(createdExpense).toEqual(minimalExpense);
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/medical-expenses",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "Content-Type": "application/json",
        }),
        body: JSON.stringify(minimalRequest),
      }),
    );
  });

  it("should handle validation errors (400)", async () => {
    const mockFetch = fetch as jest.MockedFunction<typeof fetch>;
    mockFetch.mockResolvedValue({
      ok: false,
      status: 400,
      statusText: "Bad Request",
      json: async () => ({
        message: "Validation failed: Transaction ID is required",
      }),
    } as Response);

    const wrapper = createWrapper(queryClient);
    const { result } = renderHook(() => useMedicalExpenseInsert(), { wrapper });

    let error: Error | undefined;

    await act(async () => {
      try {
        await result.current.mutateAsync({ payload: mockCreateRequest });
      } catch (e) {
        error = e as Error;
      }
    });

    expect(error).toBeDefined();
    expect(error?.message).toContain("Validation failed");

    await waitFor(
      () => {
        expect(result.current.isError).toBe(true);
      },
      { timeout: 5000 },
    );

    expect(result.current.isSuccess).toBe(false);
  });

  it("should handle conflict errors (409)", async () => {
    const mockFetch = fetch as jest.MockedFunction<typeof fetch>;
    mockFetch.mockResolvedValue({
      ok: false,
      status: 409,
      statusText: "Conflict",
      json: async () => ({ message: "Duplicate medical expense found" }),
    } as Response);

    const wrapper = createWrapper(queryClient);
    const { result } = renderHook(() => useMedicalExpenseInsert(), { wrapper });

    let error: Error | undefined;

    await act(async () => {
      try {
        await result.current.mutateAsync({ payload: mockCreateRequest });
      } catch (e) {
        error = e as Error;
      }
    });

    expect(error).toBeDefined();
    expect(error?.message).toContain("Duplicate medical expense");

    await waitFor(
      () => {
        expect(result.current.isError).toBe(true);
      },
      { timeout: 5000 },
    );
  });

  it("should handle server errors (500)", async () => {
    const mockFetch = fetch as jest.MockedFunction<typeof fetch>;
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
      json: async () => ({ message: "Internal server error" }),
    } as Response);

    const wrapper = createWrapper(queryClient);
    const { result } = renderHook(() => useMedicalExpenseInsert(), { wrapper });

    let error: Error | undefined;

    await act(async () => {
      try {
        await result.current.mutateAsync({ payload: mockCreateRequest });
      } catch (e) {
        error = e as Error;
      }
    });

    expect(error).toBeDefined();
    expect(error?.message).toContain("Internal server error");
  });

  it("should handle network errors", async () => {
    const mockFetch = fetch as jest.MockedFunction<typeof fetch>;
    mockFetch.mockRejectedValue(new Error("Network error"));

    const wrapper = createWrapper(queryClient);
    const { result } = renderHook(() => useMedicalExpenseInsert(), { wrapper });

    let error: Error | undefined;

    await act(async () => {
      try {
        await result.current.mutateAsync({ payload: mockCreateRequest });
      } catch (e) {
        error = e as Error;
      }
    });

    expect(error).toBeDefined();
    expect(error?.message).toContain("Network error");
  });

  it("should invalidate medical expenses query on success", async () => {
    const mockFetch = fetch as jest.MockedFunction<typeof fetch>;
    mockFetch.mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => mockCreatedExpense,
    } as Response);

    // Pre-populate cache with some data
    queryClient.setQueryData(["medicalExpense"], []);

    const invalidateQueriesSpy = jest.spyOn(queryClient, "invalidateQueries");

    const wrapper = createWrapper(queryClient);
    const { result } = renderHook(() => useMedicalExpenseInsert(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ payload: mockCreateRequest });
    });

    expect(invalidateQueriesSpy).toHaveBeenCalledWith({
      queryKey: ["medicalExpense"],
    });
  });

  it("should not invalidate queries on error", async () => {
    const mockFetch = fetch as jest.MockedFunction<typeof fetch>;
    mockFetch.mockResolvedValue({
      ok: false,
      status: 400,
      statusText: "Bad Request",
    } as Response);

    const invalidateQueriesSpy = jest.spyOn(queryClient, "invalidateQueries");

    const wrapper = createWrapper(queryClient);
    const { result } = renderHook(() => useMedicalExpenseInsert(), { wrapper });

    await act(async () => {
      try {
        await result.current.mutateAsync({ payload: mockCreateRequest });
      } catch (e) {
        // Expected error
      }
    });

    expect(invalidateQueriesSpy).not.toHaveBeenCalled();
  });

  it("should handle malformed JSON response", async () => {
    const mockFetch = fetch as jest.MockedFunction<typeof fetch>;
    mockFetch.mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => {
        throw new Error("Invalid JSON");
      },
    } as Response);

    const wrapper = createWrapper(queryClient);
    const { result } = renderHook(() => useMedicalExpenseInsert(), { wrapper });

    let error: Error | undefined;

    await act(async () => {
      try {
        await result.current.mutateAsync({ payload: mockCreateRequest });
      } catch (e) {
        error = e as Error;
      }
    });

    expect(error?.message).toBe("Response parsing failed: Invalid JSON");
  });

  it("should handle unauthorized errors (401)", async () => {
    const mockFetch = fetch as jest.MockedFunction<typeof fetch>;
    mockFetch.mockResolvedValue({
      ok: false,
      status: 401,
      statusText: "Unauthorized",
      json: async () => ({ message: "Unauthorized" }),
    } as Response);

    const wrapper = createWrapper(queryClient);
    const { result } = renderHook(() => useMedicalExpenseInsert(), { wrapper });

    let error: Error | undefined;

    await act(async () => {
      try {
        await result.current.mutateAsync({ payload: mockCreateRequest });
      } catch (e) {
        error = e as Error;
      }
    });

    expect(error?.message).toContain("Unauthorized");
  });
});
