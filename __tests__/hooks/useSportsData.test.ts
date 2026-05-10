import React from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useSportsData } from "../../hooks/useSportsData";

jest.mock("../../utils/logger", () => ({
  createHookLogger: jest.fn(() => ({
    debug: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
  })),
}));

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, retryDelay: 0 },
    },
  });

const createWrapper = (queryClient: QueryClient) =>
  function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(
      QueryClientProvider,
      { client: queryClient },
      children as React.ReactNode,
    );
  };

describe("useSportsData", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe("successful data fetch", () => {
    it("should return sports data on success", async () => {
      const mockData = [
        { id: 1, team: "Team A", score: 10 },
        { id: 2, team: "Team B", score: 7 },
      ];

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue(mockData),
      });

      const queryClient = createTestQueryClient();
      const { result } = renderHook(() => useSportsData("/api/nfl"), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.data).toStrictEqual(mockData);
      expect(result.current.error).toBeNull();
    });

    it("should call the correct endpoint", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue([]),
      });

      const queryClient = createTestQueryClient();
      renderHook(() => useSportsData("/api/nba"), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() =>
        expect(global.fetch).toHaveBeenCalledWith(
          "/api/nba",
          expect.any(Object),
        ),
      );
    });

    it("should use GET method with correct headers", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue([]),
      });

      const queryClient = createTestQueryClient();
      renderHook(() => useSportsData("/api/mlb"), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => expect(global.fetch).toHaveBeenCalled());

      expect(global.fetch).toHaveBeenCalledWith(
        "/api/mlb",
        expect.objectContaining({
          method: "GET",
          headers: expect.objectContaining({
            Accept: "application/json",
            "Content-Type": "application/json",
          }),
          credentials: "include",
        }),
      );
    });

    it("should start with loading true", () => {
      global.fetch = jest.fn().mockImplementation(
        () => new Promise(() => {}), // never resolves
      );

      const queryClient = createTestQueryClient();
      const { result } = renderHook(() => useSportsData("/api/nhl"), {
        wrapper: createWrapper(queryClient),
      });

      expect(result.current.loading).toBe(true);
    });

    it("should return empty array data as data", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue([]),
      });

      const queryClient = createTestQueryClient();
      const { result } = renderHook(() => useSportsData("/api/nfl"), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.data).toStrictEqual([]);
      expect(result.current.error).toBeNull();
    });

    it("should return a retry function", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue([]),
      });

      const queryClient = createTestQueryClient();
      const { result } = renderHook(() => useSportsData("/api/nfl"), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(typeof result.current.retry).toBe("function");
    });
  });

  describe("error handling", () => {
    it("should return error message for 500 server error", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: jest.fn().mockResolvedValue({}),
      });

      const queryClient = createTestQueryClient();
      const { result } = renderHook(() => useSportsData("/api/nfl"), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.error).toContain(
        "Server error. The sports data service may be temporarily unavailable.",
      );
      expect(result.current.data).toBeNull();
    });

    it("should return specific error message for 404 not found", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 404,
        json: jest.fn().mockResolvedValue({}),
      });

      const queryClient = createTestQueryClient();
      const { result } = renderHook(() => useSportsData("/api/nfl"), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.error).toContain(
        "Sports data not found for this season.",
      );
    });

    it("should return error message for 400 bad request", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: jest.fn().mockResolvedValue({}),
      });

      const queryClient = createTestQueryClient();
      const { result } = renderHook(() => useSportsData("/api/nfl"), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.error).toBeTruthy();
      expect(result.current.data).toBeNull();
    });

    it("should handle network errors", async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error("Network error"));

      const queryClient = createTestQueryClient();
      const { result } = renderHook(() => useSportsData("/api/nfl"), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.error).toBeTruthy();
      expect(result.current.data).toBeNull();
    });

    it("should use custom message from 500 response body", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: jest.fn().mockResolvedValue({ message: "Custom server message" }),
      });

      const queryClient = createTestQueryClient();
      const { result } = renderHook(() => useSportsData("/api/nfl"), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.error).toContain("Custom server message");
    });
  });

    it("should handle JSON parse failure when reading error response body", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: jest.fn().mockRejectedValue(new Error("JSON parse error")),
      });

      const queryClient = createTestQueryClient();
      const { result } = renderHook(() => useSportsData("/api/nfl"), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.error).toBe("Failed to fetch sports data");
    });

    it("should use timeout message when AbortError is thrown", async () => {
      const abortError = new Error("The operation was aborted.");
      abortError.name = "AbortError";
      global.fetch = jest.fn().mockRejectedValue(abortError);

      const queryClient = createTestQueryClient();
      const { result } = renderHook(() => useSportsData("/api/nfl"), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.error).toContain("Connection timeout");
    });

    it("should use fallback message for non-Error exceptions", async () => {
      global.fetch = jest.fn().mockRejectedValue("string error");

      const queryClient = createTestQueryClient();
      const { result } = renderHook(() => useSportsData("/api/nfl"), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.error).toContain("Failed to fetch sports data");
    });
  });

  describe("disabled state", () => {
    it("should not fetch when endpoint is empty string", () => {
      global.fetch = jest.fn();

      const queryClient = createTestQueryClient();
      const { result } = renderHook(() => useSportsData(""), {
        wrapper: createWrapper(queryClient),
      });

      expect(global.fetch).not.toHaveBeenCalled();
      expect(result.current.loading).toBe(false);
      expect(result.current.data).toBeNull();
    });
  });

  describe("different sport endpoints", () => {
    it.each(["/api/nfl", "/api/nba", "/api/mlb", "/api/nhl"])(
      "should fetch from %s endpoint",
      async (endpoint) => {
        const mockData = [{ id: 1, sport: endpoint }];
        global.fetch = jest.fn().mockResolvedValue({
          ok: true,
          status: 200,
          json: jest.fn().mockResolvedValue(mockData),
        });

        const queryClient = createTestQueryClient();
        const { result } = renderHook(() => useSportsData(endpoint), {
          wrapper: createWrapper(queryClient),
        });

        await waitFor(() => expect(result.current.loading).toBe(false));

        expect(global.fetch).toHaveBeenCalledWith(endpoint, expect.any(Object));
        expect(result.current.data).toStrictEqual(mockData);
      },
    );
  });
});
