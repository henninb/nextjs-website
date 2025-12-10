/**
 * TDD Tests for Modern useParameterUpdate
 * Modern endpoint: PUT /api/parameter/{parameterName}
 *
 * Key differences from legacy:
 * - Endpoint: /api/parameter/{parameterName} (vs /api/parameter/update/{parameterName})
 * - Uses parameterName instead of parameterId
 * - Sends newParameter in request body
 * - Uses ServiceResult pattern for errors
 */

import { ConsoleSpy } from "../../testHelpers";
import { createModernFetchMock } from "../../testHelpers";
import Parameter from "../../model/Parameter";


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

// Modern implementation to test
const updateParameterModern = async (
  oldParameter: Parameter,
  newParameter: Parameter,
): Promise<Parameter> => {
  const endpoint = `/api/parameter/${oldParameter.parameterName}`;
  try {
    const response = await fetch(endpoint, {
      method: "PUT",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(newParameter),
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

    return await response.json();
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

describe("useParameterUpdate Modern Endpoint (TDD)", () => {
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
    it("should use modern endpoint /api/parameter/{parameterName}", async () => {
      const oldParameter = createTestParameter({
        parameterId: 123,
        parameterName: "test_param_123",
      });
      const newParameter = createTestParameter({
        parameterId: 123,
        parameterName: "test_param_123",
        parameterValue: "updated_value",
      });

      global.fetch = createModernFetchMock(newParameter);

      await updateParameterModern(oldParameter, newParameter);

      expect(fetch).toHaveBeenCalledWith("/api/parameter/test_param_123", {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(newParameter),
      });
    });

    it("should update parameter successfully", async () => {
      const oldParameter = createTestParameter({
        parameterId: 1,
        parameterValue: "old_value",
      });
      const newParameter = createTestParameter({
        parameterId: 1,
        parameterValue: "new_value",
      });

      global.fetch = createModernFetchMock(newParameter);

      const result = await updateParameterModern(oldParameter, newParameter);

      expect(result).toStrictEqual(newParameter);
      expect(result.parameterValue).toBe("new_value");
    });

    it("should send newParameter in request body", async () => {
      const oldParameter = createTestParameter({ parameterId: 1 });
      const newParameter = createTestParameter({
        parameterId: 1,
        parameterValue: "updated_value",
      });

      global.fetch = createModernFetchMock(newParameter);

      await updateParameterModern(oldParameter, newParameter);

      const callArgs = (fetch as jest.Mock).mock.calls[0][1];
      expect(callArgs.body).toBe(JSON.stringify(newParameter));
    });

    it("should use parameterName from oldParameter in URL", async () => {
      const oldParameter = createTestParameter({
        parameterId: 999,
        parameterName: "test_param_999",
      });
      const newParameter = createTestParameter({
        parameterId: 999,
        parameterName: "test_param_999",
      });

      global.fetch = createModernFetchMock(newParameter);

      await updateParameterModern(oldParameter, newParameter);

      expect(fetch).toHaveBeenCalledWith(
        "/api/parameter/test_param_999",
        expect.any(Object),
      );
    });
  });

  describe("Modern error handling with ServiceResult pattern", () => {
    it("should handle 404 not found with modern error format", async () => {
      const oldParameter = createTestParameter({ parameterId: 999 });
      const newParameter = createTestParameter({ parameterId: 999 });

      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({ error: "Parameter not found" }),
      });

      consoleSpy.start();

      await expect(
        updateParameterModern(oldParameter, newParameter),
      ).rejects.toThrow("Parameter not found");
    });

    it("should handle validation errors with modern format", async () => {
      const oldParameter = createTestParameter();
      const newParameter = createTestParameter({ parameterValue: "" });

      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({
          errors: [
            "parameterValue is required",
            "parameterValue must be non-empty",
          ],
        }),
      });

      consoleSpy.start();

      await expect(
        updateParameterModern(oldParameter, newParameter),
      ).rejects.toThrow(
        "parameterValue is required, parameterValue must be non-empty",
      );
    });

    it("should handle 401 unauthorized", async () => {
      const oldParameter = createTestParameter();
      const newParameter = createTestParameter();

      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ error: "Unauthorized" }),
      });

      consoleSpy.start();

      await expect(
        updateParameterModern(oldParameter, newParameter),
      ).rejects.toThrow("Unauthorized");
    });

    it("should handle 403 forbidden", async () => {
      const oldParameter = createTestParameter();
      const newParameter = createTestParameter();

      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 403,
        json: async () => ({ error: "Forbidden" }),
      });

      consoleSpy.start();

      await expect(
        updateParameterModern(oldParameter, newParameter),
      ).rejects.toThrow("Forbidden");
    });

    it("should handle 500 server error", async () => {
      const oldParameter = createTestParameter();
      const newParameter = createTestParameter();

      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ error: "Internal server error" }),
      });

      consoleSpy.start();

      await expect(
        updateParameterModern(oldParameter, newParameter),
      ).rejects.toThrow("Internal server error");
    });

    it("should handle error response without error field", async () => {
      const oldParameter = createTestParameter();
      const newParameter = createTestParameter();

      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({}),
      });

      consoleSpy.start();

      await expect(
        updateParameterModern(oldParameter, newParameter),
      ).rejects.toThrow("HTTP error! Status: 400");
    });

    it("should handle invalid JSON in error response", async () => {
      const oldParameter = createTestParameter();
      const newParameter = createTestParameter();

      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: jest.fn().mockRejectedValue(new Error("Invalid JSON")),
      });

      consoleSpy.start();

      await expect(
        updateParameterModern(oldParameter, newParameter),
      ).rejects.toThrow("HTTP error! Status: 500");
    });
  });

  describe("Network and connectivity errors", () => {
    it("should handle network errors", async () => {
      const oldParameter = createTestParameter();
      const newParameter = createTestParameter();

      global.fetch = jest.fn().mockRejectedValue(new Error("Network error"));

      consoleSpy.start();

      await expect(
        updateParameterModern(oldParameter, newParameter),
      ).rejects.toThrow("Network error");

      const calls = consoleSpy.getCalls();
      expect(
        calls.error.some((call) => call[0].includes("An error occurred:")),
      ).toBe(true);
    });

    it("should handle timeout errors", async () => {
      const oldParameter = createTestParameter();
      const newParameter = createTestParameter();

      global.fetch = jest.fn().mockRejectedValue(new Error("Timeout"));

      consoleSpy.start();

      await expect(
        updateParameterModern(oldParameter, newParameter),
      ).rejects.toThrow("Timeout");
    });

    it("should handle connection refused", async () => {
      const oldParameter = createTestParameter();
      const newParameter = createTestParameter();

      global.fetch = jest
        .fn()
        .mockRejectedValue(new Error("Connection refused"));

      consoleSpy.start();

      await expect(
        updateParameterModern(oldParameter, newParameter),
      ).rejects.toThrow("Connection refused");
    });
  });

  describe("Request configuration", () => {
    it("should use PUT method", async () => {
      const oldParameter = createTestParameter();
      const newParameter = createTestParameter();

      global.fetch = createModernFetchMock(newParameter);

      await updateParameterModern(oldParameter, newParameter);

      const callArgs = (fetch as jest.Mock).mock.calls[0][1];
      expect(callArgs.method).toBe("PUT");
    });

    it("should include credentials", async () => {
      const oldParameter = createTestParameter();
      const newParameter = createTestParameter();

      global.fetch = createModernFetchMock(newParameter);

      await updateParameterModern(oldParameter, newParameter);

      const callArgs = (fetch as jest.Mock).mock.calls[0][1];
      expect(callArgs.credentials).toBe("include");
    });

    it("should include correct headers", async () => {
      const oldParameter = createTestParameter();
      const newParameter = createTestParameter();

      global.fetch = createModernFetchMock(newParameter);

      await updateParameterModern(oldParameter, newParameter);

      const callArgs = (fetch as jest.Mock).mock.calls[0][1];
      expect(callArgs.headers).toStrictEqual({
        "Content-Type": "application/json",
        Accept: "application/json",
      });
    });
  });

  describe("Parameter value updates", () => {
    it("should update parameter value", async () => {
      const oldParameter = createTestParameter({
        parameterValue: "old_value",
      });
      const newParameter = createTestParameter({
        parameterValue: "new_value",
      });

      global.fetch = createModernFetchMock(newParameter);

      const result = await updateParameterModern(oldParameter, newParameter);

      expect(result.parameterValue).toBe("new_value");
    });

    it("should update parameter name", async () => {
      const oldParameter = createTestParameter({
        parameterName: "old_name",
      });
      const newParameter = createTestParameter({
        parameterName: "new_name",
      });

      global.fetch = createModernFetchMock(newParameter);

      const result = await updateParameterModern(oldParameter, newParameter);

      expect(result.parameterName).toBe("new_name");
    });

    it("should update activeStatus", async () => {
      const oldParameter = createTestParameter({ activeStatus: true });
      const newParameter = createTestParameter({ activeStatus: false });

      global.fetch = createModernFetchMock(newParameter);

      const result = await updateParameterModern(oldParameter, newParameter);

      expect(result.activeStatus).toBe(false);
    });

    it("should update multiple fields simultaneously", async () => {
      const oldParameter = createTestParameter({
        parameterName: "old_name",
        parameterValue: "old_value",
        activeStatus: true,
      });
      const newParameter = createTestParameter({
        parameterName: "new_name",
        parameterValue: "new_value",
        activeStatus: false,
      });

      global.fetch = createModernFetchMock(newParameter);

      const result = await updateParameterModern(oldParameter, newParameter);

      expect(result.parameterName).toBe("new_name");
      expect(result.parameterValue).toBe("new_value");
      expect(result.activeStatus).toBe(false);
    });
  });

  describe("Edge cases", () => {
    it("should handle parameters with special characters", async () => {
      const oldParameter = createTestParameter();
      const newParameter = createTestParameter({
        parameterValue: "value!@#$%^&*()",
      });

      global.fetch = createModernFetchMock(newParameter);

      const result = await updateParameterModern(oldParameter, newParameter);

      expect(result.parameterValue).toBe("value!@#$%^&*()");
    });

    it("should handle parameters with Unicode characters", async () => {
      const oldParameter = createTestParameter();
      const newParameter = createTestParameter({
        parameterValue: "Hello 世界 🌍",
      });

      global.fetch = createModernFetchMock(newParameter);

      const result = await updateParameterModern(oldParameter, newParameter);

      expect(result.parameterValue).toBe("Hello 世界 🌍");
    });

    it("should handle parameters with empty values", async () => {
      const oldParameter = createTestParameter();
      const newParameter = createTestParameter({ parameterValue: "" });

      global.fetch = createModernFetchMock(newParameter);

      const result = await updateParameterModern(oldParameter, newParameter);

      expect(result.parameterValue).toBe("");
    });

    it("should handle parameters with very long values", async () => {
      const longValue = "a".repeat(10000);
      const oldParameter = createTestParameter();
      const newParameter = createTestParameter({ parameterValue: longValue });

      global.fetch = createModernFetchMock(newParameter);

      const result = await updateParameterModern(oldParameter, newParameter);

      expect(result.parameterValue).toBe(longValue);
      expect(result.parameterValue.length).toBe(10000);
    });

    it("should handle parameters with JSON values", async () => {
      const jsonValue = '{"key": "value", "nested": {"data": 123}}';
      const oldParameter = createTestParameter();
      const newParameter = createTestParameter({ parameterValue: jsonValue });

      global.fetch = createModernFetchMock(newParameter);

      const result = await updateParameterModern(oldParameter, newParameter);

      expect(result.parameterValue).toBe(jsonValue);
    });
  });

  describe("Common update scenarios", () => {
    it("should update payment account parameter", async () => {
      const oldParameter = createTestParameter({
        parameterName: "payment_account",
        parameterValue: "checking_old",
      });
      const newParameter = createTestParameter({
        parameterName: "payment_account",
        parameterValue: "checking_new",
      });

      global.fetch = createModernFetchMock(newParameter);

      const result = await updateParameterModern(oldParameter, newParameter);

      expect(result.parameterName).toBe("payment_account");
      expect(result.parameterValue).toBe("checking_new");
    });

    it("should update configuration parameter", async () => {
      const oldParameter = createTestParameter({
        parameterName: "default_category",
        parameterValue: "groceries",
      });
      const newParameter = createTestParameter({
        parameterName: "default_category",
        parameterValue: "dining",
      });

      global.fetch = createModernFetchMock(newParameter);

      const result = await updateParameterModern(oldParameter, newParameter);

      expect(result.parameterValue).toBe("dining");
    });

    it("should deactivate parameter", async () => {
      const oldParameter = createTestParameter({
        parameterName: "old_feature_flag",
        activeStatus: true,
      });
      const newParameter = createTestParameter({
        parameterName: "old_feature_flag",
        activeStatus: false,
      });

      global.fetch = createModernFetchMock(newParameter);

      const result = await updateParameterModern(oldParameter, newParameter);

      expect(result.activeStatus).toBe(false);
    });

    it("should update numeric parameter value", async () => {
      const oldParameter = createTestParameter({
        parameterName: "max_amount",
        parameterValue: "1000",
      });
      const newParameter = createTestParameter({
        parameterName: "max_amount",
        parameterValue: "2000",
      });

      global.fetch = createModernFetchMock(newParameter);

      const result = await updateParameterModern(oldParameter, newParameter);

      expect(result.parameterValue).toBe("2000");
    });
  });

  describe("Data integrity", () => {
    it("should preserve parameterId", async () => {
      const oldParameter = createTestParameter({ parameterId: 123 });
      const newParameter = createTestParameter({ parameterId: 123 });

      global.fetch = createModernFetchMock(newParameter);

      const result = await updateParameterModern(oldParameter, newParameter);

      expect(result.parameterId).toBe(123);
    });

    it("should return updated parameter exactly as received from API", async () => {
      const oldParameter = createTestParameter();
      const newParameter = createTestParameter({
        parameterId: 1,
        parameterName: "updated_param",
        parameterValue: "updated_value",
        activeStatus: true,
      });

      global.fetch = createModernFetchMock(newParameter);

      const result = await updateParameterModern(oldParameter, newParameter);

      expect(result).toStrictEqual(newParameter);
    });
  });
});
