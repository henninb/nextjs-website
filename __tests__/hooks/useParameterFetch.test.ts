/**
 * TDD Tests for Modern useParameterFetch
 * Modern endpoint: GET /api/parameter/active
 *
 * Key differences from legacy:
 * - Endpoint: /api/parameter/active (vs /api/parameter/select/active)
 * - Always returns array (never 404 on empty)
 * - Uses ServiceResult pattern for errors
 */

import React from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConsoleSpy } from "../../testHelpers";
import { createModernFetchMock } from "../../testHelpers";
import Parameter from "../../model/Parameter";
import useParameterFetch from "../../hooks/useParameterFetch";

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

jest.mock("../../utils/cacheUtils", () => ({
  QueryKeys: {
    parameter: jest.fn(() => ["parameter"]),
  },
}));

jest.mock("../../utils/csrf", () => ({
  getCsrfHeaders: jest.fn().mockResolvedValue({}),
  getCsrfToken: jest.fn().mockResolvedValue(null),
  fetchCsrfToken: jest.fn().mockResolvedValue(undefined),
  clearCsrfToken: jest.fn(),
  initCsrfToken: jest.fn().mockResolvedValue(undefined),
}));

// Modern implementation to test
const fetchParameterDataModern = async (): Promise<Parameter[]> => {
  try {
    const response = await fetch("/api/parameter/active", {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      const errorBody = await response
        .json()
        .catch(() => ({ error: `HTTP error! Status: ${response.status}` }));
      throw new Error(
        errorBody.error || `HTTP error! Status: ${response.status}`,
      );
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error("Error fetching parameter data:", error);
    throw new Error(`Failed to fetch parameter data: ${error.message}`);
  }
};

// Helper function to create test parameter data
const createTestParameter = (
  overrides: Partial<Parameter> = {},
): Parameter => ({
  parameterId: 1,
  parameterName: "test_parameter",
  parameterValue: "test_value",
  activeStatus: true,
  ...overrides,
});

describe("useParameterFetch Modern Endpoint (TDD)", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  let consoleSpy: ConsoleSpy;

  beforeEach(() => {
    consoleSpy = new ConsoleSpy();
    jest.clearAllMocks();
  });

  afterEach(() => {
    consoleSpy.stop();
  });

  describe("Modern endpoint behavior", () => {
    it("should use modern endpoint /api/parameter/active", async () => {
      global.fetch = createModernFetchMock([]);

      await fetchParameterDataModern();

      expect(fetch).toHaveBeenCalledWith("/api/parameter/active", {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });
    });

    it("should return empty array when no parameters exist (not 404)", async () => {
      // Modern endpoints return empty array, not 404
      global.fetch = createModernFetchMock([]);

      const result = await fetchParameterDataModern();

      expect(result).toStrictEqual([]);
      expect(Array.isArray(result)).toBe(true);
    });

    it("should fetch parameters successfully", async () => {
      const testParameters = [
        createTestParameter({ parameterId: 1, parameterName: "param1" }),
        createTestParameter({ parameterId: 2, parameterName: "param2" }),
      ];

      global.fetch = createModernFetchMock(testParameters);

      const result = await fetchParameterDataModern();

      expect(result).toStrictEqual(testParameters);
      expect(result).toHaveLength(2);
    });
  });

  describe("Modern error handling with ServiceResult pattern", () => {
    it("should handle 401 unauthorized with modern error format", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ error: "Unauthorized access" }),
      });

      consoleSpy.start();

      await expect(fetchParameterDataModern()).rejects.toThrow(
        "Failed to fetch parameter data: Unauthorized access",
      );
    });

    it("should handle 403 forbidden with modern error format", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 403,
        json: async () => ({ error: "Forbidden" }),
      });

      consoleSpy.start();

      await expect(fetchParameterDataModern()).rejects.toThrow(
        "Failed to fetch parameter data: Forbidden",
      );
    });

    it("should handle 500 server error with modern error format", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ error: "Internal server error" }),
      });

      consoleSpy.start();

      await expect(fetchParameterDataModern()).rejects.toThrow(
        "Failed to fetch parameter data: Internal server error",
      );
    });

    it("should handle validation errors with modern format", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({
          errors: [
            "parameterName is required",
            "parameterValue must be non-empty",
          ],
        }),
      });

      consoleSpy.start();

      await expect(fetchParameterDataModern()).rejects.toThrow(
        "Failed to fetch parameter data",
      );
    });

    it("should handle error response without error field", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({}),
      });

      consoleSpy.start();

      await expect(fetchParameterDataModern()).rejects.toThrow(
        "HTTP error! Status: 500",
      );
    });

    it("should handle invalid JSON in error response", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: jest.fn().mockRejectedValue(new Error("Invalid JSON")),
      });

      consoleSpy.start();

      await expect(fetchParameterDataModern()).rejects.toThrow(
        "HTTP error! Status: 500",
      );
    });
  });

  describe("Network and connectivity errors", () => {
    it("should handle network errors", async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error("Network error"));

      consoleSpy.start();

      await expect(fetchParameterDataModern()).rejects.toThrow(
        "Failed to fetch parameter data: Network error",
      );

      const calls = consoleSpy.getCalls();
      expect(
        calls.error.some((call) =>
          call[0].includes("Error fetching parameter data:"),
        ),
      ).toBe(true);
    });

    it("should handle timeout errors", async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error("Timeout"));

      consoleSpy.start();

      await expect(fetchParameterDataModern()).rejects.toThrow(
        "Failed to fetch parameter data: Timeout",
      );
    });

    it("should handle connection refused", async () => {
      global.fetch = jest
        .fn()
        .mockRejectedValue(new Error("Connection refused"));

      consoleSpy.start();

      await expect(fetchParameterDataModern()).rejects.toThrow(
        "Failed to fetch parameter data: Connection refused",
      );
    });
  });

  describe("Data integrity and validation", () => {
    it("should return parameters with all required fields", async () => {
      const testParameters = [
        createTestParameter({
          parameterId: 1,
          parameterName: "test_param",
          parameterValue: "test_value",
          activeStatus: true,
        }),
      ];

      global.fetch = createModernFetchMock(testParameters);

      const result = await fetchParameterDataModern();

      expect(result[0]).toHaveProperty("parameterId");
      expect(result[0]).toHaveProperty("parameterName");
      expect(result[0]).toHaveProperty("parameterValue");
      expect(result[0]).toHaveProperty("activeStatus");
    });

    it("should preserve parameter data exactly as received", async () => {
      const testParameters = [
        createTestParameter({
          parameterId: 999,
          parameterName: "unchanged_param",
          parameterValue: "unchanged_value",
        }),
      ];

      global.fetch = createModernFetchMock(testParameters);

      const result = await fetchParameterDataModern();

      expect(result).toStrictEqual(testParameters);
    });

    it("should handle parameters with various value types", async () => {
      const testParameters = [
        createTestParameter({ parameterValue: "string_value" }),
        createTestParameter({ parameterValue: "123.45" }),
        createTestParameter({ parameterValue: "true" }),
        createTestParameter({ parameterValue: '{"key": "value"}' }),
      ];

      global.fetch = createModernFetchMock(testParameters);

      const result = await fetchParameterDataModern();

      expect(result).toHaveLength(4);
      expect(result[0].parameterValue).toBe("string_value");
      expect(result[1].parameterValue).toBe("123.45");
      expect(result[2].parameterValue).toBe("true");
      expect(result[3].parameterValue).toBe('{"key": "value"}');
    });
  });

  describe("Edge cases", () => {
    it("should handle large number of parameters", async () => {
      const testParameters = Array.from({ length: 100 }, (_, i) =>
        createTestParameter({
          parameterId: i + 1,
          parameterName: `param_${i + 1}`,
        }),
      );

      global.fetch = createModernFetchMock(testParameters);

      const result = await fetchParameterDataModern();

      expect(result).toHaveLength(100);
    });

    it("should handle parameters with special characters", async () => {
      const testParameters = [
        createTestParameter({
          parameterName: "param-with_special.chars",
          parameterValue: "value!@#$%^&*()",
        }),
      ];

      global.fetch = createModernFetchMock(testParameters);

      const result = await fetchParameterDataModern();

      expect(result[0].parameterName).toBe("param-with_special.chars");
      expect(result[0].parameterValue).toBe("value!@#$%^&*()");
    });

    it("should handle parameters with Unicode characters", async () => {
      const testParameters = [
        createTestParameter({
          parameterValue: "Hello 世界 🌍 مرحبا",
        }),
      ];

      global.fetch = createModernFetchMock(testParameters);

      const result = await fetchParameterDataModern();

      expect(result[0].parameterValue).toBe("Hello 世界 🌍 مرحبا");
    });

    it("should handle parameters with empty values", async () => {
      const testParameters = [createTestParameter({ parameterValue: "" })];

      global.fetch = createModernFetchMock(testParameters);

      const result = await fetchParameterDataModern();

      expect(result[0].parameterValue).toBe("");
    });

    it("should handle parameters with very long values", async () => {
      const longValue = "a".repeat(10000);
      const testParameters = [
        createTestParameter({ parameterValue: longValue }),
      ];

      global.fetch = createModernFetchMock(testParameters);

      const result = await fetchParameterDataModern();

      expect(result[0].parameterValue).toBe(longValue);
      expect(result[0].parameterValue.length).toBe(10000);
    });
  });

  describe("HTTP request configuration", () => {
    it("should use GET method", async () => {
      global.fetch = createModernFetchMock([]);

      await fetchParameterDataModern();

      const callArgs = (fetch as jest.Mock).mock.calls[0][1];
      expect(callArgs.method).toBe("GET");
    });

    it("should include credentials", async () => {
      global.fetch = createModernFetchMock([]);

      await fetchParameterDataModern();

      const callArgs = (fetch as jest.Mock).mock.calls[0][1];
      expect(callArgs.credentials).toBe("include");
    });

    it("should include correct headers", async () => {
      global.fetch = createModernFetchMock([]);

      await fetchParameterDataModern();

      const callArgs = (fetch as jest.Mock).mock.calls[0][1];
      expect(callArgs.headers).toStrictEqual({
        "Content-Type": "application/json",
        Accept: "application/json",
      });
    });

    it("should only call API once per fetch", async () => {
      global.fetch = createModernFetchMock([]);

      await fetchParameterDataModern();

      expect(fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe("Common parameter scenarios", () => {
    it("should fetch payment account parameter", async () => {
      const testParameters = [
        createTestParameter({
          parameterName: "payment_account",
          parameterValue: "checking_main",
        }),
      ];

      global.fetch = createModernFetchMock(testParameters);

      const result = await fetchParameterDataModern();

      const paymentAccount = result.find(
        (p) => p.parameterName === "payment_account",
      );
      expect(paymentAccount).toBeDefined();
      expect(paymentAccount?.parameterValue).toBe("checking_main");
    });

    it("should fetch multiple configuration parameters", async () => {
      const testParameters = [
        createTestParameter({
          parameterName: "default_category",
          parameterValue: "groceries",
        }),
        createTestParameter({
          parameterName: "currency",
          parameterValue: "USD",
        }),
        createTestParameter({
          parameterName: "date_format",
          parameterValue: "MM/DD/YYYY",
        }),
      ];

      global.fetch = createModernFetchMock(testParameters);

      const result = await fetchParameterDataModern();

      expect(result).toHaveLength(3);
      expect(
        result.find((p) => p.parameterName === "default_category")
          ?.parameterValue,
      ).toBe("groceries");
      expect(
        result.find((p) => p.parameterName === "currency")?.parameterValue,
      ).toBe("USD");
      expect(
        result.find((p) => p.parameterName === "date_format")?.parameterValue,
      ).toBe("MM/DD/YYYY");
    });
  });
});

// ---------------------------------------------------------------------------
// renderHook tests for useParameterFetch default export
// ---------------------------------------------------------------------------

const createParamQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        retryOnMount: false,
        refetchOnMount: false,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
      },
      mutations: { retry: false },
    },
  });

const createParamWrapper = (queryClient: QueryClient) =>
  function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  };

describe("useParameterFetch hook - renderHook tests", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("returns parameter data on successful fetch", async () => {
    const testParameters: Parameter[] = [
      { parameterId: 1, parameterName: "payment_account", parameterValue: "checking_main", activeStatus: true },
      { parameterId: 2, parameterName: "currency", parameterValue: "USD", activeStatus: true },
    ];
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue(testParameters),
    });

    const queryClient = createParamQueryClient();
    const { result } = renderHook(() => useParameterFetch(), {
      wrapper: createParamWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toStrictEqual(testParameters);
  });

  it("enters error state when fetch returns a server error", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
      json: jest.fn().mockResolvedValue({ error: "Server error" }),
    });

    const queryClient = createParamQueryClient();
    const { result } = renderHook(() => useParameterFetch(), {
      wrapper: createParamWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.isError).toBe(true), { timeout: 5000 });
  });
});
