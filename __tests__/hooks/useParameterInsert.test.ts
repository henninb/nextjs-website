/**
 * TDD Tests for Modern useParameterInsert
 * Modern endpoint: POST /api/parameter
 *
 * Key differences from legacy:
 * - Endpoint: /api/parameter (vs /api/parameter/insert)
 * - Uses ServiceResult pattern for errors
 * - Consistent error response format
 */

import React from "react";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConsoleSpy } from "../../testHelpers";
import { createModernFetchMock } from "../../testHelpers";
import Parameter from "../../model/Parameter";

// Mock the useAuth hook
jest.mock("../../components/AuthProvider", () => ({
  useAuth: jest.fn(() => ({
    isAuthenticated: true,
    loading: false,
    user: { username: "testuser" },
    login: jest.fn(),
    logout: jest.fn(),
  })),
}));

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
    sanitizeParameterName: jest.fn((value: string) => value),
  },
}));

jest.mock("../../utils/cacheUtils", () => ({
  QueryKeys: {
    parameter: jest.fn(() => ["parameter"]),
  },
  addToList: jest.fn(),
}));

jest.mock("../../utils/logger", () => ({
  createHookLogger: jest.fn(() => ({
    debug: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
  })),
}));

import useParameterInsert, { insertParameter } from "../../hooks/useParameterInsert";
import { fetchWithErrorHandling, parseResponse } from "../../utils/fetchUtils";
import { InputSanitizer } from "../../utils/validation/sanitization";
import { addToList } from "../../utils/cacheUtils";

const mockFetchWithErrorHandling = fetchWithErrorHandling as jest.MockedFunction<typeof fetchWithErrorHandling>;
const mockParseResponse = parseResponse as jest.MockedFunction<typeof parseResponse>;
const mockSanitizeParameterName = InputSanitizer.sanitizeParameterName as jest.MockedFunction<typeof InputSanitizer.sanitizeParameterName>;
const mockAddToList = addToList as jest.Mock;

// Modern implementation to test
const insertParameterModern = async (
  payload: Parameter,
): Promise<Parameter> => {
  try {
    const endpoint = "/api/parameter";

    const response = await fetch(endpoint, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorBody = await response
        .json()
        .catch(() => ({ error: `HTTP error! Status: ${response.status}` }));
      const errorMessage =
        errorBody.error ||
        errorBody.errors?.join(", ") ||
        `HTTP error! Status: ${response.status}`;
      throw new Error(errorMessage);
    }

    return response.status !== 204 ? await response.json() : payload;
  } catch (error: any) {
    console.error(`An error occurred: ${error.message}`);
    throw error;
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

describe("useParameterInsert Modern Endpoint (TDD)", () => {
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
    it("should use modern endpoint /api/parameter", async () => {
      const testParameter = createTestParameter();
      global.fetch = createModernFetchMock(testParameter);

      await insertParameterModern(testParameter);

      expect(fetch).toHaveBeenCalledWith("/api/parameter", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(testParameter),
      });
    });

    it("should insert parameter successfully", async () => {
      const testParameter = createTestParameter({
        parameterName: "new_param",
        parameterValue: "new_value",
      });

      global.fetch = createModernFetchMock(testParameter);

      const result = await insertParameterModern(testParameter);

      expect(result).toStrictEqual(testParameter);
    });

    it("should handle 204 No Content response", async () => {
      const testParameter = createTestParameter();

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 204,
        json: async () => {
          throw new Error("No content");
        },
      });

      const result = await insertParameterModern(testParameter);

      expect(result).toStrictEqual(testParameter);
    });
  });

  describe("Modern error handling with ServiceResult pattern", () => {
    it("should handle validation errors with modern format", async () => {
      const testParameter = createTestParameter();

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

      await expect(insertParameterModern(testParameter)).rejects.toThrow(
        "parameterName is required, parameterValue must be non-empty",
      );
    });

    it("should handle duplicate parameter error", async () => {
      const testParameter = createTestParameter({
        parameterName: "payment_account",
      });

      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 409,
        json: async () => ({
          error: "Parameter payment_account already exists",
        }),
      });

      consoleSpy.start();

      await expect(insertParameterModern(testParameter)).rejects.toThrow(
        "Parameter payment_account already exists",
      );
    });

    it("should handle 401 unauthorized", async () => {
      const testParameter = createTestParameter();

      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ error: "Unauthorized" }),
      });

      consoleSpy.start();

      await expect(insertParameterModern(testParameter)).rejects.toThrow(
        "Unauthorized",
      );
    });

    it("should handle 403 forbidden", async () => {
      const testParameter = createTestParameter();

      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 403,
        json: async () => ({ error: "Forbidden" }),
      });

      consoleSpy.start();

      await expect(insertParameterModern(testParameter)).rejects.toThrow(
        "Forbidden",
      );
    });

    it("should handle 500 server error", async () => {
      const testParameter = createTestParameter();

      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ error: "Internal server error" }),
      });

      consoleSpy.start();

      await expect(insertParameterModern(testParameter)).rejects.toThrow(
        "Internal server error",
      );
    });

    it("should handle error response without error field", async () => {
      const testParameter = createTestParameter();

      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({}),
      });

      consoleSpy.start();

      await expect(insertParameterModern(testParameter)).rejects.toThrow(
        "HTTP error! Status: 400",
      );
    });

    it("should handle invalid JSON in error response", async () => {
      const testParameter = createTestParameter();

      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: jest.fn().mockRejectedValue(new Error("Invalid JSON")),
      });

      consoleSpy.start();

      await expect(insertParameterModern(testParameter)).rejects.toThrow(
        "HTTP error! Status: 500",
      );
    });
  });

  describe("Network and connectivity errors", () => {
    it("should handle network errors", async () => {
      const testParameter = createTestParameter();

      global.fetch = jest.fn().mockRejectedValue(new Error("Network error"));

      consoleSpy.start();

      await expect(insertParameterModern(testParameter)).rejects.toThrow(
        "Network error",
      );

      const calls = consoleSpy.getCalls();
      expect(
        calls.error.some((call) => call[0].includes("An error occurred:")),
      ).toBe(true);
    });

    it("should handle timeout errors", async () => {
      const testParameter = createTestParameter();

      global.fetch = jest.fn().mockRejectedValue(new Error("Timeout"));

      consoleSpy.start();

      await expect(insertParameterModern(testParameter)).rejects.toThrow(
        "Timeout",
      );
    });

    it("should handle connection refused", async () => {
      const testParameter = createTestParameter();

      global.fetch = jest
        .fn()
        .mockRejectedValue(new Error("Connection refused"));

      consoleSpy.start();

      await expect(insertParameterModern(testParameter)).rejects.toThrow(
        "Connection refused",
      );
    });
  });

  describe("Request body and headers", () => {
    it("should use POST method", async () => {
      const testParameter = createTestParameter();
      global.fetch = createModernFetchMock(testParameter);

      await insertParameterModern(testParameter);

      const callArgs = (fetch as jest.Mock).mock.calls[0][1];
      expect(callArgs.method).toBe("POST");
    });

    it("should include credentials", async () => {
      const testParameter = createTestParameter();
      global.fetch = createModernFetchMock(testParameter);

      await insertParameterModern(testParameter);

      const callArgs = (fetch as jest.Mock).mock.calls[0][1];
      expect(callArgs.credentials).toBe("include");
    });

    it("should include correct headers", async () => {
      const testParameter = createTestParameter();
      global.fetch = createModernFetchMock(testParameter);

      await insertParameterModern(testParameter);

      const callArgs = (fetch as jest.Mock).mock.calls[0][1];
      expect(callArgs.headers).toStrictEqual({
        "Content-Type": "application/json",
        Accept: "application/json",
      });
    });

    it("should send parameter as JSON in request body", async () => {
      const testParameter = createTestParameter({
        parameterName: "test_config",
        parameterValue: "test_value",
      });

      global.fetch = createModernFetchMock(testParameter);

      await insertParameterModern(testParameter);

      const callArgs = (fetch as jest.Mock).mock.calls[0][1];
      expect(callArgs.body).toBe(JSON.stringify(testParameter));
    });
  });

  describe("Data integrity and validation", () => {
    it("should preserve all parameter fields", async () => {
      const testParameter = createTestParameter({
        parameterId: 999,
        parameterName: "complete_param",
        parameterValue: "complete_value",
        activeStatus: true,
      });

      global.fetch = createModernFetchMock(testParameter);

      const result = await insertParameterModern(testParameter);

      expect(result).toStrictEqual(testParameter);
      expect(result.parameterId).toBe(999);
      expect(result.parameterName).toBe("complete_param");
      expect(result.parameterValue).toBe("complete_value");
      expect(result.activeStatus).toBe(true);
    });

    it("should handle parameters with various value types", async () => {
      const testCases = [
        { parameterValue: "string_value" },
        { parameterValue: "123.45" },
        { parameterValue: "true" },
        { parameterValue: '{"nested": "json"}' },
      ];

      for (const testCase of testCases) {
        const testParameter = createTestParameter(testCase);
        global.fetch = createModernFetchMock(testParameter);

        const result = await insertParameterModern(testParameter);

        expect(result.parameterValue).toBe(testCase.parameterValue);
      }
    });
  });

  describe("Edge cases", () => {
    it("should handle parameters with special characters", async () => {
      const testParameter = createTestParameter({
        parameterName: "param-with_special.chars",
        parameterValue: "value!@#$%^&*()",
      });

      global.fetch = createModernFetchMock(testParameter);

      const result = await insertParameterModern(testParameter);

      expect(result.parameterName).toBe("param-with_special.chars");
      expect(result.parameterValue).toBe("value!@#$%^&*()");
    });

    it("should handle parameters with Unicode characters", async () => {
      const testParameter = createTestParameter({
        parameterValue: "Hello 世界 🌍 مرحبا",
      });

      global.fetch = createModernFetchMock(testParameter);

      const result = await insertParameterModern(testParameter);

      expect(result.parameterValue).toBe("Hello 世界 🌍 مرحبا");
    });

    it("should handle parameters with empty values", async () => {
      const testParameter = createTestParameter({
        parameterValue: "",
      });

      global.fetch = createModernFetchMock(testParameter);

      const result = await insertParameterModern(testParameter);

      expect(result.parameterValue).toBe("");
    });

    it("should handle parameters with very long values", async () => {
      const longValue = "a".repeat(10000);
      const testParameter = createTestParameter({
        parameterValue: longValue,
      });

      global.fetch = createModernFetchMock(testParameter);

      const result = await insertParameterModern(testParameter);

      expect(result.parameterValue).toBe(longValue);
      expect(result.parameterValue.length).toBe(10000);
    });

    it("should handle parameters with whitespace", async () => {
      const testParameter = createTestParameter({
        parameterValue: "  value with spaces  ",
      });

      global.fetch = createModernFetchMock(testParameter);

      const result = await insertParameterModern(testParameter);

      expect(result.parameterValue).toBe("  value with spaces  ");
    });
  });

  describe("Common parameter scenarios", () => {
    it("should insert payment account parameter", async () => {
      const testParameter = createTestParameter({
        parameterName: "payment_account",
        parameterValue: "checking_main",
      });

      global.fetch = createModernFetchMock(testParameter);

      const result = await insertParameterModern(testParameter);

      expect(result.parameterName).toBe("payment_account");
      expect(result.parameterValue).toBe("checking_main");
    });

    it("should insert configuration parameters", async () => {
      const configParameters = [
        { parameterName: "default_category", parameterValue: "groceries" },
        { parameterName: "currency", parameterValue: "USD" },
        { parameterName: "date_format", parameterValue: "MM/DD/YYYY" },
      ];

      for (const config of configParameters) {
        const testParameter = createTestParameter(config);
        global.fetch = createModernFetchMock(testParameter);

        const result = await insertParameterModern(testParameter);

        expect(result.parameterName).toBe(config.parameterName);
        expect(result.parameterValue).toBe(config.parameterValue);
      }
    });

    it("should insert numeric configuration parameter", async () => {
      const testParameter = createTestParameter({
        parameterName: "max_transaction_amount",
        parameterValue: "10000.00",
      });

      global.fetch = createModernFetchMock(testParameter);

      const result = await insertParameterModern(testParameter);

      expect(result.parameterName).toBe("max_transaction_amount");
      expect(result.parameterValue).toBe("10000.00");
    });
  });
});

// ---------------------------------------------------------------------------
// Tests for the real insertParameter function
// ---------------------------------------------------------------------------

const createTestParam = (overrides: Partial<Parameter> = {}): Parameter => ({
  parameterId: 1,
  parameterName: "payment_account",
  parameterValue: "checking_john",
  activeStatus: true,
  ...overrides,
});

describe("insertParameter", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchWithErrorHandling.mockResolvedValue({ status: 201 } as Response);
    mockSanitizeParameterName.mockImplementation((value: string) => value);
  });

  it("calls POST /api/parameter with sanitized parameter", async () => {
    const param = createTestParam({ parameterName: "new_param" });
    mockParseResponse.mockResolvedValue(param);

    await insertParameter(param);

    const [url, options] = mockFetchWithErrorHandling.mock.calls[0];
    expect(url).toBe("/api/parameter");
    expect(options?.method).toBe("POST");
  });

  it("sanitizes parameter name before sending", async () => {
    const param = createTestParam({ parameterName: "test_param" });
    mockParseResponse.mockResolvedValue(param);

    await insertParameter(param);

    expect(mockSanitizeParameterName).toHaveBeenCalledWith("test_param");
  });

  it("returns the inserted parameter", async () => {
    const param = createTestParam();
    mockParseResponse.mockResolvedValue(param);

    const result = await insertParameter(param);

    expect(result).toStrictEqual(param);
  });

  it("returns payload when parseResponse returns null (204 No Content)", async () => {
    const param = createTestParam();
    mockParseResponse.mockResolvedValue(null);

    const result = await insertParameter(param);

    expect(result).toStrictEqual(param);
  });

  it("propagates fetch errors", async () => {
    const { FetchError } = jest.requireMock("../../utils/fetchUtils");
    mockFetchWithErrorHandling.mockRejectedValue(
      new FetchError("Parameter already exists", 409),
    );

    await expect(insertParameter(createTestParam())).rejects.toThrow(
      "Parameter already exists",
    );
  });
});

// ---------------------------------------------------------------------------
// renderHook tests for useParameterInsert default export
// ---------------------------------------------------------------------------

const createHookQueryClient = () =>
  new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

const createHookWrapper = (queryClient: QueryClient) =>
  function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  };

describe("useParameterInsert hook - renderHook tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchWithErrorHandling.mockResolvedValue({ status: 201 } as Response);
    mockSanitizeParameterName.mockImplementation((value: string) => value);
  });

  it("onSuccess calls addToList with the new parameter", async () => {
    const queryClient = createHookQueryClient();
    const newParam = createTestParam({ parameterName: "new_name" });
    mockParseResponse.mockResolvedValue(newParam);

    const { result } = renderHook(() => useParameterInsert(), {
      wrapper: createHookWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync({ payload: createTestParam() });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockAddToList).toHaveBeenCalledWith(
      expect.anything(),
      ["parameter"],
      newParam,
      "start",
    );
  });

  it("onError puts mutation into error state", async () => {
    const queryClient = createHookQueryClient();
    const { FetchError } = jest.requireMock("../../utils/fetchUtils");
    mockFetchWithErrorHandling.mockRejectedValue(new FetchError("Insert failed", 400));

    const { result } = renderHook(() => useParameterInsert(), {
      wrapper: createHookWrapper(queryClient),
    });

    await act(async () => {
      try {
        await result.current.mutateAsync({ payload: createTestParam() });
      } catch {
        // expected
      }
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
