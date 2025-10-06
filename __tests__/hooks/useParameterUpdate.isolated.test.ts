/**
 * Isolated tests for useParameterUpdate business logic
 * Tests updateParameter function without React Query overhead
 */

import {
  ConsoleSpy,
  createTestParameter,
} from "../../testHelpers";
import {
  createModernFetchMock,
  createModernErrorFetchMock,
} from "../../testHelpers.modern";
import Parameter from "../../model/Parameter";

import { updateParameter } from "../../hooks/useParameterUpdate";

describe("updateParameter (Isolated)", () => {
  let consoleSpy: ConsoleSpy;

  beforeEach(() => {
    consoleSpy = new ConsoleSpy();
    jest.clearAllMocks();
  });

  afterEach(() => {
    consoleSpy.stop();
  });

  describe("Successful updates", () => {
    it("should update parameter successfully", async () => {
      const oldParameter = createTestParameter({
        parameterName: "OLD_CONFIG",
        parameterValue: "old-value",
      });

      const updatedParameter = createTestParameter({
        parameterId: 1,
        parameterName: "OLD_CONFIG", // Name stays the same in response
        parameterValue: "new-value",
        activeStatus: true,
      });

      global.fetch = createModernFetchMock(updatedParameter);

      const result = await updateParameter(oldParameter, updatedParameter);

      expect(result).toEqual(updatedParameter);
      expect(fetch).toHaveBeenCalledWith(
        `/api/parameter/${oldParameter.parameterName}`,
        {
          method: "PUT",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(updatedParameter),
        },
      );
    });

    it("should use old parameter name in endpoint path", async () => {
      const oldParameter = createTestParameter({
        parameterId: 123,
        parameterName: "ORIGINAL_PARAM",
      });

      const newParameter = createTestParameter({
        parameterId: 123,
        parameterName: "ORIGINAL_PARAM",
      });

      global.fetch = createModernFetchMock(newParameter);

      await updateParameter(oldParameter, newParameter);

      expect(fetch).toHaveBeenCalledWith(
        "/api/parameter/ORIGINAL_PARAM",
        expect.any(Object),
      );
    });

    it("should send newParameter in request body", async () => {
      const oldParameter = createTestParameter({
        parameterId: 1,
        parameterName: "TEST_PARAM",
      });
      const newParameter = createTestParameter({
        parameterId: 1,
        parameterName: "TEST_PARAM",
        parameterValue: "new-value",
      });

      global.fetch = createModernFetchMock(newParameter);

      await updateParameter(oldParameter, newParameter);

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify(newParameter),
        }),
      );
    });

    it("should handle configuration parameter updates", async () => {
      const oldParameter = createTestParameter({
        parameterName: "APP_VERSION",
        parameterValue: "v1.0.0",
      });

      const updatedParameter = createTestParameter({
        parameterName: "APP_VERSION",
        parameterValue: "v1.1.0",
      });

      global.fetch = createModernFetchMock(updatedParameter);

      const result = await updateParameter(oldParameter, updatedParameter);

      expect(result.parameterValue).toBe("v1.1.0");
    });

    it("should handle system parameter updates", async () => {
      const oldParameter = createTestParameter({
        parameterName: "MAINTENANCE_MODE",
        parameterValue: "false",
      });

      const updatedParameter = createTestParameter({
        parameterName: "MAINTENANCE_MODE",
        parameterValue: "true",
      });

      global.fetch = createModernFetchMock(updatedParameter);

      const result = await updateParameter(oldParameter, updatedParameter);

      expect(result.parameterValue).toBe("true");
    });

    it("should handle feature flag updates", async () => {
      const oldParameter = createTestParameter({
        parameterName: "FEATURE_NEW_UI",
        parameterValue: "disabled",
        activeStatus: false,
      });

      const updatedParameter = createTestParameter({
        parameterName: "FEATURE_NEW_UI",
        parameterValue: "enabled",
        activeStatus: true,
      });

      global.fetch = createModernFetchMock(updatedParameter);

      const result = await updateParameter(oldParameter, updatedParameter);

      expect(result.parameterValue).toBe("enabled");
      expect(result.activeStatus).toBe(true);
    });
  });

  describe("Error handling", () => {
    it("should handle 404 not found errors", async () => {
      const oldParameter = createTestParameter({
        parameterName: "NONEXISTENT_PARAM",
      });
      const newParameter = createTestParameter();

      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: "Not Found",
        json: jest.fn().mockResolvedValue({}),
      });
      consoleSpy.start();

      await expect(updateParameter(oldParameter, newParameter)).rejects.toThrow(
        "HTTP error! Status: 404",
      );

      const calls = consoleSpy.getCalls();
      expect(calls.error[0]).toEqual([
        "An error occurred: HTTP error! Status: 404",
      ]);
    });

    it("should handle 400 bad request errors", async () => {
      const oldParameter = createTestParameter();
      const newParameter = createTestParameter();

      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 400,
        statusText: "Bad Request",
        json: jest.fn().mockResolvedValue({}),
      });
      consoleSpy.start();

      await expect(updateParameter(oldParameter, newParameter)).rejects.toThrow(
        "HTTP error! Status: 400",
      );

      const calls = consoleSpy.getCalls();
      expect(calls.error[0]).toEqual([
        "An error occurred: HTTP error! Status: 400",
      ]);
    });

    it("should handle 403 forbidden errors for restricted parameters", async () => {
      const oldParameter = createTestParameter({
        parameterName: "SYSTEM_CRITICAL_PARAM",
      });
      const newParameter = createTestParameter();

      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 403,
        statusText: "Forbidden",
        json: jest.fn().mockResolvedValue({}),
      });
      consoleSpy.start();

      await expect(updateParameter(oldParameter, newParameter)).rejects.toThrow(
        "HTTP error! Status: 403",
      );

      const calls = consoleSpy.getCalls();
      expect(calls.error[0]).toEqual([
        "An error occurred: HTTP error! Status: 403",
      ]);
    });

    it("should handle 500 server errors", async () => {
      const oldParameter = createTestParameter();
      const newParameter = createTestParameter();

      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
        json: jest.fn().mockResolvedValue({}),
      });
      consoleSpy.start();

      await expect(updateParameter(oldParameter, newParameter)).rejects.toThrow(
        "HTTP error! Status: 500",
      );

      const calls = consoleSpy.getCalls();
      expect(calls.error[0]).toEqual([
        "An error occurred: HTTP error! Status: 500",
      ]);
    });

    it("should handle network errors", async () => {
      const oldParameter = createTestParameter();
      const newParameter = createTestParameter();

      global.fetch = jest.fn().mockRejectedValue(new Error("Network error"));
      consoleSpy.start();

      await expect(updateParameter(oldParameter, newParameter)).rejects.toThrow(
        "Network error",
      );

      const calls = consoleSpy.getCalls();
      expect(calls.error[0]).toEqual(["An error occurred: Network error"]);
    });

    it("should handle timeout errors", async () => {
      const oldParameter = createTestParameter();
      const newParameter = createTestParameter();

      global.fetch = jest.fn().mockRejectedValue(new Error("Request timeout"));
      consoleSpy.start();

      await expect(updateParameter(oldParameter, newParameter)).rejects.toThrow(
        "Request timeout",
      );

      const calls = consoleSpy.getCalls();
      expect(calls.error[0]).toEqual(["An error occurred: Request timeout"]);
    });
  });

  describe("Request format validation", () => {
    it("should use PUT method", async () => {
      const oldParameter = createTestParameter();
      const newParameter = createTestParameter();

      global.fetch = createModernFetchMock(newParameter);

      await updateParameter(oldParameter, newParameter);

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ method: "PUT" }),
      );
    });

    it("should include credentials", async () => {
      const oldParameter = createTestParameter();
      const newParameter = createTestParameter();

      global.fetch = createModernFetchMock(newParameter);

      await updateParameter(oldParameter, newParameter);

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ credentials: "include" }),
      );
    });

    it("should send correct headers", async () => {
      const oldParameter = createTestParameter();
      const newParameter = createTestParameter();

      global.fetch = createModernFetchMock(newParameter);

      await updateParameter(oldParameter, newParameter);

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }),
      );
    });

    it("should always send newParameter in body", async () => {
      const oldParameter = createTestParameter({
        parameterId: 1,
        parameterName: "TEST_PARAM",
        parameterValue: "some-value",
      });
      const newParameter = createTestParameter({
        parameterId: 1,
        parameterName: "TEST_PARAM",
        parameterValue: "different-value",
      });

      global.fetch = createModernFetchMock(newParameter);

      await updateParameter(oldParameter, newParameter);

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify(newParameter),
        }),
      );
    });
  });

  describe("Edge cases and special scenarios", () => {
    it("should handle special characters in parameter names", async () => {
      const oldParameter = createTestParameter({
        parameterId: 1,
        parameterName: "SPECIAL_CHARS!@#$%",
      });
      const updatedParameter = createTestParameter({
        parameterId: 1,
        parameterName: "SPECIAL_CHARS!@#$%",
        parameterValue: "updated-value",
      });

      global.fetch = createModernFetchMock(updatedParameter);

      const result = await updateParameter(oldParameter, updatedParameter);

      expect(result.parameterName).toBe("SPECIAL_CHARS!@#$%");
      expect(fetch).toHaveBeenCalledWith(
        "/api/parameter/SPECIAL_CHARS!@#$%",
        expect.any(Object),
      );
    });

    it("should handle unicode characters in parameter names", async () => {
      const oldParameter = createTestParameter({
        parameterId: 2,
        parameterName: "测试参数",
      });
      const updatedParameter = createTestParameter({
        parameterId: 2,
        parameterName: "测试参数",
        parameterValue: "unicode-value 🚀",
      });

      global.fetch = createModernFetchMock(updatedParameter);

      const result = await updateParameter(oldParameter, updatedParameter);

      expect(result.parameterName).toBe("测试参数");
      expect(result.parameterValue).toBe("unicode-value 🚀");
    });

    it("should handle very long parameter names", async () => {
      const longName = "VERY_LONG_PARAMETER_NAME_" + "A".repeat(400);
      const oldParameter = createTestParameter({
        parameterId: 3,
        parameterName: longName,
      });
      const updatedParameter = createTestParameter({
        parameterId: 3,
        parameterName: longName,
        parameterValue: "updated-value",
      });

      global.fetch = createModernFetchMock(updatedParameter);

      const result = await updateParameter(oldParameter, updatedParameter);

      expect(result.parameterName).toBe(longName);
      expect(fetch).toHaveBeenCalledWith(
        `/api/parameter/${longName}`,
        expect.any(Object),
      );
    });

    it("should handle activating inactive parameters", async () => {
      const oldParameter = createTestParameter({
        parameterName: "INACTIVE_PARAM",
        activeStatus: false,
      });
      const updatedParameter = createTestParameter({
        parameterName: "INACTIVE_PARAM",
        activeStatus: true,
      });

      global.fetch = createModernFetchMock(updatedParameter);

      const result = await updateParameter(oldParameter, updatedParameter);

      expect(result.activeStatus).toBe(true);
    });

    it("should handle deactivating active parameters", async () => {
      const oldParameter = createTestParameter({
        parameterName: "ACTIVE_PARAM",
        activeStatus: true,
      });
      const updatedParameter = createTestParameter({
        parameterName: "ACTIVE_PARAM",
        activeStatus: false,
      });

      global.fetch = createModernFetchMock(updatedParameter);

      const result = await updateParameter(oldParameter, updatedParameter);

      expect(result.activeStatus).toBe(false);
    });
  });

  describe("Business logic scenarios", () => {
    it("should handle environment configuration updates", async () => {
      const oldParameter = createTestParameter({
        parameterName: "ENV_MODE",
        parameterValue: "development",
      });
      const updatedParameter = createTestParameter({
        parameterName: "ENV_MODE",
        parameterValue: "production",
      });

      global.fetch = createModernFetchMock(updatedParameter);

      const result = await updateParameter(oldParameter, updatedParameter);

      expect(result.parameterValue).toBe("production");
    });

    it("should handle debug level changes", async () => {
      const oldParameter = createTestParameter({
        parameterName: "DEBUG_LEVEL",
        parameterValue: "info",
      });
      const updatedParameter = createTestParameter({
        parameterName: "DEBUG_LEVEL",
        parameterValue: "error",
      });

      global.fetch = createModernFetchMock(updatedParameter);

      const result = await updateParameter(oldParameter, updatedParameter);

      expect(result.parameterValue).toBe("error");
    });

    it("should handle timeout configuration updates", async () => {
      const oldParameter = createTestParameter({
        parameterName: "API_TIMEOUT",
        parameterValue: "30000",
      });
      const updatedParameter = createTestParameter({
        parameterName: "API_TIMEOUT",
        parameterValue: "60000",
      });

      global.fetch = createModernFetchMock(updatedParameter);

      const result = await updateParameter(oldParameter, updatedParameter);

      expect(result.parameterValue).toBe("60000");
    });

    it("should handle JSON configuration updates", async () => {
      const jsonConfig = JSON.stringify({ enabled: true, timeout: 5000 });
      const oldParameter = createTestParameter({
        parameterName: "JSON_CONFIG",
        parameterValue: JSON.stringify({ enabled: false, timeout: 3000 }),
      });
      const updatedParameter = createTestParameter({
        parameterName: "JSON_CONFIG",
        parameterValue: jsonConfig,
      });

      global.fetch = createModernFetchMock(updatedParameter);

      const result = await updateParameter(oldParameter, updatedParameter);

      expect(result.parameterValue).toBe(jsonConfig);
    });

    it("should handle boolean-like string values", async () => {
      const testCases = [
        { old: "false", new: "true" },
        { old: "disabled", new: "enabled" },
        { old: "no", new: "yes" },
        { old: "0", new: "1" },
      ];

      for (const testCase of testCases) {
        const oldParameter = createTestParameter({
          parameterName: "BOOLEAN_PARAM",
          parameterValue: testCase.old,
        });
        const updatedParameter = createTestParameter({
          parameterName: "BOOLEAN_PARAM",
          parameterValue: testCase.new,
        });

        global.fetch = createModernFetchMock(updatedParameter);

        const result = await updateParameter(oldParameter, updatedParameter);
        expect(result.parameterValue).toBe(testCase.new);
      }
    });

    it("should preserve parameter ID during updates", async () => {
      const oldParameter = createTestParameter({
        parameterId: 42,
        parameterName: "PRESERVE_ID",
      });
      const updatedParameter = createTestParameter({
        parameterId: 42,
        parameterName: "PRESERVE_ID",
        parameterValue: "updated-value",
      });

      global.fetch = createModernFetchMock(updatedParameter);

      const result = await updateParameter(oldParameter, updatedParameter);

      expect(result.parameterId).toBe(42);
      expect(result.parameterValue).toBe("updated-value");
    });

    it("should handle database migration parameter updates", async () => {
      const oldParameter = createTestParameter({
        parameterName: "DB_MIGRATION_VERSION",
        parameterValue: "20231201_001",
      });
      const updatedParameter = createTestParameter({
        parameterName: "DB_MIGRATION_VERSION",
        parameterValue: "20231225_001",
      });

      global.fetch = createModernFetchMock(updatedParameter);

      const result = await updateParameter(oldParameter, updatedParameter);

      expect(result.parameterValue).toBe("20231225_001");
    });
  });

  describe("Integration scenarios", () => {
    it("should handle complete parameter update workflow", async () => {
      const oldParameter = createTestParameter({
        parameterId: 1,
        parameterName: "WORKFLOW_PARAM",
        parameterValue: "old-config",
        activeStatus: true,
        dateAdded: new Date("2023-01-01"),
        dateUpdated: new Date("2023-01-01"),
      });

      const updatedParameter = createTestParameter({
        parameterId: 1,
        parameterName: "WORKFLOW_PARAM",
        parameterValue: "new-config",
        activeStatus: true,
        dateAdded: new Date("2023-01-01"),
        dateUpdated: new Date("2023-12-25"),
      });

      global.fetch = createModernFetchMock(updatedParameter);

      const result = await updateParameter(oldParameter, updatedParameter);

      expect(result).toEqual(updatedParameter);
      expect(fetch).toHaveBeenCalledWith(
        "/api/parameter/WORKFLOW_PARAM",
        {
          method: "PUT",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(updatedParameter),
        },
      );
    });

    it("should handle server validation errors gracefully", async () => {
      const oldParameter = createTestParameter({
        parameterName: "VALIDATION_TEST",
      });
      const invalidParameter = createTestParameter({
        parameterName: "VALIDATION_TEST",
        parameterValue: "", // Invalid value
      });

      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 422,
        statusText: "Unprocessable Entity",
        json: jest.fn().mockResolvedValue({}),
      });
      consoleSpy.start();

      await expect(
        updateParameter(oldParameter, invalidParameter),
      ).rejects.toThrow(
        "HTTP error! Status: 422",
      );

      const calls = consoleSpy.getCalls();
      expect(calls.error[0]).toEqual([
        "An error occurred: HTTP error! Status: 422",
      ]);
    });
  });

  describe("Console logging", () => {
    it("should log 404 errors specifically", async () => {
      const oldParameter = createTestParameter({
        parameterName: "NOTFOUND_PARAM",
      });
      const newParameter = createTestParameter();

      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: "Not Found",
        json: jest.fn().mockResolvedValue({}),
      });
      consoleSpy.start();

      try {
        await updateParameter(oldParameter, newParameter);
      } catch (error) {
        // Expected error
      }

      const calls = consoleSpy.getCalls();
      expect(calls.error).toHaveLength(1);
      expect(calls.error[0]).toEqual([
        "An error occurred: HTTP error! Status: 404",
      ]);
    });

    it("should log general errors", async () => {
      const oldParameter = createTestParameter();
      const newParameter = createTestParameter();

      global.fetch = jest.fn().mockRejectedValue(new Error("General error"));
      consoleSpy.start();

      try {
        await updateParameter(oldParameter, newParameter);
      } catch (error) {
        // Expected error
      }

      const calls = consoleSpy.getCalls();
      expect(calls.error[0]).toEqual(["An error occurred: General error"]);
    });

    it("should not log anything on successful operations", async () => {
      const oldParameter = createTestParameter();
      const newParameter = createTestParameter();

      global.fetch = createModernFetchMock(newParameter);
      consoleSpy.start();

      await updateParameter(oldParameter, newParameter);

      const calls = consoleSpy.getCalls();
      expect(calls.log).toHaveLength(0);
      expect(calls.error).toHaveLength(0);
      expect(calls.warn).toHaveLength(0);
    });
  });
});
