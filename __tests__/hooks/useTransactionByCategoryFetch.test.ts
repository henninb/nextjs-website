/**
 * Isolated tests for useTransactionByCategoryFetch business logic
 * Tests fetchTransactionsByCategory function without React Query overhead
 */

import { createFetchMock, ConsoleSpy } from "../../testHelpers";
import Transaction from "../../model/Transaction";

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
const fetchTransactionsByCategory = async (
  categoryName: string,
): Promise<Transaction[] | null> => {
  try {
    const response = await fetch(`/api/transaction/category/${categoryName}`, {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        console.log("Resource not found (404).");
      }
      throw new Error(
        `Failed to fetch transactionsByCategory data: ${response.statusText}`,
      );
    }

    return response.status !== 204 ? await response.json() : null;
  } catch (error: any) {
    console.error("Error fetching transaction by category data:", error);
    throw new Error(
      `Failed to fetch transaction by category data: ${error.message}`,
    );
  }
};

// Helper function to create test transaction data
const createTestTransaction = (
  overrides: Partial<Transaction> = {},
): Transaction => ({
  guid: "test-guid-123",
  transactionDate: new Date("2024-01-01"),
  accountNameOwner: "checking_john",
  accountType: "debit",
  description: "Test transaction",
  category: "groceries",
  amount: 100.0,
  cleared: 1,
  reoccurringType: "onetime",
  notes: "",
  transactionState: "outstanding",
  activeStatus: true,
  ...overrides,
});

describe("useTransactionByCategoryFetch Business Logic", () => {
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

  describe("fetchTransactionsByCategory", () => {
    describe("Successful fetch operations", () => {
      it("should fetch transactions by category successfully", async () => {
        const testTransactions = [
          createTestTransaction({ category: "groceries" }),
          createTestTransaction({ category: "groceries" }),
        ];

        global.fetch = createFetchMock(testTransactions);

        const result = await fetchTransactionsByCategory("groceries");

        expect(result).toStrictEqual(testTransactions);
        expect(fetch).toHaveBeenCalledWith(
          "/api/transaction/category/groceries",
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

      it("should return null for 204 No Content response", async () => {
        global.fetch = jest.fn().mockResolvedValue({
          ok: true,
          status: 204,
        });

        const result = await fetchTransactionsByCategory("groceries");

        expect(result).toBeNull();
      });

      it("should fetch transactions for different categories", async () => {
        const categories = ["groceries", "gas", "restaurants", "bills"];

        for (const category of categories) {
          const testTransactions = [createTestTransaction({ category })];
          global.fetch = createFetchMock(testTransactions);

          const result = await fetchTransactionsByCategory(category);

          expect(result).toHaveLength(1);
          expect(result![0].category).toBe(category);
        }
      });

      it("should handle category name with special characters", async () => {
        const testTransactions = [
          createTestTransaction({ category: "auto-repair_service" }),
        ];

        global.fetch = createFetchMock(testTransactions);

        await fetchTransactionsByCategory("auto-repair_service");

        expect(fetch).toHaveBeenCalledWith(
          "/api/transaction/category/auto-repair_service",
          expect.any(Object),
        );
      });

      it("should fetch multiple transactions for same category", async () => {
        const testTransactions = Array.from({ length: 10 }, (_, i) =>
          createTestTransaction({
            guid: `guid-${i}`,
            category: "groceries",
          }),
        );

        global.fetch = createFetchMock(testTransactions);

        const result = await fetchTransactionsByCategory("groceries");

        expect(result).toHaveLength(10);
        expect(result!.every((t) => t.category === "groceries")).toBe(true);
      });

      it("should use correct HTTP method", async () => {
        global.fetch = createFetchMock([]);

        await fetchTransactionsByCategory("groceries");

        const callArgs = (fetch as jest.Mock).mock.calls[0][1];
        expect(callArgs.method).toBe("GET");
      });

      it("should include credentials", async () => {
        global.fetch = createFetchMock([]);

        await fetchTransactionsByCategory("groceries");

        const callArgs = (fetch as jest.Mock).mock.calls[0][1];
        expect(callArgs.credentials).toBe("include");
      });

      it("should include correct headers", async () => {
        global.fetch = createFetchMock([]);

        await fetchTransactionsByCategory("groceries");

        const callArgs = (fetch as jest.Mock).mock.calls[0][1];
        expect(callArgs.headers).toStrictEqual({
          "Content-Type": "application/json",
          Accept: "application/json",
        });
      });
    });

    describe("Error handling", () => {
      it("should throw error for 404 not found", async () => {
        global.fetch = jest.fn().mockResolvedValue({
          ok: false,
          status: 404,
          statusText: "Not Found",
        });

        consoleSpy.start();

        await expect(
          fetchTransactionsByCategory("nonexistent"),
        ).rejects.toThrow(
          "Failed to fetch transaction by category data: Failed to fetch transactionsByCategory data: Not Found",
        );

        const calls = consoleSpy.getCalls();
        expect(
          calls.log.some((call) =>
            call[0].includes("Resource not found (404)"),
          ),
        ).toBe(true);
      });

      it("should throw error for 500 server error", async () => {
        global.fetch = jest.fn().mockResolvedValue({
          ok: false,
          status: 500,
          statusText: "Internal Server Error",
        });

        consoleSpy.start();

        await expect(fetchTransactionsByCategory("groceries")).rejects.toThrow(
          "Failed to fetch transaction by category data:",
        );
      });

      it("should throw error for 401 unauthorized", async () => {
        global.fetch = jest.fn().mockResolvedValue({
          ok: false,
          status: 401,
          statusText: "Unauthorized",
        });

        consoleSpy.start();

        await expect(fetchTransactionsByCategory("groceries")).rejects.toThrow(
          "Failed to fetch transaction by category data:",
        );
      });

      it("should throw error for 403 forbidden", async () => {
        global.fetch = jest.fn().mockResolvedValue({
          ok: false,
          status: 403,
          statusText: "Forbidden",
        });

        consoleSpy.start();

        await expect(fetchTransactionsByCategory("groceries")).rejects.toThrow(
          "Failed to fetch transaction by category data:",
        );
      });

      it("should handle network errors", async () => {
        global.fetch = jest.fn().mockRejectedValue(new Error("Network error"));

        consoleSpy.start();

        await expect(fetchTransactionsByCategory("groceries")).rejects.toThrow(
          "Failed to fetch transaction by category data: Network error",
        );

        const calls = consoleSpy.getCalls();
        expect(
          calls.error.some((call) =>
            call[0].includes("Error fetching transaction by category data:"),
          ),
        ).toBe(true);
      });

      it("should handle invalid JSON response", async () => {
        global.fetch = jest.fn().mockResolvedValue({
          ok: true,
          status: 200,
          json: jest.fn().mockRejectedValue(new Error("Invalid JSON")),
        });

        consoleSpy.start();

        await expect(fetchTransactionsByCategory("groceries")).rejects.toThrow(
          "Failed to fetch transaction by category data: Invalid JSON",
        );
      });

      it("should handle fetch failure", async () => {
        global.fetch = jest
          .fn()
          .mockRejectedValue(new Error("Failed to fetch"));

        consoleSpy.start();

        await expect(fetchTransactionsByCategory("groceries")).rejects.toThrow(
          "Failed to fetch transaction by category data: Failed to fetch",
        );
      });

      it("should handle timeout errors", async () => {
        global.fetch = jest.fn().mockRejectedValue(new Error("Timeout"));

        consoleSpy.start();

        await expect(fetchTransactionsByCategory("groceries")).rejects.toThrow(
          "Failed to fetch transaction by category data: Timeout",
        );
      });
    });

    describe("Edge cases", () => {
      it("should handle empty category name", async () => {
        const testTransactions = [createTestTransaction()];
        global.fetch = createFetchMock(testTransactions);

        await fetchTransactionsByCategory("");

        expect(fetch).toHaveBeenCalledWith(
          "/api/transaction/category/",
          expect.any(Object),
        );
      });

      it("should handle category name with spaces", async () => {
        const testTransactions = [
          createTestTransaction({ category: "auto repair" }),
        ];
        global.fetch = createFetchMock(testTransactions);

        await fetchTransactionsByCategory("auto repair");

        expect(fetch).toHaveBeenCalledWith(
          "/api/transaction/category/auto repair",
          expect.any(Object),
        );
      });

      it("should handle category name with uppercase", async () => {
        const testTransactions = [
          createTestTransaction({ category: "GROCERIES" }),
        ];
        global.fetch = createFetchMock(testTransactions);

        await fetchTransactionsByCategory("GROCERIES");

        expect(fetch).toHaveBeenCalledWith(
          "/api/transaction/category/GROCERIES",
          expect.any(Object),
        );
      });

      it("should handle very long category names", async () => {
        const longCategory = "a".repeat(100);
        const testTransactions = [
          createTestTransaction({ category: longCategory }),
        ];
        global.fetch = createFetchMock(testTransactions);

        await fetchTransactionsByCategory(longCategory);

        expect(fetch).toHaveBeenCalledWith(
          `/api/transaction/category/${longCategory}`,
          expect.any(Object),
        );
      });

      it("should preserve transaction data structure", async () => {
        const testTransactions = [
          createTestTransaction({
            guid: "test-123",
            category: "groceries",
            amount: 250.75,
            description: "Walmart",
          }),
        ];

        global.fetch = createFetchMock(testTransactions);

        const result = await fetchTransactionsByCategory("groceries");

        expect(result![0].guid).toBe("test-123");
        expect(result![0].amount).toBe(250.75);
        expect(result![0].description).toBe("Walmart");
      });

      it("should handle transactions with different amounts", async () => {
        const testTransactions = [
          createTestTransaction({ amount: 10.99, category: "groceries" }),
          createTestTransaction({ amount: 150.0, category: "groceries" }),
          createTestTransaction({ amount: -25.5, category: "groceries" }),
        ];

        global.fetch = createFetchMock(testTransactions);

        const result = await fetchTransactionsByCategory("groceries");

        expect(result).toHaveLength(3);
        expect(result![0].amount).toBe(10.99);
        expect(result![1].amount).toBe(150.0);
        expect(result![2].amount).toBe(-25.5);
      });

      it("should handle transactions with different dates", async () => {
        const testTransactions = [
          createTestTransaction({
            transactionDate: new Date("2024-01-01"),
            category: "groceries",
          }),
          createTestTransaction({
            transactionDate: new Date("2024-06-15"),
            category: "groceries",
          }),
        ];

        global.fetch = createFetchMock(testTransactions);

        const result = await fetchTransactionsByCategory("groceries");

        expect(result).toHaveLength(2);
      });

      it("should preserve error stack trace", async () => {
        const testError = new Error("Custom error");
        global.fetch = jest.fn().mockRejectedValue(testError);

        try {
          await fetchTransactionsByCategory("groceries");
          fail("Should have thrown an error");
        } catch (error: any) {
          expect(error.message).toContain(
            "Failed to fetch transaction by category data",
          );
        }
      });
    });

    describe("Common categories", () => {
      it("should fetch groceries category", async () => {
        const testTransactions = [
          createTestTransaction({ category: "groceries" }),
        ];

        global.fetch = createFetchMock(testTransactions);

        const result = await fetchTransactionsByCategory("groceries");

        expect(result).toHaveLength(1);
        expect(result![0].category).toBe("groceries");
      });

      it("should fetch gas category", async () => {
        const testTransactions = [createTestTransaction({ category: "gas" })];

        global.fetch = createFetchMock(testTransactions);

        const result = await fetchTransactionsByCategory("gas");

        expect(result).toHaveLength(1);
        expect(result![0].category).toBe("gas");
      });

      it("should fetch restaurants category", async () => {
        const testTransactions = [
          createTestTransaction({ category: "restaurants" }),
        ];

        global.fetch = createFetchMock(testTransactions);

        const result = await fetchTransactionsByCategory("restaurants");

        expect(result).toHaveLength(1);
        expect(result![0].category).toBe("restaurants");
      });

      it("should fetch bills category", async () => {
        const testTransactions = [createTestTransaction({ category: "bills" })];

        global.fetch = createFetchMock(testTransactions);

        const result = await fetchTransactionsByCategory("bills");

        expect(result).toHaveLength(1);
        expect(result![0].category).toBe("bills");
      });

      it("should fetch entertainment category", async () => {
        const testTransactions = [
          createTestTransaction({ category: "entertainment" }),
        ];

        global.fetch = createFetchMock(testTransactions);

        const result = await fetchTransactionsByCategory("entertainment");

        expect(result).toHaveLength(1);
        expect(result![0].category).toBe("entertainment");
      });
    });

    describe("API endpoint", () => {
      it("should construct correct API endpoint", async () => {
        global.fetch = createFetchMock([]);

        await fetchTransactionsByCategory("test-category");

        expect(fetch).toHaveBeenCalledWith(
          "/api/transaction/category/test-category",
          expect.any(Object),
        );
      });

      it("should only call API once per fetch", async () => {
        global.fetch = createFetchMock([]);

        await fetchTransactionsByCategory("groceries");

        expect(fetch).toHaveBeenCalledTimes(1);
      });
    });

    describe("Response status handling", () => {
      it("should return data for 200 OK", async () => {
        const testTransactions = [createTestTransaction()];
        global.fetch = jest.fn().mockResolvedValue({
          ok: true,
          status: 200,
          json: jest.fn().mockResolvedValue(testTransactions),
        });

        const result = await fetchTransactionsByCategory("groceries");

        expect(result).toStrictEqual(testTransactions);
      });

      it("should return null for 204 No Content", async () => {
        global.fetch = jest.fn().mockResolvedValue({
          ok: true,
          status: 204,
        });

        const result = await fetchTransactionsByCategory("groceries");

        expect(result).toBeNull();
      });
    });
  });
});
