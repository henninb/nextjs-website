/**
 * TDD Tests for Modern useDescriptionFetch
 * Modern endpoint: GET /api/description/active
 *
 * Key differences from legacy:
 * - Endpoint: /api/description/active (vs /api/description/select/active)
 * - Uses ServiceResult pattern for errors
 * - Error format: { error: "message" }
 */

import { ConsoleSpy } from "../../testHelpers";
import { createModernFetchMock } from "../../testHelpers.modern";
import Description from "../../model/Description";

// Modern implementation to test
const fetchDescriptionDataModern = async (): Promise<Description[]> => {
  try {
    const response = await fetch("/api/description/active", {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({ error: `HTTP error! Status: ${response.status}` }));
      throw new Error(errorBody.error || `HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error("Error fetching description data:", error);
    throw new Error(`Failed to fetch description data: ${error.message}`);
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

describe("useDescriptionFetch Modern Endpoint (TDD)", () => {
  let consoleSpy: ConsoleSpy;

  beforeEach(() => {
    consoleSpy = new ConsoleSpy();
    jest.clearAllMocks();
  });

  afterEach(() => {
    consoleSpy.stop();
  });

  describe("Modern endpoint behavior", () => {
    it("should use modern endpoint /api/description/active", async () => {
      global.fetch = createModernFetchMock([]);

      await fetchDescriptionDataModern();

      expect(fetch).toHaveBeenCalledWith("/api/description/active", {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });
    });

    it("should return empty array when no descriptions exist", async () => {
      global.fetch = createModernFetchMock([]);

      const result = await fetchDescriptionDataModern();

      expect(result).toEqual([]);
      expect(Array.isArray(result)).toBe(true);
    });

    it("should fetch descriptions successfully", async () => {
      const testDescriptions = [
        createTestDescription({ descriptionId: 1, descriptionName: "amazon" }),
        createTestDescription({ descriptionId: 2, descriptionName: "walmart" }),
      ];

      global.fetch = createModernFetchMock(testDescriptions);

      const result = await fetchDescriptionDataModern();

      expect(result).toEqual(testDescriptions);
      expect(result).toHaveLength(2);
    });
  });

  describe("Modern error handling with ServiceResult pattern", () => {
    it("should handle 401 unauthorized with modern error format", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ error: "Unauthorized access" }),
      });

      consoleSpy.start();

      await expect(fetchDescriptionDataModern()).rejects.toThrow(
        "Failed to fetch description data: Unauthorized access",
      );
    });

    it("should handle 403 forbidden with modern error format", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 403,
        json: async () => ({ error: "Forbidden" }),
      });

      consoleSpy.start();

      await expect(fetchDescriptionDataModern()).rejects.toThrow(
        "Failed to fetch description data: Forbidden",
      );
    });

    it("should handle 500 server error with modern error format", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ error: "Internal server error" }),
      });

      consoleSpy.start();

      await expect(fetchDescriptionDataModern()).rejects.toThrow(
        "Failed to fetch description data: Internal server error",
      );
    });

    it("should handle 404 error with modern format", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({ error: "Not found" }),
      });

      consoleSpy.start();

      await expect(fetchDescriptionDataModern()).rejects.toThrow(
        "Failed to fetch description data: Not found",
      );
    });

    it("should handle error response without error field", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({}),
      });

      consoleSpy.start();

      await expect(fetchDescriptionDataModern()).rejects.toThrow(
        "HTTP error! Status: 500",
      );
    });

    it("should handle invalid JSON in error response", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: jest.fn().mockRejectedValue(new Error("Invalid JSON")),
      });

      consoleSpy.start();

      await expect(fetchDescriptionDataModern()).rejects.toThrow(
        "HTTP error! Status: 500",
      );
    });
  });

  describe("Network and connectivity errors", () => {
    it("should handle network errors", async () => {
      global.fetch = jest
        .fn()
        .mockRejectedValue(new Error("Network error"));

      consoleSpy.start();

      await expect(fetchDescriptionDataModern()).rejects.toThrow(
        "Failed to fetch description data: Network error",
      );

      const calls = consoleSpy.getCalls();
      expect(
        calls.error.some((call) =>
          call[0].includes("Error fetching description data:"),
        ),
      ).toBe(true);
    });

    it("should handle timeout errors", async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error("Timeout"));

      consoleSpy.start();

      await expect(fetchDescriptionDataModern()).rejects.toThrow(
        "Failed to fetch description data: Timeout",
      );
    });

    it("should handle connection refused", async () => {
      global.fetch = jest
        .fn()
        .mockRejectedValue(new Error("Connection refused"));

      consoleSpy.start();

      await expect(fetchDescriptionDataModern()).rejects.toThrow(
        "Failed to fetch description data: Connection refused",
      );
    });
  });

  describe("Data integrity and validation", () => {
    it("should return descriptions with all required fields", async () => {
      const testDescriptions = [
        createTestDescription({
          descriptionId: 1,
          descriptionName: "amazon",
          activeStatus: true,
        }),
      ];

      global.fetch = createModernFetchMock(testDescriptions);

      const result = await fetchDescriptionDataModern();

      expect(result[0]).toHaveProperty("descriptionId");
      expect(result[0]).toHaveProperty("descriptionName");
      expect(result[0]).toHaveProperty("activeStatus");
    });

    it("should preserve description data exactly as received", async () => {
      const testDescriptions = [
        createTestDescription({
          descriptionId: 999,
          descriptionName: "special_description",
          activeStatus: true,
        }),
      ];

      global.fetch = createModernFetchMock(testDescriptions);

      const result = await fetchDescriptionDataModern();

      expect(result).toEqual(testDescriptions);
    });
  });

  describe("Edge cases", () => {
    it("should handle large number of descriptions", async () => {
      const testDescriptions = Array.from({ length: 100 }, (_, i) =>
        createTestDescription({
          descriptionId: i + 1,
          descriptionName: `description_${i + 1}`,
        }),
      );

      global.fetch = createModernFetchMock(testDescriptions);

      const result = await fetchDescriptionDataModern();

      expect(result).toHaveLength(100);
    });

    it("should handle descriptions with special characters", async () => {
      const testDescriptions = [
        createTestDescription({
          descriptionName: "description-with_special.chars",
        }),
      ];

      global.fetch = createModernFetchMock(testDescriptions);

      const result = await fetchDescriptionDataModern();

      expect(result[0].descriptionName).toBe("description-with_special.chars");
    });

    it("should handle descriptions with Unicode characters", async () => {
      const testDescriptions = [
        createTestDescription({
          descriptionName: "店舗 🏪",
        }),
      ];

      global.fetch = createModernFetchMock(testDescriptions);

      const result = await fetchDescriptionDataModern();

      expect(result[0].descriptionName).toBe("店舗 🏪");
    });
  });

  describe("HTTP request configuration", () => {
    it("should use GET method", async () => {
      global.fetch = createModernFetchMock([]);

      await fetchDescriptionDataModern();

      const callArgs = (fetch as jest.Mock).mock.calls[0][1];
      expect(callArgs.method).toBe("GET");
    });

    it("should include credentials", async () => {
      global.fetch = createModernFetchMock([]);

      await fetchDescriptionDataModern();

      const callArgs = (fetch as jest.Mock).mock.calls[0][1];
      expect(callArgs.credentials).toBe("include");
    });

    it("should include correct headers", async () => {
      global.fetch = createModernFetchMock([]);

      await fetchDescriptionDataModern();

      const callArgs = (fetch as jest.Mock).mock.calls[0][1];
      expect(callArgs.headers).toEqual({
        "Content-Type": "application/json",
        Accept: "application/json",
      });
    });

    it("should only call API once per fetch", async () => {
      global.fetch = createModernFetchMock([]);

      await fetchDescriptionDataModern();

      expect(fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe("Common description scenarios", () => {
    it("should fetch retail store descriptions", async () => {
      const testDescriptions = [
        createTestDescription({ descriptionName: "amazon" }),
        createTestDescription({ descriptionName: "walmart" }),
        createTestDescription({ descriptionName: "target" }),
      ];

      global.fetch = createModernFetchMock(testDescriptions);

      const result = await fetchDescriptionDataModern();

      expect(result).toHaveLength(3);
      expect(result.find((d) => d.descriptionName === "amazon")).toBeDefined();
      expect(result.find((d) => d.descriptionName === "walmart")).toBeDefined();
      expect(result.find((d) => d.descriptionName === "target")).toBeDefined();
    });

    it("should fetch service descriptions", async () => {
      const testDescriptions = [
        createTestDescription({ descriptionName: "grocery_store" }),
        createTestDescription({ descriptionName: "gas_station" }),
      ];

      global.fetch = createModernFetchMock(testDescriptions);

      const result = await fetchDescriptionDataModern();

      expect(result).toHaveLength(2);
      expect(result.find((d) => d.descriptionName === "grocery_store")).toBeDefined();
      expect(result.find((d) => d.descriptionName === "gas_station")).toBeDefined();
    });
  });
});
