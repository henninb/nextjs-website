import Parameter from "../../model/Parameter";
import {
  ConsoleSpy,
  createTestParameter,
  simulateNetworkError,
} from "../../testHelpers";
import {
  createModernFetchMock,
  createModernErrorFetchMock,
} from "../../testHelpers.modern";

import { deleteParameter } from "../../hooks/useParameterDelete";

describe("deleteParameter (Isolated)", () => {
  const mockParameter = createTestParameter({
    parameterId: 1,
    parameterName: "TEST_PARAMETER",
    parameterValue: "test_value_123",
    activeStatus: true,
    dateAdded: new Date("2024-01-01"),
    dateUpdated: new Date("2024-01-01"),
  });

  let consoleSpy: ConsoleSpy;
  let mockConsole: any;

  beforeEach(() => {
    consoleSpy = new ConsoleSpy();
    mockConsole = consoleSpy.start();
    jest.clearAllMocks();
  });

  afterEach(() => {
    consoleSpy.stop();
  });

  describe("Successful deletion", () => {
    it("should delete parameter successfully with 204 response", async () => {
      global.fetch = createModernFetchMock(null, { status: 204 });

      const result = await deleteParameter(mockParameter);

      expect(result).toBeNull();
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/parameter/TEST_PARAMETER",
        expect.objectContaining({
          method: "DELETE",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }),
      );
    });

    it("should return parameter data for non-204 responses", async () => {
      const responseData = { ...mockParameter, deleted: true };
      global.fetch = createModernFetchMock(responseData, { status: 200 });

      const result = await deleteParameter(mockParameter);

      expect(result).toEqual(responseData);
    });

    it("should construct correct endpoint URL with parameter name", async () => {
      const parameterWithDifferentId = createTestParameter({
        parameterId: 999,
        parameterName: "CUSTOM_CONFIG",
      });
      global.fetch = createModernFetchMock(null, { status: 204 });

      await deleteParameter(parameterWithDifferentId);

      expect(global.fetch).toHaveBeenCalledWith(
        "/api/parameter/CUSTOM_CONFIG",
        expect.any(Object),
      );
    });
  });

  describe("Error handling", () => {
    it("should handle server error with error message", async () => {
      const errorMessage = "Cannot delete system parameter";
      global.fetch = createModernErrorFetchMock(errorMessage, 400);

      await expect(deleteParameter(mockParameter)).rejects.toThrow(
        errorMessage,
      );
      expect(mockConsole.error).toHaveBeenCalledWith(
        `An error occurred: ${errorMessage}`,
      );
    });

    it("should handle server error without error message", async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: jest.fn().mockResolvedValueOnce({}),
      });

      await expect(deleteParameter(mockParameter)).rejects.toThrow(
        "HTTP error! Status: 400",
      );
      expect(mockConsole.error).toHaveBeenCalledWith(
        "An error occurred: HTTP error! Status: 400",
      );
    });

    it("should handle malformed error response", async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: jest.fn().mockRejectedValueOnce(new Error("Invalid JSON")),
      });

      await expect(deleteParameter(mockParameter)).rejects.toThrow(
        "HTTP error! Status: 400",
      );
      expect(mockConsole.error).toHaveBeenCalledWith(
        "An error occurred: HTTP error! Status: 400",
      );
    });

    it("should handle empty error message gracefully", async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: jest.fn().mockResolvedValueOnce({ error: "" }),
      });

      await expect(deleteParameter(mockParameter)).rejects.toThrow(
        "HTTP error! Status: 400",
      );
      expect(mockConsole.error).toHaveBeenCalledWith(
        "An error occurred: HTTP error! Status: 400",
      );
    });

    it("should handle network errors", async () => {
      global.fetch = simulateNetworkError();

      await expect(deleteParameter(mockParameter)).rejects.toThrow(
        "Network error",
      );
      expect(mockConsole.error).toHaveBeenCalledWith(
        "An error occurred: Network error",
      );
    });

    it("should handle fetch rejection", async () => {
      global.fetch = jest
        .fn()
        .mockRejectedValueOnce(new Error("Connection failed"));

      await expect(deleteParameter(mockParameter)).rejects.toThrow(
        "Connection failed",
      );
      expect(mockConsole.error).toHaveBeenCalledWith(
        "An error occurred: Connection failed",
      );
    });
  });

  describe("Parameter name edge cases", () => {
    it("should handle parameter with uppercase name", async () => {
      const uppercaseParameter = createTestParameter({
        parameterId: 100,
        parameterName: "UPPERCASE_PARAMETER",
      });
      global.fetch = createModernFetchMock(null, { status: 204 });

      await deleteParameter(uppercaseParameter);

      expect(global.fetch).toHaveBeenCalledWith(
        "/api/parameter/UPPERCASE_PARAMETER",
        expect.any(Object),
      );
    });

    it("should handle parameter with lowercase name", async () => {
      const lowercaseParameter = createTestParameter({
        parameterId: 101,
        parameterName: "lowercase_parameter",
      });
      global.fetch = createModernFetchMock(null, { status: 204 });

      await deleteParameter(lowercaseParameter);

      expect(global.fetch).toHaveBeenCalledWith(
        "/api/parameter/lowercase_parameter",
        expect.any(Object),
      );
    });

    it("should handle parameter with mixed case name", async () => {
      const mixedCaseParameter = createTestParameter({
        parameterId: 102,
        parameterName: "Mixed_Case_Parameter_123",
      });
      global.fetch = createModernFetchMock(null, { status: 204 });

      await deleteParameter(mixedCaseParameter);

      expect(global.fetch).toHaveBeenCalledWith(
        "/api/parameter/Mixed_Case_Parameter_123",
        expect.any(Object),
      );
    });

    it("should handle parameter with special characters in name", async () => {
      const specialCharParameter = createTestParameter({
        parameterId: 103,
        parameterName: "param-with.special@chars_123",
      });
      global.fetch = createModernFetchMock(null, { status: 204 });

      await deleteParameter(specialCharParameter);

      expect(global.fetch).toHaveBeenCalledWith(
        "/api/parameter/param-with.special@chars_123",
        expect.any(Object),
      );
    });

    it("should handle parameter with very long name", async () => {
      const longName = "VERY_LONG_PARAMETER_NAME_" + "A".repeat(200);
      const longNameParameter = createTestParameter({
        parameterId: 104,
        parameterName: longName,
      });
      global.fetch = createModernFetchMock(null, { status: 204 });

      await deleteParameter(longNameParameter);

      expect(global.fetch).toHaveBeenCalledWith(
        `/api/parameter/${longName}`,
        expect.any(Object),
      );
    });

    it("should handle parameter with single character name", async () => {
      const singleCharParameter = createTestParameter({
        parameterId: 105,
        parameterName: "A",
      });
      global.fetch = createModernFetchMock(null, { status: 204 });

      await deleteParameter(singleCharParameter);

      expect(global.fetch).toHaveBeenCalledWith(
        "/api/parameter/A",
        expect.any(Object),
      );
    });

    it("should handle parameter with numeric name", async () => {
      const numericParameter = createTestParameter({
        parameterId: 106,
        parameterName: "12345",
      });
      global.fetch = createModernFetchMock(null, { status: 204 });

      await deleteParameter(numericParameter);

      expect(global.fetch).toHaveBeenCalledWith(
        "/api/parameter/12345",
        expect.any(Object),
      );
    });
  });

  describe("Response parsing", () => {
    it("should handle JSON response correctly", async () => {
      const jsonResponse = {
        message: "Parameter deleted successfully",
        parameterName: mockParameter.parameterName,
        deletedAt: "2024-01-01T00:00:00Z",
        affectedSystems: ["config", "cache"],
      };
      global.fetch = createModernFetchMock(jsonResponse, { status: 200 });

      const result = await deleteParameter(mockParameter);

      expect(result).toEqual(jsonResponse);
    });

    it("should handle empty JSON response", async () => {
      global.fetch = createModernFetchMock({}, { status: 200 });

      const result = await deleteParameter(mockParameter);

      expect(result).toEqual({});
    });

    it("should prioritize 204 status over response body", async () => {
      const mockJson = jest.fn().mockResolvedValueOnce({ message: "ignored" });
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        status: 204,
        json: mockJson,
      });

      const result = await deleteParameter(mockParameter);

      expect(result).toBeNull();
      expect(mockJson).not.toHaveBeenCalled();
    });

    it("should handle complex JSON response with metadata", async () => {
      const complexResponse = {
        parameter: mockParameter,
        dependentParameters: [],
        configurationChanged: true,
        backupCreated: true,
        metadata: {
          deletedAt: "2024-01-01T10:30:00Z",
          deletedBy: "admin",
          reason: "parameter cleanup",
          version: "1.2.3",
        },
      };
      global.fetch = createModernFetchMock(complexResponse, { status: 200 });

      const result = await deleteParameter(mockParameter);

      expect(result).toEqual(complexResponse);
    });
  });

  describe("HTTP headers and credentials", () => {
    it("should include correct headers in request", async () => {
      global.fetch = createModernFetchMock(null, { status: 204 });

      await deleteParameter(mockParameter);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }),
      );
    });

    it("should include credentials in request", async () => {
      global.fetch = createModernFetchMock(null, { status: 204 });

      await deleteParameter(mockParameter);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          credentials: "include",
        }),
      );
    });

    it("should use DELETE method", async () => {
      global.fetch = createModernFetchMock(null, { status: 204 });

      await deleteParameter(mockParameter);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: "DELETE",
        }),
      );
    });
  });

  describe("Console logging behavior", () => {
    it("should log error messages from server", async () => {
      const errorMessage = "Parameter deletion failed - system dependency";
      global.fetch = createModernErrorFetchMock(errorMessage, 400);

      await expect(deleteParameter(mockParameter)).rejects.toThrow();
      expect(mockConsole.error).toHaveBeenCalledWith(
        `An error occurred: ${errorMessage}`,
      );
    });

    it("should log general errors with context", async () => {
      global.fetch = simulateNetworkError();

      await expect(deleteParameter(mockParameter)).rejects.toThrow();
      expect(mockConsole.error).toHaveBeenCalledWith(
        "An error occurred: Network error",
      );
    });

    it("should not log anything for successful deletions", async () => {
      global.fetch = createModernFetchMock(null, { status: 204 });

      await deleteParameter(mockParameter);

      expect(mockConsole.log).not.toHaveBeenCalled();
      expect(mockConsole.error).not.toHaveBeenCalled();
      expect(mockConsole.warn).not.toHaveBeenCalled();
    });

    it("should log different parameter-specific error types", async () => {
      const parameterErrorScenarios = [
        { error: "Cannot delete system parameter", status: 400 },
        { error: "Parameter is read-only", status: 403 },
        { error: "Parameter has dependencies", status: 409 },
        { error: "Parameter not found", status: 404 },
        { error: "Parameter locked by another process", status: 423 },
        { error: "Invalid parameter format", status: 422 },
      ];

      for (const scenario of parameterErrorScenarios) {
        jest.clearAllMocks();
        consoleSpy.stop();
        consoleSpy = new ConsoleSpy();
        mockConsole = consoleSpy.start();

        global.fetch = createModernErrorFetchMock(
          scenario.error,
          scenario.status,
        );

        await expect(deleteParameter(mockParameter)).rejects.toThrow(
          scenario.error,
        );
        expect(mockConsole.error).toHaveBeenCalledWith(
          `An error occurred: ${scenario.error}`,
        );
      }
    });
  });

  describe("Parameter-specific validations", () => {
    it("should handle parameter with all required fields", async () => {
      const fullParameter = createTestParameter({
        parameterId: 123,
        parameterName: "FULL_CONFIG_PARAM",
        parameterValue: "complex_value_with_multiple_parts",
        activeStatus: true,
        dateAdded: new Date("2024-02-14"),
        dateUpdated: new Date("2024-02-15"),
      });

      global.fetch = createModernFetchMock(null, { status: 204 });

      const result = await deleteParameter(fullParameter);

      expect(result).toBeNull();
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/parameter/FULL_CONFIG_PARAM",
        expect.any(Object),
      );
    });

    it("should handle parameter with minimal required fields", async () => {
      const minimalParameter = createTestParameter({
        parameterId: 456,
        parameterName: "MIN_PARAM",
        parameterValue: "min_val",
        activeStatus: false,
      });

      global.fetch = createModernFetchMock(null, { status: 204 });

      const result = await deleteParameter(minimalParameter);

      expect(result).toBeNull();
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/parameter/MIN_PARAM",
        expect.any(Object),
      );
    });

    it("should handle parameter with inactive status", async () => {
      const inactiveParameter = createTestParameter({
        parameterName: "INACTIVE_PARAM",
        activeStatus: false,
      });

      global.fetch = createModernFetchMock(null, { status: 204 });

      const result = await deleteParameter(inactiveParameter);

      expect(result).toBeNull();
    });

    it("should handle parameter with empty value", async () => {
      const emptyValueParameter = createTestParameter({
        parameterName: "EMPTY_PARAM",
        parameterValue: "",
      });

      global.fetch = createModernFetchMock(null, { status: 204 });

      const result = await deleteParameter(emptyValueParameter);

      expect(result).toBeNull();
    });

    it("should handle parameter with very long value", async () => {
      const longValue = "A".repeat(1000);
      const longValueParameter = createTestParameter({
        parameterName: "LONG_VALUE_PARAM",
        parameterValue: longValue,
      });

      global.fetch = createModernFetchMock(null, { status: 204 });

      const result = await deleteParameter(longValueParameter);

      expect(result).toBeNull();
    });
  });

  describe("Parameter business logic edge cases", () => {
    it("should handle common system parameters", async () => {
      const systemParameters = [
        "DATABASE_URL",
        "API_KEY",
        "MAX_CONNECTIONS",
        "TIMEOUT_SECONDS",
        "DEBUG_MODE",
        "LOG_LEVEL",
      ];

      for (const paramName of systemParameters) {
        const systemParam = createTestParameter({ parameterName: paramName });
        global.fetch = createModernFetchMock(null, { status: 204 });

        const result = await deleteParameter(systemParam);
        expect(result).toBeNull();
      }
    });

    it("should handle parameter with JSON value", async () => {
      const jsonValueParameter = createTestParameter({
        parameterName: "JSON_CONFIG",
        parameterValue: JSON.stringify({
          enabled: true,
          maxRetries: 3,
          endpoints: ["api1", "api2"],
        }),
      });

      global.fetch = createModernFetchMock(null, { status: 204 });

      const result = await deleteParameter(jsonValueParameter);

      expect(result).toBeNull();
    });

    it("should handle parameter with URL value", async () => {
      const urlParameter = createTestParameter({
        parameterName: "EXTERNAL_API_URL",
        parameterValue:
          "https://api.example.com/v2/data?format=json&key=abc123",
      });

      global.fetch = createModernFetchMock(null, { status: 204 });

      const result = await deleteParameter(urlParameter);

      expect(result).toBeNull();
    });

    it("should handle parameter with boolean string value", async () => {
      const booleanParameters = ["true", "false", "1", "0", "yes", "no"];

      for (const boolVal of booleanParameters) {
        const boolParam = createTestParameter({
          parameterName: `BOOL_PARAM_${boolVal.toUpperCase()}`,
          parameterValue: boolVal,
        });
        global.fetch = createModernFetchMock(null, { status: 204 });

        const result = await deleteParameter(boolParam);
        expect(result).toBeNull();
      }
    });
  });
});
