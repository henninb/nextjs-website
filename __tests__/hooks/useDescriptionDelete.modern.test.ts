/**
 * TDD Tests for Modern useDescriptionDelete
 * Modern endpoint: DELETE /api/description/{descriptionName}
 *
 * Key differences from legacy:
 * - Endpoint: /api/description/{descriptionName} (vs /api/description/delete/{descriptionName})
 * - Uses descriptionName instead of descriptionId
 * - Uses ServiceResult pattern for errors
 */

import { ConsoleSpy } from "../../testHelpers";
import { createModernFetchMock } from "../../testHelpers.modern";
import Description from "../../model/Description";

// Modern implementation to test
const deleteDescriptionModern = async (
  payload: Description,
): Promise<Description | null> => {
  try {
    const endpoint = `/api/description/${payload.descriptionName}`;

    const response = await fetch(endpoint, {
      method: "DELETE",
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
      const errorMessage =
        errorBody.error ||
        errorBody.errors?.join(", ") ||
        `HTTP error! Status: ${response.status}`;
      throw new Error(errorMessage);
    }

    return response.status !== 204 ? await response.json() : null;
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

describe("useDescriptionDelete Modern Endpoint (TDD)", () => {
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
      const testDescription = createTestDescription({
        descriptionId: 123,
        descriptionName: "test_desc_123",
      });

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 204,
      });

      await deleteDescriptionModern(testDescription);

      expect(fetch).toHaveBeenCalledWith("/api/description/test_desc_123", {
        method: "DELETE",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });
    });

    it("should delete description successfully with 204 response", async () => {
      const testDescription = createTestDescription();

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 204,
      });

      const result = await deleteDescriptionModern(testDescription);

      expect(result).toBeNull();
    });

    it("should delete description successfully with 200 response", async () => {
      const testDescription = createTestDescription();

      global.fetch = createModernFetchMock(testDescription);

      const result = await deleteDescriptionModern(testDescription);

      expect(result).toEqual(testDescription);
    });

    it("should use descriptionName from payload in URL", async () => {
      const testDescription = createTestDescription({
        descriptionId: 999,
        descriptionName: "test_desc_999",
      });

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 204,
      });

      await deleteDescriptionModern(testDescription);

      expect(fetch).toHaveBeenCalledWith(
        "/api/description/test_desc_999",
        expect.any(Object),
      );
    });
  });

  describe("Modern error handling with ServiceResult pattern", () => {
    it("should handle 404 not found with modern error format", async () => {
      const testDescription = createTestDescription({ descriptionId: 999 });

      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({ error: "Description not found" }),
      });

      consoleSpy.start();

      await expect(deleteDescriptionModern(testDescription)).rejects.toThrow(
        "Description not found",
      );
    });

    it("should handle 401 unauthorized", async () => {
      const testDescription = createTestDescription();

      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ error: "Unauthorized" }),
      });

      consoleSpy.start();

      await expect(deleteDescriptionModern(testDescription)).rejects.toThrow(
        "Unauthorized",
      );
    });

    it("should handle 403 forbidden", async () => {
      const testDescription = createTestDescription();

      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 403,
        json: async () => ({ error: "Forbidden" }),
      });

      consoleSpy.start();

      await expect(deleteDescriptionModern(testDescription)).rejects.toThrow(
        "Forbidden",
      );
    });

    it("should handle 409 conflict (description in use)", async () => {
      const testDescription = createTestDescription({
        descriptionName: "amazon",
      });

      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 409,
        json: async () => ({
          error: "Cannot delete description amazon - in use",
        }),
      });

      consoleSpy.start();

      await expect(deleteDescriptionModern(testDescription)).rejects.toThrow(
        "Cannot delete description amazon - in use",
      );
    });

    it("should handle 500 server error", async () => {
      const testDescription = createTestDescription();

      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ error: "Internal server error" }),
      });

      consoleSpy.start();

      await expect(deleteDescriptionModern(testDescription)).rejects.toThrow(
        "Internal server error",
      );
    });

    it("should handle error response without error field", async () => {
      const testDescription = createTestDescription();

      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({}),
      });

      consoleSpy.start();

      await expect(deleteDescriptionModern(testDescription)).rejects.toThrow(
        "HTTP error! Status: 400",
      );
    });

    it("should handle invalid JSON in error response", async () => {
      const testDescription = createTestDescription();

      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: jest.fn().mockRejectedValue(new Error("Invalid JSON")),
      });

      consoleSpy.start();

      await expect(deleteDescriptionModern(testDescription)).rejects.toThrow(
        "HTTP error! Status: 500",
      );
    });

    it("should handle validation errors with modern format", async () => {
      const testDescription = createTestDescription();

      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({
          errors: [
            "descriptionId is required",
            "descriptionId must be a valid number",
          ],
        }),
      });

      consoleSpy.start();

      await expect(deleteDescriptionModern(testDescription)).rejects.toThrow(
        "descriptionId is required, descriptionId must be a valid number",
      );
    });
  });

  describe("Network and connectivity errors", () => {
    it("should handle network errors", async () => {
      const testDescription = createTestDescription();

      global.fetch = jest.fn().mockRejectedValue(new Error("Network error"));

      consoleSpy.start();

      await expect(deleteDescriptionModern(testDescription)).rejects.toThrow(
        "Network error",
      );

      const calls = consoleSpy.getCalls();
      expect(
        calls.error.some((call) => call[0].includes("An error occurred:")),
      ).toBe(true);
    });

    it("should handle timeout errors", async () => {
      const testDescription = createTestDescription();

      global.fetch = jest.fn().mockRejectedValue(new Error("Timeout"));

      consoleSpy.start();

      await expect(deleteDescriptionModern(testDescription)).rejects.toThrow(
        "Timeout",
      );
    });

    it("should handle connection refused", async () => {
      const testDescription = createTestDescription();

      global.fetch = jest
        .fn()
        .mockRejectedValue(new Error("Connection refused"));

      consoleSpy.start();

      await expect(deleteDescriptionModern(testDescription)).rejects.toThrow(
        "Connection refused",
      );
    });
  });

  describe("Request configuration", () => {
    it("should use DELETE method", async () => {
      const testDescription = createTestDescription();

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 204,
      });

      await deleteDescriptionModern(testDescription);

      const callArgs = (fetch as jest.Mock).mock.calls[0][1];
      expect(callArgs.method).toBe("DELETE");
    });

    it("should include credentials", async () => {
      const testDescription = createTestDescription();

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 204,
      });

      await deleteDescriptionModern(testDescription);

      const callArgs = (fetch as jest.Mock).mock.calls[0][1];
      expect(callArgs.credentials).toBe("include");
    });

    it("should include correct headers", async () => {
      const testDescription = createTestDescription();

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 204,
      });

      await deleteDescriptionModern(testDescription);

      const callArgs = (fetch as jest.Mock).mock.calls[0][1];
      expect(callArgs.headers).toEqual({
        "Content-Type": "application/json",
        Accept: "application/json",
      });
    });

    it("should not send body in DELETE request", async () => {
      const testDescription = createTestDescription();

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 204,
      });

      await deleteDescriptionModern(testDescription);

      const callArgs = (fetch as jest.Mock).mock.calls[0][1];
      expect(callArgs.body).toBeUndefined();
    });
  });

  describe("Response handling", () => {
    it("should return null for 204 No Content", async () => {
      const testDescription = createTestDescription();

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 204,
      });

      const result = await deleteDescriptionModern(testDescription);

      expect(result).toBeNull();
    });

    it("should return description data for 200 OK", async () => {
      const testDescription = createTestDescription({
        descriptionId: 123,
        descriptionName: "deleted_desc",
      });

      global.fetch = createModernFetchMock(testDescription);

      const result = await deleteDescriptionModern(testDescription);

      expect(result).toEqual(testDescription);
    });

    it("should handle different descriptionName values", async () => {
      const descriptionNames = ["desc_1", "desc_100", "desc_999", "desc_12345"];

      for (const name of descriptionNames) {
        const testDescription = createTestDescription({
          descriptionName: name,
        });

        global.fetch = jest.fn().mockResolvedValue({
          ok: true,
          status: 204,
        });

        await deleteDescriptionModern(testDescription);

        expect(fetch).toHaveBeenCalledWith(
          `/api/description/${name}`,
          expect.any(Object),
        );
      }
    });
  });

  describe("Common deletion scenarios", () => {
    it("should delete retail store description", async () => {
      const testDescription = createTestDescription({
        descriptionId: 1,
        descriptionName: "amazon",
      });

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 204,
      });

      const result = await deleteDescriptionModern(testDescription);

      expect(result).toBeNull();
      expect(fetch).toHaveBeenCalledWith(
        "/api/description/amazon",
        expect.any(Object),
      );
    });

    it("should delete walmart description", async () => {
      const testDescription = createTestDescription({
        descriptionId: 2,
        descriptionName: "walmart",
      });

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 204,
      });

      const result = await deleteDescriptionModern(testDescription);

      expect(result).toBeNull();
      expect(fetch).toHaveBeenCalledWith(
        "/api/description/walmart",
        expect.any(Object),
      );
    });

    it("should delete target description", async () => {
      const testDescription = createTestDescription({
        descriptionId: 3,
        descriptionName: "target",
      });

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 204,
      });

      const result = await deleteDescriptionModern(testDescription);

      expect(result).toBeNull();
      expect(fetch).toHaveBeenCalledWith(
        "/api/description/target",
        expect.any(Object),
      );
    });

    it("should delete grocery store description", async () => {
      const testDescription = createTestDescription({
        descriptionId: 4,
        descriptionName: "grocery_store",
      });

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 204,
      });

      const result = await deleteDescriptionModern(testDescription);

      expect(result).toBeNull();
      expect(fetch).toHaveBeenCalledWith(
        "/api/description/grocery_store",
        expect.any(Object),
      );
    });

    it("should delete gas station description", async () => {
      const testDescription = createTestDescription({
        descriptionId: 5,
        descriptionName: "gas_station",
      });

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 204,
      });

      const result = await deleteDescriptionModern(testDescription);

      expect(result).toBeNull();
      expect(fetch).toHaveBeenCalledWith(
        "/api/description/gas_station",
        expect.any(Object),
      );
    });

    it("should delete inactive description", async () => {
      const testDescription = createTestDescription({
        descriptionId: 6,
        descriptionName: "old_store",
        activeStatus: false,
      });

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 204,
      });

      const result = await deleteDescriptionModern(testDescription);

      expect(result).toBeNull();
    });
  });

  describe("Edge cases", () => {
    it("should handle deletion of description with special characters in name", async () => {
      const testDescription = createTestDescription({
        descriptionId: 100,
        descriptionName: "store-with_special.chars",
      });

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 204,
      });

      await deleteDescriptionModern(testDescription);

      expect(fetch).toHaveBeenCalledWith(
        "/api/description/store-with_special.chars",
        expect.any(Object),
      );
    });

    it("should handle deletion of description with Unicode characters in name", async () => {
      const testDescription = createTestDescription({
        descriptionId: 101,
        descriptionName: "店舗 🏪",
      });

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 204,
      });

      await deleteDescriptionModern(testDescription);

      expect(fetch).toHaveBeenCalledWith(
        "/api/description/店舗 🏪",
        expect.any(Object),
      );
    });

    it("should handle deletion of description with whitespace in name", async () => {
      const testDescription = createTestDescription({
        descriptionId: 102,
        descriptionName: "  store with spaces  ",
      });

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 204,
      });

      const result = await deleteDescriptionModern(testDescription);

      expect(result).toBeNull();
    });

    it("should handle deletion of description with long name", async () => {
      const longName = "a".repeat(500);
      const testDescription = createTestDescription({
        descriptionId: 103,
        descriptionName: longName,
      });

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 204,
      });

      const result = await deleteDescriptionModern(testDescription);

      expect(result).toBeNull();
    });
  });

  describe("Data integrity", () => {
    it("should use correct descriptionName from payload", async () => {
      const testDescription = createTestDescription({
        descriptionId: 456,
        descriptionName: "test",
      });

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 204,
      });

      await deleteDescriptionModern(testDescription);

      const url = (fetch as jest.Mock).mock.calls[0][0];
      expect(url).toBe("/api/description/test");
    });

    it("should return exact description data when API returns 200", async () => {
      const testDescription = createTestDescription({
        descriptionId: 789,
        descriptionName: "exact_desc",
        activeStatus: true,
      });

      global.fetch = createModernFetchMock(testDescription);

      const result = await deleteDescriptionModern(testDescription);

      expect(result).toEqual(testDescription);
    });
  });

  describe("Error logging", () => {
    it("should log error message to console", async () => {
      const testDescription = createTestDescription();

      global.fetch = jest.fn().mockRejectedValue(new Error("Test error"));

      consoleSpy.start();

      await expect(deleteDescriptionModern(testDescription)).rejects.toThrow();

      const calls = consoleSpy.getCalls();
      expect(
        calls.error.some((call) =>
          call[0].includes("An error occurred: Test error"),
        ),
      ).toBe(true);
    });
  });
});
