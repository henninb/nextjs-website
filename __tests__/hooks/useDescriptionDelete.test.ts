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

import Description from "../../model/Description";
import {
  createModernFetchMock,
  createModernErrorFetchMock,
  createTestDescription,
} from "../../testHelpers.modern";

const simulateNetworkError = () => {
  return jest.fn().mockRejectedValue(new Error("Network error"));
};

import { deleteDescription } from "../../hooks/useDescriptionDelete";
import { HookValidator } from "../../utils/hookValidation";

const mockValidateDelete = HookValidator.validateDelete as jest.Mock;

describe("deleteDescription (Isolated)", () => {
  const mockDescription = createTestDescription({
    descriptionId: 1,
    descriptionName: "electronics",
    activeStatus: true,
    dateAdded: new Date("2024-01-01"),
    dateUpdated: new Date("2024-01-01"),
  });


  beforeEach(() => {
    jest.clearAllMocks();
    // Reset validation mock
    mockValidateDelete.mockImplementation(() => {});
  });

  afterEach(() => {
  });

  describe("Successful deletion", () => {
    it("should delete description successfully with 204 status", async () => {
      global.fetch = createModernFetchMock(null, { status: 204 });

      const result = await deleteDescription(mockDescription);

      expect(result).toBeNull();
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/description/electronics",
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

    it("should return JSON data when status is not 204", async () => {
      const mockResponse = { message: "Description deleted", id: 1 };
      global.fetch = createModernFetchMock(mockResponse, { status: 200 });

      const result = await deleteDescription(mockDescription);

      expect(result).toEqual(mockResponse);
    });

    it("should construct correct endpoint URL with description name", async () => {
      const descriptionWithDifferentName = createTestDescription({
        ...mockDescription,
        descriptionName: "groceries",
      });
      global.fetch = createModernFetchMock(null, { status: 204 });

      await deleteDescription(descriptionWithDifferentName);

      expect(global.fetch).toHaveBeenCalledWith(
        "/api/description/groceries",
        expect.any(Object),
      );
    });

    it("should handle description name with special characters", async () => {
      const specialDescription = createTestDescription({
        ...mockDescription,
        descriptionName: "food & dining",
      });
      global.fetch = createModernFetchMock(null, { status: 204 });

      await deleteDescription(specialDescription);

      // Special characters are sanitized in URL path
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/description/food  dining",
        expect.any(Object),
      );
    });
  });

  describe("Error handling", () => {
    it("should handle server error with error message", async () => {
      const errorMessage = "Cannot delete this description";
      global.fetch = createModernErrorFetchMock(errorMessage, 400);

      await expect(deleteDescription(mockDescription)).rejects.toThrow(
        errorMessage,
      );
    });

    it("should handle server error without error message", async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: jest.fn().mockResolvedValueOnce({}),
      });

      await expect(deleteDescription(mockDescription)).rejects.toThrow(
        "HTTP 400",
      );
    });

    it("should handle JSON parsing errors in error response", async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: jest.fn().mockRejectedValueOnce(new Error("Invalid JSON")),
      });

      await expect(deleteDescription(mockDescription)).rejects.toThrow(
        "HTTP 400",
      );
    });

    it("should handle empty error message gracefully", async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: jest.fn().mockResolvedValueOnce({}),
      });

      await expect(deleteDescription(mockDescription)).rejects.toThrow(
        "HTTP 500",
      );
    });

    it("should handle network errors", async () => {
      global.fetch = simulateNetworkError();

      await expect(deleteDescription(mockDescription)).rejects.toThrow(
        "Network error",
      );
    });

    it("should handle various HTTP error statuses", async () => {
      const errorStatuses = [400, 401, 403, 404, 409, 500];

      for (const status of errorStatuses) {
        const errorMessage = `Error ${status}`;
        global.fetch = createModernErrorFetchMock(errorMessage, status);

        await expect(deleteDescription(mockDescription)).rejects.toThrow(
          errorMessage,
        );
      }
    });

    it("should handle fetch rejection", async () => {
      global.fetch = jest
        .fn()
        .mockRejectedValueOnce(new Error("Connection failed"));

      await expect(deleteDescription(mockDescription)).rejects.toThrow(
        "Connection failed",
      );
    });
  });

  describe("Request format validation", () => {
    it("should use DELETE method", async () => {
      global.fetch = createModernFetchMock(null, { status: 204 });

      await deleteDescription(mockDescription);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: "DELETE",
        }),
      );
    });

    it("should include credentials", async () => {
      global.fetch = createModernFetchMock(null, { status: 204 });

      await deleteDescription(mockDescription);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          credentials: "include",
        }),
      );
    });

    it("should include correct headers", async () => {
      global.fetch = createModernFetchMock(null, { status: 204 });

      await deleteDescription(mockDescription);

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

    it("should not include request body for DELETE", async () => {
      global.fetch = createModernFetchMock(null, { status: 204 });

      await deleteDescription(mockDescription);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.not.objectContaining({
          body: expect.anything(),
        }),
      );
    });
  });

  describe("Response handling", () => {
    it("should return parsed JSON response for non-204 status", async () => {
      const responseData = {
        descriptionId: 1,
        descriptionName: "electronics",
        message: "Successfully deleted",
        timestamp: "2024-01-15T10:00:00Z",
      };
      global.fetch = createModernFetchMock(responseData, { status: 200 });

      const result = await deleteDescription(mockDescription);

      expect(result).toEqual(responseData);
    });

    it("should handle empty response body", async () => {
      global.fetch = createModernFetchMock({}, { status: 200 });

      const result = await deleteDescription(mockDescription);

      expect(result).toEqual({});
    });

    it("should handle complex response data", async () => {
      const complexResponse = {
        descriptionId: 1,
        descriptionName: "electronics",
        deletedAt: "2024-01-15T10:00:00Z",
        metadata: {
          deletedBy: "admin",
          reason: "cleanup",
        },
      };
      global.fetch = createModernFetchMock(complexResponse, { status: 200 });

      const result = await deleteDescription(mockDescription);

      expect(result).toEqual(complexResponse);
    });

    it("should prioritize 204 status over response body", async () => {
      // Even if there's a response body, 204 should return null
      const mockJson = jest.fn().mockResolvedValueOnce({ message: "ignored" });
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        status: 204,
        json: mockJson,
      });

      const result = await deleteDescription(mockDescription);

      expect(result).toBeNull();
      // json() should not be called for 204 responses
      expect(mockJson).not.toHaveBeenCalled();
    });
  });

  describe("Edge cases", () => {
    it("should handle description with empty name", async () => {
      const emptyNameDescription = createTestDescription({
        ...mockDescription,
        descriptionName: "",
      });
      global.fetch = createModernFetchMock(null, { status: 204 });

      await deleteDescription(emptyNameDescription);

      expect(global.fetch).toHaveBeenCalledWith(
        "/api/description/",
        expect.any(Object),
      );
    });

    it("should handle description with very long name", async () => {
      const longDescriptionName = "A".repeat(255);
      const longNameDescription = createTestDescription({
        ...mockDescription,
        descriptionName: longDescriptionName,
      });
      global.fetch = createModernFetchMock(null, { status: 204 });

      await deleteDescription(longNameDescription);

      expect(global.fetch).toHaveBeenCalledWith(
        `/api/description/${longDescriptionName}`,
        expect.any(Object),
      );
    });

    it("should handle description with numeric-like name", async () => {
      const numericDescription = createTestDescription({
        ...mockDescription,
        descriptionName: "12345",
      });
      global.fetch = createModernFetchMock(null, { status: 204 });

      await deleteDescription(numericDescription);

      expect(global.fetch).toHaveBeenCalledWith(
        "/api/description/12345",
        expect.any(Object),
      );
    });

    it("should handle description with Unicode characters", async () => {
      const unicodeDescription = createTestDescription({
        ...mockDescription,
        descriptionName: "café & résumé",
      });
      global.fetch = createModernFetchMock(null, { status: 204 });

      await deleteDescription(unicodeDescription);

      // Unicode and special characters are sanitized in URL path
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/description/caf  rsum",
        expect.any(Object),
      );
    });

    it("should handle description with null/undefined properties", async () => {
      const descriptionWithNulls = {
        ...mockDescription,
        dateAdded: null as any,
        dateUpdated: undefined as any,
      };
      global.fetch = createModernFetchMock(null, { status: 204 });

      await deleteDescription(descriptionWithNulls);

      expect(global.fetch).toHaveBeenCalledWith(
        "/api/description/electronics",
        expect.any(Object),
      );
    });
  });

  describe("Business logic validation", () => {
    it("should use description name in endpoint URL", async () => {
      const businessDescription = createTestDescription({
        descriptionId: 999, // Should not be used in endpoint
        descriptionName: "business_expense",
        activeStatus: false, // Should not affect endpoint
      });
      global.fetch = createModernFetchMock(null, { status: 204 });

      await deleteDescription(businessDescription);

      expect(global.fetch).toHaveBeenCalledWith(
        "/api/description/business_expense",
        expect.any(Object),
      );
    });

    it("should not modify description data before deletion", async () => {
      const originalDescription = createTestDescription({
        descriptionId: 123,
        descriptionName: "original_description",
        activeStatus: true,
      });
      global.fetch = createModernFetchMock(null, { status: 204 });

      await deleteDescription(originalDescription);

      // Verify endpoint uses exact description name
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/description/original_description",
        expect.any(Object),
      );
    });

    it("should handle case-sensitive description names", async () => {
      const caseSensitiveDescriptions = [
        "Electronics",
        "electronics",
        "ELECTRONICS",
        "eLeCTRoNiCs",
      ];

      for (const name of caseSensitiveDescriptions) {
        const description = createTestDescription({
          ...mockDescription,
          descriptionName: name,
        });
        global.fetch = createModernFetchMock(null, { status: 204 });

        await deleteDescription(description);

        expect(global.fetch).toHaveBeenCalledWith(
          `/api/description/${name}`,
          expect.any(Object),
        );
      }
    });
  });

  describe("HTTP status validation", () => {
    it("should handle different success status codes", async () => {
      const successStatuses = [200, 202, 204];

      for (const status of successStatuses) {
        const responseData =
          status === 204 ? null : { message: `Status ${status}` };
        global.fetch = createModernFetchMock(responseData, { status });

        const result = await deleteDescription(mockDescription);

        if (status === 204) {
          expect(result).toBeNull();
        } else {
          expect(result).toEqual(responseData);
        }
      }
    });

    it("should handle server error status codes", async () => {
      const errorStatuses = [
        { status: 400, message: "Bad Request" },
        { status: 403, message: "Forbidden" },
        { status: 404, message: "Not Found" },
        { status: 409, message: "Conflict" },
        { status: 500, message: "Internal Server Error" },
        { status: 503, message: "Service Unavailable" },
      ];

      for (const { status, message } of errorStatuses) {
        global.fetch = createModernErrorFetchMock(message, status);

        await expect(deleteDescription(mockDescription)).rejects.toThrow(
          message,
        );
      }
    });
  });
});
