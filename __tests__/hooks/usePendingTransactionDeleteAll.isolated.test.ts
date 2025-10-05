/**
 * Isolated tests for usePendingTransactionDeleteAll business logic
 * Tests deleteAllPendingTransactions function without React Query overhead
 */

import { ConsoleSpy } from "../../testHelpers";

// Copy the function to test
const deleteAllPendingTransactions = async (): Promise<void> => {
  try {
    const endpoint = "/api/pending/transaction/delete/all";
    console.log("Deleting all pending transactions");

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

describe("usePendingTransactionDeleteAll Business Logic (Isolated)", () => {
  let consoleSpy: ConsoleSpy;

  beforeEach(() => {
    consoleSpy = new ConsoleSpy();
    jest.clearAllMocks();
  });

  afterEach(() => {
    consoleSpy.stop();
  });

  describe("deleteAllPendingTransactions", () => {
    describe("Successful delete all operations", () => {
      it("should delete all pending transactions successfully", async () => {
        global.fetch = jest.fn().mockResolvedValue({
          ok: true,
          status: 204,
        });

        consoleSpy.start();

        await deleteAllPendingTransactions();

        expect(fetch).toHaveBeenCalledWith(
          "/api/pending/transaction/delete/all",
          {
            method: "DELETE",
            credentials: "include",
          },
        );

        const calls = consoleSpy.getCalls();
        expect(calls.log[0][0]).toBe("Deleting all pending transactions");
      });

      it("should log that all transactions are being deleted", async () => {
        global.fetch = jest.fn().mockResolvedValue({
          ok: true,
          status: 204,
        });

        consoleSpy.start();

        await deleteAllPendingTransactions();

        const calls = consoleSpy.getCalls();
        expect(calls.log[0]).toEqual(["Deleting all pending transactions"]);
      });

      it("should call the delete endpoint only once", async () => {
        global.fetch = jest.fn().mockResolvedValue({
          ok: true,
          status: 204,
        });

        await deleteAllPendingTransactions();

        expect(fetch).toHaveBeenCalledTimes(1);
      });

      it("should use DELETE method", async () => {
        global.fetch = jest.fn().mockResolvedValue({
          ok: true,
          status: 204,
        });

        await deleteAllPendingTransactions();

        expect(fetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            method: "DELETE",
          }),
        );
      });

      it("should include credentials in the request", async () => {
        global.fetch = jest.fn().mockResolvedValue({
          ok: true,
          status: 204,
        });

        await deleteAllPendingTransactions();

        expect(fetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            credentials: "include",
          }),
        );
      });
    });

    describe("Error handling", () => {
      it("should throw error when deletion fails with error message in response", async () => {
        global.fetch = jest.fn().mockResolvedValue({
          ok: false,
          status: 500,
          json: jest.fn().mockResolvedValue({
            response: "Database error while deleting all transactions",
          }),
        });

        consoleSpy.start();

        await expect(deleteAllPendingTransactions()).rejects.toThrow(
          "Database error while deleting all transactions",
        );

        const calls = consoleSpy.getCalls();
        expect(
          calls.log.some((call) =>
            call[0].includes("Database error while deleting all transactions"),
          ),
        ).toBe(true);
      });

      it("should handle error when no error message is returned", async () => {
        global.fetch = jest.fn().mockResolvedValue({
          ok: false,
          status: 500,
          json: jest.fn().mockResolvedValue({}),
        });

        consoleSpy.start();

        await expect(deleteAllPendingTransactions()).rejects.toThrow(
          "No error message returned.",
        );
      });

      it("should handle 401 unauthorized error", async () => {
        global.fetch = jest.fn().mockResolvedValue({
          ok: false,
          status: 401,
          json: jest.fn().mockResolvedValue({
            response: "Unauthorized to delete all transactions",
          }),
        });

        consoleSpy.start();

        await expect(deleteAllPendingTransactions()).rejects.toThrow(
          "Unauthorized to delete all transactions",
        );
      });

      it("should handle 403 forbidden error", async () => {
        global.fetch = jest.fn().mockResolvedValue({
          ok: false,
          status: 403,
          json: jest.fn().mockResolvedValue({
            response: "Forbidden - insufficient permissions",
          }),
        });

        consoleSpy.start();

        await expect(deleteAllPendingTransactions()).rejects.toThrow(
          "Forbidden - insufficient permissions",
        );
      });

      it("should handle 404 not found error", async () => {
        global.fetch = jest.fn().mockResolvedValue({
          ok: false,
          status: 404,
          json: jest.fn().mockResolvedValue({
            response: "Endpoint not found",
          }),
        });

        consoleSpy.start();

        await expect(deleteAllPendingTransactions()).rejects.toThrow(
          "Endpoint not found",
        );
      });

      it("should handle failed JSON parsing in error response", async () => {
        global.fetch = jest.fn().mockResolvedValue({
          ok: false,
          status: 500,
          json: jest.fn().mockRejectedValue(new Error("Invalid JSON")),
        });

        consoleSpy.start();

        await expect(deleteAllPendingTransactions()).rejects.toThrow(
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

        await expect(deleteAllPendingTransactions()).rejects.toThrow(
          "Network error",
        );
      });

      it("should handle fetch timeout", async () => {
        global.fetch = jest.fn().mockRejectedValue(new Error("Timeout"));

        await expect(deleteAllPendingTransactions()).rejects.toThrow("Timeout");
      });

      it("should handle error when response is null", async () => {
        global.fetch = jest.fn().mockResolvedValue({
          ok: false,
          status: 500,
          json: jest.fn().mockResolvedValue(null),
        });

        consoleSpy.start();

        await expect(deleteAllPendingTransactions()).rejects.toThrow(
          "No error message returned.",
        );
      });

      it("should handle malformed error response", async () => {
        global.fetch = jest.fn().mockResolvedValue({
          ok: false,
          status: 500,
          json: jest.fn().mockResolvedValue({
            someOtherField: "error",
          }),
        });

        consoleSpy.start();

        await expect(deleteAllPendingTransactions()).rejects.toThrow(
          "No error message returned.",
        );
      });
    });

    describe("Edge cases", () => {
      it("should handle successful deletion when there are no pending transactions", async () => {
        global.fetch = jest.fn().mockResolvedValue({
          ok: true,
          status: 204,
        });

        consoleSpy.start();

        await expect(deleteAllPendingTransactions()).resolves.toBeUndefined();
      });

      it("should preserve error stack trace", async () => {
        const testError = new Error("Test error with stack");
        global.fetch = jest.fn().mockRejectedValue(testError);

        try {
          await deleteAllPendingTransactions();
          fail("Should have thrown an error");
        } catch (error: any) {
          expect(error).toBe(testError);
          expect(error.message).toBe("Test error with stack");
        }
      });

      it("should handle concurrent delete all calls", async () => {
        global.fetch = jest.fn().mockResolvedValue({
          ok: true,
          status: 204,
        });

        const promise1 = deleteAllPendingTransactions();
        const promise2 = deleteAllPendingTransactions();
        const promise3 = deleteAllPendingTransactions();

        await Promise.all([promise1, promise2, promise3]);

        expect(fetch).toHaveBeenCalledTimes(3);
      });

      it("should return void (undefined) on success", async () => {
        global.fetch = jest.fn().mockResolvedValue({
          ok: true,
          status: 204,
        });

        const result = await deleteAllPendingTransactions();

        expect(result).toBeUndefined();
      });

      it("should handle different successful HTTP status codes", async () => {
        const successStatuses = [200, 201, 204];

        for (const status of successStatuses) {
          global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            status: status,
          });

          await expect(deleteAllPendingTransactions()).resolves.toBeUndefined();
        }
      });
    });

    describe("Security and validation", () => {
      it("should include credentials for authentication", async () => {
        global.fetch = jest.fn().mockResolvedValue({
          ok: true,
          status: 204,
        });

        await deleteAllPendingTransactions();

        const callArgs = (fetch as jest.Mock).mock.calls[0][1];
        expect(callArgs.credentials).toBe("include");
      });

      it("should use correct endpoint path", async () => {
        global.fetch = jest.fn().mockResolvedValue({
          ok: true,
          status: 204,
        });

        await deleteAllPendingTransactions();

        const endpoint = (fetch as jest.Mock).mock.calls[0][0];
        expect(endpoint).toBe("/api/pending/transaction/delete/all");
      });
    });
  });
});
