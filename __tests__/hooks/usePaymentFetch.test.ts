/**
 * Isolated tests for usePaymentFetch business logic
 * Tests fetchPaymentData function without React Query overhead
 */

import { createFetchMock, ConsoleSpy } from "../../testHelpers";
import Payment from "../../model/Payment";

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

// Copy the function to test
const fetchPaymentData = async (): Promise<Payment[]> => {
  try {
    const response = await fetch("/api/payment/active", {
      method: "GET",
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
        errorBody.error || `HTTP error! Status: ${response.status}`;
      console.error("Error fetching payment data:", errorMessage);
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error("Error fetching payment data:", error);
    throw error;
  }
};

// Helper function to create test payment data
const createTestPayment = (overrides: Partial<Payment> = {}): Payment => ({
  paymentId: 1,
  transactionDate: new Date("2024-01-01T00:00:00.000Z"),
  sourceAccount: "checking_john",
  destinationAccount: "credit_card_visa",
  amount: 250.0,
  activeStatus: true,
  ...overrides,
});

describe("usePaymentFetch Business Logic", () => {
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

  describe("fetchPaymentData", () => {
    describe("Successful fetch operations", () => {
      it("should fetch payments successfully", async () => {
        const testPayments = [
          createTestPayment({ paymentId: 1 }),
          createTestPayment({ paymentId: 2 }),
        ];

        global.fetch = createFetchMock(testPayments);

        const result = await fetchPaymentData();

        expect(result).toStrictEqual(testPayments);
        expect(fetch).toHaveBeenCalledWith("/api/payment/active", {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        });
      });

      it("should handle 404 errors correctly", async () => {
        global.fetch = jest.fn().mockResolvedValue({
          ok: false,
          status: 404,
          json: jest.fn().mockResolvedValue({ error: "Not found" }),
        });

        consoleSpy.start();

        await expect(fetchPaymentData()).rejects.toThrow("Not found");
        const calls = consoleSpy.getCalls();
        expect(
          calls.error.some((call) =>
            call[0].includes("Error fetching payment data:"),
          ),
        ).toBe(true);
      });

      it("should fetch payments with different amounts", async () => {
        const testPayments = [
          createTestPayment({ amount: 100.0 }),
          createTestPayment({ amount: 500.5 }),
          createTestPayment({ amount: 1000.99 }),
        ];

        global.fetch = createFetchMock(testPayments);

        const result = await fetchPaymentData();

        expect(result).toHaveLength(3);
        expect(result[0].amount).toBe(100.0);
        expect(result[1].amount).toBe(500.5);
        expect(result[2].amount).toBe(1000.99);
      });

      it("should fetch payments between different accounts", async () => {
        const testPayments = [
          createTestPayment({
            sourceAccount: "checking_john",
            destinationAccount: "credit_card_visa",
          }),
          createTestPayment({
            sourceAccount: "savings_jane",
            destinationAccount: "credit_card_mastercard",
          }),
          createTestPayment({
            sourceAccount: "checking_bob",
            destinationAccount: "loan_auto",
          }),
        ];

        global.fetch = createFetchMock(testPayments);

        const result = await fetchPaymentData();

        expect(result).toHaveLength(3);
        expect(result[0].sourceAccount).toBe("checking_john");
        expect(result[1].sourceAccount).toBe("savings_jane");
        expect(result[2].sourceAccount).toBe("checking_bob");
      });

      it("should handle empty array response", async () => {
        global.fetch = createFetchMock([]);

        const result = await fetchPaymentData();

        expect(result).toStrictEqual([]);
        expect(Array.isArray(result)).toBe(true);
      });

      it("should fetch payments with different dates", async () => {
        const testPayments = [
          createTestPayment({
            transactionDate: new Date("2024-01-01"),
          }),
          createTestPayment({
            transactionDate: new Date("2024-02-15"),
          }),
          createTestPayment({
            transactionDate: new Date("2024-12-31"),
          }),
        ];

        global.fetch = createFetchMock(testPayments);

        const result = await fetchPaymentData();

        expect(result).toHaveLength(3);
        expect(new Date(result[0].transactionDate)).toStrictEqual(
          new Date("2024-01-01"),
        );
        expect(new Date(result[1].transactionDate)).toStrictEqual(
          new Date("2024-02-15"),
        );
      });

      it("should fetch active and inactive payments", async () => {
        const testPayments = [
          createTestPayment({ activeStatus: true }),
          createTestPayment({ activeStatus: false }),
        ];

        global.fetch = createFetchMock(testPayments);

        const result = await fetchPaymentData();

        expect(result[0].activeStatus).toBe(true);
        expect(result[1].activeStatus).toBe(false);
      });

      it("should use correct HTTP method", async () => {
        global.fetch = createFetchMock([]);

        await fetchPaymentData();

        const callArgs = (fetch as jest.Mock).mock.calls[0][1];
        expect(callArgs.method).toBe("GET");
      });

      it("should include credentials", async () => {
        global.fetch = createFetchMock([]);

        await fetchPaymentData();

        const callArgs = (fetch as jest.Mock).mock.calls[0][1];
        expect(callArgs.credentials).toBe("include");
      });

      it("should include correct headers", async () => {
        global.fetch = createFetchMock([]);

        await fetchPaymentData();

        const callArgs = (fetch as jest.Mock).mock.calls[0][1];
        expect(callArgs.headers).toStrictEqual({
          "Content-Type": "application/json",
          Accept: "application/json",
        });
      });
    });

    describe("Error handling", () => {
      it("should throw error for 500 server error", async () => {
        global.fetch = jest.fn().mockResolvedValue({
          ok: false,
          status: 500,
          json: jest.fn().mockResolvedValue({ error: "Internal server error" }),
        });

        consoleSpy.start();

        await expect(fetchPaymentData()).rejects.toThrow(
          "Internal server error",
        );

        const calls = consoleSpy.getCalls();
        expect(
          calls.error.some((call) =>
            call[0].includes("Error fetching payment data:"),
          ),
        ).toBe(true);
      });

      it("should throw error for 401 unauthorized", async () => {
        global.fetch = jest.fn().mockResolvedValue({
          ok: false,
          status: 401,
          json: jest.fn().mockResolvedValue({ error: "Unauthorized" }),
        });

        consoleSpy.start();

        await expect(fetchPaymentData()).rejects.toThrow("Unauthorized");
      });

      it("should throw error for 403 forbidden", async () => {
        global.fetch = jest.fn().mockResolvedValue({
          ok: false,
          status: 403,
          json: jest.fn().mockResolvedValue({ error: "Forbidden" }),
        });

        consoleSpy.start();

        await expect(fetchPaymentData()).rejects.toThrow("Forbidden");
      });

      it("should handle network errors", async () => {
        global.fetch = jest.fn().mockRejectedValue(new Error("Network error"));

        consoleSpy.start();

        await expect(fetchPaymentData()).rejects.toThrow("Network error");

        const calls = consoleSpy.getCalls();
        expect(
          calls.error.some((call) =>
            call[0].includes("Error fetching payment data:"),
          ),
        ).toBe(true);
      });

      it("should handle invalid JSON response", async () => {
        global.fetch = jest.fn().mockResolvedValue({
          ok: true,
          json: jest.fn().mockRejectedValue(new Error("Invalid JSON")),
        });

        consoleSpy.start();

        await expect(fetchPaymentData()).rejects.toThrow("Invalid JSON");
      });

      it("should handle fetch failure", async () => {
        global.fetch = jest
          .fn()
          .mockRejectedValue(new Error("Failed to fetch"));

        consoleSpy.start();

        await expect(fetchPaymentData()).rejects.toThrow("Failed to fetch");
      });

      it("should handle timeout errors", async () => {
        global.fetch = jest.fn().mockRejectedValue(new Error("Timeout"));

        consoleSpy.start();

        await expect(fetchPaymentData()).rejects.toThrow("Timeout");
      });

      it("should handle error response without error field", async () => {
        global.fetch = jest.fn().mockResolvedValue({
          ok: false,
          status: 500,
          json: jest.fn().mockResolvedValue({}),
        });

        consoleSpy.start();

        await expect(fetchPaymentData()).rejects.toThrow(
          "HTTP error! Status: 500",
        );
      });
    });

    describe("Edge cases", () => {
      it("should handle payments with zero amount", async () => {
        const testPayments = [createTestPayment({ amount: 0 })];

        global.fetch = createFetchMock(testPayments);

        const result = await fetchPaymentData();

        expect(result[0].amount).toBe(0);
      });

      it("should handle payments with negative amount", async () => {
        const testPayments = [createTestPayment({ amount: -100.0 })];

        global.fetch = createFetchMock(testPayments);

        const result = await fetchPaymentData();

        expect(result[0].amount).toBe(-100.0);
      });

      it("should handle payments with very large amounts", async () => {
        const testPayments = [createTestPayment({ amount: 999999.99 })];

        global.fetch = createFetchMock(testPayments);

        const result = await fetchPaymentData();

        expect(result[0].amount).toBe(999999.99);
      });

      it("should handle payments with same source and destination", async () => {
        const testPayments = [
          createTestPayment({
            sourceAccount: "checking_john",
            destinationAccount: "checking_john",
          }),
        ];

        global.fetch = createFetchMock(testPayments);

        const result = await fetchPaymentData();

        expect(result[0].sourceAccount).toBe("checking_john");
        expect(result[0].destinationAccount).toBe("checking_john");
      });

      it("should handle payments with special characters in account names", async () => {
        const testPayments = [
          createTestPayment({
            sourceAccount: "account-with_special.chars",
            destinationAccount: "another!@#account",
          }),
        ];

        global.fetch = createFetchMock(testPayments);

        const result = await fetchPaymentData();

        expect(result[0].sourceAccount).toBe("account-with_special.chars");
        expect(result[0].destinationAccount).toBe("another!@#account");
      });

      it("should handle payments with future dates", async () => {
        const futureDate = new Date("2030-12-31");
        const testPayments = [
          createTestPayment({ transactionDate: futureDate }),
        ];

        global.fetch = createFetchMock(testPayments);

        const result = await fetchPaymentData();

        expect(new Date(result[0].transactionDate)).toStrictEqual(futureDate);
      });

      it("should handle payments with past dates", async () => {
        const pastDate = new Date("2000-01-01");
        const testPayments = [createTestPayment({ transactionDate: pastDate })];

        global.fetch = createFetchMock(testPayments);

        const result = await fetchPaymentData();

        expect(new Date(result[0].transactionDate)).toStrictEqual(pastDate);
      });

      it("should preserve payment ID in response", async () => {
        const testPayments = [
          createTestPayment({ paymentId: 12345 }),
          createTestPayment({ paymentId: 67890 }),
        ];

        global.fetch = createFetchMock(testPayments);

        const result = await fetchPaymentData();

        expect(result[0].paymentId).toBe(12345);
        expect(result[1].paymentId).toBe(67890);
      });

      it("should handle large number of payments", async () => {
        const testPayments = Array.from({ length: 100 }, (_, i) =>
          createTestPayment({ paymentId: i + 1 }),
        );

        global.fetch = createFetchMock(testPayments);

        const result = await fetchPaymentData();

        expect(result).toHaveLength(100);
        expect(result[0].paymentId).toBe(1);
        expect(result[99].paymentId).toBe(100);
      });

      it("should preserve error stack trace", async () => {
        const testError = new Error("Custom error");
        global.fetch = jest.fn().mockRejectedValue(testError);

        try {
          await fetchPaymentData();
          fail("Should have thrown an error");
        } catch (error: any) {
          expect(error.message).toContain("Custom error");
        }
      });
    });

    describe("API endpoint", () => {
      it("should call correct API endpoint", async () => {
        global.fetch = createFetchMock([]);

        await fetchPaymentData();

        expect(fetch).toHaveBeenCalledWith(
          "/api/payment/active",
          expect.any(Object),
        );
      });

      it("should only call API once per fetch", async () => {
        global.fetch = createFetchMock([]);

        await fetchPaymentData();

        expect(fetch).toHaveBeenCalledTimes(1);
      });
    });
  });
});
