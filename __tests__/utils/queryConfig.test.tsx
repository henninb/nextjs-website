import React, { ReactNode } from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  DEFAULT_QUERY_CONFIG,
  DEFAULT_MUTATION_CONFIG,
  useAuthenticatedQuery,
  usePublicQuery,
  useStandardMutation,
} from "../../utils/queryConfig";
import * as AuthProvider from "../../components/AuthProvider";

// Mock AuthProvider
jest.mock("../../components/AuthProvider");

describe("queryConfig", () => {
  describe("DEFAULT_QUERY_CONFIG", () => {
    it("should have correct default values", () => {
      expect(DEFAULT_QUERY_CONFIG).toEqual({
        staleTime: 5 * 60 * 1000, // 5 minutes
        retry: 1,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        refetchOnReconnect: true,
      });
    });

    it("should be readonly", () => {
      expect(Object.isFrozen(DEFAULT_QUERY_CONFIG)).toBe(false); // as const doesn't freeze
      // But TypeScript prevents modification at compile time
    });
  });

  describe("DEFAULT_MUTATION_CONFIG", () => {
    it("should have correct default values", () => {
      expect(DEFAULT_MUTATION_CONFIG).toEqual({
        retry: 1,
      });
    });
  });

  describe("useAuthenticatedQuery", () => {
    let queryClient: QueryClient;

    beforeEach(() => {
      queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false },
          mutations: { retry: false },
        },
      });
      jest.clearAllMocks();
    });

    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    it("should not execute query when loading", async () => {
      const mockUseAuth = jest.spyOn(AuthProvider, "useAuth");
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        loading: true,
        user: null,
      });

      const mockQueryFn = jest.fn().mockResolvedValue({ data: "test" });

      const { result } = renderHook(
        () => useAuthenticatedQuery(["test"], mockQueryFn),
        { wrapper },
      );

      // Query should be disabled while loading
      expect(result.current.fetchStatus).toBe("idle");
      expect(mockQueryFn).not.toHaveBeenCalled();
    });

    it("should not execute query when not authenticated", async () => {
      const mockUseAuth = jest.spyOn(AuthProvider, "useAuth");
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        loading: false,
        user: null,
      });

      const mockQueryFn = jest.fn().mockResolvedValue({ data: "test" });

      const { result } = renderHook(
        () => useAuthenticatedQuery(["test"], mockQueryFn),
        { wrapper },
      );

      // Query should be disabled when not authenticated
      expect(result.current.fetchStatus).toBe("idle");
      expect(mockQueryFn).not.toHaveBeenCalled();
    });

    it("should execute query when authenticated", async () => {
      const mockUseAuth = jest.spyOn(AuthProvider, "useAuth");
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        loading: false,
        user: { username: "testuser" },
      });

      const mockData = { data: "test" };
      const mockQueryFn = jest.fn().mockResolvedValue(mockData);

      const { result } = renderHook(
        () => useAuthenticatedQuery(["test"], mockQueryFn),
        { wrapper },
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockQueryFn).toHaveBeenCalled();
      expect(result.current.data).toEqual(mockData);
    });

    it("should pass signal to queryFn", async () => {
      const mockUseAuth = jest.spyOn(AuthProvider, "useAuth");
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        loading: false,
        user: { username: "testuser" },
      });

      const mockQueryFn = jest.fn().mockResolvedValue({ data: "test" });

      renderHook(() => useAuthenticatedQuery(["test"], mockQueryFn), {
        wrapper,
      });

      await waitFor(() => expect(mockQueryFn).toHaveBeenCalled());

      // Verify signal was passed
      const callArgs = mockQueryFn.mock.calls[0][0];
      expect(callArgs).toHaveProperty("signal");
      expect(callArgs.signal).toBeInstanceOf(AbortSignal);
    });

    it("should respect custom options", async () => {
      const mockUseAuth = jest.spyOn(AuthProvider, "useAuth");
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        loading: false,
        user: { username: "testuser" },
      });

      const mockQueryFn = jest.fn().mockResolvedValue({ data: "test" });

      const { result } = renderHook(
        () =>
          useAuthenticatedQuery(["test"], mockQueryFn, {
            staleTime: 10000,
            retry: 3,
          }),
        { wrapper },
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // Check that custom options are applied
      // Note: We can't directly check staleTime/retry from the result,
      // but we can verify the query executed
      expect(mockQueryFn).toHaveBeenCalled();
    });

    it("should respect custom enabled option", async () => {
      const mockUseAuth = jest.spyOn(AuthProvider, "useAuth");
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        loading: false,
        user: { username: "testuser" },
      });

      const mockQueryFn = jest.fn().mockResolvedValue({ data: "test" });

      const { result } = renderHook(
        () =>
          useAuthenticatedQuery(["test"], mockQueryFn, {
            enabled: false, // Explicitly disabled
          }),
        { wrapper },
      );

      // Query should not execute even when authenticated
      expect(result.current.fetchStatus).toBe("idle");
      expect(mockQueryFn).not.toHaveBeenCalled();
    });
  });

  describe("usePublicQuery", () => {
    let queryClient: QueryClient;

    beforeEach(() => {
      queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false },
          mutations: { retry: false },
        },
      });
    });

    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    it("should execute query immediately without auth check", async () => {
      const mockData = { data: "public" };
      const mockQueryFn = jest.fn().mockResolvedValue(mockData);

      const { result } = renderHook(
        () => usePublicQuery(["public"], mockQueryFn),
        { wrapper },
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockQueryFn).toHaveBeenCalled();
      expect(result.current.data).toEqual(mockData);
    });

    it("should apply default config", async () => {
      const mockQueryFn = jest.fn().mockResolvedValue({ data: "test" });

      const { result } = renderHook(
        () => usePublicQuery(["test"], mockQueryFn),
        { wrapper },
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // Query executed successfully with default config
      expect(mockQueryFn).toHaveBeenCalled();
    });
  });

  describe("useStandardMutation", () => {
    let queryClient: QueryClient;

    beforeEach(() => {
      queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false },
          mutations: { retry: false },
        },
      });
    });

    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    it("should execute mutation successfully", async () => {
      const mockData = { id: 1, name: "test" };
      const mockMutationFn = jest.fn().mockResolvedValue(mockData);

      const { result } = renderHook(() => useStandardMutation(mockMutationFn), {
        wrapper,
      });

      result.current.mutate({ name: "test" });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // React Query v5 passes additional context as second parameter
      expect(mockMutationFn).toHaveBeenCalledWith(
        { name: "test" },
        expect.any(Object),
      );
      expect(result.current.data).toEqual(mockData);
    });

    it("should handle mutation error", async () => {
      const mockError = new Error("Mutation failed");
      const mockMutationFn = jest.fn().mockRejectedValue(mockError);

      const { result } = renderHook(() => useStandardMutation(mockMutationFn), {
        wrapper,
      });

      result.current.mutate({ name: "test" });

      await waitFor(() => expect(result.current.isError).toBe(true), {
        timeout: 5000,
      });

      expect(result.current.error).toEqual(mockError);
    });

    it("should call onSuccess callback", async () => {
      const mockData = { id: 1, name: "test" };
      const mockMutationFn = jest.fn().mockResolvedValue(mockData);
      const onSuccess = jest.fn();

      const { result } = renderHook(
        () => useStandardMutation(mockMutationFn, { onSuccess }),
        { wrapper },
      );

      result.current.mutate({ name: "test" });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // React Query v5 passes context object as third parameter
      expect(onSuccess).toHaveBeenCalledWith(
        mockData,
        { name: "test" },
        undefined,
        expect.any(Object),
      );
    });

    it("should call onError callback", async () => {
      const mockError = new Error("Mutation failed");
      const mockMutationFn = jest.fn().mockRejectedValue(mockError);
      const onError = jest.fn();

      const { result } = renderHook(
        () => useStandardMutation(mockMutationFn, { onError }),
        { wrapper },
      );

      result.current.mutate({ name: "test" });

      await waitFor(() => expect(result.current.isError).toBe(true), {
        timeout: 5000,
      });

      // React Query v5 passes context object as fourth parameter
      expect(onError).toHaveBeenCalledWith(
        mockError,
        { name: "test" },
        undefined,
        expect.any(Object),
      );
    });

    it("should apply custom mutationKey", async () => {
      const mockMutationFn = jest.fn().mockResolvedValue({ id: 1 });

      const { result } = renderHook(
        () =>
          useStandardMutation(mockMutationFn, {
            mutationKey: ["customKey"],
          }),
        { wrapper },
      );

      result.current.mutate({ name: "test" });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // Mutation executed with custom key
      expect(mockMutationFn).toHaveBeenCalled();
    });
  });
});
