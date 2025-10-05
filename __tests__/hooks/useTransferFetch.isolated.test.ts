/**
 * Isolated tests for useTransferFetch business logic
 * Tests fetchTransferData function without React Query overhead
 */

import { createFetchMock, ConsoleSpy } from "../../testHelpers";
import Transfer from "../../model/Transfer";

// Copy the function to test
const fetchTransferData = async (): Promise<Transfer[]> => {
  try {
    const response = await fetch("/api/transfer/select", {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        console.log("No transfers found (404).");
        return [];
      }
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();

    return data;
  } catch (error) {
    console.log("Error fetching transfer data:", error);
    throw error;
  }
};

// Helper function to create test transfer data
const createTestTransfer = (overrides: Partial<Transfer> = {}): Transfer => ({
  transferId: 1,
  transactionDate: new Date("2024-01-01T00:00:00.000Z"),
  sourceAccount: "checking_john",
  destinationAccount: "savings_john",
  amount: 500.0,
  activeStatus: true,
  ...overrides,
});

describe("useTransferFetch Business Logic (Isolated)", () => {
  let consoleSpy: ConsoleSpy;

  beforeEach(() => {
    consoleSpy = new ConsoleSpy();
    jest.clearAllMocks();
  });

  afterEach(() => {
    consoleSpy.stop();
  });

  describe("fetchTransferData", () => {
    describe("Successful fetch operations", () => {
      it("should fetch transfers successfully", async () => {
        const testTransfers = [
          createTestTransfer({ transferId: 1 }),
          createTestTransfer({ transferId: 2 }),
        ];

        global.fetch = createFetchMock(testTransfers);

        const result = await fetchTransferData();

        expect(result).toEqual(testTransfers);
        expect(fetch).toHaveBeenCalledWith("/api/transfer/select", {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        });
      });

      it("should return empty array when no transfers exist (404)", async () => {
        global.fetch = jest.fn().mockResolvedValue({
          ok: false,
          status: 404,
        });

        consoleSpy.start();

        const result = await fetchTransferData();

        expect(result).toEqual([]);
        const calls = consoleSpy.getCalls();
        expect(calls.log.some((call) => call[0].includes("404"))).toBe(true);
      });

      it("should fetch transfers with different amounts", async () => {
        const testTransfers = [
          createTestTransfer({ amount: 100.0 }),
          createTestTransfer({ amount: 750.5 }),
          createTestTransfer({ amount: 2000.99 }),
        ];

        global.fetch = createFetchMock(testTransfers);

        const result = await fetchTransferData();

        expect(result).toHaveLength(3);
        expect(result[0].amount).toBe(100.0);
        expect(result[1].amount).toBe(750.5);
        expect(result[2].amount).toBe(2000.99);
      });

      it("should fetch transfers between different accounts", async () => {
        const testTransfers = [
          createTestTransfer({
            sourceAccount: "checking_john",
            destinationAccount: "savings_john",
          }),
          createTestTransfer({
            sourceAccount: "savings_jane",
            destinationAccount: "checking_jane",
          }),
          createTestTransfer({
            sourceAccount: "checking_bob",
            destinationAccount: "investment_bob",
          }),
        ];

        global.fetch = createFetchMock(testTransfers);

        const result = await fetchTransferData();

        expect(result).toHaveLength(3);
        expect(result[0].sourceAccount).toBe("checking_john");
        expect(result[1].sourceAccount).toBe("savings_jane");
        expect(result[2].sourceAccount).toBe("checking_bob");
      });

      it("should handle empty array response", async () => {
        global.fetch = createFetchMock([]);

        const result = await fetchTransferData();

        expect(result).toEqual([]);
        expect(Array.isArray(result)).toBe(true);
      });

      it("should fetch transfers with different dates", async () => {
        const testTransfers = [
          createTestTransfer({
            transactionDate: new Date("2024-01-15"),
          }),
          createTestTransfer({
            transactionDate: new Date("2024-06-30"),
          }),
          createTestTransfer({
            transactionDate: new Date("2024-12-01"),
          }),
        ];

        global.fetch = createFetchMock(testTransfers);

        const result = await fetchTransferData();

        expect(result).toHaveLength(3);
        expect(new Date(result[0].transactionDate)).toEqual(
          new Date("2024-01-15"),
        );
        expect(new Date(result[1].transactionDate)).toEqual(
          new Date("2024-06-30"),
        );
      });

      it("should fetch active and inactive transfers", async () => {
        const testTransfers = [
          createTestTransfer({ activeStatus: true }),
          createTestTransfer({ activeStatus: false }),
        ];

        global.fetch = createFetchMock(testTransfers);

        const result = await fetchTransferData();

        expect(result[0].activeStatus).toBe(true);
        expect(result[1].activeStatus).toBe(false);
      });

      it("should use correct HTTP method", async () => {
        global.fetch = createFetchMock([]);

        await fetchTransferData();

        const callArgs = (fetch as jest.Mock).mock.calls[0][1];
        expect(callArgs.method).toBe("GET");
      });

      it("should include credentials", async () => {
        global.fetch = createFetchMock([]);

        await fetchTransferData();

        const callArgs = (fetch as jest.Mock).mock.calls[0][1];
        expect(callArgs.credentials).toBe("include");
      });

      it("should include correct headers", async () => {
        global.fetch = createFetchMock([]);

        await fetchTransferData();

        const callArgs = (fetch as jest.Mock).mock.calls[0][1];
        expect(callArgs.headers).toEqual({
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
        });

        consoleSpy.start();

        await expect(fetchTransferData()).rejects.toThrow(
          "HTTP error! Status: 500",
        );

        const calls = consoleSpy.getCalls();
        expect(
          calls.log.some((call) =>
            call[0].includes("Error fetching transfer data:"),
          ),
        ).toBe(true);
      });

      it("should throw error for 401 unauthorized", async () => {
        global.fetch = jest.fn().mockResolvedValue({
          ok: false,
          status: 401,
        });

        consoleSpy.start();

        await expect(fetchTransferData()).rejects.toThrow(
          "HTTP error! Status: 401",
        );
      });

      it("should throw error for 403 forbidden", async () => {
        global.fetch = jest.fn().mockResolvedValue({
          ok: false,
          status: 403,
        });

        consoleSpy.start();

        await expect(fetchTransferData()).rejects.toThrow(
          "HTTP error! Status: 403",
        );
      });

      it("should handle network errors", async () => {
        global.fetch = jest
          .fn()
          .mockRejectedValue(new Error("Network error"));

        consoleSpy.start();

        await expect(fetchTransferData()).rejects.toThrow("Network error");

        const calls = consoleSpy.getCalls();
        expect(
          calls.log.some((call) =>
            call[0].includes("Error fetching transfer data:"),
          ),
        ).toBe(true);
      });

      it("should handle invalid JSON response", async () => {
        global.fetch = jest.fn().mockResolvedValue({
          ok: true,
          json: jest.fn().mockRejectedValue(new Error("Invalid JSON")),
        });

        consoleSpy.start();

        await expect(fetchTransferData()).rejects.toThrow("Invalid JSON");
      });

      it("should handle fetch failure", async () => {
        global.fetch = jest
          .fn()
          .mockRejectedValue(new Error("Failed to fetch"));

        consoleSpy.start();

        await expect(fetchTransferData()).rejects.toThrow("Failed to fetch");
      });

      it("should handle timeout errors", async () => {
        global.fetch = jest.fn().mockRejectedValue(new Error("Timeout"));

        consoleSpy.start();

        await expect(fetchTransferData()).rejects.toThrow("Timeout");
      });

      it("should log 404 status when no transfers found", async () => {
        global.fetch = jest.fn().mockResolvedValue({
          ok: false,
          status: 404,
        });

        consoleSpy.start();

        await fetchTransferData();

        const calls = consoleSpy.getCalls();
        expect(calls.log[0][0]).toBe("No transfers found (404).");
      });

      it("should log errors when they occur", async () => {
        const testError = new Error("Test error");
        global.fetch = jest.fn().mockRejectedValue(testError);

        consoleSpy.start();

        try {
          await fetchTransferData();
        } catch (error) {
          // Expected to throw
        }

        const calls = consoleSpy.getCalls();
        expect(
          calls.log.some((call) =>
            call[0].includes("Error fetching transfer data:"),
          ),
        ).toBe(true);
      });
    });

    describe("Edge cases", () => {
      it("should handle transfers with zero amount", async () => {
        const testTransfers = [createTestTransfer({ amount: 0 })];

        global.fetch = createFetchMock(testTransfers);

        const result = await fetchTransferData();

        expect(result[0].amount).toBe(0);
      });

      it("should handle transfers with negative amount", async () => {
        const testTransfers = [createTestTransfer({ amount: -500.0 })];

        global.fetch = createFetchMock(testTransfers);

        const result = await fetchTransferData();

        expect(result[0].amount).toBe(-500.0);
      });

      it("should handle transfers with very large amounts", async () => {
        const testTransfers = [createTestTransfer({ amount: 999999.99 })];

        global.fetch = createFetchMock(testTransfers);

        const result = await fetchTransferData();

        expect(result[0].amount).toBe(999999.99);
      });

      it("should handle transfers with same source and destination", async () => {
        const testTransfers = [
          createTestTransfer({
            sourceAccount: "checking_john",
            destinationAccount: "checking_john",
          }),
        ];

        global.fetch = createFetchMock(testTransfers);

        const result = await fetchTransferData();

        expect(result[0].sourceAccount).toBe("checking_john");
        expect(result[0].destinationAccount).toBe("checking_john");
      });

      it("should handle transfers with special characters in account names", async () => {
        const testTransfers = [
          createTestTransfer({
            sourceAccount: "account-with_special.chars",
            destinationAccount: "another!@#account",
          }),
        ];

        global.fetch = createFetchMock(testTransfers);

        const result = await fetchTransferData();

        expect(result[0].sourceAccount).toBe("account-with_special.chars");
        expect(result[0].destinationAccount).toBe("another!@#account");
      });

      it("should handle transfers with future dates", async () => {
        const futureDate = new Date("2030-12-31");
        const testTransfers = [
          createTestTransfer({ transactionDate: futureDate }),
        ];

        global.fetch = createFetchMock(testTransfers);

        const result = await fetchTransferData();

        expect(new Date(result[0].transactionDate)).toEqual(futureDate);
      });

      it("should handle transfers with past dates", async () => {
        const pastDate = new Date("2000-01-01");
        const testTransfers = [
          createTestTransfer({ transactionDate: pastDate }),
        ];

        global.fetch = createFetchMock(testTransfers);

        const result = await fetchTransferData();

        expect(new Date(result[0].transactionDate)).toEqual(pastDate);
      });

      it("should preserve transfer ID in response", async () => {
        const testTransfers = [
          createTestTransfer({ transferId: 12345 }),
          createTestTransfer({ transferId: 67890 }),
        ];

        global.fetch = createFetchMock(testTransfers);

        const result = await fetchTransferData();

        expect(result[0].transferId).toBe(12345);
        expect(result[1].transferId).toBe(67890);
      });

      it("should handle large number of transfers", async () => {
        const testTransfers = Array.from({ length: 100 }, (_, i) =>
          createTestTransfer({ transferId: i + 1 }),
        );

        global.fetch = createFetchMock(testTransfers);

        const result = await fetchTransferData();

        expect(result).toHaveLength(100);
        expect(result[0].transferId).toBe(1);
        expect(result[99].transferId).toBe(100);
      });

      it("should handle transfers between multiple account types", async () => {
        const testTransfers = [
          createTestTransfer({
            sourceAccount: "checking",
            destinationAccount: "savings",
          }),
          createTestTransfer({
            sourceAccount: "savings",
            destinationAccount: "investment",
          }),
          createTestTransfer({
            sourceAccount: "investment",
            destinationAccount: "checking",
          }),
        ];

        global.fetch = createFetchMock(testTransfers);

        const result = await fetchTransferData();

        expect(result).toHaveLength(3);
        expect(result[0].sourceAccount).toBe("checking");
        expect(result[1].destinationAccount).toBe("investment");
      });

      it("should preserve error object when thrown", async () => {
        const testError = new Error("Custom error");
        global.fetch = jest.fn().mockRejectedValue(testError);

        try {
          await fetchTransferData();
          fail("Should have thrown an error");
        } catch (error: any) {
          expect(error).toBe(testError);
        }
      });
    });

    describe("API endpoint", () => {
      it("should call correct API endpoint", async () => {
        global.fetch = createFetchMock([]);

        await fetchTransferData();

        expect(fetch).toHaveBeenCalledWith(
          "/api/transfer/select",
          expect.any(Object),
        );
      });

      it("should only call API once per fetch", async () => {
        global.fetch = createFetchMock([]);

        await fetchTransferData();

        expect(fetch).toHaveBeenCalledTimes(1);
      });
    });

    describe("Data integrity", () => {
      it("should return data exactly as received from API", async () => {
        const testTransfers = [
          createTestTransfer({
            transferId: 999,
            amount: 123.45,
            sourceAccount: "test_source",
            destinationAccount: "test_dest",
          }),
        ];

        global.fetch = createFetchMock(testTransfers);

        const result = await fetchTransferData();

        expect(result).toEqual(testTransfers);
      });

      it("should not modify transfer data during fetch", async () => {
        const testTransfers = [
          createTestTransfer({ transferId: 1, amount: 100.0 }),
        ];

        global.fetch = createFetchMock(testTransfers);

        const result = await fetchTransferData();

        expect(result[0].transferId).toBe(testTransfers[0].transferId);
        expect(result[0].amount).toBe(testTransfers[0].amount);
        expect(result[0].sourceAccount).toBe(testTransfers[0].sourceAccount);
        expect(result[0].destinationAccount).toBe(
          testTransfers[0].destinationAccount,
        );
      });
    });
  });
});
