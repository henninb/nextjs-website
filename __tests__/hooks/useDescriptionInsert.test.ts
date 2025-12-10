/**
 * TDD Tests for Modern useDescriptionInsert
 * Modern endpoint: POST /api/description
 *
 * Key differences from legacy:
 * - Endpoint: /api/description (vs /api/description/insert)
 * - Uses ServiceResult pattern for errors
 * - Consistent error response format
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
const insertDescriptionModern = async (
  payload: Description,
): Promise<Description> => {
  try {
    const endpoint = "/api/description";

    const response = await fetch(endpoint, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
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

    return response.status !== 204 ? await response.json() : payload;
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

describe("useDescriptionInsert Modern Endpoint (TDD)", () => {
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
    it("should use modern endpoint /api/description", async () => {
      const testDescription = createTestDescription();
      global.fetch = createModernFetchMock(testDescription);

      await insertDescriptionModern(testDescription);

      expect(fetch).toHaveBeenCalledWith("/api/description", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(testDescription),
      });
    });

    it("should insert description successfully", async () => {
      const testDescription = createTestDescription({
        descriptionName: "new_store",
      });

      global.fetch = createModernFetchMock(testDescription);

      const result = await insertDescriptionModern(testDescription);

      expect(result).toStrictEqual(testDescription);
    });

    it("should handle 204 No Content response", async () => {
      const testDescription = createTestDescription();

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 204,
        json: async () => {
          throw new Error("No content");
        },
      });

      const result = await insertDescriptionModern(testDescription);

      expect(result).toStrictEqual(testDescription);
    });
  });

  describe("Modern error handling with ServiceResult pattern", () => {
    it("should handle validation errors with modern format", async () => {
      const testDescription = createTestDescription();

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

      await expect(insertDescriptionModern(testDescription)).rejects.toThrow(
        "descriptionName is required, descriptionName must be non-empty",
      );
    });

    it("should handle duplicate description error", async () => {
      const testDescription = createTestDescription({
        descriptionName: "amazon",
      });

      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 409,
        json: async () => ({
          error: "Description amazon already exists",
        }),
      });

      consoleSpy.start();

      await expect(insertDescriptionModern(testDescription)).rejects.toThrow(
        "Description amazon already exists",
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

      await expect(insertDescriptionModern(testDescription)).rejects.toThrow(
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

      await expect(insertDescriptionModern(testDescription)).rejects.toThrow(
        "Forbidden",
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

      await expect(insertDescriptionModern(testDescription)).rejects.toThrow(
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

      await expect(insertDescriptionModern(testDescription)).rejects.toThrow(
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

      await expect(insertDescriptionModern(testDescription)).rejects.toThrow(
        "HTTP error! Status: 500",
      );
    });
  });

  describe("Network and connectivity errors", () => {
    it("should handle network errors", async () => {
      const testDescription = createTestDescription();

      global.fetch = jest.fn().mockRejectedValue(new Error("Network error"));

      consoleSpy.start();

      await expect(insertDescriptionModern(testDescription)).rejects.toThrow(
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

      await expect(insertDescriptionModern(testDescription)).rejects.toThrow(
        "Timeout",
      );
    });

    it("should handle connection refused", async () => {
      const testDescription = createTestDescription();

      global.fetch = jest
        .fn()
        .mockRejectedValue(new Error("Connection refused"));

      consoleSpy.start();

      await expect(insertDescriptionModern(testDescription)).rejects.toThrow(
        "Connection refused",
      );
    });
  });

  describe("Request body and headers", () => {
    it("should use POST method", async () => {
      const testDescription = createTestDescription();
      global.fetch = createModernFetchMock(testDescription);

      await insertDescriptionModern(testDescription);

      const callArgs = (fetch as jest.Mock).mock.calls[0][1];
      expect(callArgs.method).toBe("POST");
    });

    it("should include credentials", async () => {
      const testDescription = createTestDescription();
      global.fetch = createModernFetchMock(testDescription);

      await insertDescriptionModern(testDescription);

      const callArgs = (fetch as jest.Mock).mock.calls[0][1];
      expect(callArgs.credentials).toBe("include");
    });

    it("should include correct headers", async () => {
      const testDescription = createTestDescription();
      global.fetch = createModernFetchMock(testDescription);

      await insertDescriptionModern(testDescription);

      const callArgs = (fetch as jest.Mock).mock.calls[0][1];
      expect(callArgs.headers).toStrictEqual({
        "Content-Type": "application/json",
        Accept: "application/json",
      });
    });

    it("should send description as JSON in request body", async () => {
      const testDescription = createTestDescription({
        descriptionName: "test_store",
      });

      global.fetch = createModernFetchMock(testDescription);

      await insertDescriptionModern(testDescription);

      const callArgs = (fetch as jest.Mock).mock.calls[0][1];
      expect(callArgs.body).toBe(JSON.stringify(testDescription));
    });
  });

  describe("Data integrity and validation", () => {
    it("should preserve all description fields", async () => {
      const testDescription = createTestDescription({
        descriptionId: 999,
        descriptionName: "complete_description",
        activeStatus: true,
      });

      global.fetch = createModernFetchMock(testDescription);

      const result = await insertDescriptionModern(testDescription);

      expect(result).toStrictEqual(testDescription);
      expect(result.descriptionId).toBe(999);
      expect(result.descriptionName).toBe("complete_description");
      expect(result.activeStatus).toBe(true);
    });

    it("should handle descriptions with various name formats", async () => {
      const testCases = [
        { descriptionName: "simple_name" },
        { descriptionName: "name-with-dashes" },
        { descriptionName: "name.with.dots" },
        { descriptionName: "name_with_underscores" },
      ];

      for (const testCase of testCases) {
        const testDescription = createTestDescription(testCase);
        global.fetch = createModernFetchMock(testDescription);

        const result = await insertDescriptionModern(testDescription);

        expect(result.descriptionName).toBe(testCase.descriptionName);
      }
    });
  });

  describe("Edge cases", () => {
    it("should handle descriptions with special characters", async () => {
      const testDescription = createTestDescription({
        descriptionName: "store-with_special.chars",
      });

      global.fetch = createModernFetchMock(testDescription);

      const result = await insertDescriptionModern(testDescription);

      expect(result.descriptionName).toBe("store-with_special.chars");
    });

    it("should handle descriptions with Unicode characters", async () => {
      const testDescription = createTestDescription({
        descriptionName: "店舗 🏪",
      });

      global.fetch = createModernFetchMock(testDescription);

      const result = await insertDescriptionModern(testDescription);

      expect(result.descriptionName).toBe("店舗 🏪");
    });

    it("should handle descriptions with whitespace", async () => {
      const testDescription = createTestDescription({
        descriptionName: "  store with spaces  ",
      });

      global.fetch = createModernFetchMock(testDescription);

      const result = await insertDescriptionModern(testDescription);

      expect(result.descriptionName).toBe("  store with spaces  ");
    });

    it("should handle descriptions with very long names", async () => {
      const longName = "a".repeat(500);
      const testDescription = createTestDescription({
        descriptionName: longName,
      });

      global.fetch = createModernFetchMock(testDescription);

      const result = await insertDescriptionModern(testDescription);

      expect(result.descriptionName).toBe(longName);
      expect(result.descriptionName.length).toBe(500);
    });
  });

  describe("Common description scenarios", () => {
    it("should insert retail store description", async () => {
      const testDescription = createTestDescription({
        descriptionName: "amazon",
      });

      global.fetch = createModernFetchMock(testDescription);

      const result = await insertDescriptionModern(testDescription);

      expect(result.descriptionName).toBe("amazon");
    });

    it("should insert multiple retail descriptions", async () => {
      const retailers = [
        { descriptionName: "walmart" },
        { descriptionName: "target" },
        { descriptionName: "costco" },
      ];

      for (const retailer of retailers) {
        const testDescription = createTestDescription(retailer);
        global.fetch = createModernFetchMock(testDescription);

        const result = await insertDescriptionModern(testDescription);

        expect(result.descriptionName).toBe(retailer.descriptionName);
      }
    });

    it("should insert service provider description", async () => {
      const testDescription = createTestDescription({
        descriptionName: "grocery_store",
      });

      global.fetch = createModernFetchMock(testDescription);

      const result = await insertDescriptionModern(testDescription);

      expect(result.descriptionName).toBe("grocery_store");
    });

    it("should insert gas station description", async () => {
      const testDescription = createTestDescription({
        descriptionName: "gas_station",
      });

      global.fetch = createModernFetchMock(testDescription);

      const result = await insertDescriptionModern(testDescription);

      expect(result.descriptionName).toBe("gas_station");
    });

    it("should insert restaurant description", async () => {
      const testDescription = createTestDescription({
        descriptionName: "restaurant",
      });

      global.fetch = createModernFetchMock(testDescription);

      const result = await insertDescriptionModern(testDescription);

      expect(result.descriptionName).toBe("restaurant");
    });
  });

  describe("Active status handling", () => {
    it("should insert active description", async () => {
      const testDescription = createTestDescription({
        activeStatus: true,
      });

      global.fetch = createModernFetchMock(testDescription);

      const result = await insertDescriptionModern(testDescription);

      expect(result.activeStatus).toBe(true);
    });

    it("should insert inactive description", async () => {
      const testDescription = createTestDescription({
        activeStatus: false,
      });

      global.fetch = createModernFetchMock(testDescription);

      const result = await insertDescriptionModern(testDescription);

      expect(result.activeStatus).toBe(false);
    });
  });
});
