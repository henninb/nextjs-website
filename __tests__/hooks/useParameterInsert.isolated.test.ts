/**
 * Isolated tests for useParameterInsert business logic
 * Tests insertParameter function without React Query overhead
 */

import {
  createFetchMock,
  createErrorFetchMock,
  ConsoleSpy,
  createTestParameter,
} from "../../testHelpers";
import Parameter from "../../model/Parameter";

import { insertParameter } from "../../hooks/useParameterInsert";

describe("insertParameter (Isolated)", () => {
  let consoleSpy: ConsoleSpy;

  beforeEach(() => {
    consoleSpy = new ConsoleSpy();
    jest.clearAllMocks();
  });

  afterEach(() => {
    consoleSpy.stop();
  });

  describe("Successful insertion", () => {
    it("should insert parameter successfully with 200 response", async () => {
      const testParameter = createTestParameter({
        parameterName: "TEST_CONFIG",
        parameterValue: "test-value",
      });

      const expectedResponse = {
        ...testParameter,
        parameterId: 42,
        dateAdded: new Date().toISOString(),
        dateUpdated: new Date().toISOString(),
      };

      global.fetch = createFetchMock(expectedResponse);

      const result = await insertParameter(testParameter);

      expect(result).toEqual(expectedResponse);
      expect(fetch).toHaveBeenCalledWith("/api/parameter/insert", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(testParameter),
      });
    });

    it("should handle 204 no content response", async () => {
      const testParameter = createTestParameter();
      global.fetch = createFetchMock(null, { status: 204 });

      const result = await insertParameter(testParameter);

      expect(result).toBeNull();
    });

    it("should send complete parameter payload", async () => {
      const complexParameter = createTestParameter({
        parameterName: "COMPLEX_CONFIG",
        parameterValue: "complex-value-with-special-chars-!@#$%",
        activeStatus: false,
      });

      global.fetch = createFetchMock({ parameterId: 1 });

      await insertParameter(complexParameter);

      expect(fetch).toHaveBeenCalledWith(
        "/api/parameter/insert",
        expect.objectContaining({
          body: JSON.stringify(complexParameter),
        }),
      );
    });
  });

  describe("API error handling", () => {
    it("should handle 400 error with response message", async () => {
      const testParameter = createTestParameter();
      global.fetch = createErrorFetchMock("Parameter name already exists", 400);
      consoleSpy.start();

      await expect(insertParameter(testParameter)).rejects.toThrow(
        "Parameter name already exists",
      );

      const calls = consoleSpy.getCalls();
      expect(calls.log[0]).toEqual(["Parameter name already exists"]);
      expect(calls.error[0]).toEqual(["An error occurred: Parameter name already exists"]);
    });

    it("should handle 500 server error", async () => {
      const testParameter = createTestParameter();
      global.fetch = createErrorFetchMock("Internal server error", 500);
      consoleSpy.start();

      await expect(insertParameter(testParameter)).rejects.toThrow(
        "Internal server error",
      );

      const calls = consoleSpy.getCalls();
      expect(calls.log[0]).toEqual(["Internal server error"]);
      expect(calls.error[0]).toEqual(["An error occurred: Internal server error"]);
    });

    it("should handle 409 conflict error for duplicate parameters", async () => {
      const duplicateParameter = createTestParameter({
        parameterName: "EXISTING_PARAM",
        parameterValue: "some-value",
      });
      global.fetch = createErrorFetchMock("Parameter already exists with this name", 409);
      consoleSpy.start();

      await expect(insertParameter(duplicateParameter)).rejects.toThrow(
        "Parameter already exists with this name",
      );

      const calls = consoleSpy.getCalls();
      expect(calls.log[0]).toEqual(["Parameter already exists with this name"]);
    });

    it("should handle error response without message", async () => {
      const testParameter = createTestParameter();
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: jest.fn().mockResolvedValue({}),
      });
      consoleSpy.start();

      await expect(insertParameter(testParameter)).rejects.toThrow(
        "Failed to parse error response: No error message returned.",
      );

      const calls = consoleSpy.getCalls();
      expect(calls.log[0]).toEqual(["No error message returned."]);
      expect(calls.error[0]).toEqual(["An error occurred: Failed to parse error response: No error message returned."]);
    });

    it("should handle malformed error response", async () => {
      const testParameter = createTestParameter();
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: jest.fn().mockRejectedValue(new Error("Invalid JSON")),
      });
      consoleSpy.start();

      await expect(insertParameter(testParameter)).rejects.toThrow(
        "Failed to parse error response: Invalid JSON",
      );

      const calls = consoleSpy.getCalls();
      expect(calls.log[0]).toEqual(["Failed to parse error response: Invalid JSON"]);
      expect(calls.error[0]).toEqual(["An error occurred: Failed to parse error response: Invalid JSON"]);
    });

    it("should handle network errors", async () => {
      const testParameter = createTestParameter();
      global.fetch = jest.fn().mockRejectedValue(new Error("Network error"));
      consoleSpy.start();

      await expect(insertParameter(testParameter)).rejects.toThrow(
        "Network error",
      );

      const calls = consoleSpy.getCalls();
      expect(calls.error[0]).toEqual(["An error occurred: Network error"]);
    });

    it("should handle timeout errors", async () => {
      const testParameter = createTestParameter();
      global.fetch = jest.fn().mockRejectedValue(new Error("Request timeout"));
      consoleSpy.start();

      await expect(insertParameter(testParameter)).rejects.toThrow(
        "Request timeout",
      );

      const calls = consoleSpy.getCalls();
      expect(calls.error[0]).toEqual(["An error occurred: Request timeout"]);
    });
  });

  describe("Request format validation", () => {
    it("should send correct headers", async () => {
      const testParameter = createTestParameter();
      global.fetch = createFetchMock({ parameterId: 1 });

      await insertParameter(testParameter);

      expect(fetch).toHaveBeenCalledWith("/api/parameter/insert", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(testParameter),
      });
    });

    it("should use correct endpoint", async () => {
      const testParameter = createTestParameter();
      global.fetch = createFetchMock({ parameterId: 1 });

      await insertParameter(testParameter);

      expect(fetch).toHaveBeenCalledWith(
        "/api/parameter/insert",
        expect.any(Object),
      );
    });

    it("should send POST method", async () => {
      const testParameter = createTestParameter();
      global.fetch = createFetchMock({ parameterId: 1 });

      await insertParameter(testParameter);

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ method: "POST" }),
      );
    });

    it("should include credentials", async () => {
      const testParameter = createTestParameter();
      global.fetch = createFetchMock({ parameterId: 1 });

      await insertParameter(testParameter);

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ credentials: "include" }),
      );
    });
  });

  describe("Parameter validation scenarios", () => {
    it("should handle configuration parameters", async () => {
      const configParam = createTestParameter({
        parameterName: "APP_CONFIG_VERSION",
        parameterValue: "v2.1.3",
        activeStatus: true,
      });

      global.fetch = createFetchMock({
        ...configParam,
        parameterId: 1,
      });

      const result = await insertParameter(configParam);

      expect(result.parameterName).toBe("APP_CONFIG_VERSION");
      expect(result.parameterValue).toBe("v2.1.3");
      expect(result.activeStatus).toBe(true);
    });

    it("should handle system parameters", async () => {
      const systemParam = createTestParameter({
        parameterName: "SYSTEM_MAINTENANCE_MODE",
        parameterValue: "false",
        activeStatus: true,
      });

      global.fetch = createFetchMock({
        ...systemParam,
        parameterId: 2,
      });

      const result = await insertParameter(systemParam);

      expect(result.parameterName).toBe("SYSTEM_MAINTENANCE_MODE");
      expect(result.parameterValue).toBe("false");
    });

    it("should handle feature flag parameters", async () => {
      const featureFlag = createTestParameter({
        parameterName: "FEATURE_NEW_DASHBOARD",
        parameterValue: "enabled",
        activeStatus: true,
      });

      global.fetch = createFetchMock({
        ...featureFlag,
        parameterId: 3,
      });

      const result = await insertParameter(featureFlag);

      expect(result.parameterName).toBe("FEATURE_NEW_DASHBOARD");
      expect(result.parameterValue).toBe("enabled");
    });

    it("should handle inactive parameters", async () => {
      const inactiveParam = createTestParameter({
        parameterName: "DEPRECATED_SETTING",
        parameterValue: "old-value",
        activeStatus: false,
      });

      global.fetch = createFetchMock({
        ...inactiveParam,
        parameterId: 4,
      });

      const result = await insertParameter(inactiveParam);

      expect(result.activeStatus).toBe(false);
    });
  });

  describe("Edge cases", () => {
    it("should handle special characters in parameter names", async () => {
      const specialParam = createTestParameter({
        parameterName: "SPECIAL_CHARS_!@#$%",
        parameterValue: "special-value",
      });

      global.fetch = createFetchMock({
        ...specialParam,
        parameterId: 1,
      });

      const result = await insertParameter(specialParam);

      expect(result.parameterName).toBe("SPECIAL_CHARS_!@#$%");
    });

    it("should handle unicode characters in parameter values", async () => {
      const unicodeParam = createTestParameter({
        parameterName: "UNICODE_TEST",
        parameterValue: "测试值 🚀 émojis",
      });

      global.fetch = createFetchMock({
        ...unicodeParam,
        parameterId: 1,
      });

      const result = await insertParameter(unicodeParam);

      expect(result.parameterValue).toBe("测试值 🚀 émojis");
    });

    it("should handle very long parameter values", async () => {
      const longValue = "A".repeat(1000);
      const longParam = createTestParameter({
        parameterName: "LONG_VALUE_PARAM",
        parameterValue: longValue,
      });

      global.fetch = createFetchMock({
        ...longParam,
        parameterId: 1,
      });

      const result = await insertParameter(longParam);

      expect(result.parameterValue).toBe(longValue);
    });

    it("should handle JSON string parameter values", async () => {
      const jsonValue = JSON.stringify({
        nested: { config: true, values: [1, 2, 3] },
      });
      const jsonParam = createTestParameter({
        parameterName: "JSON_CONFIG",
        parameterValue: jsonValue,
      });

      global.fetch = createFetchMock({
        ...jsonParam,
        parameterId: 1,
      });

      const result = await insertParameter(jsonParam);

      expect(result.parameterValue).toBe(jsonValue);
    });

    it("should handle empty parameter values", async () => {
      const emptyParam = createTestParameter({
        parameterName: "EMPTY_VALUE",
        parameterValue: "",
      });

      global.fetch = createFetchMock({
        ...emptyParam,
        parameterId: 1,
      });

      const result = await insertParameter(emptyParam);

      expect(result.parameterValue).toBe("");
    });

    it("should handle boolean-like string values", async () => {
      const booleanParams = [
        createTestParameter({
          parameterName: "BOOL_TRUE",
          parameterValue: "true",
        }),
        createTestParameter({
          parameterName: "BOOL_FALSE",
          parameterValue: "false",
        }),
        createTestParameter({
          parameterName: "BOOL_YES",
          parameterValue: "yes",
        }),
      ];

      for (const param of booleanParams) {
        global.fetch = createFetchMock({ ...param, parameterId: 1 });
        const result = await insertParameter(param);
        expect(result.parameterValue).toBe(param.parameterValue);
      }
    });
  });

  describe("Console logging", () => {
    it("should log API errors to console.log", async () => {
      const testParameter = createTestParameter();
      global.fetch = createErrorFetchMock("API Error", 400);
      consoleSpy.start();

      try {
        await insertParameter(testParameter);
      } catch (error) {
        // Expected error
      }

      const calls = consoleSpy.getCalls();
      expect(calls.log[0]).toEqual(["API Error"]);
    });

    it("should log general errors to console.error", async () => {
      const testParameter = createTestParameter();
      global.fetch = jest.fn().mockRejectedValue(new Error("Network failure"));
      consoleSpy.start();

      try {
        await insertParameter(testParameter);
      } catch (error) {
        // Expected error
      }

      const calls = consoleSpy.getCalls();
      expect(calls.error[0]).toEqual(["An error occurred: Network failure"]);
    });

    it("should not log anything on successful operations", async () => {
      const testParameter = createTestParameter();
      global.fetch = createFetchMock({ parameterId: 1 });
      consoleSpy.start();

      await insertParameter(testParameter);

      const calls = consoleSpy.getCalls();
      expect(calls.log).toHaveLength(0);
      expect(calls.error).toHaveLength(0);
      expect(calls.warn).toHaveLength(0);
    });
  });

  describe("Integration scenarios", () => {
    it("should handle complete successful parameter creation flow", async () => {
      const newParameter = createTestParameter({
        parameterName: "NEW_FEATURE_FLAG",
        parameterValue: "enabled",
        activeStatus: true,
      });

      const expectedResponse = {
        ...newParameter,
        parameterId: 100,
        dateAdded: "2023-12-25T10:30:00.000Z",
        dateUpdated: "2023-12-25T10:30:00.000Z",
      };

      global.fetch = createFetchMock(expectedResponse);

      const result = await insertParameter(newParameter);

      expect(result).toEqual(expectedResponse);
      expect(fetch).toHaveBeenCalledWith(
        "/api/parameter/insert",
        expect.objectContaining({
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(newParameter),
        }),
      );
    });

    it("should handle parameter creation failure with detailed error", async () => {
      const invalidParameter = createTestParameter({
        parameterName: "", // Invalid empty name
        parameterValue: "some-value",
      });

      global.fetch = createErrorFetchMock(
        "Parameter name cannot be empty and must be unique",
        400,
      );
      consoleSpy.start();

      await expect(insertParameter(invalidParameter)).rejects.toThrow(
        "Parameter name cannot be empty and must be unique",
      );

      const calls = consoleSpy.getCalls();
      expect(calls.log[0]).toEqual(["Parameter name cannot be empty and must be unique"]);
      expect(calls.error[0]).toEqual([
        "An error occurred: Parameter name cannot be empty and must be unique",
      ]);
    });

    it("should handle server errors gracefully", async () => {
      const testParameter = createTestParameter();
      global.fetch = createErrorFetchMock("Database connection failed", 503);
      consoleSpy.start();

      await expect(insertParameter(testParameter)).rejects.toThrow(
        "Database connection failed",
      );

      const calls = consoleSpy.getCalls();
      expect(calls.log[0]).toEqual(["Database connection failed"]);
      expect(calls.error[0]).toEqual(["An error occurred: Database connection failed"]);
    });
  });

  describe("Parameter-specific business logic", () => {
    it("should handle configuration migration parameters", async () => {
      const migrationParam = createTestParameter({
        parameterName: "DB_MIGRATION_VERSION",
        parameterValue: "20231225_001",
        activeStatus: true,
      });

      global.fetch = createFetchMock({
        ...migrationParam,
        parameterId: 1,
      });

      const result = await insertParameter(migrationParam);

      expect(result.parameterName).toBe("DB_MIGRATION_VERSION");
      expect(result.parameterValue).toBe("20231225_001");
    });

    it("should handle environment-specific parameters", async () => {
      const envParams = [
        createTestParameter({
          parameterName: "ENV_MODE",
          parameterValue: "production",
        }),
        createTestParameter({
          parameterName: "DEBUG_LEVEL",
          parameterValue: "error",
        }),
        createTestParameter({
          parameterName: "API_TIMEOUT",
          parameterValue: "30000",
        }),
      ];

      for (let i = 0; i < envParams.length; i++) {
        global.fetch = createFetchMock({
          ...envParams[i],
          parameterId: i + 1,
        });

        const result = await insertParameter(envParams[i]);
        expect(result.parameterName).toBe(envParams[i].parameterName);
        expect(result.parameterValue).toBe(envParams[i].parameterValue);
      }
    });

    it("should handle user preference parameters", async () => {
      const userPrefParam = createTestParameter({
        parameterName: "DEFAULT_CURRENCY",
        parameterValue: "USD",
        activeStatus: true,
      });

      global.fetch = createFetchMock({
        ...userPrefParam,
        parameterId: 1,
      });

      const result = await insertParameter(userPrefParam);

      expect(result.parameterName).toBe("DEFAULT_CURRENCY");
      expect(result.parameterValue).toBe("USD");
    });
  });
});