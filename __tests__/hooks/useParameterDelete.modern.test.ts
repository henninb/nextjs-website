/**
 * TDD Tests for Modern useParameterDelete
 * Modern endpoint: DELETE /api/parameter/{parameterId}
 *
 * Key differences from legacy:
 * - Endpoint: /api/parameter/{parameterId} (vs /api/parameter/delete/{parameterName})
 * - Uses parameterId instead of parameterName
 * - Uses ServiceResult pattern for errors
 */

import { ConsoleSpy } from "../../testHelpers";
import { createModernFetchMock } from "../../testHelpers.modern";
import Parameter from "../../model/Parameter";

// Modern implementation to test
const deleteParameterModern = async (
  payload: Parameter,
): Promise<Parameter | null> => {
  try {
    const endpoint = `/api/parameter/${payload.parameterId}`;

    const response = await fetch(endpoint, {
      method: "DELETE",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({ error: `HTTP error! Status: ${response.status}` }));
      const errorMessage = errorBody.error || errorBody.errors?.join(", ") || `HTTP error! Status: ${response.status}`;
      throw new Error(errorMessage);
    }

    return response.status !== 204 ? await response.json() : null;
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

describe("useParameterDelete Modern Endpoint (TDD)", () => {
  let consoleSpy: ConsoleSpy;

  beforeEach(() => {
    consoleSpy = new ConsoleSpy();
    jest.clearAllMocks();
  });

  afterEach(() => {
    consoleSpy.stop();
  });

  describe("Modern endpoint behavior", () => {
    it("should use modern endpoint /api/parameter/{parameterId}", async () => {
      const testParameter = createTestParameter({ parameterId: 123 });

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 204,
      });

      await deleteParameterModern(testParameter);

      expect(fetch).toHaveBeenCalledWith("/api/parameter/123", {
        method: "DELETE",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });
    });

    it("should delete parameter successfully with 204 response", async () => {
      const testParameter = createTestParameter();

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 204,
      });

      const result = await deleteParameterModern(testParameter);

      expect(result).toBeNull();
    });

    it("should delete parameter successfully with 200 response", async () => {
      const testParameter = createTestParameter();

      global.fetch = createModernFetchMock(testParameter);

      const result = await deleteParameterModern(testParameter);

      expect(result).toEqual(testParameter);
    });

    it("should use parameterId from payload in URL", async () => {
      const testParameter = createTestParameter({ parameterId: 999 });

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 204,
      });

      await deleteParameterModern(testParameter);

      expect(fetch).toHaveBeenCalledWith(
        "/api/parameter/999",
        expect.any(Object),
      );
    });
  });

  describe("Modern error handling with ServiceResult pattern", () => {
    it("should handle 404 not found with modern error format", async () => {
      const testParameter = createTestParameter({ parameterId: 999 });

      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({ error: "Parameter not found" }),
      });

      consoleSpy.start();

      await expect(deleteParameterModern(testParameter)).rejects.toThrow(
        "Parameter not found",
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

      await expect(deleteParameterModern(testParameter)).rejects.toThrow(
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

      await expect(deleteParameterModern(testParameter)).rejects.toThrow(
        "Forbidden",
      );
    });

    it("should handle 409 conflict (parameter in use)", async () => {
      const testParameter = createTestParameter({
        parameterName: "payment_account",
      });

      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 409,
        json: async () => ({
          error: "Cannot delete parameter payment_account - in use",
        }),
      });

      consoleSpy.start();

      await expect(deleteParameterModern(testParameter)).rejects.toThrow(
        "Cannot delete parameter payment_account - in use",
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

      await expect(deleteParameterModern(testParameter)).rejects.toThrow(
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

      await expect(deleteParameterModern(testParameter)).rejects.toThrow(
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

      await expect(deleteParameterModern(testParameter)).rejects.toThrow(
        "HTTP error! Status: 500",
      );
    });

    it("should handle validation errors with modern format", async () => {
      const testParameter = createTestParameter();

      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({
          errors: [
            "parameterId is required",
            "parameterId must be a valid number",
          ],
        }),
      });

      consoleSpy.start();

      await expect(deleteParameterModern(testParameter)).rejects.toThrow(
        "parameterId is required, parameterId must be a valid number",
      );
    });
  });

  describe("Network and connectivity errors", () => {
    it("should handle network errors", async () => {
      const testParameter = createTestParameter();

      global.fetch = jest
        .fn()
        .mockRejectedValue(new Error("Network error"));

      consoleSpy.start();

      await expect(deleteParameterModern(testParameter)).rejects.toThrow(
        "Network error",
      );

      const calls = consoleSpy.getCalls();
      expect(
        calls.error.some((call) =>
          call[0].includes("An error occurred:"),
        ),
      ).toBe(true);
    });

    it("should handle timeout errors", async () => {
      const testParameter = createTestParameter();

      global.fetch = jest.fn().mockRejectedValue(new Error("Timeout"));

      consoleSpy.start();

      await expect(deleteParameterModern(testParameter)).rejects.toThrow(
        "Timeout",
      );
    });

    it("should handle connection refused", async () => {
      const testParameter = createTestParameter();

      global.fetch = jest
        .fn()
        .mockRejectedValue(new Error("Connection refused"));

      consoleSpy.start();

      await expect(deleteParameterModern(testParameter)).rejects.toThrow(
        "Connection refused",
      );
    });
  });

  describe("Request configuration", () => {
    it("should use DELETE method", async () => {
      const testParameter = createTestParameter();

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 204,
      });

      await deleteParameterModern(testParameter);

      const callArgs = (fetch as jest.Mock).mock.calls[0][1];
      expect(callArgs.method).toBe("DELETE");
    });

    it("should include credentials", async () => {
      const testParameter = createTestParameter();

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 204,
      });

      await deleteParameterModern(testParameter);

      const callArgs = (fetch as jest.Mock).mock.calls[0][1];
      expect(callArgs.credentials).toBe("include");
    });

    it("should include correct headers", async () => {
      const testParameter = createTestParameter();

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 204,
      });

      await deleteParameterModern(testParameter);

      const callArgs = (fetch as jest.Mock).mock.calls[0][1];
      expect(callArgs.headers).toEqual({
        "Content-Type": "application/json",
        Accept: "application/json",
      });
    });

    it("should not send body in DELETE request", async () => {
      const testParameter = createTestParameter();

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 204,
      });

      await deleteParameterModern(testParameter);

      const callArgs = (fetch as jest.Mock).mock.calls[0][1];
      expect(callArgs.body).toBeUndefined();
    });
  });

  describe("Response handling", () => {
    it("should return null for 204 No Content", async () => {
      const testParameter = createTestParameter();

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 204,
      });

      const result = await deleteParameterModern(testParameter);

      expect(result).toBeNull();
    });

    it("should return parameter data for 200 OK", async () => {
      const testParameter = createTestParameter({
        parameterId: 123,
        parameterName: "deleted_param",
      });

      global.fetch = createModernFetchMock(testParameter);

      const result = await deleteParameterModern(testParameter);

      expect(result).toEqual(testParameter);
    });

    it("should handle different parameterId values", async () => {
      const parameterIds = [1, 100, 999, 12345];

      for (const id of parameterIds) {
        const testParameter = createTestParameter({ parameterId: id });

        global.fetch = jest.fn().mockResolvedValue({
          ok: true,
          status: 204,
        });

        await deleteParameterModern(testParameter);

        expect(fetch).toHaveBeenCalledWith(
          `/api/parameter/${id}`,
          expect.any(Object),
        );
      }
    });
  });

  describe("Common deletion scenarios", () => {
    it("should delete payment account parameter", async () => {
      const testParameter = createTestParameter({
        parameterId: 1,
        parameterName: "payment_account",
        parameterValue: "checking_old",
      });

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 204,
      });

      const result = await deleteParameterModern(testParameter);

      expect(result).toBeNull();
      expect(fetch).toHaveBeenCalledWith("/api/parameter/1", expect.any(Object));
    });

    it("should delete configuration parameter", async () => {
      const testParameter = createTestParameter({
        parameterId: 2,
        parameterName: "old_config",
        parameterValue: "deprecated",
      });

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 204,
      });

      const result = await deleteParameterModern(testParameter);

      expect(result).toBeNull();
    });

    it("should delete inactive parameter", async () => {
      const testParameter = createTestParameter({
        parameterId: 3,
        activeStatus: false,
      });

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 204,
      });

      const result = await deleteParameterModern(testParameter);

      expect(result).toBeNull();
    });
  });

  describe("Edge cases", () => {
    it("should handle deletion of parameter with special characters in name", async () => {
      const testParameter = createTestParameter({
        parameterId: 100,
        parameterName: "param-with_special.chars",
      });

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 204,
      });

      await deleteParameterModern(testParameter);

      expect(fetch).toHaveBeenCalledWith(
        "/api/parameter/100",
        expect.any(Object),
      );
    });

    it("should handle deletion of parameter with Unicode characters in value", async () => {
      const testParameter = createTestParameter({
        parameterId: 101,
        parameterValue: "Hello 世界 🌍",
      });

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 204,
      });

      const result = await deleteParameterModern(testParameter);

      expect(result).toBeNull();
    });

    it("should handle deletion of parameter with long value", async () => {
      const longValue = "a".repeat(10000);
      const testParameter = createTestParameter({
        parameterId: 102,
        parameterValue: longValue,
      });

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 204,
      });

      const result = await deleteParameterModern(testParameter);

      expect(result).toBeNull();
    });

    it("should handle deletion of parameter with empty value", async () => {
      const testParameter = createTestParameter({
        parameterId: 103,
        parameterValue: "",
      });

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 204,
      });

      const result = await deleteParameterModern(testParameter);

      expect(result).toBeNull();
    });
  });

  describe("Data integrity", () => {
    it("should use correct parameterId from payload", async () => {
      const testParameter = createTestParameter({
        parameterId: 456,
        parameterName: "test",
      });

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 204,
      });

      await deleteParameterModern(testParameter);

      const url = (fetch as jest.Mock).mock.calls[0][0];
      expect(url).toBe("/api/parameter/456");
    });

    it("should return exact parameter data when API returns 200", async () => {
      const testParameter = createTestParameter({
        parameterId: 789,
        parameterName: "exact_param",
        parameterValue: "exact_value",
        activeStatus: true,
      });

      global.fetch = createModernFetchMock(testParameter);

      const result = await deleteParameterModern(testParameter);

      expect(result).toEqual(testParameter);
    });
  });

  describe("Error logging", () => {
    it("should log error message to console", async () => {
      const testParameter = createTestParameter();

      global.fetch = jest
        .fn()
        .mockRejectedValue(new Error("Test error"));

      consoleSpy.start();

      await expect(deleteParameterModern(testParameter)).rejects.toThrow();

      const calls = consoleSpy.getCalls();
      expect(
        calls.error.some((call) =>
          call[0].includes("An error occurred: Test error"),
        ),
      ).toBe(true);
    });
  });
});
