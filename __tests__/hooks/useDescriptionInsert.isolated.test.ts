/**
 * Isolated tests for useDescriptionInsert business logic
 * Tests insertDescription function without React Query overhead
 */

import {
  createFetchMock,
  createErrorFetchMock,
  ConsoleSpy,
  createMockValidationUtils,
} from "../../testHelpers";

// Mock the validation utilities
jest.mock("../../utils/validation", () => ({
  DataValidator: {
    validateDescription: jest.fn(),
  },
  hookValidators: {
    validateApiPayload: jest.fn(),
  },
}));

import { DataValidator, hookValidators } from "../../utils/validation";
import { insertDescription } from "../../hooks/useDescriptionInsert";

describe("insertDescription (Isolated)", () => {
  let consoleSpy: ConsoleSpy;
  const mockValidateApiPayload = hookValidators.validateApiPayload as jest.Mock;

  beforeEach(() => {
    consoleSpy = new ConsoleSpy();
    jest.clearAllMocks();

    // Default mock for successful validation
    mockValidateApiPayload.mockReturnValue({
      isValid: true,
      validatedData: {
        descriptionName: "test-description",
        activeStatus: true,
      },
      errors: [],
    });
  });

  afterEach(() => {
    consoleSpy.stop();
  });

  describe("Successful insertion", () => {
    it("should insert description successfully with 200 response", async () => {
      const mockDescription = {
        descriptionId: 1,
        descriptionName: "test-description",
        activeStatus: true,
        dateAdded: new Date().toISOString(),
        dateUpdated: new Date().toISOString(),
      };

      global.fetch = createFetchMock(mockDescription);

      const result = await insertDescription("test-description");

      expect(result).toEqual(mockDescription);
      expect(mockValidateApiPayload).toHaveBeenCalledWith(
        { descriptionName: "test-description", activeStatus: true },
        DataValidator.validateDescription,
        "insertDescription",
      );
      expect(fetch).toHaveBeenCalledWith("/api/description/insert", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          descriptionName: "test-description",
          activeStatus: true,
        }),
      });
    });

    it("should handle 204 no content response", async () => {
      global.fetch = createFetchMock(null, { status: 204 });

      const result = await insertDescription("test-description");

      expect(result).toBeNull();
      expect(mockValidateApiPayload).toHaveBeenCalled();
    });

    it("should use validated data from validation utility", async () => {
      const validatedData = {
        descriptionName: "sanitized-description",
        activeStatus: true,
      };
      mockValidateApiPayload.mockReturnValue({
        isValid: true,
        validatedData,
        errors: [],
      });

      global.fetch = createFetchMock({ descriptionId: 1 });

      await insertDescription("original-description");

      expect(fetch).toHaveBeenCalledWith("/api/description/insert", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(validatedData),
      });
    });
  });

  describe("Validation errors", () => {
    it("should throw error when validation fails", async () => {
      mockValidateApiPayload.mockReturnValue({
        isValid: false,
        validatedData: null,
        errors: [
          { message: "Description name is required" },
          { message: "Description name must be at least 3 characters" },
        ],
      });

      await expect(insertDescription("")).rejects.toThrow(
        "Description validation failed: Description name is required, Description name must be at least 3 characters",
      );

      expect(mockValidateApiPayload).toHaveBeenCalledWith(
        { descriptionName: "", activeStatus: true },
        DataValidator.validateDescription,
        "insertDescription",
      );
      expect(fetch).not.toHaveBeenCalled();
    });

    it("should handle validation errors without specific messages", async () => {
      mockValidateApiPayload.mockReturnValue({
        isValid: false,
        validatedData: null,
        errors: [],
      });

      await expect(insertDescription("invalid")).rejects.toThrow(
        "Description validation failed: Validation failed",
      );
    });

    it("should handle validation errors with undefined errors array", async () => {
      mockValidateApiPayload.mockReturnValue({
        isValid: false,
        validatedData: null,
        errors: undefined,
      });

      await expect(insertDescription("invalid")).rejects.toThrow(
        "Description validation failed: Validation failed",
      );
    });

    it("should validate description name requirements", async () => {
      const testCases = [
        { input: "", expected: "empty string" },
        { input: "ab", expected: "too short" },
        { input: "   ", expected: "whitespace only" },
      ];

      for (const testCase of testCases) {
        mockValidateApiPayload.mockReturnValue({
          isValid: false,
          validatedData: null,
          errors: [{ message: `Invalid description: ${testCase.expected}` }],
        });

        await expect(insertDescription(testCase.input)).rejects.toThrow(
          `Description validation failed: Invalid description: ${testCase.expected}`,
        );
      }
    });
  });

  describe("API error handling", () => {
    it("should handle 400 error with response message", async () => {
      global.fetch = createErrorFetchMock("Description already exists", 400);
      consoleSpy.start();

      await expect(insertDescription("duplicate-description")).rejects.toThrow(
        "Description already exists",
      );

      const calls = consoleSpy.getCalls();
      expect(calls.log[0]).toEqual(["Description already exists"]);
    });

    it("should handle 500 server error", async () => {
      global.fetch = createErrorFetchMock("Internal server error", 500);
      consoleSpy.start();

      await expect(insertDescription("test-description")).rejects.toThrow(
        "Internal server error",
      );

      const calls = consoleSpy.getCalls();
      expect(calls.log[0]).toEqual(["Internal server error"]);
    });

    it("should handle error response without message", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: jest.fn().mockResolvedValue({}),
      });
      consoleSpy.start();

      await expect(insertDescription("test-description")).rejects.toThrow(
        "No error message returned.",
      );

      const calls = consoleSpy.getCalls();
      expect(calls.log[0]).toEqual(["No error message returned."]);
    });

    it("should handle malformed error response", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: jest.fn().mockRejectedValue(new Error("Invalid JSON")),
      });
      consoleSpy.start();

      await expect(insertDescription("test-description")).rejects.toThrow(
        "Failed to parse error response: Invalid JSON",
      );

      const calls = consoleSpy.getCalls();
      expect(calls.log[0]).toEqual([
        "Failed to parse error response: Invalid JSON",
      ]);
    });

    it("should handle network errors", async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error("Network error"));
      consoleSpy.start();

      await expect(insertDescription("test-description")).rejects.toThrow(
        "Network error",
      );

      const calls = consoleSpy.getCalls();
      expect(calls.log[0]).toEqual(["An error occurred: Network error"]);
    });

    it("should handle timeout errors", async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error("Request timeout"));
      consoleSpy.start();

      await expect(insertDescription("test-description")).rejects.toThrow(
        "Request timeout",
      );

      const calls = consoleSpy.getCalls();
      expect(calls.log[0]).toEqual(["An error occurred: Request timeout"]);
    });
  });

  describe("Request format validation", () => {
    it("should send correct headers", async () => {
      global.fetch = createFetchMock({ descriptionId: 1 });

      await insertDescription("test-description");

      expect(fetch).toHaveBeenCalledWith("/api/description/insert", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          descriptionName: "test-description",
          activeStatus: true,
        }),
      });
    });

    it("should use correct endpoint", async () => {
      global.fetch = createFetchMock({ descriptionId: 1 });

      await insertDescription("test-description");

      expect(fetch).toHaveBeenCalledWith(
        "/api/description/insert",
        expect.any(Object),
      );
    });

    it("should send POST method", async () => {
      global.fetch = createFetchMock({ descriptionId: 1 });

      await insertDescription("test-description");

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ method: "POST" }),
      );
    });

    it("should include credentials", async () => {
      global.fetch = createFetchMock({ descriptionId: 1 });

      await insertDescription("test-description");

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ credentials: "include" }),
      );
    });
  });

  describe("Edge cases", () => {
    it("should handle special characters in description name", async () => {
      const specialDescription = "Special & Characters: 123!@#";
      mockValidateApiPayload.mockReturnValue({
        isValid: true,
        validatedData: {
          descriptionName: specialDescription,
          activeStatus: true,
        },
        errors: [],
      });

      global.fetch = createFetchMock({
        descriptionId: 1,
        descriptionName: specialDescription,
      });

      const result = await insertDescription(specialDescription);

      expect(result.descriptionName).toBe(specialDescription);
      expect(fetch).toHaveBeenCalledWith(
        "/api/description/insert",
        expect.objectContaining({
          body: JSON.stringify({
            descriptionName: specialDescription,
            activeStatus: true,
          }),
        }),
      );
    });

    it("should handle unicode characters", async () => {
      const unicodeDescription = "测试 Description 🎉";
      mockValidateApiPayload.mockReturnValue({
        isValid: true,
        validatedData: {
          descriptionName: unicodeDescription,
          activeStatus: true,
        },
        errors: [],
      });

      global.fetch = createFetchMock({
        descriptionId: 1,
        descriptionName: unicodeDescription,
      });

      const result = await insertDescription(unicodeDescription);

      expect(result.descriptionName).toBe(unicodeDescription);
    });

    it("should handle very long description names", async () => {
      const longDescription = "A".repeat(500);
      mockValidateApiPayload.mockReturnValue({
        isValid: true,
        validatedData: { descriptionName: longDescription, activeStatus: true },
        errors: [],
      });

      global.fetch = createFetchMock({
        descriptionId: 1,
        descriptionName: longDescription,
      });

      const result = await insertDescription(longDescription);

      expect(result.descriptionName).toBe(longDescription);
    });
  });

  describe("Console logging", () => {
    it("should log validation errors", async () => {
      mockValidateApiPayload.mockReturnValue({
        isValid: false,
        validatedData: null,
        errors: [{ message: "Invalid description" }],
      });
      consoleSpy.start();

      try {
        await insertDescription("invalid");
      } catch (error) {
        // Expected error
      }

      // The error gets logged in the catch block
      const calls = consoleSpy.getCalls();
      expect(calls.log[0][0]).toContain(
        "An error occurred: Description validation failed:",
      );
    });

    it("should log API errors", async () => {
      global.fetch = createErrorFetchMock("Server error", 500);
      consoleSpy.start();

      try {
        await insertDescription("test-description");
      } catch (error) {
        // Expected error
      }

      const calls = consoleSpy.getCalls();
      expect(calls.log).toEqual([
        ["Server error"],
        ["An error occurred: Server error"],
      ]);
    });

    it("should log network errors", async () => {
      global.fetch = jest
        .fn()
        .mockRejectedValue(new Error("Connection failed"));
      consoleSpy.start();

      try {
        await insertDescription("test-description");
      } catch (error) {
        // Expected error
      }

      const calls = consoleSpy.getCalls();
      expect(calls.log[0]).toEqual(["An error occurred: Connection failed"]);
    });
  });

  describe("Integration scenarios", () => {
    it("should handle complete successful flow", async () => {
      const testDescription = "Integration Test Description";
      const expectedResponse = {
        descriptionId: 42,
        descriptionName: testDescription,
        activeStatus: true,
        dateAdded: "2023-12-25T10:30:00.000Z",
        dateUpdated: "2023-12-25T10:30:00.000Z",
      };

      mockValidateApiPayload.mockReturnValue({
        isValid: true,
        validatedData: { descriptionName: testDescription, activeStatus: true },
        errors: [],
      });

      global.fetch = createFetchMock(expectedResponse);

      const result = await insertDescription(testDescription);

      expect(result).toEqual(expectedResponse);
      expect(mockValidateApiPayload).toHaveBeenCalledWith(
        { descriptionName: testDescription, activeStatus: true },
        DataValidator.validateDescription,
        "insertDescription",
      );
    });

    it("should handle validation failure to API error chain", async () => {
      // First, validation passes
      mockValidateApiPayload.mockReturnValue({
        isValid: true,
        validatedData: {
          descriptionName: "test-description",
          activeStatus: true,
        },
        errors: [],
      });

      // Then API returns error
      global.fetch = createErrorFetchMock(
        "Description already exists in database",
        409,
      );
      consoleSpy.start();

      await expect(insertDescription("test-description")).rejects.toThrow(
        "Description already exists in database",
      );

      const calls = consoleSpy.getCalls();
      expect(calls.log).toEqual([
        ["Description already exists in database"],
        ["An error occurred: Description already exists in database"],
      ]);
    });
  });
});
