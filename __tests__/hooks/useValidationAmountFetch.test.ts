/**
 * Isolated tests for useValidationAmountFetch business logic
 * Tests the fetchValidationAmount function without React Query/React overhead
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
    validateValidationAmount: jest.fn(),
  },
  ValidationError: jest.fn(),
}));

import { fetchValidationAmount } from "../../hooks/useValidationAmountFetch";
import { HookValidator } from "../../utils/hookValidation";
import ValidationAmount from "../../model/ValidationAmount";
import {
  createFetchMock,
  createErrorFetchMock,
  simulateNetworkError,
  simulateTimeoutError,
  createMockResponse,
} from "../../testHelpers";

describe("fetchValidationAmount (Isolated)", () => {
  const originalFetch = global.fetch;

  const createTestValidationAmount = (overrides = {}): ValidationAmount => ({
    validationId: 1,
    activeStatus: true,
    amount: 100.0,
    transactionState: "cleared",
    validationDate: new Date("2024-01-01"),
    dateAdded: new Date("2024-01-01T10:00:00Z"),
    dateUpdated: new Date("2024-01-01T12:00:00Z"),
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe("Successful Validation Amount Fetch", () => {
    it("should fetch validation amount data successfully", async () => {
      const testData = createTestValidationAmount();
      // Modern endpoint returns an array
      global.fetch = createFetchMock([testData]);

      const result = await fetchValidationAmount("testAccount");

      expect(result).toEqual(testData);
      // Account name is lowercased by sanitizeAccountName
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/validation/amount/active?accountNameOwner=testaccount&transactionState=cleared",
        {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        },
      );
    });

    it("should handle validation amount with all fields", async () => {
      const completeData = createTestValidationAmount({
        validationId: 123,
        accountId: 456,
        amount: 250.75,
        transactionState: "outstanding",
        activeStatus: false,
        validationDate: new Date("2023-06-15"),
        dateAdded: new Date("2023-06-01T08:30:00Z"),
        dateUpdated: new Date("2023-06-15T14:45:00Z"),
      });
      // Modern endpoint returns an array
      global.fetch = createFetchMock([completeData]);

      const result = await fetchValidationAmount("businessaccount");

      expect(result).toEqual(completeData);
      expect(result.validationId).toBe(123);
      expect(result.accountId).toBe(456);
      expect(result.amount).toBe(250.75);
      expect(result.transactionState).toBe("outstanding");
      expect(result.activeStatus).toBe(false);
    });

    it("should construct correct endpoint URL for different account names", async () => {
      const testData = createTestValidationAmount();
      // Modern endpoint returns an array
      global.fetch = createFetchMock([testData]);

      await fetchValidationAmount("my-special-account");

      expect(global.fetch).toHaveBeenCalledWith(
        "/api/validation/amount/active?accountNameOwner=my-special-account&transactionState=cleared",
        expect.any(Object),
      );
    });

    it("should handle account names with special characters", async () => {
      const testData = createTestValidationAmount();
      // Modern endpoint returns an array
      global.fetch = createFetchMock([testData]);

      await fetchValidationAmount("account-with-dashes_and_underscores");

      expect(global.fetch).toHaveBeenCalledWith(
        "/api/validation/amount/active?accountNameOwner=account-with-dashes_and_underscores&transactionState=cleared",
        expect.any(Object),
      );
    });
  });

  describe("Error Handling", () => {
    it("should handle 404 resource not found by returning zero values", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: "Not Found",
        json: jest.fn().mockResolvedValue({ message: "Not Found" }),
        text: jest
          .fn()
          .mockResolvedValue(JSON.stringify({ message: "Not Found" })),
      });

      const result = await fetchValidationAmount("nonexistent");

      expect(result).toEqual(
        expect.objectContaining({
          validationId: 0,
          amount: 0,
          transactionState: "cleared",
          activeStatus: true,
        }),
      );
      expect(result.validationDate).toEqual(new Date("1970-01-01"));
    });

    it("should handle 500 server error", async () => {
      global.fetch = createErrorFetchMock("Internal Server Error", 500);

      await expect(fetchValidationAmount("testAccount")).rejects.toThrow(
        "HTTP error! Status: 500",
      );
    });

    it("should handle 400 bad request", async () => {
      global.fetch = createErrorFetchMock("Invalid account name", 400);

      await expect(fetchValidationAmount("")).rejects.toThrow(
        "HTTP error! Status: 400",
      );
    });

    it("should handle network errors", async () => {
      global.fetch = simulateNetworkError();

      await expect(fetchValidationAmount("testAccount")).rejects.toThrow(
        "Network error",
      );
    });

    it("should handle timeout errors", async () => {
      global.fetch = simulateTimeoutError();

      await expect(fetchValidationAmount("testAccount")).rejects.toThrow(
        "Request timeout",
      );
    });

    it("should handle fetch errors without specific message", async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error(""));

      await expect(fetchValidationAmount("testAccount")).rejects.toThrow();
    });
  });

  describe("Request Configuration", () => {
    it("should use correct HTTP method and headers", async () => {
      const testData = createTestValidationAmount();
      // Modern endpoint returns an array
      global.fetch = createFetchMock([testData]);

      await fetchValidationAmount("testAccount");

      expect(global.fetch).toHaveBeenCalledWith(expect.any(String), {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });
    });

    it("should include credentials for authentication", async () => {
      const testData = createTestValidationAmount();
      // Modern endpoint returns an array
      global.fetch = createFetchMock([testData]);

      await fetchValidationAmount("testAccount");

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          credentials: "include",
        }),
      );
    });
  });

  describe("Response Parsing", () => {
    it("should parse JSON response correctly", async () => {
      const testData = createTestValidationAmount();
      // Modern endpoint returns an array
      const mockResponse = createMockResponse([testData]);
      global.fetch = jest.fn().mockResolvedValue(mockResponse);

      const result = await fetchValidationAmount("testAccount");

      expect(mockResponse.json).toHaveBeenCalled();
      expect(result).toEqual(testData);
    });

    it("should handle empty response data", async () => {
      // Empty array response should return zero values
      global.fetch = createFetchMock([]);

      const result = await fetchValidationAmount("testAccount");

      expect(result).toEqual(
        expect.objectContaining({
          validationId: 0,
          amount: 0,
          transactionState: "cleared",
          activeStatus: true,
        }),
      );
      expect(result.validationDate).toEqual(new Date("1970-01-01"));
    });

    it("should handle response with null values", async () => {
      const dataWithNulls = {
        validationId: 1,
        accountId: null,
        amount: 0.0,
        transactionState: "cleared",
        validationDate: null,
        activeStatus: true,
        dateAdded: null,
        dateUpdated: null,
      };
      // Modern endpoint returns an array
      global.fetch = createFetchMock([dataWithNulls]);

      const result = await fetchValidationAmount("testAccount");

      expect(result).toEqual(dataWithNulls);
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty account name", async () => {
      const testData = createTestValidationAmount();
      // Modern endpoint returns an array
      global.fetch = createFetchMock([testData]);

      await fetchValidationAmount("");

      expect(global.fetch).toHaveBeenCalledWith(
        "/api/validation/amount/active?accountNameOwner=&transactionState=cleared",
        expect.any(Object),
      );
    });

    it("should handle account names with spaces", async () => {
      const testData = createTestValidationAmount();
      // Modern endpoint returns an array
      global.fetch = createFetchMock([testData]);

      await fetchValidationAmount("account with spaces");

      // Spaces are removed by sanitizeAccountName (only a-zA-Z0-9_- allowed)
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/validation/amount/active?accountNameOwner=accountwithspaces&transactionState=cleared",
        expect.any(Object),
      );
    });

    it("should handle very long account names", async () => {
      const longAccountName = "a".repeat(255);
      const testData = createTestValidationAmount();
      // Modern endpoint returns an array
      global.fetch = createFetchMock([testData]);

      await fetchValidationAmount(longAccountName);

      expect(global.fetch).toHaveBeenCalledWith(
        `/api/validation/amount/active?accountNameOwner=${longAccountName}&transactionState=cleared`,
        expect.any(Object),
      );
    });

    it("should handle numeric account names", async () => {
      const testData = createTestValidationAmount();
      // Modern endpoint returns an array
      global.fetch = createFetchMock([testData]);

      await fetchValidationAmount("12345");

      expect(global.fetch).toHaveBeenCalledWith(
        "/api/validation/amount/active?accountNameOwner=12345&transactionState=cleared",
        expect.any(Object),
      );
    });
  });

  describe("Validation Amount Business Logic", () => {
    it("should handle different transaction states", async () => {
      const states = ["cleared", "outstanding", "future"];

      for (const state of states) {
        const testData = createTestValidationAmount({
          transactionState: state,
        });
        // Modern endpoint returns an array
        global.fetch = createFetchMock([testData]);

        const result = await fetchValidationAmount("testAccount");
        expect(result.transactionState).toBe(state);
      }
    });

    it("should handle validation amounts with different precision", async () => {
      const amounts = [0.01, 0.1, 1.0, 10.99, 100.0, 999.99, 1000.01];

      for (const amount of amounts) {
        const testData = createTestValidationAmount({ amount });
        // Modern endpoint returns an array
        global.fetch = createFetchMock([testData]);

        const result = await fetchValidationAmount("testAccount");
        expect(result.amount).toBe(amount);
      }
    });

    it("should handle both active and inactive validation amounts", async () => {
      const activeData = createTestValidationAmount({ activeStatus: true });
      const inactiveData = createTestValidationAmount({ activeStatus: false });

      // Modern endpoint returns an array
      global.fetch = createFetchMock([activeData]);
      let result = await fetchValidationAmount("activeAccount");
      expect(result.activeStatus).toBe(true);

      // Modern endpoint returns an array
      global.fetch = createFetchMock([inactiveData]);
      result = await fetchValidationAmount("inactiveAccount");
      expect(result.activeStatus).toBe(false);
    });
  });
});
