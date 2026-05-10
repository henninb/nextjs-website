import React from "react";
import { renderHook, act, waitFor } from "@testing-library/react";
import useLogoutProcess from "../../hooks/useLogoutProcess";

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

jest.mock("../../utils/logger", () => ({
  createHookLogger: jest.fn(() => ({
    debug: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
  })),
}));

const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(() => ({
    push: mockPush,
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
  })),
}));

import { fetchWithErrorHandling } from "../../utils/fetchUtils";

const mockFetchWithErrorHandling = fetchWithErrorHandling as jest.MockedFunction<
  typeof fetchWithErrorHandling
>;

describe("useLogoutProcess", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchWithErrorHandling.mockResolvedValue({ status: 200 } as Response);
  });

  describe("initial state", () => {
    it("should initialize with loading false", () => {
      const { result } = renderHook(() => useLogoutProcess());

      expect(result.current.loading).toBe(false);
    });

    it("should initialize with error null", () => {
      const { result } = renderHook(() => useLogoutProcess());

      expect(result.current.error).toBeNull();
    });

    it("should expose logoutNow function", () => {
      const { result } = renderHook(() => useLogoutProcess());

      expect(typeof result.current.logoutNow).toBe("function");
    });
  });

  describe("successful logout", () => {
    it("should call fetchWithErrorHandling with POST to /api/logout", async () => {
      const { result } = renderHook(() => useLogoutProcess());

      await act(async () => {
        await result.current.logoutNow();
      });

      expect(mockFetchWithErrorHandling).toHaveBeenCalledWith("/api/logout", {
        method: "POST",
      });
    });

    it("should set loading to false after successful logout", async () => {
      const { result } = renderHook(() => useLogoutProcess());

      await act(async () => {
        await result.current.logoutNow();
      });

      expect(result.current.loading).toBe(false);
    });

    it("should not set error on successful logout", async () => {
      const { result } = renderHook(() => useLogoutProcess());

      await act(async () => {
        await result.current.logoutNow();
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe("loading state", () => {
    it("should set loading to true while logout is in progress", async () => {
      let resolveLogout: () => void;
      const logoutPromise = new Promise<Response>((resolve) => {
        resolveLogout = () => resolve({ status: 200 } as Response);
      });
      mockFetchWithErrorHandling.mockReturnValue(logoutPromise);

      const { result } = renderHook(() => useLogoutProcess());

      act(() => {
        result.current.logoutNow();
      });

      expect(result.current.loading).toBe(true);

      await act(async () => {
        resolveLogout!();
        await logoutPromise;
      });
    });
  });

  describe("error handling", () => {
    it("should set error when logout fails", async () => {
      const logoutError = new Error("Logout failed");
      mockFetchWithErrorHandling.mockRejectedValue(logoutError);

      const { result } = renderHook(() => useLogoutProcess());

      await act(async () => {
        await result.current.logoutNow();
      });

      expect(result.current.error).toBe(logoutError);
    });

    it("should set loading to false after failed logout", async () => {
      mockFetchWithErrorHandling.mockRejectedValue(new Error("Network error"));

      const { result } = renderHook(() => useLogoutProcess());

      await act(async () => {
        await result.current.logoutNow();
      });

      expect(result.current.loading).toBe(false);
    });

    it("should create Error from non-Error rejection", async () => {
      mockFetchWithErrorHandling.mockRejectedValue("string error");

      const { result } = renderHook(() => useLogoutProcess());

      await act(async () => {
        await result.current.logoutNow();
      });

      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toBe("Logout failed");
    });

    it("should propagate fetch errors properly", async () => {
      const { FetchError } = jest.requireMock("../../utils/fetchUtils");
      mockFetchWithErrorHandling.mockRejectedValue(
        new FetchError("Unauthorized", 401),
      );

      const { result } = renderHook(() => useLogoutProcess());

      await act(async () => {
        await result.current.logoutNow();
      });

      expect(result.current.error?.message).toBe("Unauthorized");
    });
  });

  describe("request format", () => {
    it("should use POST method for logout", async () => {
      const { result } = renderHook(() => useLogoutProcess());

      await act(async () => {
        await result.current.logoutNow();
      });

      const [, options] = mockFetchWithErrorHandling.mock.calls[0];
      expect(options?.method).toBe("POST");
    });

    it("should not send body in logout request", async () => {
      const { result } = renderHook(() => useLogoutProcess());

      await act(async () => {
        await result.current.logoutNow();
      });

      const [, options] = mockFetchWithErrorHandling.mock.calls[0];
      expect(options?.body).toBeUndefined();
    });
  });
});
