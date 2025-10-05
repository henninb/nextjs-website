/**
 * Isolated tests for usePendingTransactionDelete business logic
 * Tests deletePendingTransaction function without React Query overhead
 */

import { createFetchMock, ConsoleSpy } from "../../testHelpers";

// Copy the function to test
const deletePendingTransaction = async (id: number): Promise<void> => {
  try {
    const endpoint = `/api/pending/transaction/delete/${id}`;
    console.log(`Deleting pending transaction with id: ${id}`);

    const response = await fetch(endpoint, {
      method: "DELETE",
      credentials: "include",
    });

    if (!response.ok) {
      let errorMessage = "";
      try {
        const errorBody = await response.json();
        if (errorBody && errorBody.response) {
          errorMessage = `${errorBody.response}`;
        } else {
          throw new Error("No error message returned.");
        }
      } catch (error: any) {
        console.log(`Failed to parse error response: ${error.message}`);
        throw new Error(`Failed to parse error response: ${error.message}`);
      }
      console.log(errorMessage || "Unknown error");
      throw new Error(errorMessage || "Unknown error");
    }

    return;
  } catch (error: any) {
    throw error;
  }
};

describe("usePendingTransactionDelete Business Logic (Isolated)", () => {
  let consoleSpy: ConsoleSpy;

  beforeEach(() => {
    consoleSpy = new ConsoleSpy();
    jest.clearAllMocks();
  });

  afterEach(() => {
    consoleSpy.stop();
  });

  describe("deletePendingTransaction", () => {
    describe("Successful delete operations", () => {
      it("should delete pending transaction successfully", async () => {
        global.fetch = jest.fn().mockResolvedValue({
          ok: true,
          status: 204,
        });

        consoleSpy.start();

        await deletePendingTransaction(42);

        expect(fetch).toHaveBeenCalledWith(
          "/api/pending/transaction/delete/42",
          {
            method: "DELETE",
            credentials: "include",
          },
        );

        const calls = consoleSpy.getCalls();
        expect(calls.log[0][0]).toBe("Deleting pending transaction with id: 42");
      });

      it("should handle deletion of different transaction IDs", async () => {
        global.fetch = jest.fn().mockResolvedValue({
          ok: true,
          status: 204,
        });

        const testIds = [1, 100, 999, 12345];

        for (const id of testIds) {
          await deletePendingTransaction(id);
          expect(fetch).toHaveBeenCalledWith(
            `/api/pending/transaction/delete/${id}`,
            {
              method: "DELETE",
              credentials: "include",
            },
          );
        }

        expect(fetch).toHaveBeenCalledTimes(testIds.length);
      });

      it("should log the transaction ID being deleted", async () => {
        global.fetch = jest.fn().mockResolvedValue({
          ok: true,
          status: 204,
        });

        consoleSpy.start();

        await deletePendingTransaction(123);

        const calls = consoleSpy.getCalls();
        expect(calls.log[0]).toEqual([
          "Deleting pending transaction with id: 123",
        ]);
      });
    });

    describe("Error handling", () => {
      it("should throw error when deletion fails with error message in response", async () => {
        global.fetch = jest.fn().mockResolvedValue({
          ok: false,
          status: 500,
          json: jest.fn().mockResolvedValue({
            response: "Database error",
          }),
        });

        consoleSpy.start();

        await expect(deletePendingTransaction(42)).rejects.toThrow(
          "Database error",
        );

        const calls = consoleSpy.getCalls();
        expect(
          calls.log.some((call) => call[0].includes("Database error")),
        ).toBe(true);
      });

      it("should handle error when no error message is returned", async () => {
        global.fetch = jest.fn().mockResolvedValue({
          ok: false,
          status: 500,
          json: jest.fn().mockResolvedValue({}),
        });

        consoleSpy.start();

        await expect(deletePendingTransaction(42)).rejects.toThrow(
          "No error message returned.",
        );
      });

      it("should handle 404 not found error", async () => {
        global.fetch = jest.fn().mockResolvedValue({
          ok: false,
          status: 404,
          json: jest.fn().mockResolvedValue({
            response: "Transaction not found",
          }),
        });

        consoleSpy.start();

        await expect(deletePendingTransaction(999)).rejects.toThrow(
          "Transaction not found",
        );
      });

      it("should handle 401 unauthorized error", async () => {
        global.fetch = jest.fn().mockResolvedValue({
          ok: false,
          status: 401,
          json: jest.fn().mockResolvedValue({
            response: "Unauthorized",
          }),
        });

        consoleSpy.start();

        await expect(deletePendingTransaction(42)).rejects.toThrow(
          "Unauthorized",
        );
      });

      it("should handle 403 forbidden error", async () => {
        global.fetch = jest.fn().mockResolvedValue({
          ok: false,
          status: 403,
          json: jest.fn().mockResolvedValue({
            response: "Forbidden",
          }),
        });

        consoleSpy.start();

        await expect(deletePendingTransaction(42)).rejects.toThrow("Forbidden");
      });

      it("should handle failed JSON parsing in error response", async () => {
        global.fetch = jest.fn().mockResolvedValue({
          ok: false,
          status: 500,
          json: jest.fn().mockRejectedValue(new Error("Invalid JSON")),
        });

        consoleSpy.start();

        await expect(deletePendingTransaction(42)).rejects.toThrow(
          "Failed to parse error response: Invalid JSON",
        );

        const calls = consoleSpy.getCalls();
        expect(
          calls.log.some((call) =>
            call[0].includes("Failed to parse error response: Invalid JSON"),
          ),
        ).toBe(true);
      });

      it("should handle network errors", async () => {
        global.fetch = jest
          .fn()
          .mockRejectedValue(new Error("Network error"));

        await expect(deletePendingTransaction(42)).rejects.toThrow(
          "Network error",
        );
      });

      it("should handle fetch timeout", async () => {
        global.fetch = jest.fn().mockRejectedValue(new Error("Timeout"));

        await expect(deletePendingTransaction(42)).rejects.toThrow("Timeout");
      });

      it("should handle error when response is null", async () => {
        global.fetch = jest.fn().mockResolvedValue({
          ok: false,
          status: 500,
          json: jest.fn().mockResolvedValue(null),
        });

        consoleSpy.start();

        await expect(deletePendingTransaction(42)).rejects.toThrow(
          "No error message returned.",
        );
      });
    });

    describe("Edge cases", () => {
      it("should handle deletion with ID 0", async () => {
        global.fetch = jest.fn().mockResolvedValue({
          ok: true,
          status: 204,
        });

        await deletePendingTransaction(0);

        expect(fetch).toHaveBeenCalledWith(
          "/api/pending/transaction/delete/0",
          {
            method: "DELETE",
            credentials: "include",
          },
        );
      });

      it("should handle deletion with very large ID", async () => {
        global.fetch = jest.fn().mockResolvedValue({
          ok: true,
          status: 204,
        });

        const largeId = 2147483647; // Max 32-bit integer

        await deletePendingTransaction(largeId);

        expect(fetch).toHaveBeenCalledWith(
          `/api/pending/transaction/delete/${largeId}`,
          {
            method: "DELETE",
            credentials: "include",
          },
        );
      });

      it("should handle deletion with negative ID", async () => {
        global.fetch = jest.fn().mockResolvedValue({
          ok: true,
          status: 204,
        });

        await deletePendingTransaction(-1);

        expect(fetch).toHaveBeenCalledWith(
          "/api/pending/transaction/delete/-1",
          {
            method: "DELETE",
            credentials: "include",
          },
        );
      });

      it("should preserve error stack trace", async () => {
        const testError = new Error("Test error");
        global.fetch = jest.fn().mockRejectedValue(testError);

        try {
          await deletePendingTransaction(42);
          fail("Should have thrown an error");
        } catch (error: any) {
          expect(error).toBe(testError);
          expect(error.message).toBe("Test error");
        }
      });
    });
  });
});
