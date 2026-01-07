/**
 * TDD Tests for Modern useDescriptionUpdate
 * Modern endpoint: PUT /api/description/{descriptionName}
 *
 * Key differences from legacy:
 * - Endpoint: /api/description/{descriptionName} (vs /api/description/update/{descriptionName})
 * - Uses descriptionName instead of descriptionId
 * - Sends newDescription in request body
 * - Uses ServiceResult pattern for errors
 */

import { ConsoleSpy } from "../../testHelpers";
import { createModernFetchMock } from "../../testHelpers";
import Description from "../../model/Description";

// Mock the useAuth hook
jest.mock("../../components/AuthProvider", () => ({
  useAuth: () => ({
    isAuthenticated: true,
    loading: false,
    user: null,
    login: jest.fn(),
    logout: jest.fn(),
  }),
}));

// Modern implementation to test
const updateDescriptionModern = async (
  oldDescription: Description,
  newDescription: Description,
): Promise<Description> => {
  const endpoint = `/api/description/${oldDescription.descriptionName}`;
  try {
    const response = await fetch(endpoint, {
      method: "PUT",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(newDescription),
    });

    if (!response.ok) {
      const errorBody = await response
        .json()
        .catch(() => ({ error: `HTTP error! Status: ${response.status}` }));
      const errorMessage =
        errorBody.error ||
        errorBody.errors?.join(", ") ||
        `HTTP error! Status: ${response.status}`;
      throw new Error(errorMessage);
    }

    return await response.json();
  } catch (error: any) {
    console.error(`An error occurred: ${error.message}`);
    throw error;
  }
};

// Helper function to create test description data
const createTestDescription = (
  overrides: Partial<Description> = {},
): Description => ({
  descriptionId: 1,
  descriptionName: "test_description",
  activeStatus: true,
  ...overrides,
});

describe("useDescriptionUpdate Modern Endpoint (TDD)", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  let consoleSpy: ConsoleSpy;

  beforeEach(() => {
    consoleSpy = new ConsoleSpy();
    jest.clearAllMocks();
  });

  afterEach(() => {
    consoleSpy.stop();
  });

  describe("Modern endpoint behavior", () => {
    it("should use modern endpoint /api/description/{descriptionName}", async () => {
      const oldDescription = createTestDescription({
        descriptionId: 123,
        descriptionName: "test_desc_123",
      });
      const newDescription = createTestDescription({
        descriptionId: 123,
        descriptionName: "test_desc_123_updated",
      });

      global.fetch = createModernFetchMock(newDescription);

      await updateDescriptionModern(oldDescription, newDescription);

      expect(fetch).toHaveBeenCalledWith("/api/description/test_desc_123", {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(newDescription),
      });
    });

    it("should update description successfully", async () => {
      const oldDescription = createTestDescription({
        descriptionId: 1,
        descriptionName: "old_name",
      });
      const newDescription = createTestDescription({
        descriptionId: 1,
        descriptionName: "new_name",
      });

      global.fetch = createModernFetchMock(newDescription);

      const result = await updateDescriptionModern(
        oldDescription,
        newDescription,
      );

      expect(result).toStrictEqual(newDescription);
      expect(result.descriptionName).toBe("new_name");
    });

    it("should send newDescription in request body", async () => {
      const oldDescription = createTestDescription({ descriptionId: 1 });
      const newDescription = createTestDescription({
        descriptionId: 1,
        descriptionName: "updated_name",
      });

      global.fetch = createModernFetchMock(newDescription);

      await updateDescriptionModern(oldDescription, newDescription);

      const callArgs = (fetch as jest.Mock).mock.calls[0][1];
      expect(callArgs.body).toBe(JSON.stringify(newDescription));
    });

    it("should use descriptionName from oldDescription in URL", async () => {
      const oldDescription = createTestDescription({
        descriptionId: 999,
        descriptionName: "test_desc_999",
      });
      const newDescription = createTestDescription({
        descriptionId: 999,
        descriptionName: "test_desc_999_new",
      });

      global.fetch = createModernFetchMock(newDescription);

      await updateDescriptionModern(oldDescription, newDescription);

      expect(fetch).toHaveBeenCalledWith(
        "/api/description/test_desc_999",
        expect.any(Object),
      );
    });
  });

  describe("Modern error handling with ServiceResult pattern", () => {
    it("should handle 404 not found with modern error format", async () => {
      const oldDescription = createTestDescription({ descriptionId: 999 });
      const newDescription = createTestDescription({ descriptionId: 999 });

      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({ error: "Description not found" }),
      });

      consoleSpy.start();

      await expect(
        updateDescriptionModern(oldDescription, newDescription),
      ).rejects.toThrow("Description not found");
    });

    it("should handle validation errors with modern format", async () => {
      const oldDescription = createTestDescription();
      const newDescription = createTestDescription({ descriptionName: "" });

      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({
          errors: [
            "descriptionName is required",
            "descriptionName must be non-empty",
          ],
        }),
      });

      consoleSpy.start();

      await expect(
        updateDescriptionModern(oldDescription, newDescription),
      ).rejects.toThrow(
        "descriptionName is required, descriptionName must be non-empty",
      );
    });

    it("should handle 401 unauthorized", async () => {
      const oldDescription = createTestDescription();
      const newDescription = createTestDescription();

      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ error: "Unauthorized" }),
      });

      consoleSpy.start();

      await expect(
        updateDescriptionModern(oldDescription, newDescription),
      ).rejects.toThrow("Unauthorized");
    });

    it("should handle 403 forbidden", async () => {
      const oldDescription = createTestDescription();
      const newDescription = createTestDescription();

      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 403,
        json: async () => ({ error: "Forbidden" }),
      });

      consoleSpy.start();

      await expect(
        updateDescriptionModern(oldDescription, newDescription),
      ).rejects.toThrow("Forbidden");
    });

    it("should handle 500 server error", async () => {
      const oldDescription = createTestDescription();
      const newDescription = createTestDescription();

      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ error: "Internal server error" }),
      });

      consoleSpy.start();

      await expect(
        updateDescriptionModern(oldDescription, newDescription),
      ).rejects.toThrow("Internal server error");
    });

    it("should handle error response without error field", async () => {
      const oldDescription = createTestDescription();
      const newDescription = createTestDescription();

      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({}),
      });

      consoleSpy.start();

      await expect(
        updateDescriptionModern(oldDescription, newDescription),
      ).rejects.toThrow("HTTP error! Status: 400");
    });

    it("should handle invalid JSON in error response", async () => {
      const oldDescription = createTestDescription();
      const newDescription = createTestDescription();

      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: jest.fn().mockRejectedValue(new Error("Invalid JSON")),
      });

      consoleSpy.start();

      await expect(
        updateDescriptionModern(oldDescription, newDescription),
      ).rejects.toThrow("HTTP error! Status: 500");
    });
  });

  describe("Network and connectivity errors", () => {
    it("should handle network errors", async () => {
      const oldDescription = createTestDescription();
      const newDescription = createTestDescription();

      global.fetch = jest.fn().mockRejectedValue(new Error("Network error"));

      consoleSpy.start();

      await expect(
        updateDescriptionModern(oldDescription, newDescription),
      ).rejects.toThrow("Network error");

      const calls = consoleSpy.getCalls();
      expect(
        calls.error.some((call) => call[0].includes("An error occurred:")),
      ).toBe(true);
    });

    it("should handle timeout errors", async () => {
      const oldDescription = createTestDescription();
      const newDescription = createTestDescription();

      global.fetch = jest.fn().mockRejectedValue(new Error("Timeout"));

      consoleSpy.start();

      await expect(
        updateDescriptionModern(oldDescription, newDescription),
      ).rejects.toThrow("Timeout");
    });

    it("should handle connection refused", async () => {
      const oldDescription = createTestDescription();
      const newDescription = createTestDescription();

      global.fetch = jest
        .fn()
        .mockRejectedValue(new Error("Connection refused"));

      consoleSpy.start();

      await expect(
        updateDescriptionModern(oldDescription, newDescription),
      ).rejects.toThrow("Connection refused");
    });
  });

  describe("Request configuration", () => {
    it("should use PUT method", async () => {
      const oldDescription = createTestDescription();
      const newDescription = createTestDescription();

      global.fetch = createModernFetchMock(newDescription);

      await updateDescriptionModern(oldDescription, newDescription);

      const callArgs = (fetch as jest.Mock).mock.calls[0][1];
      expect(callArgs.method).toBe("PUT");
    });

    it("should include credentials", async () => {
      const oldDescription = createTestDescription();
      const newDescription = createTestDescription();

      global.fetch = createModernFetchMock(newDescription);

      await updateDescriptionModern(oldDescription, newDescription);

      const callArgs = (fetch as jest.Mock).mock.calls[0][1];
      expect(callArgs.credentials).toBe("include");
    });

    it("should include correct headers", async () => {
      const oldDescription = createTestDescription();
      const newDescription = createTestDescription();

      global.fetch = createModernFetchMock(newDescription);

      await updateDescriptionModern(oldDescription, newDescription);

      const callArgs = (fetch as jest.Mock).mock.calls[0][1];
      expect(callArgs.headers).toStrictEqual({
        "Content-Type": "application/json",
        Accept: "application/json",
      });
    });
  });

  describe("Description name updates", () => {
    it("should update description name", async () => {
      const oldDescription = createTestDescription({
        descriptionName: "old_store",
      });
      const newDescription = createTestDescription({
        descriptionName: "new_store",
      });

      global.fetch = createModernFetchMock(newDescription);

      const result = await updateDescriptionModern(
        oldDescription,
        newDescription,
      );

      expect(result.descriptionName).toBe("new_store");
    });

    it("should update activeStatus", async () => {
      const oldDescription = createTestDescription({ activeStatus: true });
      const newDescription = createTestDescription({ activeStatus: false });

      global.fetch = createModernFetchMock(newDescription);

      const result = await updateDescriptionModern(
        oldDescription,
        newDescription,
      );

      expect(result.activeStatus).toBe(false);
    });

    it("should update multiple fields simultaneously", async () => {
      const oldDescription = createTestDescription({
        descriptionName: "old_name",
        activeStatus: true,
      });
      const newDescription = createTestDescription({
        descriptionName: "new_name",
        activeStatus: false,
      });

      global.fetch = createModernFetchMock(newDescription);

      const result = await updateDescriptionModern(
        oldDescription,
        newDescription,
      );

      expect(result.descriptionName).toBe("new_name");
      expect(result.activeStatus).toBe(false);
    });
  });

  describe("Edge cases", () => {
    it("should handle descriptions with special characters", async () => {
      const oldDescription = createTestDescription();
      const newDescription = createTestDescription({
        descriptionName: "store-with_special.chars",
      });

      global.fetch = createModernFetchMock(newDescription);

      const result = await updateDescriptionModern(
        oldDescription,
        newDescription,
      );

      expect(result.descriptionName).toBe("store-with_special.chars");
    });

    it("should handle descriptions with Unicode characters", async () => {
      const oldDescription = createTestDescription();
      const newDescription = createTestDescription({
        descriptionName: "店舗 🏪",
      });

      global.fetch = createModernFetchMock(newDescription);

      const result = await updateDescriptionModern(
        oldDescription,
        newDescription,
      );

      expect(result.descriptionName).toBe("店舗 🏪");
    });

    it("should handle descriptions with whitespace", async () => {
      const oldDescription = createTestDescription();
      const newDescription = createTestDescription({
        descriptionName: "  store with spaces  ",
      });

      global.fetch = createModernFetchMock(newDescription);

      const result = await updateDescriptionModern(
        oldDescription,
        newDescription,
      );

      expect(result.descriptionName).toBe("  store with spaces  ");
    });

    it("should handle descriptions with very long names", async () => {
      const longName = "a".repeat(500);
      const oldDescription = createTestDescription();
      const newDescription = createTestDescription({
        descriptionName: longName,
      });

      global.fetch = createModernFetchMock(newDescription);

      const result = await updateDescriptionModern(
        oldDescription,
        newDescription,
      );

      expect(result.descriptionName).toBe(longName);
      expect(result.descriptionName.length).toBe(500);
    });
  });

  describe("Common update scenarios", () => {
    it("should update retail store description", async () => {
      const oldDescription = createTestDescription({
        descriptionName: "amazon_old",
      });
      const newDescription = createTestDescription({
        descriptionName: "amazon",
      });

      global.fetch = createModernFetchMock(newDescription);

      const result = await updateDescriptionModern(
        oldDescription,
        newDescription,
      );

      expect(result.descriptionName).toBe("amazon");
    });

    it("should update service provider description", async () => {
      const oldDescription = createTestDescription({
        descriptionName: "grocery_old",
      });
      const newDescription = createTestDescription({
        descriptionName: "grocery_store",
      });

      global.fetch = createModernFetchMock(newDescription);

      const result = await updateDescriptionModern(
        oldDescription,
        newDescription,
      );

      expect(result.descriptionName).toBe("grocery_store");
    });

    it("should deactivate description", async () => {
      const oldDescription = createTestDescription({
        descriptionName: "old_store",
        activeStatus: true,
      });
      const newDescription = createTestDescription({
        descriptionName: "old_store",
        activeStatus: false,
      });

      global.fetch = createModernFetchMock(newDescription);

      const result = await updateDescriptionModern(
        oldDescription,
        newDescription,
      );

      expect(result.activeStatus).toBe(false);
    });

    it("should update gas station description", async () => {
      const oldDescription = createTestDescription({
        descriptionName: "gas_station_old",
      });
      const newDescription = createTestDescription({
        descriptionName: "gas_station",
      });

      global.fetch = createModernFetchMock(newDescription);

      const result = await updateDescriptionModern(
        oldDescription,
        newDescription,
      );

      expect(result.descriptionName).toBe("gas_station");
    });

    it("should rename store description", async () => {
      const oldDescription = createTestDescription({
        descriptionName: "walmart_old",
      });
      const newDescription = createTestDescription({
        descriptionName: "walmart",
      });

      global.fetch = createModernFetchMock(newDescription);

      const result = await updateDescriptionModern(
        oldDescription,
        newDescription,
      );

      expect(result.descriptionName).toBe("walmart");
    });
  });

  describe("Data integrity", () => {
    it("should preserve descriptionId", async () => {
      const oldDescription = createTestDescription({ descriptionId: 123 });
      const newDescription = createTestDescription({ descriptionId: 123 });

      global.fetch = createModernFetchMock(newDescription);

      const result = await updateDescriptionModern(
        oldDescription,
        newDescription,
      );

      expect(result.descriptionId).toBe(123);
    });

    it("should return updated description exactly as received from API", async () => {
      const oldDescription = createTestDescription();
      const newDescription = createTestDescription({
        descriptionId: 1,
        descriptionName: "updated_desc",
        activeStatus: true,
      });

      global.fetch = createModernFetchMock(newDescription);

      const result = await updateDescriptionModern(
        oldDescription,
        newDescription,
      );

      expect(result).toStrictEqual(newDescription);
    });
  });
});
