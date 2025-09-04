/**
 * Isolated tests for useTotalsPerAccountFetch business logic
 * Tests the fetchTotalsPerAccount function without React Query/React overhead
 */

import { fetchTotalsPerAccount } from "../../hooks/useTotalsPerAccountFetch";
import Totals from "../../model/Totals";
import {
  createFetchMock,
  createErrorFetchMock,
  ConsoleSpy,
  simulateNetworkError,
  simulateTimeoutError,
  createMockResponse,
} from "../../testHelpers";

describe("fetchTotalsPerAccount (Isolated)", () => {
  let consoleSpy: ConsoleSpy;
  const originalFetch = global.fetch;

  const createTestTotals = (overrides = {}): Totals => ({
    totals: 1000.5,
    totalsFuture: 300.25,
    totalsCleared: 500.0,
    totalsOutstanding: 200.25,
    ...overrides,
  });

  beforeEach(() => {
    consoleSpy = new ConsoleSpy();
  });

  afterEach(() => {
    consoleSpy.stop();
    global.fetch = originalFetch;
  });

  describe("Successful Per-Account Totals Fetch", () => {
    it("should fetch totals per account successfully", async () => {
      const testTotals = createTestTotals();
      global.fetch = createFetchMock(testTotals);

      const result = await fetchTotalsPerAccount("testAccount");

      expect(result).toEqual(testTotals);
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/transaction/account/totals/testAccount",
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

    it("should construct correct endpoint URL for different accounts", async () => {
      const testTotals = createTestTotals();
      global.fetch = createFetchMock(testTotals);

      await fetchTotalsPerAccount("my-business-account");

      expect(global.fetch).toHaveBeenCalledWith(
        "/api/transaction/account/totals/my-business-account",
        expect.any(Object),
      );
    });

    it("should handle account names with special characters", async () => {
      const testTotals = createTestTotals();
      global.fetch = createFetchMock(testTotals);

      await fetchTotalsPerAccount("account-with_special.chars@123");

      expect(global.fetch).toHaveBeenCalledWith(
        "/api/transaction/account/totals/account-with_special.chars@123",
        expect.any(Object),
      );
    });

    it("should handle account names with spaces", async () => {
      const testTotals = createTestTotals();
      global.fetch = createFetchMock(testTotals);

      await fetchTotalsPerAccount("account with spaces");

      expect(global.fetch).toHaveBeenCalledWith(
        "/api/transaction/account/totals/account with spaces",
        expect.any(Object),
      );
    });

    it("should handle empty account name", async () => {
      const testTotals = createTestTotals();
      global.fetch = createFetchMock(testTotals);

      await fetchTotalsPerAccount("");

      expect(global.fetch).toHaveBeenCalledWith(
        "/api/transaction/account/totals/",
        expect.any(Object),
      );
    });
  });

  describe("Per-Account Financial Calculations", () => {
    it("should handle checking account totals", async () => {
      const checkingTotals = createTestTotals({
        totals: 2500.0,
        totalsFuture: 500.0,
        totalsCleared: 1800.0,
        totalsOutstanding: 200.0,
      });
      global.fetch = createFetchMock(checkingTotals);

      const result = await fetchTotalsPerAccount("checking-main");

      expect(result).toEqual(checkingTotals);
      expect(result.totals).toBe(2500.0);
      expect(result.totalsCleared).toBe(1800.0);
    });

    it("should handle savings account totals", async () => {
      const savingsTotals = createTestTotals({
        totals: 10000.0,
        totalsFuture: 1000.0,
        totalsCleared: 9000.0,
        totalsOutstanding: 0.0,
      });
      global.fetch = createFetchMock(savingsTotals);

      const result = await fetchTotalsPerAccount("savings-emergency");

      expect(result).toEqual(savingsTotals);
      expect(result.totals).toBe(10000.0);
      expect(result.totalsOutstanding).toBe(0.0);
    });

    it("should handle credit card account with negative balances", async () => {
      const creditCardTotals = createTestTotals({
        totals: -1500.75,
        totalsFuture: -300.25,
        totalsCleared: -1000.5,
        totalsOutstanding: -200.0,
      });
      global.fetch = createFetchMock(creditCardTotals);

      const result = await fetchTotalsPerAccount("credit-card-visa");

      expect(result).toEqual(creditCardTotals);
      expect(result.totals).toBe(-1500.75);
      expect(result.totalsFuture).toBe(-300.25);
    });

    it("should handle investment account with high precision", async () => {
      const investmentTotals = createTestTotals({
        totals: 50000.123456,
        totalsFuture: 5000.654321,
        totalsCleared: 40000.987654,
        totalsOutstanding: 4999.481481,
      });
      global.fetch = createFetchMock(investmentTotals);

      const result = await fetchTotalsPerAccount("investment-portfolio");

      expect(result.totals).toBe(50000.123456);
      expect(result.totalsFuture).toBe(5000.654321);
      expect(result.totalsCleared).toBe(40000.987654);
      expect(result.totalsOutstanding).toBe(4999.481481);
    });

    it("should handle business account with large values", async () => {
      const businessTotals = createTestTotals({
        totals: 1000000.99,
        totalsFuture: 250000.25,
        totalsCleared: 500000.5,
        totalsOutstanding: 250000.24,
      });
      global.fetch = createFetchMock(businessTotals);

      const result = await fetchTotalsPerAccount("business-operating");

      expect(result.totals).toBe(1000000.99);
      expect(result.totalsFuture).toBe(250000.25);
    });

    it("should handle zero balance accounts", async () => {
      const zeroTotals = createTestTotals({
        totals: 0.0,
        totalsFuture: 0.0,
        totalsCleared: 0.0,
        totalsOutstanding: 0.0,
      });
      global.fetch = createFetchMock(zeroTotals);

      const result = await fetchTotalsPerAccount("closed-account");

      expect(result.totals).toBe(0.0);
      expect(result.totalsFuture).toBe(0.0);
      expect(result.totalsCleared).toBe(0.0);
      expect(result.totalsOutstanding).toBe(0.0);
    });
  });

  describe("Account-Specific Business Logic Validation", () => {
    it("should validate balanced totals for account", async () => {
      const balancedTotals = createTestTotals({
        totals: 1500.0,
        totalsFuture: 400.0,
        totalsCleared: 800.0,
        totalsOutstanding: 300.0,
      });
      global.fetch = createFetchMock(balancedTotals);

      const result = await fetchTotalsPerAccount("balanced-account");

      // Business rule: Future + Cleared + Outstanding should relate to totals
      const calculatedTotal =
        result.totalsFuture + result.totalsCleared + result.totalsOutstanding;
      expect(calculatedTotal).toBe(result.totals);
    });

    it("should handle accounts with outstanding credits", async () => {
      const creditAccount = createTestTotals({
        totals: 500.0,
        totalsFuture: 200.0,
        totalsCleared: 600.0,
        totalsOutstanding: -300.0, // Credit balance
      });
      global.fetch = createFetchMock(creditAccount);

      const result = await fetchTotalsPerAccount("credit-account");

      expect(result.totalsOutstanding).toBe(-300.0);
      const calculatedTotal =
        result.totalsFuture + result.totalsCleared + result.totalsOutstanding;
      expect(calculatedTotal).toBe(result.totals);
    });

    it("should handle accounts with future income exceeding current totals", async () => {
      const futureTotals = createTestTotals({
        totals: 1000.0,
        totalsFuture: 2000.0, // Large future amount
        totalsCleared: 500.0,
        totalsOutstanding: -1500.0, // Negative to balance
      });
      global.fetch = createFetchMock(futureTotals);

      const result = await fetchTotalsPerAccount("future-heavy-account");

      expect(result.totalsFuture).toBe(2000.0);
      expect(result.totalsOutstanding).toBe(-1500.0);
      const calculatedTotal =
        result.totalsFuture + result.totalsCleared + result.totalsOutstanding;
      expect(calculatedTotal).toBe(result.totals);
    });

    it("should handle micro-amounts for precision testing", async () => {
      const microTotals = createTestTotals({
        totals: 0.06,
        totalsFuture: 0.02,
        totalsCleared: 0.02,
        totalsOutstanding: 0.02,
      });
      global.fetch = createFetchMock(microTotals);

      const result = await fetchTotalsPerAccount("micro-account");

      expect(result.totals).toBe(0.06);
      const calculatedTotal =
        result.totalsFuture + result.totalsCleared + result.totalsOutstanding;
      expect(calculatedTotal).toBeCloseTo(result.totals, 2);
    });
  });

  describe("Error Handling", () => {
    it("should handle 404 resource not found", async () => {
      const mockLog = consoleSpy.start().log;
      const mockError = consoleSpy.start().error;
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: "Not Found",
        json: jest.fn().mockResolvedValue({ message: "Account not found" }),
      });

      await expect(fetchTotalsPerAccount("nonexistent")).rejects.toThrow(
        "Failed to fetch totals per account data: Failed to fetch totalsPerAccount: Not Found",
      );

      expect(mockLog).toHaveBeenCalledWith("Resource not found (404).");
      expect(mockError).toHaveBeenCalledWith(
        "Error fetching totals per account data:",
        expect.any(Error),
      );
    });

    it("should handle 500 server error", async () => {
      const mockError = consoleSpy.start().error;
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
        json: jest.fn().mockResolvedValue({ message: "Internal server error" }),
      });

      await expect(fetchTotalsPerAccount("testAccount")).rejects.toThrow(
        "Failed to fetch totals per account data: Failed to fetch totalsPerAccount: Internal Server Error",
      );

      expect(mockError).toHaveBeenCalledWith(
        "Error fetching totals per account data:",
        expect.any(Error),
      );
    });

    it("should handle 401 unauthorized error", async () => {
      const mockError = consoleSpy.start().error;
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 401,
        statusText: "Unauthorized",
        json: jest.fn().mockResolvedValue({ message: "Unauthorized access" }),
      });

      await expect(fetchTotalsPerAccount("testAccount")).rejects.toThrow(
        "Failed to fetch totals per account data: Failed to fetch totalsPerAccount: Unauthorized",
      );

      expect(mockError).toHaveBeenCalledWith(
        "Error fetching totals per account data:",
        expect.any(Error),
      );
    });

    it("should handle 400 bad request", async () => {
      const mockError = consoleSpy.start().error;
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 400,
        statusText: "Bad Request",
        json: jest.fn().mockResolvedValue({ message: "Invalid account name" }),
      });

      await expect(fetchTotalsPerAccount("")).rejects.toThrow(
        "Failed to fetch totals per account data: Failed to fetch totalsPerAccount: Bad Request",
      );

      expect(mockError).toHaveBeenCalledWith(
        "Error fetching totals per account data:",
        expect.any(Error),
      );
    });

    it("should handle network errors", async () => {
      const mockError = consoleSpy.start().error;
      global.fetch = simulateNetworkError();

      await expect(fetchTotalsPerAccount("testAccount")).rejects.toThrow(
        "Failed to fetch totals per account data: Network error",
      );

      expect(mockError).toHaveBeenCalledWith(
        "Error fetching totals per account data:",
        expect.any(Error),
      );
    });

    it("should handle timeout errors", async () => {
      const mockError = consoleSpy.start().error;
      global.fetch = simulateTimeoutError();

      await expect(fetchTotalsPerAccount("testAccount")).rejects.toThrow(
        "Failed to fetch totals per account data: Request timeout",
      );

      expect(mockError).toHaveBeenCalledWith(
        "Error fetching totals per account data:",
        expect.any(Error),
      );
    });

    it("should handle fetch errors without specific message", async () => {
      const mockError = consoleSpy.start().error;
      global.fetch = jest.fn().mockRejectedValue(new Error());

      await expect(fetchTotalsPerAccount("testAccount")).rejects.toThrow(
        "Failed to fetch totals per account data:",
      );

      expect(mockError).toHaveBeenCalledWith(
        "Error fetching totals per account data:",
        expect.any(Error),
      );
    });
  });

  describe("Request Configuration", () => {
    it("should use correct HTTP method and headers", async () => {
      const testTotals = createTestTotals();
      global.fetch = createFetchMock(testTotals);

      await fetchTotalsPerAccount("testAccount");

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
      const testTotals = createTestTotals();
      global.fetch = createFetchMock(testTotals);

      await fetchTotalsPerAccount("testAccount");

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

      await fetchTotalsPerAccount("testAccount");

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

      await fetchTotalsPerAccount("testAccount");

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

      const result = await fetchTotalsPerAccount("testAccount");

      expect(mockResponse.json).toHaveBeenCalled();
      expect(result).toEqual(testTotals);
    });

    it("should handle response with all totals fields", async () => {
      const completeTotals = createTestTotals({
        totals: 1234.56,
        totalsFuture: 234.56,
        totalsCleared: 789.12,
        totalsOutstanding: 210.88,
      });
      global.fetch = createFetchMock(completeTotals);

      const result = await fetchTotalsPerAccount("testAccount");

      expect(result).toHaveProperty("totals", 1234.56);
      expect(result).toHaveProperty("totalsFuture", 234.56);
      expect(result).toHaveProperty("totalsCleared", 789.12);
      expect(result).toHaveProperty("totalsOutstanding", 210.88);
    });

    it("should handle integer values as floats", async () => {
      const integerTotals = {
        totals: 1000,
        totalsFuture: 200,
        totalsCleared: 500,
        totalsOutstanding: 300,
      };
      global.fetch = createFetchMock(integerTotals);

      const result = await fetchTotalsPerAccount("testAccount");

      expect(typeof result.totals).toBe("number");
      expect(typeof result.totalsFuture).toBe("number");
      expect(typeof result.totalsCleared).toBe("number");
      expect(typeof result.totalsOutstanding).toBe("number");
      expect(result).toEqual(integerTotals);
    });
  });

  describe("API Endpoint Integration", () => {
    it("should call the correct per-account totals endpoint", async () => {
      const testTotals = createTestTotals();
      global.fetch = createFetchMock(testTotals);

      await fetchTotalsPerAccount("specific-account");

      expect(global.fetch).toHaveBeenCalledWith(
        "/api/transaction/account/totals/specific-account",
        expect.any(Object),
      );
    });

    it("should maintain consistent API contract", async () => {
      const testTotals = createTestTotals();
      global.fetch = createFetchMock(testTotals);

      const result = await fetchTotalsPerAccount("testAccount");

      // Verify the contract is maintained
      expect(result).toHaveProperty("totals");
      expect(result).toHaveProperty("totalsFuture");
      expect(result).toHaveProperty("totalsCleared");
      expect(result).toHaveProperty("totalsOutstanding");

      expect(typeof result.totals).toBe("number");
      expect(typeof result.totalsFuture).toBe("number");
      expect(typeof result.totalsCleared).toBe("number");
      expect(typeof result.totalsOutstanding).toBe("number");
    });

    it("should handle different account naming conventions", async () => {
      const accountNames = [
        "checking-001",
        "savings_emergency",
        "credit.card.visa",
        "investment@portfolio",
        "business-operating-2024",
      ];
      const testTotals = createTestTotals();

      for (const accountName of accountNames) {
        global.fetch = createFetchMock(testTotals);

        const result = await fetchTotalsPerAccount(accountName);

        expect(result).toEqual(testTotals);
        expect(global.fetch).toHaveBeenCalledWith(
          `/api/transaction/account/totals/${accountName}`,
          expect.any(Object),
        );
      }
    });
  });

  describe("Edge Cases and Boundary Conditions", () => {
    it("should handle extremely large account names", async () => {
      const longAccountName = "a".repeat(255);
      const testTotals = createTestTotals();
      global.fetch = createFetchMock(testTotals);

      const result = await fetchTotalsPerAccount(longAccountName);

      expect(result).toEqual(testTotals);
      expect(global.fetch).toHaveBeenCalledWith(
        `/api/transaction/account/totals/${longAccountName}`,
        expect.any(Object),
      );
    });

    it("should handle numeric account names", async () => {
      const numericAccount = "12345";
      const testTotals = createTestTotals();
      global.fetch = createFetchMock(testTotals);

      const result = await fetchTotalsPerAccount(numericAccount);

      expect(result).toEqual(testTotals);
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/transaction/account/totals/12345",
        expect.any(Object),
      );
    });

    it("should handle accounts with Unicode characters", async () => {
      const unicodeAccount = "compte-épargne-ñoño";
      const testTotals = createTestTotals();
      global.fetch = createFetchMock(testTotals);

      const result = await fetchTotalsPerAccount(unicodeAccount);

      expect(result).toEqual(testTotals);
      expect(global.fetch).toHaveBeenCalledWith(
        `/api/transaction/account/totals/${unicodeAccount}`,
        expect.any(Object),
      );
    });

    it("should handle accounts with URL-sensitive characters", async () => {
      const specialAccount = "account&with%special?chars#test";
      const testTotals = createTestTotals();
      global.fetch = createFetchMock(testTotals);

      const result = await fetchTotalsPerAccount(specialAccount);

      expect(result).toEqual(testTotals);
      expect(global.fetch).toHaveBeenCalledWith(
        `/api/transaction/account/totals/${specialAccount}`,
        expect.any(Object),
      );
    });
  });
});
