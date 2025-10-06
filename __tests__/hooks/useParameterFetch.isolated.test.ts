/**
 * Isolated tests for useParameterFetch business logic
 * Tests fetchParameterData function without React Query overhead
 */

import { ConsoleSpy } from "../../testHelpers";
import { createModernFetchMock } from "../../testHelpers.modern";
import Parameter from "../../model/Parameter";

// Copy the function to test
const fetchParameterData = async (): Promise<Parameter[]> => {
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

describe("useParameterFetch Business Logic (Isolated)", () => {
  let consoleSpy: ConsoleSpy;

  beforeEach(() => {
    consoleSpy = new ConsoleSpy();
    jest.clearAllMocks();
  });

  afterEach(() => {
    consoleSpy.stop();
  });

  describe("fetchParameterData", () => {
    describe("Successful fetch operations", () => {
      it("should fetch parameters successfully", async () => {
        const testParameters = [
          createTestParameter({ parameterId: 1 }),
          createTestParameter({ parameterId: 2 }),
        ];

        global.fetch = createModernFetchMock(testParameters);

        const result = await fetchParameterData();

        expect(result).toEqual(testParameters);
        expect(fetch).toHaveBeenCalledWith("/api/parameter/active", {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        });
      });

      it("should return empty array when no parameters exist", async () => {
        global.fetch = createModernFetchMock([]);

        const result = await fetchParameterData();

        expect(result).toEqual([]);
      });

      it("should fetch parameters with different names and values", async () => {
        const testParameters = [
          createTestParameter({
            parameterName: "payment_account",
            parameterValue: "checking_john",
          }),
          createTestParameter({
            parameterName: "default_category",
            parameterValue: "groceries",
          }),
          createTestParameter({
            parameterName: "budget_limit",
            parameterValue: "2000.00",
          }),
        ];

        global.fetch = createModernFetchMock(testParameters);

        const result = await fetchParameterData();

        expect(result).toHaveLength(3);
        expect(result[0].parameterName).toBe("payment_account");
        expect(result[1].parameterName).toBe("default_category");
        expect(result[2].parameterName).toBe("budget_limit");
      });

      it("should handle empty array response", async () => {
        global.fetch = createModernFetchMock([]);

        const result = await fetchParameterData();

        expect(result).toEqual([]);
        expect(Array.isArray(result)).toBe(true);
      });

      it("should fetch only active parameters", async () => {
        const testParameters = [
          createTestParameter({ activeStatus: true }),
          createTestParameter({ activeStatus: true }),
        ];

        global.fetch = createModernFetchMock(testParameters);

        const result = await fetchParameterData();

        expect(result.every((param) => param.activeStatus === true)).toBe(true);
      });

      it("should use correct HTTP method", async () => {
        global.fetch = createModernFetchMock([]);

        await fetchParameterData();

        const callArgs = (fetch as jest.Mock).mock.calls[0][1];
        expect(callArgs.method).toBe("GET");
      });

      it("should include credentials", async () => {
        global.fetch = createModernFetchMock([]);

        await fetchParameterData();

        const callArgs = (fetch as jest.Mock).mock.calls[0][1];
        expect(callArgs.credentials).toBe("include");
      });

      it("should include correct headers", async () => {
        global.fetch = createModernFetchMock([]);

        await fetchParameterData();

        const callArgs = (fetch as jest.Mock).mock.calls[0][1];
        expect(callArgs.headers).toEqual({
          "Content-Type": "application/json",
          Accept: "application/json",
        });
      });

      it("should fetch parameters with various value types", async () => {
        const testParameters = [
          createTestParameter({
            parameterName: "string_param",
            parameterValue: "text",
          }),
          createTestParameter({
            parameterName: "numeric_param",
            parameterValue: "123.45",
          }),
          createTestParameter({
            parameterName: "boolean_param",
            parameterValue: "true",
          }),
        ];

        global.fetch = createModernFetchMock(testParameters);

        const result = await fetchParameterData();

        expect(result).toHaveLength(3);
        expect(result[0].parameterValue).toBe("text");
        expect(result[1].parameterValue).toBe("123.45");
        expect(result[2].parameterValue).toBe("true");
      });

      it("should preserve parameter order from API", async () => {
        const testParameters = [
          createTestParameter({ parameterId: 3, parameterName: "third" }),
          createTestParameter({ parameterId: 1, parameterName: "first" }),
          createTestParameter({ parameterId: 2, parameterName: "second" }),
        ];

        global.fetch = createModernFetchMock(testParameters);

        const result = await fetchParameterData();

        expect(result[0].parameterName).toBe("third");
        expect(result[1].parameterName).toBe("first");
        expect(result[2].parameterName).toBe("second");
      });
    });

    describe("Error handling", () => {
      it("should throw error for 500 server error", async () => {
        global.fetch = jest.fn().mockResolvedValue({
          ok: false,
          status: 500,
          json: async () => ({ error: "Internal server error" }),
        });

        consoleSpy.start();

        await expect(fetchParameterData()).rejects.toThrow(
          "Failed to fetch parameter data: Internal server error",
        );

        const calls = consoleSpy.getCalls();
        expect(
          calls.error.some((call) =>
            call[0].includes("Error fetching parameter data:"),
          ),
        ).toBe(true);
      });

      it("should throw error for 401 unauthorized", async () => {
        global.fetch = jest.fn().mockResolvedValue({
          ok: false,
          status: 401,
          json: async () => ({ error: "Unauthorized" }),
        });

        consoleSpy.start();

        await expect(fetchParameterData()).rejects.toThrow(
          "Failed to fetch parameter data: Unauthorized",
        );
      });

      it("should throw error for 403 forbidden", async () => {
        global.fetch = jest.fn().mockResolvedValue({
          ok: false,
          status: 403,
          json: async () => ({ error: "Forbidden" }),
        });

        consoleSpy.start();

        await expect(fetchParameterData()).rejects.toThrow(
          "Failed to fetch parameter data: Forbidden",
        );
      });

      it("should handle network errors", async () => {
        global.fetch = jest.fn().mockRejectedValue(new Error("Network error"));

        consoleSpy.start();

        await expect(fetchParameterData()).rejects.toThrow(
          "Failed to fetch parameter data: Network error",
        );

        const calls = consoleSpy.getCalls();
        expect(
          calls.error.some((call) =>
            call[0].includes("Error fetching parameter data:"),
          ),
        ).toBe(true);
      });

      it("should handle invalid JSON response", async () => {
        global.fetch = jest.fn().mockResolvedValue({
          ok: true,
          json: jest.fn().mockRejectedValue(new Error("Invalid JSON")),
        });

        consoleSpy.start();

        await expect(fetchParameterData()).rejects.toThrow(
          "Failed to fetch parameter data: Invalid JSON",
        );
      });

      it("should handle fetch failure", async () => {
        global.fetch = jest
          .fn()
          .mockRejectedValue(new Error("Failed to fetch"));

        consoleSpy.start();

        await expect(fetchParameterData()).rejects.toThrow(
          "Failed to fetch parameter data: Failed to fetch",
        );
      });

      it("should handle timeout errors", async () => {
        global.fetch = jest.fn().mockRejectedValue(new Error("Timeout"));

        consoleSpy.start();

        await expect(fetchParameterData()).rejects.toThrow(
          "Failed to fetch parameter data: Timeout",
        );
      });

      it("should handle 404 error with modern format", async () => {
        global.fetch = jest.fn().mockResolvedValue({
          ok: false,
          status: 404,
          json: async () => ({ error: "Not found" }),
        });

        consoleSpy.start();

        await expect(fetchParameterData()).rejects.toThrow(
          "Failed to fetch parameter data: Not found",
        );
      });
    });

    describe("Edge cases", () => {
      it("should handle parameters with empty values", async () => {
        const testParameters = [createTestParameter({ parameterValue: "" })];

        global.fetch = createModernFetchMock(testParameters);

        const result = await fetchParameterData();

        expect(result[0].parameterValue).toBe("");
      });

      it("should handle parameters with very long values", async () => {
        const longValue = "a".repeat(1000);
        const testParameters = [
          createTestParameter({ parameterValue: longValue }),
        ];

        global.fetch = createModernFetchMock(testParameters);

        const result = await fetchParameterData();

        expect(result[0].parameterValue).toBe(longValue);
        expect(result[0].parameterValue.length).toBe(1000);
      });

      it("should handle parameters with special characters in names", async () => {
        const testParameters = [
          createTestParameter({
            parameterName: "param-with_special.chars",
            parameterValue: "value!@#$%",
          }),
        ];

        global.fetch = createModernFetchMock(testParameters);

        const result = await fetchParameterData();

        expect(result[0].parameterName).toBe("param-with_special.chars");
        expect(result[0].parameterValue).toBe("value!@#$%");
      });

      it("should handle parameters with JSON values", async () => {
        const jsonValue = '{"key": "value", "nested": {"data": 123}}';
        const testParameters = [
          createTestParameter({
            parameterName: "json_config",
            parameterValue: jsonValue,
          }),
        ];

        global.fetch = createModernFetchMock(testParameters);

        const result = await fetchParameterData();

        expect(result[0].parameterValue).toBe(jsonValue);
      });

      it("should handle parameters with Unicode characters", async () => {
        const testParameters = [
          createTestParameter({
            parameterName: "unicode_param",
            parameterValue: "Hello 世界 🌍",
          }),
        ];

        global.fetch = createModernFetchMock(testParameters);

        const result = await fetchParameterData();

        expect(result[0].parameterValue).toBe("Hello 世界 🌍");
      });

      it("should preserve parameter ID in response", async () => {
        const testParameters = [
          createTestParameter({ parameterId: 12345 }),
          createTestParameter({ parameterId: 67890 }),
        ];

        global.fetch = createModernFetchMock(testParameters);

        const result = await fetchParameterData();

        expect(result[0].parameterId).toBe(12345);
        expect(result[1].parameterId).toBe(67890);
      });

      it("should handle large number of parameters", async () => {
        const testParameters = Array.from({ length: 100 }, (_, i) =>
          createTestParameter({
            parameterId: i + 1,
            parameterName: `param_${i + 1}`,
          }),
        );

        global.fetch = createModernFetchMock(testParameters);

        const result = await fetchParameterData();

        expect(result).toHaveLength(100);
        expect(result[0].parameterId).toBe(1);
        expect(result[99].parameterId).toBe(100);
      });

      it("should handle parameters with whitespace in values", async () => {
        const testParameters = [
          createTestParameter({
            parameterValue: "  value with spaces  ",
          }),
        ];

        global.fetch = createModernFetchMock(testParameters);

        const result = await fetchParameterData();

        expect(result[0].parameterValue).toBe("  value with spaces  ");
      });

      it("should preserve error stack trace", async () => {
        const testError = new Error("Custom error");
        global.fetch = jest.fn().mockRejectedValue(testError);

        try {
          await fetchParameterData();
          fail("Should have thrown an error");
        } catch (error: any) {
          expect(error.message).toContain("Failed to fetch parameter data");
        }
      });
    });

    describe("API endpoint", () => {
      it("should call correct API endpoint for active parameters", async () => {
        global.fetch = createModernFetchMock([]);

        await fetchParameterData();

        expect(fetch).toHaveBeenCalledWith(
          "/api/parameter/active",
          expect.any(Object),
        );
      });

      it("should only call API once per fetch", async () => {
        global.fetch = createModernFetchMock([]);

        await fetchParameterData();

        expect(fetch).toHaveBeenCalledTimes(1);
      });
    });

    describe("Data integrity", () => {
      it("should return data exactly as received from API", async () => {
        const testParameters = [
          createTestParameter({
            parameterId: 999,
            parameterName: "test_param",
            parameterValue: "test_value",
            activeStatus: true,
          }),
        ];

        global.fetch = createModernFetchMock(testParameters);

        const result = await fetchParameterData();

        expect(result).toEqual(testParameters);
      });

      it("should not modify parameter data during fetch", async () => {
        const testParameters = [
          createTestParameter({
            parameterId: 1,
            parameterName: "param1",
            parameterValue: "value1",
          }),
        ];
        const originalParameters = JSON.parse(JSON.stringify(testParameters));

        global.fetch = createModernFetchMock(testParameters);

        const result = await fetchParameterData();

        expect(result).toEqual(originalParameters);
      });

      it("should handle parameters with all field types", async () => {
        const testParameters = [
          createTestParameter({
            parameterId: 1,
            parameterName: "complete_param",
            parameterValue: "complete_value",
            activeStatus: true,
          }),
        ];

        global.fetch = createModernFetchMock(testParameters);

        const result = await fetchParameterData();

        expect(result[0]).toHaveProperty("parameterId");
        expect(result[0]).toHaveProperty("parameterName");
        expect(result[0]).toHaveProperty("parameterValue");
        expect(result[0]).toHaveProperty("activeStatus");
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

        const result = await fetchParameterData();

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

        const result = await fetchParameterData();

        expect(result).toHaveLength(3);
        expect(
          result.find((p) => p.parameterName === "default_category"),
        ).toBeDefined();
        expect(
          result.find((p) => p.parameterName === "currency"),
        ).toBeDefined();
        expect(
          result.find((p) => p.parameterName === "date_format"),
        ).toBeDefined();
      });
    });
  });
});
