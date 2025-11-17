/**
 * Isolated tests for useParameterInsert business logic
 * Tests insertParameter function without React Query overhead
 */

// Mock HookValidator
jest.mock("../../utils/hookValidation", () => ({
  HookValidator: {
    validateInsert: jest.fn((data) => data),
    validateUpdate: jest.fn((newData) => newData),
    validateDelete: jest.fn(),
  },
  HookValidationError: class HookValidationError extends Error {
    constructor(message: string) {
      super(message);
      this.name = "HookValidationError";
    }
  },
}));

// Mock logger
jest.mock("../../utils/logger", () => ({
  createHookLogger: jest.fn(() => ({
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  })),
}));

// Mock validation utilities
jest.mock("../../utils/validation", () => ({
  DataValidator: {
    validateParameter: jest.fn(),
  },
  ValidationError: jest.fn(),
}));

import { createTestParameter } from "../../testHelpers";
import {
  createModernFetchMock,
  createModernErrorFetchMock,
} from "../../testHelpers.modern";
import Parameter from "../../model/Parameter";

import { insertParameter } from "../../hooks/useParameterInsert";
import { HookValidator } from "../../utils/hookValidation";

const mockValidateInsert = HookValidator.validateInsert as jest.Mock;

describe("insertParameter (Isolated)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset validation mock
    mockValidateInsert.mockImplementation((data) => data);
  });

  afterEach(() => {});

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

      global.fetch = createModernFetchMock(expectedResponse);

      const result = await insertParameter(testParameter);

      expect(result).toEqual(expectedResponse);
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

    it("should handle 204 no content response", async () => {
      const testParameter = createTestParameter();
      global.fetch = createModernFetchMock(null, { status: 204 });

      const result = await insertParameter(testParameter);

      expect(result).toEqual(testParameter);
    });

    it("should send complete parameter payload", async () => {
      const complexParameter = createTestParameter({
        parameterName: "COMPLEX_CONFIG",
        parameterValue: "complex-value-with-special-chars-!@#$%",
        activeStatus: false,
      });

      global.fetch = createModernFetchMock({ parameterId: 1 });

      await insertParameter(complexParameter);

      expect(fetch).toHaveBeenCalledWith(
        "/api/parameter",
        expect.objectContaining({
          body: JSON.stringify(complexParameter),
        }),
      );
    });
  });

  describe("API error handling", () => {
    it("should handle 400 error with response message", async () => {
      const testParameter = createTestParameter();
      global.fetch = createModernErrorFetchMock(
        "Parameter name already exists",
        400,
      );
      await expect(insertParameter(testParameter)).rejects.toThrow(
        "Parameter name already exists",
      );
    });

    it("should handle 500 server error", async () => {
      const testParameter = createTestParameter();
      global.fetch = createModernErrorFetchMock("Internal server error", 500);
      await expect(insertParameter(testParameter)).rejects.toThrow(
        "Internal server error",
      );
    });

    it("should handle 409 conflict error for duplicate parameters", async () => {
      const duplicateParameter = createTestParameter({
        parameterName: "EXISTING_PARAM",
        parameterValue: "some-value",
      });
      global.fetch = createModernErrorFetchMock(
        "Parameter already exists with this name",
        409,
      );
      await expect(insertParameter(duplicateParameter)).rejects.toThrow(
        "Parameter already exists with this name",
      );
    });

    it("should handle error response without message", async () => {
      const testParameter = createTestParameter();
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: jest.fn().mockResolvedValue({}),
      });
      await expect(insertParameter(testParameter)).rejects.toThrow("HTTP 400");
    });

    it("should handle malformed error response", async () => {
      const testParameter = createTestParameter();
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: jest.fn().mockRejectedValue(new Error("Invalid JSON")),
      });
      await expect(insertParameter(testParameter)).rejects.toThrow("HTTP 400");
    });

    it("should handle network errors", async () => {
      const testParameter = createTestParameter();
      global.fetch = jest.fn().mockRejectedValue(new Error("Network error"));
      await expect(insertParameter(testParameter)).rejects.toThrow(
        "Network error",
      );
    });

    it("should handle timeout errors", async () => {
      const testParameter = createTestParameter();
      global.fetch = jest.fn().mockRejectedValue(new Error("Request timeout"));
      await expect(insertParameter(testParameter)).rejects.toThrow(
        "Request timeout",
      );
    });
  });

  describe("Request format validation", () => {
    it("should send correct headers", async () => {
      const testParameter = createTestParameter();
      global.fetch = createModernFetchMock({ parameterId: 1 });

      await insertParameter(testParameter);

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

    it("should use correct endpoint", async () => {
      const testParameter = createTestParameter();
      global.fetch = createModernFetchMock({ parameterId: 1 });

      await insertParameter(testParameter);

      expect(fetch).toHaveBeenCalledWith("/api/parameter", expect.any(Object));
    });

    it("should send POST method", async () => {
      const testParameter = createTestParameter();
      global.fetch = createModernFetchMock({ parameterId: 1 });

      await insertParameter(testParameter);

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ method: "POST" }),
      );
    });

    it("should include credentials", async () => {
      const testParameter = createTestParameter();
      global.fetch = createModernFetchMock({ parameterId: 1 });

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

      global.fetch = createModernFetchMock({
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

      global.fetch = createModernFetchMock({
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

      global.fetch = createModernFetchMock({
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

      global.fetch = createModernFetchMock({
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

      global.fetch = createModernFetchMock({
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

      global.fetch = createModernFetchMock({
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

      global.fetch = createModernFetchMock({
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

      global.fetch = createModernFetchMock({
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

      global.fetch = createModernFetchMock({
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
        global.fetch = createModernFetchMock({ ...param, parameterId: 1 });
        const result = await insertParameter(param);
        expect(result.parameterValue).toBe(param.parameterValue);
      }
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

      global.fetch = createModernFetchMock(expectedResponse);

      const result = await insertParameter(newParameter);

      expect(result).toEqual(expectedResponse);
      expect(fetch).toHaveBeenCalledWith(
        "/api/parameter",
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

      global.fetch = createModernErrorFetchMock(
        "Parameter name cannot be empty and must be unique",
        400,
      );
      await expect(insertParameter(invalidParameter)).rejects.toThrow(
        "Parameter name cannot be empty and must be unique",
      );
    });

    it("should handle server errors gracefully", async () => {
      const testParameter = createTestParameter();
      global.fetch = createModernErrorFetchMock(
        "Database connection failed",
        503,
      );
      await expect(insertParameter(testParameter)).rejects.toThrow(
        "Database connection failed",
      );
    });
  });

  describe("Parameter-specific business logic", () => {
    it("should handle configuration migration parameters", async () => {
      const migrationParam = createTestParameter({
        parameterName: "DB_MIGRATION_VERSION",
        parameterValue: "20231225_001",
        activeStatus: true,
      });

      global.fetch = createModernFetchMock({
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
        global.fetch = createModernFetchMock({
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

      global.fetch = createModernFetchMock({
        ...userPrefParam,
        parameterId: 1,
      });

      const result = await insertParameter(userPrefParam);

      expect(result.parameterName).toBe("DEFAULT_CURRENCY");
      expect(result.parameterValue).toBe("USD");
    });
  });
});
