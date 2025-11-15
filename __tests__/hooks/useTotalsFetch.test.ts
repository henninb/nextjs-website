/**
 * Isolated tests for useTotalsFetch business logic
 * Tests the fetchTotals function without React Query/React overhead
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
    validateTotals: jest.fn(),
  },
  ValidationError: jest.fn(),
}));

import { fetchTotals } from "../../hooks/useTotalsFetch";
import { HookValidator } from "../../utils/hookValidation";
import Totals from "../../model/Totals";
import {
  createFetchMock,
  createErrorFetchMock,
  simulateNetworkError,
  simulateTimeoutError,
  createMockResponse,
} from "../../testHelpers";

describe("fetchTotals (Isolated)", () => {
  const originalFetch = global.fetch;

  const createTestTotals = (overrides = {}): Totals => ({
    totals: 1500.75,
    totalsFuture: 2000.5,
    totalsCleared: 1200.25,
    totalsOutstanding: 300.25,
    ...overrides,
  });

  beforeEach(() => {
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe("Successful Totals Fetch", () => {
    it("should fetch financial totals successfully", async () => {
      const testTotals = createTestTotals();
      global.fetch = createFetchMock(testTotals);

      const result = await fetchTotals();

      expect(result).toEqual(testTotals);
      expect(global.fetch).toHaveBeenCalledWith("/api/account/totals", {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
            Accept: "application/json",
        },
      });
    });

    it("should handle totals with different precision values", async () => {
      const preciseTotals = createTestTotals({
        totals: 12345.67,
        totalsFuture: 0.01,
        totalsCleared: 999999.99,
        totalsOutstanding: 0.0,
      });
      global.fetch = createFetchMock(preciseTotals);

      const result = await fetchTotals();

      expect(result).toEqual(preciseTotals);
      expect(result.totals).toBe(12345.67);
      expect(result.totalsFuture).toBe(0.01);
      expect(result.totalsCleared).toBe(999999.99);
      expect(result.totalsOutstanding).toBe(0.0);
    });

    it("should handle negative totals values", async () => {
      const negativeTotals = createTestTotals({
        totals: -500.25,
        totalsFuture: 1000.0,
        totalsCleared: 200.0,
        totalsOutstanding: -700.25,
      });
      global.fetch = createFetchMock(negativeTotals);

      const result = await fetchTotals();

      expect(result).toEqual(negativeTotals);
      expect(result.totals).toBe(-500.25);
      expect(result.totalsOutstanding).toBe(-700.25);
    });

    it("should handle zero totals values", async () => {
      const zeroTotals = createTestTotals({
        totals: 0.0,
        totalsFuture: 0.0,
        totalsCleared: 0.0,
        totalsOutstanding: 0.0,
      });
      global.fetch = createFetchMock(zeroTotals);

      const result = await fetchTotals();

      expect(result).toEqual(zeroTotals);
      expect(result.totals).toBe(0.0);
      expect(result.totalsFuture).toBe(0.0);
      expect(result.totalsCleared).toBe(0.0);
      expect(result.totalsOutstanding).toBe(0.0);
    });

    it("should handle large totals values", async () => {
      const largeTotals = createTestTotals({
        totals: 1000000.5,
        totalsFuture: 500000.75,
        totalsCleared: 750000.25,
        totalsOutstanding: 250000.25,
      });
      global.fetch = createFetchMock(largeTotals);

      const result = await fetchTotals();

      expect(result).toEqual(largeTotals);
      expect(result.totals).toBe(1000000.5);
      expect(result.totalsFuture).toBe(500000.75);
    });
  });

  describe("Error Handling", () => {
    it("should handle 404 resource not found", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: "Not Found",
        json: jest.fn().mockResolvedValue({ message: "Totals not found" }),
      });

      await expect(fetchTotals()).rejects.toThrow(
        "HTTP error! Status: 404",
      );
    });

    it("should handle 500 server error", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
        json: jest.fn().mockResolvedValue({ message: "Internal server error" }),
      });

      await expect(fetchTotals()).rejects.toThrow(
        "HTTP error! Status: 500",
      );
    });

    it("should handle 401 unauthorized error", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 401,
        statusText: "Unauthorized",
        json: jest.fn().mockResolvedValue({ message: "Unauthorized access" }),
      });

      await expect(fetchTotals()).rejects.toThrow(
        "HTTP error! Status: 401",
      );
    });

    it("should handle 400 bad request", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 400,
        statusText: "Bad Request",
        json: jest.fn().mockResolvedValue({ message: "Bad request" }),
      });

      await expect(fetchTotals()).rejects.toThrow(
        "HTTP error! Status: 400",
      );
    });

    it("should handle network errors", async () => {
      global.fetch = simulateNetworkError();

      await expect(fetchTotals()).rejects.toThrow(
        "Network error",
      );
    });

    it("should handle timeout errors", async () => {
      global.fetch = simulateTimeoutError();

      await expect(fetchTotals()).rejects.toThrow(
        "Request timeout",
      );
    });

    it("should handle fetch errors without specific message", async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error());

      await expect(fetchTotals()).rejects.toThrow();
    });
  });

  describe("Request Configuration", () => {
    it("should use correct HTTP method and headers", async () => {
      const testTotals = createTestTotals();
      global.fetch = createFetchMock(testTotals);

      await fetchTotals();

      expect(global.fetch).toHaveBeenCalledWith("/api/account/totals", {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
            Accept: "application/json",
        },
      });
    });

    it("should include credentials for authentication", async () => {
      const testTotals = createTestTotals();
      global.fetch = createFetchMock(testTotals);

      await fetchTotals();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          credentials: "include",
        }),
      );
    });

    it("should use GET method for fetching totals", async () => {
      const testTotals = createTestTotals();
      global.fetch = createFetchMock(testTotals);

      await fetchTotals();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: "GET",
        }),
      );
    });

    it("should request JSON content type", async () => {
      const testTotals = createTestTotals();
      global.fetch = createFetchMock(testTotals);

      await fetchTotals();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            "Content-Type": "application/json",
            Accept: "application/json",
          }),
        }),
      );
    });
  });

  describe("Response Processing", () => {
    it("should parse JSON response correctly", async () => {
      const testTotals = createTestTotals();
      const mockResponse = createMockResponse(testTotals);
      global.fetch = jest.fn().mockResolvedValue(mockResponse);

      const result = await fetchTotals();

      expect(mockResponse.json).toHaveBeenCalled();
      expect(result).toEqual(testTotals);
    });

    it("should handle response with decimal precision", async () => {
      const preciseData = createTestTotals({
        totals: 123.456789,
        totalsFuture: 987.654321,
        totalsCleared: 555.123456,
        totalsOutstanding: 333.987654,
      });
      global.fetch = createFetchMock(preciseData);

      const result = await fetchTotals();

      expect(result.totals).toBe(123.456789);
      expect(result.totalsFuture).toBe(987.654321);
      expect(result.totalsCleared).toBe(555.123456);
      expect(result.totalsOutstanding).toBe(333.987654);
    });

    it("should handle integer values as floats", async () => {
      const integerTotals = {
        totals: 1000,
        totalsFuture: 2000,
        totalsCleared: 1500,
        totalsOutstanding: 500,
      };
      global.fetch = createFetchMock(integerTotals);

      const result = await fetchTotals();

      expect(typeof result.totals).toBe("number");
      expect(typeof result.totalsFuture).toBe("number");
      expect(typeof result.totalsCleared).toBe("number");
      expect(typeof result.totalsOutstanding).toBe("number");
      expect(result).toEqual(integerTotals);
    });
  });

  describe("Financial Totals Business Logic", () => {
    it("should handle balanced totals calculations", async () => {
      const balancedTotals = createTestTotals({
        totals: 1500.0,
        totalsFuture: 500.0,
        totalsCleared: 1000.0,
        totalsOutstanding: 0.0,
      });
      global.fetch = createFetchMock(balancedTotals);

      const result = await fetchTotals();

      // Verify the totals structure makes sense
      expect(result.totals).toBe(1500.0);
      expect(result.totalsFuture).toBe(500.0);
      expect(result.totalsCleared).toBe(1000.0);
      expect(result.totalsOutstanding).toBe(0.0);

      // Business logic: Future + Cleared + Outstanding should relate to totals
      const calculatedTotal =
        result.totalsFuture + result.totalsCleared + result.totalsOutstanding;
      expect(calculatedTotal).toBe(result.totals);
    });

    it("should handle imbalanced totals scenarios", async () => {
      const imbalancedTotals = createTestTotals({
        totals: 1000.0,
        totalsFuture: 300.0,
        totalsCleared: 500.0,
        totalsOutstanding: 250.0,
      });
      global.fetch = createFetchMock(imbalancedTotals);

      const result = await fetchTotals();

      expect(result.totals).toBe(1000.0);

      // Verify individual components
      expect(result.totalsFuture).toBe(300.0);
      expect(result.totalsCleared).toBe(500.0);
      expect(result.totalsOutstanding).toBe(250.0);

      // In this case, components add up to 1050 but totals is 1000
      const calculatedTotal =
        result.totalsFuture + result.totalsCleared + result.totalsOutstanding;
      expect(calculatedTotal).toBe(1050.0);
      expect(result.totals).not.toBe(calculatedTotal);
    });

    it("should handle scenarios with negative outstanding amounts", async () => {
      const negativeOutstanding = createTestTotals({
        totals: 800.0,
        totalsFuture: 500.0,
        totalsCleared: 600.0,
        totalsOutstanding: -300.0, // Negative outstanding (overpayment scenario)
      });
      global.fetch = createFetchMock(negativeOutstanding);

      const result = await fetchTotals();

      expect(result.totalsOutstanding).toBe(-300.0);
      expect(result.totals).toBe(800.0);

      // With negative outstanding, the math still works
      const calculatedTotal =
        result.totalsFuture + result.totalsCleared + result.totalsOutstanding;
      expect(calculatedTotal).toBe(result.totals);
    });

    it("should handle zero balance scenarios", async () => {
      const zeroBalance = createTestTotals({
        totals: 0.0,
        totalsFuture: 100.0,
        totalsCleared: 50.0,
        totalsOutstanding: -150.0, // Credits exceed debits
      });
      global.fetch = createFetchMock(zeroBalance);

      const result = await fetchTotals();

      expect(result.totals).toBe(0.0);
      expect(result.totalsOutstanding).toBe(-150.0);

      const calculatedTotal =
        result.totalsFuture + result.totalsCleared + result.totalsOutstanding;
      expect(calculatedTotal).toBe(0.0);
      expect(result.totals).toBe(calculatedTotal);
    });

    it("should handle high-value financial totals", async () => {
      const highValueTotals = createTestTotals({
        totals: 1000000.5,
        totalsFuture: 250000.25,
        totalsCleared: 500000.0,
        totalsOutstanding: 250000.25,
      });
      global.fetch = createFetchMock(highValueTotals);

      const result = await fetchTotals();

      expect(result.totals).toBe(1000000.5);
      expect(result.totalsFuture).toBe(250000.25);
      expect(result.totalsCleared).toBe(500000.0);
      expect(result.totalsOutstanding).toBe(250000.25);

      // Verify precision is maintained for large numbers
      const calculatedTotal =
        result.totalsFuture + result.totalsCleared + result.totalsOutstanding;
      expect(calculatedTotal).toBe(result.totals);
    });

    it("should handle micro-transaction totals", async () => {
      const microTotals = createTestTotals({
        totals: 0.03,
        totalsFuture: 0.01,
        totalsCleared: 0.01,
        totalsOutstanding: 0.01,
      });
      global.fetch = createFetchMock(microTotals);

      const result = await fetchTotals();

      expect(result.totals).toBe(0.03);
      expect(result.totalsFuture).toBe(0.01);
      expect(result.totalsCleared).toBe(0.01);
      expect(result.totalsOutstanding).toBe(0.01);

      // Verify precision is maintained for small numbers
      const calculatedTotal =
        result.totalsFuture + result.totalsCleared + result.totalsOutstanding;
      expect(calculatedTotal).toBeCloseTo(result.totals, 2);
    });
  });

  describe("API Endpoint Integration", () => {
    it("should call the correct totals endpoint", async () => {
      const testTotals = createTestTotals();
      global.fetch = createFetchMock(testTotals);

      await fetchTotals();

      expect(global.fetch).toHaveBeenCalledWith(
        "/api/account/totals",
        expect.any(Object),
      );
    });

    it("should handle API endpoint variations gracefully", async () => {
      // Even if the endpoint changes, the business logic should remain consistent
      const testTotals = createTestTotals();
      global.fetch = createFetchMock(testTotals);

      const result = await fetchTotals();

      // Verify the contract is maintained regardless of backend changes
      expect(result).toHaveProperty("totals");
      expect(result).toHaveProperty("totalsFuture");
      expect(result).toHaveProperty("totalsCleared");
      expect(result).toHaveProperty("totalsOutstanding");

      expect(typeof result.totals).toBe("number");
      expect(typeof result.totalsFuture).toBe("number");
      expect(typeof result.totalsCleared).toBe("number");
      expect(typeof result.totalsOutstanding).toBe("number");
    });
  });
});
