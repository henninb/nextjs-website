import React, { ReactNode } from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import useFamilyMemberFetch from "../../hooks/useFamilyMemberFetch";
import { FamilyMember, FamilyRelationship } from "../../model/FamilyMember";

// Mock fetch globally
global.fetch = jest.fn();

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

describe("useFamilyMemberFetch", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    jest.clearAllMocks();
  });

  const mockFamilyMembers: FamilyMember[] = [
    {
      familyMemberId: 1,
      owner: "testuser",
      memberName: "John Doe",
      relationship: FamilyRelationship.Self,
      dateOfBirth: new Date("1985-06-15"),
      insuranceMemberId: "INS123456",
      ssnLastFour: "1234",
      medicalRecordNumber: "MRN789012",
      activeStatus: true,
      dateAdded: new Date("2024-01-15T10:00:00Z"),
      dateUpdated: new Date("2024-01-15T10:00:00Z"),
    },
    {
      familyMemberId: 2,
      owner: "testuser",
      memberName: "Jane Doe",
      relationship: FamilyRelationship.Spouse,
      dateOfBirth: new Date("1987-08-20"),
      insuranceMemberId: "INS123457",
      activeStatus: true,
      dateAdded: new Date("2024-01-15T10:00:00Z"),
      dateUpdated: new Date("2024-01-15T10:00:00Z"),
    },
    {
      familyMemberId: 3,
      owner: "testuser",
      memberName: "Child Doe",
      relationship: FamilyRelationship.Child,
      dateOfBirth: new Date("2010-03-10"),
      activeStatus: true,
      dateAdded: new Date("2024-01-15T10:00:00Z"),
      dateUpdated: new Date("2024-01-15T10:00:00Z"),
    },
  ];

  it("should fetch family members successfully", async () => {
    const mockFetch = fetch as jest.MockedFunction<typeof fetch>;
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockFamilyMembers,
    } as Response);

    const wrapper = createWrapper(queryClient);
    const { result } = renderHook(() => useFamilyMemberFetch(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockFamilyMembers);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(null);
    expect(mockFetch).toHaveBeenCalledWith("/api/family-members/active", {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });
  });

  it("should handle empty family members response", async () => {
    const mockFetch = fetch as jest.MockedFunction<typeof fetch>;
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    } as Response);

    const wrapper = createWrapper(queryClient);
    const { result } = renderHook(() => useFamilyMemberFetch(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it("should handle fetch error", async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
      json: async () => ({ message: "Internal server error" }),
    } as Response);

    const wrapper = createWrapper(queryClient);
    const { result } = renderHook(() => useFamilyMemberFetch(), { wrapper });

    await waitFor(
      () => {
        expect(result.current.isError).toBe(true);
      },
      { timeout: 5000 },
    );

    expect(result.current.data).toBeUndefined();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeTruthy();
    expect(result.current.error?.message).toContain("HTTP error! Status: 500");
  });

  it("should handle network error", async () => {
    (fetch as jest.Mock).mockRejectedValue(new Error("Network error"));

    const wrapper = createWrapper(queryClient);
    const { result } = renderHook(() => useFamilyMemberFetch(), { wrapper });

    await waitFor(
      () => {
        expect(result.current.isError).toBe(true);
      },
      { timeout: 5000 },
    );

    expect(result.current.data).toBeUndefined();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeTruthy();
    expect(result.current.error?.message).toBe("Network error");
  });

  it("should have correct query key", async () => {
    const mockFetch = fetch as jest.MockedFunction<typeof fetch>;
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockFamilyMembers,
    } as Response);

    const wrapper = createWrapper(queryClient);
    renderHook(() => useFamilyMemberFetch(), { wrapper });

    await waitFor(() => {
      const queries = queryClient.getQueriesData(["familyMembers"]);
      expect(queries).toHaveLength(1);
    });
  });

  it("should handle 401 unauthorized error", async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 401,
      statusText: "Unauthorized",
      json: async () => ({ message: "Unauthorized" }),
    } as Response);

    const wrapper = createWrapper(queryClient);
    const { result } = renderHook(() => useFamilyMemberFetch(), { wrapper });

    await waitFor(
      () => {
        expect(result.current.isError).toBe(true);
      },
      { timeout: 5000 },
    );

    expect(result.current.error?.message).toContain("HTTP error! Status: 401");
  });

  it("should handle malformed JSON response", async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockRejectedValue(new Error("Invalid JSON")),
    } as Response);

    const wrapper = createWrapper(queryClient);
    const { result } = renderHook(() => useFamilyMemberFetch(), { wrapper });

    await waitFor(
      () => {
        expect(result.current.isError).toBe(true);
      },
      { timeout: 5000 },
    );

    expect(result.current.error?.message).toBe("Invalid JSON");
  });

  it("should cache data correctly", async () => {
    const mockFetch = fetch as jest.MockedFunction<typeof fetch>;
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockFamilyMembers,
    } as Response);

    const wrapper = createWrapper(queryClient);

    // First render
    const { result: result1 } = renderHook(() => useFamilyMemberFetch(), {
      wrapper,
    });

    await waitFor(() => {
      expect(result1.current.isSuccess).toBe(true);
    });

    // Second render should use cached data
    const { result: result2 } = renderHook(() => useFamilyMemberFetch(), {
      wrapper,
    });

    expect(result2.current.data).toEqual(mockFamilyMembers);
    expect(result2.current.isLoading).toBe(false);

    // Should only call fetch once due to caching
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});
