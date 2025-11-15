/**
 * Isolated tests for useDescriptionInsert business logic
 * Tests insertDescription function without React Query overhead
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
    validateDescription: jest.fn(),
  },
  ValidationError: jest.fn(),
}));

import {
  createModernFetchMock,
  createModernErrorFetchMock,
} from "../../testHelpers.modern";

import { DataValidator } from "../../utils/validation";
import { insertDescription } from "../../hooks/useDescriptionInsert";
import { HookValidator } from "../../utils/hookValidation";

const mockValidateInsert = HookValidator.validateInsert as jest.Mock;

describe("insertDescription (Isolated)", () => {

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset validation mock
    mockValidateInsert.mockImplementation((data) => data);
  });

  afterEach(() => {
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

      global.fetch = createModernFetchMock(mockDescription);

      const result = await insertDescription("test-description");

      expect(result).toEqual(mockDescription);
      expect(mockValidateInsert).toHaveBeenCalledWith(
        { descriptionName: "test-description", activeStatus: true },
        DataValidator.validateDescription,
        "insertDescription",
      );
      expect(fetch).toHaveBeenCalledWith("/api/description", {
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
      global.fetch = createModernFetchMock(null, { status: 204 });

      const result = await insertDescription("test-description");

      expect(result).toBeNull();
      expect(mockValidateInsert).toHaveBeenCalled();
    });

    it("should use validated data from validation utility", async () => {
      const validatedData = {
        descriptionName: "sanitized-description",
        activeStatus: true,
      };
      mockValidateInsert.mockReturnValue(validatedData);

      global.fetch = createModernFetchMock({ descriptionId: 1 });

      await insertDescription("original-description");

      expect(fetch).toHaveBeenCalledWith("/api/description", {
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
      mockValidateInsert.mockImplementation(() => {
        throw new Error("insertDescription validation failed: Description name is required");
      });

      await expect(insertDescription("")).rejects.toThrow(
        "insertDescription validation failed: Description name is required",
      );

      expect(global.fetch).not.toHaveBeenCalled();
    });

    it("should handle validation errors without specific messages", async () => {
      mockValidateInsert.mockImplementation(() => {
        throw new Error("insertDescription validation failed: Validation failed");
      });

      await expect(insertDescription("invalid")).rejects.toThrow(
        "insertDescription validation failed: Validation failed",
      );
    });

    it("should handle validation errors with undefined errors array", async () => {
      mockValidateInsert.mockImplementation(() => {
        throw new Error("insertDescription validation failed: Validation failed");
      });

      await expect(insertDescription("invalid")).rejects.toThrow(
        "insertDescription validation failed: Validation failed",
      );
    });

    it("should validate description name requirements", async () => {
      mockValidateInsert.mockImplementation(() => {
        throw new Error("insertDescription validation failed: Invalid description name");
      });

      await expect(insertDescription("")).rejects.toThrow(
        "insertDescription validation failed: Invalid description name",
      );
    });
  });

  describe("API error handling", () => {
    it("should handle 400 error with response message", async () => {
      global.fetch = createModernErrorFetchMock(
        "Description already exists",
        400,
      );

      await expect(insertDescription("duplicate-description")).rejects.toThrow(
        "Description already exists",
      );
    });

    it("should handle 500 server error", async () => {
      global.fetch = createModernErrorFetchMock("Internal server error", 500);

      await expect(insertDescription("test-description")).rejects.toThrow(
        "Internal server error",
      );
    });

    it("should handle error response without message", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: jest.fn().mockResolvedValue({}),
      });

      await expect(insertDescription("test-description")).rejects.toThrow(
        "HTTP 400",
      );
    });

    it("should handle malformed error response", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: jest.fn().mockRejectedValue(new Error("Invalid JSON")),
      });

      await expect(insertDescription("test-description")).rejects.toThrow(
        "HTTP 400",
      );
    });

    it("should handle network errors", async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error("Network error"));

      await expect(insertDescription("test-description")).rejects.toThrow(
        "Network error",
      );
    });

    it("should handle timeout errors", async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error("Request timeout"));

      await expect(insertDescription("test-description")).rejects.toThrow(
        "Request timeout",
      );
    });
  });

  describe("Request format validation", () => {
    it("should send correct headers", async () => {
      global.fetch = createModernFetchMock({ descriptionId: 1 });

      await insertDescription("test-description");

      expect(fetch).toHaveBeenCalledWith("/api/description", {
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
      global.fetch = createModernFetchMock({ descriptionId: 1 });

      await insertDescription("test-description");

      expect(fetch).toHaveBeenCalledWith(
        "/api/description",
        expect.any(Object),
      );
    });

    it("should send POST method", async () => {
      global.fetch = createModernFetchMock({ descriptionId: 1 });

      await insertDescription("test-description");

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ method: "POST" }),
      );
    });

    it("should include credentials", async () => {
      global.fetch = createModernFetchMock({ descriptionId: 1 });

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

      global.fetch = createModernFetchMock({
        descriptionId: 1,
        descriptionName: specialDescription,
      });

      const result = await insertDescription(specialDescription);

      expect(result.descriptionName).toBe(specialDescription);
    });

    it("should handle unicode characters", async () => {
      const unicodeDescription = "测试 Description 🎉";

      global.fetch = createModernFetchMock({
        descriptionId: 1,
        descriptionName: unicodeDescription,
      });

      const result = await insertDescription(unicodeDescription);

      expect(result.descriptionName).toBe(unicodeDescription);
    });

    it("should handle very long description names", async () => {
      const longDescription = "A".repeat(500);

      global.fetch = createModernFetchMock({
        descriptionId: 1,
        descriptionName: longDescription,
      });

      const result = await insertDescription(longDescription);

      expect(result.descriptionName).toBe(longDescription);
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

      global.fetch = createModernFetchMock(expectedResponse);

      const result = await insertDescription(testDescription);

      expect(result).toEqual(expectedResponse);
    });

    it("should handle validation failure to API error chain", async () => {
      // API returns error
      global.fetch = createModernErrorFetchMock(
        "Description already exists in database",
        409,
      );

      await expect(insertDescription("test-description")).rejects.toThrow(
        "Description already exists in database",
      );
    });
  });
});
