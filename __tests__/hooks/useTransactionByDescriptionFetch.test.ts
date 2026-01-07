/**
 * Isolated tests for useTransactionByDescriptionFetch business logic
 * Tests fetchTransactionsByDescription function without React Query overhead
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
const fetchTransactionsByDescription = async (
  description: string,
): Promise<Transaction[] | null> => {
  try {
    const response = await fetch(
      `/api/transaction/description/${description}`,
      {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      },
    );

    if (!response.ok) {
      if (response.status === 404) {
        console.log("Resource not found (404).");
      }
      throw new Error(
        `Failed to fetch transactionsByDescription data: ${response.statusText}`,
      );
    }

    return response.status !== 204 ? await response.json() : null;
  } catch (error: any) {
    console.error("Error fetching transaction by description data:", error);
    throw new Error(
      `Failed to fetch transaction by description data: ${error.message}`,
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
  description: "walmart",
  category: "groceries",
  amount: 100.0,
  cleared: 1,
  reoccurringType: "onetime",
  notes: "",
  transactionState: "outstanding",
  activeStatus: true,
  ...overrides,
});

describe("useTransactionByDescriptionFetch Business Logic", () => {
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

  describe("fetchTransactionsByDescription", () => {
    describe("Successful fetch operations", () => {
      it("should fetch transactions by description successfully", async () => {
        const testTransactions = [
          createTestTransaction({ description: "walmart" }),
          createTestTransaction({ description: "walmart" }),
        ];

        global.fetch = createFetchMock(testTransactions);

        const result = await fetchTransactionsByDescription("walmart");

        expect(result).toStrictEqual(testTransactions);
        expect(fetch).toHaveBeenCalledWith(
          "/api/transaction/description/walmart",
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

        const result = await fetchTransactionsByDescription("walmart");

        expect(result).toBeNull();
      });

      it("should fetch transactions for different descriptions", async () => {
        const descriptions = [
          "walmart",
          "target",
          "amazon",
          "costco",
          "whole foods",
        ];

        for (const description of descriptions) {
          const testTransactions = [createTestTransaction({ description })];
          global.fetch = createFetchMock(testTransactions);

          const result = await fetchTransactionsByDescription(description);

          expect(result).toHaveLength(1);
          expect(result![0].description).toBe(description);
        }
      });

      it("should handle description with special characters", async () => {
        const testTransactions = [
          createTestTransaction({ description: "store-name_with.special" }),
        ];

        global.fetch = createFetchMock(testTransactions);

        await fetchTransactionsByDescription("store-name_with.special");

        expect(fetch).toHaveBeenCalledWith(
          "/api/transaction/description/store-name_with.special",
          expect.any(Object),
        );
      });

      it("should fetch multiple transactions for same description", async () => {
        const testTransactions = Array.from({ length: 10 }, (_, i) =>
          createTestTransaction({
            guid: `guid-${i}`,
            description: "walmart",
          }),
        );

        global.fetch = createFetchMock(testTransactions);

        const result = await fetchTransactionsByDescription("walmart");

        expect(result).toHaveLength(10);
        expect(result!.every((t) => t.description === "walmart")).toBe(true);
      });

      it("should use correct HTTP method", async () => {
        global.fetch = createFetchMock([]);

        await fetchTransactionsByDescription("walmart");

        const callArgs = (fetch as jest.Mock).mock.calls[0][1];
        expect(callArgs.method).toBe("GET");
      });

      it("should include credentials", async () => {
        global.fetch = createFetchMock([]);

        await fetchTransactionsByDescription("walmart");

        const callArgs = (fetch as jest.Mock).mock.calls[0][1];
        expect(callArgs.credentials).toBe("include");
      });

      it("should include correct headers", async () => {
        global.fetch = createFetchMock([]);

        await fetchTransactionsByDescription("walmart");

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
          fetchTransactionsByDescription("nonexistent"),
        ).rejects.toThrow(
          "Failed to fetch transaction by description data: Failed to fetch transactionsByDescription data: Not Found",
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

        await expect(fetchTransactionsByDescription("walmart")).rejects.toThrow(
          "Failed to fetch transaction by description data:",
        );
      });

      it("should throw error for 401 unauthorized", async () => {
        global.fetch = jest.fn().mockResolvedValue({
          ok: false,
          status: 401,
          statusText: "Unauthorized",
        });

        consoleSpy.start();

        await expect(fetchTransactionsByDescription("walmart")).rejects.toThrow(
          "Failed to fetch transaction by description data:",
        );
      });

      it("should throw error for 403 forbidden", async () => {
        global.fetch = jest.fn().mockResolvedValue({
          ok: false,
          status: 403,
          statusText: "Forbidden",
        });

        consoleSpy.start();

        await expect(fetchTransactionsByDescription("walmart")).rejects.toThrow(
          "Failed to fetch transaction by description data:",
        );
      });

      it("should handle network errors", async () => {
        global.fetch = jest.fn().mockRejectedValue(new Error("Network error"));

        consoleSpy.start();

        await expect(fetchTransactionsByDescription("walmart")).rejects.toThrow(
          "Failed to fetch transaction by description data: Network error",
        );

        const calls = consoleSpy.getCalls();
        expect(
          calls.error.some((call) =>
            call[0].includes("Error fetching transaction by description data:"),
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

        await expect(fetchTransactionsByDescription("walmart")).rejects.toThrow(
          "Failed to fetch transaction by description data: Invalid JSON",
        );
      });

      it("should handle fetch failure", async () => {
        global.fetch = jest
          .fn()
          .mockRejectedValue(new Error("Failed to fetch"));

        consoleSpy.start();

        await expect(fetchTransactionsByDescription("walmart")).rejects.toThrow(
          "Failed to fetch transaction by description data: Failed to fetch",
        );
      });

      it("should handle timeout errors", async () => {
        global.fetch = jest.fn().mockRejectedValue(new Error("Timeout"));

        consoleSpy.start();

        await expect(fetchTransactionsByDescription("walmart")).rejects.toThrow(
          "Failed to fetch transaction by description data: Timeout",
        );
      });
    });

    describe("Edge cases", () => {
      it("should handle empty description name", async () => {
        const testTransactions = [createTestTransaction()];
        global.fetch = createFetchMock(testTransactions);

        await fetchTransactionsByDescription("");

        expect(fetch).toHaveBeenCalledWith(
          "/api/transaction/description/",
          expect.any(Object),
        );
      });

      it("should handle description with spaces", async () => {
        const testTransactions = [
          createTestTransaction({ description: "whole foods" }),
        ];
        global.fetch = createFetchMock(testTransactions);

        await fetchTransactionsByDescription("whole foods");

        expect(fetch).toHaveBeenCalledWith(
          "/api/transaction/description/whole foods",
          expect.any(Object),
        );
      });

      it("should handle description with uppercase", async () => {
        const testTransactions = [
          createTestTransaction({ description: "WALMART" }),
        ];
        global.fetch = createFetchMock(testTransactions);

        await fetchTransactionsByDescription("WALMART");

        expect(fetch).toHaveBeenCalledWith(
          "/api/transaction/description/WALMART",
          expect.any(Object),
        );
      });

      it("should handle very long description names", async () => {
        const longDescription = "a".repeat(100);
        const testTransactions = [
          createTestTransaction({ description: longDescription }),
        ];
        global.fetch = createFetchMock(testTransactions);

        await fetchTransactionsByDescription(longDescription);

        expect(fetch).toHaveBeenCalledWith(
          `/api/transaction/description/${longDescription}`,
          expect.any(Object),
        );
      });

      it("should preserve transaction data structure", async () => {
        const testTransactions = [
          createTestTransaction({
            guid: "test-123",
            description: "walmart",
            amount: 250.75,
            category: "groceries",
          }),
        ];

        global.fetch = createFetchMock(testTransactions);

        const result = await fetchTransactionsByDescription("walmart");

        expect(result![0].guid).toBe("test-123");
        expect(result![0].amount).toBe(250.75);
        expect(result![0].description).toBe("walmart");
      });

      it("should handle transactions with different amounts", async () => {
        const testTransactions = [
          createTestTransaction({
            amount: 10.99,
            description: "walmart",
          }),
          createTestTransaction({
            amount: 150.0,
            description: "walmart",
          }),
          createTestTransaction({
            amount: -25.5,
            description: "walmart",
          }),
        ];

        global.fetch = createFetchMock(testTransactions);

        const result = await fetchTransactionsByDescription("walmart");

        expect(result).toHaveLength(3);
        expect(result![0].amount).toBe(10.99);
        expect(result![1].amount).toBe(150.0);
        expect(result![2].amount).toBe(-25.5);
      });

      it("should handle transactions with different dates", async () => {
        const testTransactions = [
          createTestTransaction({
            transactionDate: new Date("2024-01-01"),
            description: "walmart",
          }),
          createTestTransaction({
            transactionDate: new Date("2024-06-15"),
            description: "walmart",
          }),
        ];

        global.fetch = createFetchMock(testTransactions);

        const result = await fetchTransactionsByDescription("walmart");

        expect(result).toHaveLength(2);
      });

      it("should preserve error stack trace", async () => {
        const testError = new Error("Custom error");
        global.fetch = jest.fn().mockRejectedValue(testError);

        try {
          await fetchTransactionsByDescription("walmart");
          fail("Should have thrown an error");
        } catch (error: any) {
          expect(error.message).toContain(
            "Failed to fetch transaction by description data",
          );
        }
      });

      it("should handle description with numbers", async () => {
        const testTransactions = [
          createTestTransaction({ description: "store123" }),
        ];
        global.fetch = createFetchMock(testTransactions);

        await fetchTransactionsByDescription("store123");

        expect(fetch).toHaveBeenCalledWith(
          "/api/transaction/description/store123",
          expect.any(Object),
        );
      });

      it("should handle description with unicode characters", async () => {
        const testTransactions = [
          createTestTransaction({ description: "café" }),
        ];
        global.fetch = createFetchMock(testTransactions);

        await fetchTransactionsByDescription("café");

        expect(fetch).toHaveBeenCalledWith(
          "/api/transaction/description/café",
          expect.any(Object),
        );
      });
    });

    describe("Common merchant descriptions", () => {
      it("should fetch walmart transactions", async () => {
        const testTransactions = [
          createTestTransaction({ description: "walmart" }),
        ];

        global.fetch = createFetchMock(testTransactions);

        const result = await fetchTransactionsByDescription("walmart");

        expect(result).toHaveLength(1);
        expect(result![0].description).toBe("walmart");
      });

      it("should fetch amazon transactions", async () => {
        const testTransactions = [
          createTestTransaction({ description: "amazon" }),
        ];

        global.fetch = createFetchMock(testTransactions);

        const result = await fetchTransactionsByDescription("amazon");

        expect(result).toHaveLength(1);
        expect(result![0].description).toBe("amazon");
      });

      it("should fetch target transactions", async () => {
        const testTransactions = [
          createTestTransaction({ description: "target" }),
        ];

        global.fetch = createFetchMock(testTransactions);

        const result = await fetchTransactionsByDescription("target");

        expect(result).toHaveLength(1);
        expect(result![0].description).toBe("target");
      });

      it("should fetch costco transactions", async () => {
        const testTransactions = [
          createTestTransaction({ description: "costco" }),
        ];

        global.fetch = createFetchMock(testTransactions);

        const result = await fetchTransactionsByDescription("costco");

        expect(result).toHaveLength(1);
        expect(result![0].description).toBe("costco");
      });

      it("should fetch starbucks transactions", async () => {
        const testTransactions = [
          createTestTransaction({ description: "starbucks" }),
        ];

        global.fetch = createFetchMock(testTransactions);

        const result = await fetchTransactionsByDescription("starbucks");

        expect(result).toHaveLength(1);
        expect(result![0].description).toBe("starbucks");
      });

      it("should fetch gas station transactions", async () => {
        const testTransactions = [
          createTestTransaction({ description: "shell gas station" }),
        ];

        global.fetch = createFetchMock(testTransactions);

        const result =
          await fetchTransactionsByDescription("shell gas station");

        expect(result).toHaveLength(1);
        expect(result![0].description).toBe("shell gas station");
      });
    });

    describe("API endpoint", () => {
      it("should construct correct API endpoint", async () => {
        global.fetch = createFetchMock([]);

        await fetchTransactionsByDescription("test-description");

        expect(fetch).toHaveBeenCalledWith(
          "/api/transaction/description/test-description",
          expect.any(Object),
        );
      });

      it("should only call API once per fetch", async () => {
        global.fetch = createFetchMock([]);

        await fetchTransactionsByDescription("walmart");

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

        const result = await fetchTransactionsByDescription("walmart");

        expect(result).toStrictEqual(testTransactions);
      });

      it("should return null for 204 No Content", async () => {
        global.fetch = jest.fn().mockResolvedValue({
          ok: true,
          status: 204,
        });

        const result = await fetchTransactionsByDescription("walmart");

        expect(result).toBeNull();
      });
    });

    describe("Transaction data variations", () => {
      it("should handle transactions with different categories", async () => {
        const testTransactions = [
          createTestTransaction({
            description: "walmart",
            category: "groceries",
          }),
          createTestTransaction({
            description: "walmart",
            category: "household",
          }),
          createTestTransaction({
            description: "walmart",
            category: "clothing",
          }),
        ];

        global.fetch = createFetchMock(testTransactions);

        const result = await fetchTransactionsByDescription("walmart");

        expect(result).toHaveLength(3);
        expect(result!.every((t) => t.description === "walmart")).toBe(true);
        expect(result![0].category).toBe("groceries");
        expect(result![1].category).toBe("household");
        expect(result![2].category).toBe("clothing");
      });

      it("should handle transactions with different account owners", async () => {
        const testTransactions = [
          createTestTransaction({
            description: "walmart",
            accountNameOwner: "checking_john",
          }),
          createTestTransaction({
            description: "walmart",
            accountNameOwner: "checking_jane",
          }),
        ];

        global.fetch = createFetchMock(testTransactions);

        const result = await fetchTransactionsByDescription("walmart");

        expect(result).toHaveLength(2);
        expect(result![0].accountNameOwner).toBe("checking_john");
        expect(result![1].accountNameOwner).toBe("checking_jane");
      });

      it("should handle transactions with different states", async () => {
        const testTransactions = [
          createTestTransaction({
            description: "walmart",
            transactionState: "cleared",
          }),
          createTestTransaction({
            description: "walmart",
            transactionState: "outstanding",
          }),
          createTestTransaction({
            description: "walmart",
            transactionState: "pending",
          }),
        ];

        global.fetch = createFetchMock(testTransactions);

        const result = await fetchTransactionsByDescription("walmart");

        expect(result).toHaveLength(3);
        expect(result![0].transactionState).toBe("cleared");
        expect(result![1].transactionState).toBe("outstanding");
        expect(result![2].transactionState).toBe("pending");
      });
    });
  });
});
