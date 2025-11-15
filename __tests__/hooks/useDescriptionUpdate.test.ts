/**
 * Isolated tests for useDescriptionUpdate business logic
 * Tests updateDescription function without React Query overhead
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
import Description from "../../model/Description";

// Mock description data
const createTestDescription = (overrides = {}): Description => ({
  descriptionId: 1,
  descriptionName: "testDescription",
  activeStatus: true,
  dateAdded: new Date("2023-01-01"),
  dateUpdated: new Date("2023-01-01"),
  ...overrides,
});

import { updateDescription } from "../../hooks/useDescriptionUpdate";
import { HookValidator } from "../../utils/hookValidation";

const mockValidateUpdate = HookValidator.validateUpdate as jest.Mock;

describe("updateDescription (Isolated)", () => {

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset validation mock
    mockValidateUpdate.mockImplementation((newData) => newData);
  });

  afterEach(() => {
  });

  describe("Successful updates", () => {
    it("should update description successfully", async () => {
      const oldDescription = createTestDescription({
        descriptionName: "oldDescription",
        activeStatus: true,
      });

      const newDescription = createTestDescription({
        descriptionId: 1,
        descriptionName: "updatedDescription",
        activeStatus: true,
        dateUpdated: new Date("2023-12-25"),
      });

      global.fetch = createModernFetchMock(newDescription);

      const result = await updateDescription(oldDescription, newDescription);

      expect(result).toEqual(newDescription);
      expect(fetch).toHaveBeenCalledWith(
        `/api/description/${oldDescription.descriptionName}`,
        {
          method: "PUT",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(newDescription),
        },
      );
    });

    it("should use old description name in endpoint path", async () => {
      const oldDescription = createTestDescription({
        descriptionName: "originalName",
      });

      const newDescription = createTestDescription({
        descriptionName: "newName",
      });

      global.fetch = createModernFetchMock(newDescription);

      await updateDescription(oldDescription, newDescription);

      expect(fetch).toHaveBeenCalledWith(
        "/api/description/originalName",
        expect.any(Object),
      );
    });

    it("should send new description data in request body", async () => {
      const oldDescription = createTestDescription({
        descriptionName: "old",
        activeStatus: true,
      });

      const newDescription = createTestDescription({
        descriptionName: "new",
        activeStatus: false,
      });

      global.fetch = createModernFetchMock(newDescription);

      await updateDescription(oldDescription, newDescription);

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify(newDescription),
        }),
      );
    });

    it("should handle status changes", async () => {
      const oldDescription = createTestDescription({
        descriptionName: "testDesc",
        activeStatus: true,
      });

      const newDescription = createTestDescription({
        descriptionName: "testDesc",
        activeStatus: false, // Deactivating
      });

      global.fetch = createModernFetchMock(newDescription);

      const result = await updateDescription(oldDescription, newDescription);

      expect(result.activeStatus).toBe(false);
    });
  });

  describe("Error handling", () => {
    it("should handle 404 not found errors", async () => {
      const oldDescription = createTestDescription({
        descriptionName: "nonexistent",
      });
      const newDescription = createTestDescription();

      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 404,
        json: jest.fn().mockResolvedValue({ error: "Not found" }),
      });

      await expect(
        updateDescription(oldDescription, newDescription),
      ).rejects.toThrow("Not found");
    });

    it("should handle 400 bad request errors", async () => {
      const oldDescription = createTestDescription();
      const newDescription = createTestDescription();

      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: jest.fn().mockResolvedValue({ error: "Bad request" }),
      });

      await expect(
        updateDescription(oldDescription, newDescription),
      ).rejects.toThrow("Bad request");
    });

    it("should handle 500 server errors", async () => {
      const oldDescription = createTestDescription();
      const newDescription = createTestDescription();

      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: jest.fn().mockResolvedValue({ error: "Internal server error" }),
      });

      await expect(
        updateDescription(oldDescription, newDescription),
      ).rejects.toThrow("Internal server error");
    });

    it("should handle network errors", async () => {
      const oldDescription = createTestDescription();
      const newDescription = createTestDescription();

      global.fetch = jest.fn().mockRejectedValue(new Error("Network error"));

      await expect(
        updateDescription(oldDescription, newDescription),
      ).rejects.toThrow("Network error");
    });

    it("should handle timeout errors", async () => {
      const oldDescription = createTestDescription();
      const newDescription = createTestDescription();

      global.fetch = jest.fn().mockRejectedValue(new Error("Request timeout"));

      await expect(
        updateDescription(oldDescription, newDescription),
      ).rejects.toThrow("Request timeout");
    });
  });

  describe("Request format validation", () => {
    it("should use PUT method", async () => {
      const oldDescription = createTestDescription();
      const newDescription = createTestDescription();

      global.fetch = createModernFetchMock(newDescription);

      await updateDescription(oldDescription, newDescription);

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ method: "PUT" }),
      );
    });

    it("should include credentials", async () => {
      const oldDescription = createTestDescription();
      const newDescription = createTestDescription();

      global.fetch = createModernFetchMock(newDescription);

      await updateDescription(oldDescription, newDescription);

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ credentials: "include" }),
      );
    });

    it("should send correct headers", async () => {
      const oldDescription = createTestDescription();
      const newDescription = createTestDescription();

      global.fetch = createModernFetchMock(newDescription);

      await updateDescription(oldDescription, newDescription);

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
  });

  describe("Edge cases and special scenarios", () => {
    it("should handle special characters in description names", async () => {
      const oldDescription = createTestDescription({
        descriptionName: "special-chars!@#$%",
      });
      const newDescription = createTestDescription({
        descriptionName: "new-special-chars&*()_+",
      });

      global.fetch = createModernFetchMock(newDescription);

      const result = await updateDescription(oldDescription, newDescription);

      expect(result.descriptionName).toBe("new-special-chars&*()_+");
      // Special characters are sanitized in URL path
      expect(fetch).toHaveBeenCalledWith(
        "/api/description/special-chars!",
        expect.any(Object),
      );
    });

    it("should handle unicode characters", async () => {
      const oldDescription = createTestDescription({
        descriptionName: "测试描述",
      });
      const newDescription = createTestDescription({
        descriptionName: "新的测试描述 🚀",
      });

      global.fetch = createModernFetchMock(newDescription);

      const result = await updateDescription(oldDescription, newDescription);

      expect(result.descriptionName).toBe("新的测试描述 🚀");
    });

    it("should handle very long description names", async () => {
      const longName = "A".repeat(500);
      const oldDescription = createTestDescription({
        descriptionName: "short",
      });
      const newDescription = createTestDescription({
        descriptionName: longName,
      });

      global.fetch = createModernFetchMock(newDescription);

      const result = await updateDescription(oldDescription, newDescription);

      expect(result.descriptionName).toBe(longName);
    });

    it("should handle activating inactive descriptions", async () => {
      const oldDescription = createTestDescription({
        descriptionName: "inactive",
        activeStatus: false,
      });
      const newDescription = createTestDescription({
        descriptionName: "inactive",
        activeStatus: true,
      });

      global.fetch = createModernFetchMock(newDescription);

      const result = await updateDescription(oldDescription, newDescription);

      expect(result.activeStatus).toBe(true);
    });

    it("should handle deactivating active descriptions", async () => {
      const oldDescription = createTestDescription({
        descriptionName: "active",
        activeStatus: true,
      });
      const newDescription = createTestDescription({
        descriptionName: "active",
        activeStatus: false,
      });

      global.fetch = createModernFetchMock(newDescription);

      const result = await updateDescription(oldDescription, newDescription);

      expect(result.activeStatus).toBe(false);
    });

    it("should handle date updates", async () => {
      const oldDescription = createTestDescription({
        dateUpdated: new Date("2023-01-01"),
      });
      const newDate = new Date("2023-12-25T15:30:00.000Z");
      const newDescription = createTestDescription({
        dateUpdated: newDate,
      });

      global.fetch = createModernFetchMock(newDescription);

      const result = await updateDescription(oldDescription, newDescription);

      expect(result.dateUpdated).toEqual(newDate);
    });
  });

  describe("Business logic scenarios", () => {
    it("should handle renaming descriptions", async () => {
      const oldDescription = createTestDescription({
        descriptionName: "oldName",
        activeStatus: true,
      });
      const newDescription = createTestDescription({
        descriptionName: "newName",
        activeStatus: true,
      });

      global.fetch = createModernFetchMock(newDescription);

      const result = await updateDescription(oldDescription, newDescription);

      expect(result.descriptionName).toBe("newName");
      expect(fetch).toHaveBeenCalledWith(
        "/api/description/oldName",
        expect.any(Object),
      );
    });

    it("should handle bulk property updates", async () => {
      const oldDescription = createTestDescription({
        descriptionName: "bulk",
        activeStatus: true,
        dateUpdated: new Date("2023-01-01"),
      });
      const newDescription = createTestDescription({
        descriptionName: "bulkUpdated",
        activeStatus: false,
        dateUpdated: new Date("2023-12-25"),
      });

      global.fetch = createModernFetchMock(newDescription);

      const result = await updateDescription(oldDescription, newDescription);

      expect(result.descriptionName).toBe("bulkUpdated");
      expect(result.activeStatus).toBe(false);
      expect(result.dateUpdated).toEqual(new Date("2023-12-25"));
    });

    it("should handle partial updates (only status change)", async () => {
      const oldDescription = createTestDescription({
        descriptionName: "unchanged",
        activeStatus: true,
      });
      const newDescription = createTestDescription({
        descriptionName: "unchanged",
        activeStatus: false, // Only change status
      });

      global.fetch = createModernFetchMock(newDescription);

      const result = await updateDescription(oldDescription, newDescription);

      expect(result.descriptionName).toBe("unchanged");
      expect(result.activeStatus).toBe(false);
    });

    it("should preserve description ID during updates", async () => {
      const oldDescription = createTestDescription({
        descriptionId: 42,
        descriptionName: "preserve-id",
      });
      const newDescription = createTestDescription({
        descriptionId: 42,
        descriptionName: "updated-preserve-id",
      });

      global.fetch = createModernFetchMock(newDescription);

      const result = await updateDescription(oldDescription, newDescription);

      expect(result.descriptionId).toBe(42);
      expect(result.descriptionName).toBe("updated-preserve-id");
    });
  });

  describe("Integration scenarios", () => {
    it("should handle complete update workflow", async () => {
      const oldDescription = createTestDescription({
        descriptionId: 1,
        descriptionName: "originalDesc",
        activeStatus: true,
        dateAdded: new Date("2023-01-01"),
        dateUpdated: new Date("2023-01-01"),
      });

      const newDescription = createTestDescription({
        descriptionId: 1,
        descriptionName: "updatedDesc",
        activeStatus: false,
        dateAdded: new Date("2023-01-01"), // Preserve creation date
        dateUpdated: new Date("2023-12-25"), // Update modification date
      });

      global.fetch = createModernFetchMock(newDescription);

      const result = await updateDescription(oldDescription, newDescription);

      expect(result).toEqual(newDescription);
      expect(fetch).toHaveBeenCalledWith("/api/description/originalDesc", {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
            Accept: "application/json",
        },
        body: JSON.stringify(newDescription),
      });
    });

    it("should handle server validation errors gracefully", async () => {
      const oldDescription = createTestDescription({
        descriptionName: "valid",
      });
      const newDescription = createTestDescription({
        descriptionName: "", // Invalid empty name
      });

      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 422,
        json: jest.fn().mockResolvedValue({ error: "Unprocessable entity" }),
      });

      await expect(
        updateDescription(oldDescription, newDescription),
      ).rejects.toThrow("Unprocessable entity");
    });
  });
});
