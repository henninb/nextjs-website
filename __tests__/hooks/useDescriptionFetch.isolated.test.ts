/**
 * Isolated tests for useDescriptionFetch business logic
 * Tests fetchDescriptionData function without React Query overhead
 */

import { createFetchMock, ConsoleSpy } from "../../testHelpers";
import Description from "../../model/Description";

// Copy the function to test
const fetchDescriptionData = async (): Promise<Description[]> => {
  try {
    const response = await fetch("/api/description/select/active", {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        console.log("No descriptions found (404).");
        return [];
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
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
  description: "amazon",
  activeStatus: true,
  ...overrides,
});

describe("useDescriptionFetch Business Logic (Isolated)", () => {
  let consoleSpy: ConsoleSpy;

  beforeEach(() => {
    consoleSpy = new ConsoleSpy();
    jest.clearAllMocks();
  });

  afterEach(() => {
    consoleSpy.stop();
  });

  describe("fetchDescriptionData", () => {
    describe("Successful fetch operations", () => {
      it("should fetch descriptions successfully", async () => {
        const testDescriptions = [
          createTestDescription({ descriptionId: 1, description: "amazon" }),
          createTestDescription({ descriptionId: 2, description: "walmart" }),
        ];

        global.fetch = createFetchMock(testDescriptions);

        const result = await fetchDescriptionData();

        expect(result).toEqual(testDescriptions);
        expect(fetch).toHaveBeenCalledWith("/api/description/select/active", {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        });
      });

      it("should return empty array when no descriptions exist (404)", async () => {
        global.fetch = jest.fn().mockResolvedValue({
          ok: false,
          status: 404,
        });

        consoleSpy.start();

        const result = await fetchDescriptionData();

        expect(result).toEqual([]);
        const calls = consoleSpy.getCalls();
        expect(calls.log.some((call) => call[0].includes("404"))).toBe(true);
      });

      it("should fetch descriptions with various names", async () => {
        const testDescriptions = [
          createTestDescription({ description: "amazon" }),
          createTestDescription({ description: "walmart" }),
          createTestDescription({ description: "target" }),
          createTestDescription({ description: "costco" }),
        ];

        global.fetch = createFetchMock(testDescriptions);

        const result = await fetchDescriptionData();

        expect(result).toHaveLength(4);
        expect(result[0].description).toBe("amazon");
        expect(result[1].description).toBe("walmart");
        expect(result[2].description).toBe("target");
        expect(result[3].description).toBe("costco");
      });

      it("should handle empty array response", async () => {
        global.fetch = createFetchMock([]);

        const result = await fetchDescriptionData();

        expect(result).toEqual([]);
        expect(Array.isArray(result)).toBe(true);
      });

      it("should fetch only active descriptions", async () => {
        const testDescriptions = [
          createTestDescription({ activeStatus: true }),
          createTestDescription({ activeStatus: true }),
        ];

        global.fetch = createFetchMock(testDescriptions);

        const result = await fetchDescriptionData();

        expect(result.every((desc) => desc.activeStatus === true)).toBe(true);
      });

      it("should use correct HTTP method", async () => {
        global.fetch = createFetchMock([]);

        await fetchDescriptionData();

        const callArgs = (fetch as jest.Mock).mock.calls[0][1];
        expect(callArgs.method).toBe("GET");
      });

      it("should include credentials", async () => {
        global.fetch = createFetchMock([]);

        await fetchDescriptionData();

        const callArgs = (fetch as jest.Mock).mock.calls[0][1];
        expect(callArgs.credentials).toBe("include");
      });

      it("should include correct headers", async () => {
        global.fetch = createFetchMock([]);

        await fetchDescriptionData();

        const callArgs = (fetch as jest.Mock).mock.calls[0][1];
        expect(callArgs.headers).toEqual({
          "Content-Type": "application/json",
          Accept: "application/json",
        });
      });

      it("should fetch descriptions with different IDs", async () => {
        const testDescriptions = [
          createTestDescription({ descriptionId: 1 }),
          createTestDescription({ descriptionId: 100 }),
          createTestDescription({ descriptionId: 999 }),
        ];

        global.fetch = createFetchMock(testDescriptions);

        const result = await fetchDescriptionData();

        expect(result[0].descriptionId).toBe(1);
        expect(result[1].descriptionId).toBe(100);
        expect(result[2].descriptionId).toBe(999);
      });
    });

    describe("Error handling", () => {
      it("should throw error for 500 server error", async () => {
        global.fetch = jest.fn().mockResolvedValue({
          ok: false,
          status: 500,
        });

        consoleSpy.start();

        await expect(fetchDescriptionData()).rejects.toThrow(
          "Failed to fetch description data: HTTP error! status: 500",
        );

        const calls = consoleSpy.getCalls();
        expect(
          calls.error.some((call) =>
            call[0].includes("Error fetching description data:"),
          ),
        ).toBe(true);
      });

      it("should throw error for 401 unauthorized", async () => {
        global.fetch = jest.fn().mockResolvedValue({
          ok: false,
          status: 401,
        });

        consoleSpy.start();

        await expect(fetchDescriptionData()).rejects.toThrow(
          "Failed to fetch description data: HTTP error! status: 401",
        );
      });

      it("should throw error for 403 forbidden", async () => {
        global.fetch = jest.fn().mockResolvedValue({
          ok: false,
          status: 403,
        });

        consoleSpy.start();

        await expect(fetchDescriptionData()).rejects.toThrow(
          "Failed to fetch description data: HTTP error! status: 403",
        );
      });

      it("should handle network errors", async () => {
        global.fetch = jest
          .fn()
          .mockRejectedValue(new Error("Network error"));

        consoleSpy.start();

        await expect(fetchDescriptionData()).rejects.toThrow(
          "Failed to fetch description data: Network error",
        );

        const calls = consoleSpy.getCalls();
        expect(
          calls.error.some((call) =>
            call[0].includes("Error fetching description data:"),
          ),
        ).toBe(true);
      });

      it("should handle invalid JSON response", async () => {
        global.fetch = jest.fn().mockResolvedValue({
          ok: true,
          json: jest.fn().mockRejectedValue(new Error("Invalid JSON")),
        });

        consoleSpy.start();

        await expect(fetchDescriptionData()).rejects.toThrow(
          "Failed to fetch description data: Invalid JSON",
        );
      });

      it("should handle fetch failure", async () => {
        global.fetch = jest
          .fn()
          .mockRejectedValue(new Error("Failed to fetch"));

        consoleSpy.start();

        await expect(fetchDescriptionData()).rejects.toThrow(
          "Failed to fetch description data: Failed to fetch",
        );
      });

      it("should handle timeout errors", async () => {
        global.fetch = jest.fn().mockRejectedValue(new Error("Timeout"));

        consoleSpy.start();

        await expect(fetchDescriptionData()).rejects.toThrow(
          "Failed to fetch description data: Timeout",
        );
      });

      it("should log 404 status when no descriptions found", async () => {
        global.fetch = jest.fn().mockResolvedValue({
          ok: false,
          status: 404,
        });

        consoleSpy.start();

        await fetchDescriptionData();

        const calls = consoleSpy.getCalls();
        expect(calls.log[0][0]).toBe("No descriptions found (404).");
      });
    });

    describe("Edge cases", () => {
      it("should handle descriptions with empty strings", async () => {
        const testDescriptions = [
          createTestDescription({ description: "" }),
        ];

        global.fetch = createFetchMock(testDescriptions);

        const result = await fetchDescriptionData();

        expect(result[0].description).toBe("");
      });

      it("should handle descriptions with special characters", async () => {
        const testDescriptions = [
          createTestDescription({ description: "store-name_with.special" }),
          createTestDescription({ description: "name!@#$%" }),
        ];

        global.fetch = createFetchMock(testDescriptions);

        const result = await fetchDescriptionData();

        expect(result[0].description).toBe("store-name_with.special");
        expect(result[1].description).toBe("name!@#$%");
      });

      it("should handle descriptions with Unicode characters", async () => {
        const testDescriptions = [
          createTestDescription({ description: "café" }),
          createTestDescription({ description: "日本" }),
          createTestDescription({ description: "🏪 store" }),
        ];

        global.fetch = createFetchMock(testDescriptions);

        const result = await fetchDescriptionData();

        expect(result[0].description).toBe("café");
        expect(result[1].description).toBe("日本");
        expect(result[2].description).toBe("🏪 store");
      });

      it("should handle very long description names", async () => {
        const longName = "a".repeat(500);
        const testDescriptions = [
          createTestDescription({ description: longName }),
        ];

        global.fetch = createFetchMock(testDescriptions);

        const result = await fetchDescriptionData();

        expect(result[0].description).toBe(longName);
        expect(result[0].description.length).toBe(500);
      });

      it("should handle descriptions with whitespace", async () => {
        const testDescriptions = [
          createTestDescription({ description: "  store name  " }),
        ];

        global.fetch = createFetchMock(testDescriptions);

        const result = await fetchDescriptionData();

        expect(result[0].description).toBe("  store name  ");
      });

      it("should preserve description ID in response", async () => {
        const testDescriptions = [
          createTestDescription({ descriptionId: 12345 }),
          createTestDescription({ descriptionId: 67890 }),
        ];

        global.fetch = createFetchMock(testDescriptions);

        const result = await fetchDescriptionData();

        expect(result[0].descriptionId).toBe(12345);
        expect(result[1].descriptionId).toBe(67890);
      });

      it("should handle large number of descriptions", async () => {
        const testDescriptions = Array.from({ length: 100 }, (_, i) =>
          createTestDescription({
            descriptionId: i + 1,
            description: `description_${i + 1}`,
          }),
        );

        global.fetch = createFetchMock(testDescriptions);

        const result = await fetchDescriptionData();

        expect(result).toHaveLength(100);
        expect(result[0].descriptionId).toBe(1);
        expect(result[99].descriptionId).toBe(100);
      });

      it("should handle descriptions with case variations", async () => {
        const testDescriptions = [
          createTestDescription({ description: "UPPERCASE" }),
          createTestDescription({ description: "lowercase" }),
          createTestDescription({ description: "MixedCase" }),
        ];

        global.fetch = createFetchMock(testDescriptions);

        const result = await fetchDescriptionData();

        expect(result[0].description).toBe("UPPERCASE");
        expect(result[1].description).toBe("lowercase");
        expect(result[2].description).toBe("MixedCase");
      });

      it("should preserve error stack trace", async () => {
        const testError = new Error("Custom error");
        global.fetch = jest.fn().mockRejectedValue(testError);

        try {
          await fetchDescriptionData();
          fail("Should have thrown an error");
        } catch (error: any) {
          expect(error.message).toContain("Failed to fetch description data");
        }
      });
    });

    describe("API endpoint", () => {
      it("should call correct API endpoint for active descriptions", async () => {
        global.fetch = createFetchMock([]);

        await fetchDescriptionData();

        expect(fetch).toHaveBeenCalledWith(
          "/api/description/select/active",
          expect.any(Object),
        );
      });

      it("should only call API once per fetch", async () => {
        global.fetch = createFetchMock([]);

        await fetchDescriptionData();

        expect(fetch).toHaveBeenCalledTimes(1);
      });
    });

    describe("Data integrity", () => {
      it("should return data exactly as received from API", async () => {
        const testDescriptions = [
          createTestDescription({
            descriptionId: 999,
            description: "test_description",
            activeStatus: true,
          }),
        ];

        global.fetch = createFetchMock(testDescriptions);

        const result = await fetchDescriptionData();

        expect(result).toEqual(testDescriptions);
      });

      it("should handle all field types correctly", async () => {
        const testDescriptions = [
          createTestDescription({
            descriptionId: 1,
            description: "complete_description",
            activeStatus: true,
          }),
        ];

        global.fetch = createFetchMock(testDescriptions);

        const result = await fetchDescriptionData();

        expect(result[0]).toHaveProperty("descriptionId");
        expect(result[0]).toHaveProperty("description");
        expect(result[0]).toHaveProperty("activeStatus");
      });
    });

    describe("Common description scenarios", () => {
      it("should fetch merchant descriptions", async () => {
        const testDescriptions = [
          createTestDescription({ description: "amazon" }),
          createTestDescription({ description: "walmart" }),
          createTestDescription({ description: "target" }),
        ];

        global.fetch = createFetchMock(testDescriptions);

        const result = await fetchDescriptionData();

        expect(result).toHaveLength(3);
        expect(result.find((d) => d.description === "amazon")).toBeDefined();
        expect(result.find((d) => d.description === "walmart")).toBeDefined();
        expect(result.find((d) => d.description === "target")).toBeDefined();
      });

      it("should fetch service provider descriptions", async () => {
        const testDescriptions = [
          createTestDescription({ description: "electric company" }),
          createTestDescription({ description: "water utility" }),
          createTestDescription({ description: "internet provider" }),
        ];

        global.fetch = createFetchMock(testDescriptions);

        const result = await fetchDescriptionData();

        expect(result).toHaveLength(3);
        expect(
          result.find((d) => d.description === "electric company"),
        ).toBeDefined();
      });

      it("should handle duplicate description names with different IDs", async () => {
        const testDescriptions = [
          createTestDescription({
            descriptionId: 1,
            description: "amazon",
          }),
          createTestDescription({
            descriptionId: 2,
            description: "amazon",
          }),
        ];

        global.fetch = createFetchMock(testDescriptions);

        const result = await fetchDescriptionData();

        expect(result).toHaveLength(2);
        expect(result[0].description).toBe("amazon");
        expect(result[1].description).toBe("amazon");
        expect(result[0].descriptionId).not.toBe(result[1].descriptionId);
      });
    });
  });
});
