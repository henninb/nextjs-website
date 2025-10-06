/**
 * Isolated tests for useTransferUpdate business logic
 * Tests updateTransfer function without React Query overhead
 */

import { ConsoleSpy } from "../../testHelpers";
import {
  createModernFetchMock,
  createModernErrorFetchMock,
} from "../../testHelpers.modern";
import Transfer from "../../model/Transfer";

import { updateTransfer } from "../../hooks/useTransferUpdate";

// Helper function to create test transfer data
const createTestTransfer = (overrides: Partial<Transfer> = {}): Transfer => ({
  transferId: 1,
  sourceAccount: "checking-123",
  destinationAccount: "savings-456",
  transactionDate: new Date("2024-01-01T00:00:00.000Z"),
  amount: 500,
  guidSource: "source-guid-123",
  guidDestination: "dest-guid-456",
  activeStatus: true,
  dateAdded: new Date("2024-01-01T10:00:00.000Z"),
  dateUpdated: new Date("2024-01-01T10:00:00.000Z"),
  ...overrides,
});

describe("useTransferUpdate Business Logic (Isolated)", () => {
  let consoleSpy: ConsoleSpy;

  beforeEach(() => {
    consoleSpy = new ConsoleSpy();
    jest.clearAllMocks();
  });

  afterEach(() => {
    consoleSpy.stop();
  });

  describe("updateTransfer", () => {
    describe("Successful updates", () => {
      it("should update transfer successfully", async () => {
        const oldTransfer = createTestTransfer({ transferId: 42 });
        const newTransfer = createTestTransfer({
          transferId: 42,
          amount: 1000,
          sourceAccount: "updated-checking",
        });

        const expectedResponse = {
          ...newTransfer,
          dateUpdated: new Date("2024-01-01T15:30:00.000Z"),
        };

        global.fetch = createModernFetchMock(expectedResponse);

        const result = await updateTransfer(oldTransfer, newTransfer);

        expect(result).toEqual(expectedResponse);
        expect(fetch).toHaveBeenCalledWith("/api/transfer/42", {
          method: "PUT",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(newTransfer),
        });
      });

      it("should use correct endpoint with transfer ID", async () => {
        const oldTransfer = createTestTransfer({ transferId: 999 });
        const newTransfer = createTestTransfer({ transferId: 999 });

        global.fetch = createModernFetchMock({ transferId: 999 });

        await updateTransfer(oldTransfer, newTransfer);

        expect(fetch).toHaveBeenCalledWith(
          "/api/transfer/999",
          expect.any(Object),
        );
      });

      it("should handle amount changes", async () => {
        const oldTransfer = createTestTransfer({ amount: 500 });
        const newTransfer = createTestTransfer({ amount: 750 });

        const expectedResponse = { ...newTransfer };
        global.fetch = createModernFetchMock(expectedResponse);

        const result = await updateTransfer(oldTransfer, newTransfer);

        expect(result.amount).toBe(750);
      });

      it("should handle account changes", async () => {
        const oldTransfer = createTestTransfer();
        const newTransfer = createTestTransfer({
          sourceAccount: "new-checking-456",
          destinationAccount: "new-savings-789",
        });

        const expectedResponse = { ...newTransfer };
        global.fetch = createModernFetchMock(expectedResponse);

        const result = await updateTransfer(oldTransfer, newTransfer);

        expect(result.sourceAccount).toBe("new-checking-456");
        expect(result.destinationAccount).toBe("new-savings-789");
      });

      it("should handle date changes", async () => {
        const oldTransfer = createTestTransfer();
        const newDate = new Date("2024-06-15T12:30:00.000Z");
        const newTransfer = createTestTransfer({ transactionDate: newDate });

        const expectedResponse = { ...newTransfer };
        global.fetch = createModernFetchMock(expectedResponse);

        const result = await updateTransfer(oldTransfer, newTransfer);

        expect(result.transactionDate).toEqual(newDate);
      });

      it("should handle status changes", async () => {
        const oldTransfer = createTestTransfer({ activeStatus: true });
        const newTransfer = createTestTransfer({ activeStatus: false });

        const expectedResponse = { ...newTransfer };
        global.fetch = createModernFetchMock(expectedResponse);

        const result = await updateTransfer(oldTransfer, newTransfer);

        expect(result.activeStatus).toBe(false);
      });

      it("should handle GUID changes", async () => {
        const oldTransfer = createTestTransfer();
        const newTransfer = createTestTransfer({
          guidSource: "new-source-guid",
          guidDestination: "new-dest-guid",
        });

        const expectedResponse = { ...newTransfer };
        global.fetch = createModernFetchMock(expectedResponse);

        const result = await updateTransfer(oldTransfer, newTransfer);

        expect(result.guidSource).toBe("new-source-guid");
        expect(result.guidDestination).toBe("new-dest-guid");
      });
    });

    describe("Error handling", () => {
      it("should handle 404 not found errors with specific logging", async () => {
        const oldTransfer = createTestTransfer({ transferId: 999 });
        const newTransfer = createTestTransfer({ transferId: 999 });

        global.fetch = createModernErrorFetchMock("Transfer not found", 404);
        consoleSpy.start();

        await expect(updateTransfer(oldTransfer, newTransfer)).rejects.toThrow(
          "Transfer not found",
        );

        const calls = consoleSpy.getCalls();
        expect(
          calls.error.some((call) =>
            call[0].includes("Failed to update transfer:"),
          ),
        ).toBe(true);
        expect(
          calls.error.some((call) => call[0].includes("An error occurred:")),
        ).toBe(true);
      });

      it("should handle 400 bad request errors", async () => {
        const oldTransfer = createTestTransfer();
        const newTransfer = createTestTransfer();

        global.fetch = createModernErrorFetchMock("Invalid transfer data", 400);
        consoleSpy.start();

        await expect(updateTransfer(oldTransfer, newTransfer)).rejects.toThrow(
          "Invalid transfer data",
        );

        const calls = consoleSpy.getCalls();
        expect(
          calls.error.some((call) => call[0].includes("An error occurred:")),
        ).toBe(true);
      });

      it("should handle 403 forbidden errors", async () => {
        const oldTransfer = createTestTransfer();
        const newTransfer = createTestTransfer();

        global.fetch = createModernErrorFetchMock("Forbidden", 403);
        consoleSpy.start();

        await expect(updateTransfer(oldTransfer, newTransfer)).rejects.toThrow(
          "Forbidden",
        );

        const calls = consoleSpy.getCalls();
        expect(
          calls.error.some((call) => call[0].includes("An error occurred:")),
        ).toBe(true);
      });

      it("should handle 500 server errors", async () => {
        const oldTransfer = createTestTransfer();
        const newTransfer = createTestTransfer();

        global.fetch = createModernErrorFetchMock("Internal server error", 500);
        consoleSpy.start();

        await expect(updateTransfer(oldTransfer, newTransfer)).rejects.toThrow(
          "Internal server error",
        );

        const calls = consoleSpy.getCalls();
        expect(
          calls.error.some((call) => call[0].includes("An error occurred:")),
        ).toBe(true);
      });

      it("should handle network errors", async () => {
        const oldTransfer = createTestTransfer();
        const newTransfer = createTestTransfer();

        global.fetch = jest.fn().mockRejectedValue(new Error("Network error"));
        consoleSpy.start();

        await expect(updateTransfer(oldTransfer, newTransfer)).rejects.toThrow(
          "Network error",
        );

        const calls = consoleSpy.getCalls();
        expect(calls.error[0]).toEqual(["An error occurred: Network error"]);
      });

      it("should handle timeout errors", async () => {
        const oldTransfer = createTestTransfer();
        const newTransfer = createTestTransfer();

        global.fetch = jest
          .fn()
          .mockRejectedValue(new Error("Request timeout"));
        consoleSpy.start();

        await expect(updateTransfer(oldTransfer, newTransfer)).rejects.toThrow(
          "Request timeout",
        );

        const calls = consoleSpy.getCalls();
        expect(calls.error[0]).toEqual(["An error occurred: Request timeout"]);
      });

      it("should handle JSON parsing errors", async () => {
        const oldTransfer = createTestTransfer();
        const newTransfer = createTestTransfer();

        global.fetch = jest.fn().mockResolvedValue({
          ok: true,
          status: 200,
          json: jest.fn().mockRejectedValue(new Error("Invalid JSON")),
        });
        consoleSpy.start();

        await expect(updateTransfer(oldTransfer, newTransfer)).rejects.toThrow(
          "Invalid JSON",
        );

        const calls = consoleSpy.getCalls();
        expect(calls.error[0]).toEqual(["An error occurred: Invalid JSON"]);
      });
    });

    describe("Request format validation", () => {
      it("should use PUT method", async () => {
        const oldTransfer = createTestTransfer();
        const newTransfer = createTestTransfer();

        global.fetch = createModernFetchMock({ transferId: 1 });

        await updateTransfer(oldTransfer, newTransfer);

        expect(fetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({ method: "PUT" }),
        );
      });

      it("should include credentials", async () => {
        const oldTransfer = createTestTransfer();
        const newTransfer = createTestTransfer();

        global.fetch = createModernFetchMock({ transferId: 1 });

        await updateTransfer(oldTransfer, newTransfer);

        expect(fetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({ credentials: "include" }),
        );
      });

      it("should send correct headers", async () => {
        const oldTransfer = createTestTransfer();
        const newTransfer = createTestTransfer();

        global.fetch = createModernFetchMock({ transferId: 1 });

        await updateTransfer(oldTransfer, newTransfer);

        expect(fetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
          }),
        );
      });

      it("should send newTransfer in JSON body", async () => {
        const oldTransfer = createTestTransfer({ transferId: 123 });
        const newTransfer = createTestTransfer({ transferId: 123 });

        global.fetch = createModernFetchMock({ transferId: 123 });

        await updateTransfer(oldTransfer, newTransfer);

        expect(fetch).toHaveBeenCalledWith(
          "/api/transfer/123",
          expect.objectContaining({
            body: JSON.stringify(newTransfer),
          }),
        );
      });
    });

    describe("Business logic scenarios", () => {
      it("should handle zero transfer ID", async () => {
        const oldTransfer = createTestTransfer({ transferId: 0 });
        const newTransfer = createTestTransfer({ transferId: 0 });

        global.fetch = createModernFetchMock({ transferId: 0 });

        await updateTransfer(oldTransfer, newTransfer);

        expect(fetch).toHaveBeenCalledWith(
          "/api/transfer/0",
          expect.any(Object),
        );
      });

      it("should handle large transfer IDs", async () => {
        const largeId = 999999999;
        const oldTransfer = createTestTransfer({ transferId: largeId });
        const newTransfer = createTestTransfer({ transferId: largeId });

        global.fetch = createModernFetchMock({ transferId: largeId });

        await updateTransfer(oldTransfer, newTransfer);

        expect(fetch).toHaveBeenCalledWith(
          `/api/transfer/${largeId}`,
          expect.any(Object),
        );
      });

      it("should handle negative transfer IDs", async () => {
        const negativeId = -1;
        const oldTransfer = createTestTransfer({ transferId: negativeId });
        const newTransfer = createTestTransfer({ transferId: negativeId });

        global.fetch = createModernFetchMock({ transferId: negativeId });

        await updateTransfer(oldTransfer, newTransfer);

        expect(fetch).toHaveBeenCalledWith(
          `/api/transfer/${negativeId}`,
          expect.any(Object),
        );
      });

      it("should handle transfer reconciliation scenarios", async () => {
        const oldTransfer = createTestTransfer({
          amount: 1000,
          sourceAccount: "checking-primary",
          destinationAccount: "savings-emergency",
        });
        const newTransfer = createTestTransfer({
          amount: 1500,
          sourceAccount: "checking-primary",
          destinationAccount: "savings-emergency",
        });

        const expectedResponse = { ...newTransfer };
        global.fetch = createModernFetchMock(expectedResponse);

        const result = await updateTransfer(oldTransfer, newTransfer);

        expect(result.amount).toBe(1500);
        expect(result.sourceAccount).toBe("checking-primary");
        expect(result.destinationAccount).toBe("savings-emergency");
      });

      it("should handle cross-account transfer changes", async () => {
        const oldTransfer = createTestTransfer({
          sourceAccount: "old-checking",
          destinationAccount: "old-savings",
        });
        const newTransfer = createTestTransfer({
          sourceAccount: "new-checking",
          destinationAccount: "new-savings",
        });

        const expectedResponse = { ...newTransfer };
        global.fetch = createModernFetchMock(expectedResponse);

        const result = await updateTransfer(oldTransfer, newTransfer);

        expect(result.sourceAccount).toBe("new-checking");
        expect(result.destinationAccount).toBe("new-savings");
      });

      it("should handle amount reconciliation from small to large", async () => {
        const oldTransfer = createTestTransfer({ amount: 10.5 });
        const newTransfer = createTestTransfer({ amount: 50000.99 });

        const expectedResponse = { ...newTransfer };
        global.fetch = createModernFetchMock(expectedResponse);

        const result = await updateTransfer(oldTransfer, newTransfer);

        expect(result.amount).toBe(50000.99);
      });

      it("should handle amount reconciliation from large to small", async () => {
        const oldTransfer = createTestTransfer({ amount: 50000.99 });
        const newTransfer = createTestTransfer({ amount: 10.5 });

        const expectedResponse = { ...newTransfer };
        global.fetch = createModernFetchMock(expectedResponse);

        const result = await updateTransfer(oldTransfer, newTransfer);

        expect(result.amount).toBe(10.5);
      });
    });

    describe("Edge cases", () => {
      it("should handle special characters in account names", async () => {
        const oldTransfer = createTestTransfer();
        const newTransfer = createTestTransfer({
          sourceAccount: "Account & Co: 2024!",
          destinationAccount: "Savings@Bank#1",
        });

        const expectedResponse = { ...newTransfer };
        global.fetch = createModernFetchMock(expectedResponse);

        const result = await updateTransfer(oldTransfer, newTransfer);

        expect(result.sourceAccount).toBe("Account & Co: 2024!");
        expect(result.destinationAccount).toBe("Savings@Bank#1");
      });

      it("should handle unicode characters in account names", async () => {
        const oldTransfer = createTestTransfer();
        const newTransfer = createTestTransfer({
          sourceAccount: "账户支票 Checking",
          destinationAccount: "储蓄账户 Savings 💰",
        });

        const expectedResponse = { ...newTransfer };
        global.fetch = createModernFetchMock(expectedResponse);

        const result = await updateTransfer(oldTransfer, newTransfer);

        expect(result.sourceAccount).toBe("账户支票 Checking");
        expect(result.destinationAccount).toBe("储蓄账户 Savings 💰");
      });

      it("should handle very long account names", async () => {
        const longAccountName = "A".repeat(500);
        const oldTransfer = createTestTransfer();
        const newTransfer = createTestTransfer({
          sourceAccount: longAccountName,
          destinationAccount: longAccountName,
        });

        const expectedResponse = { ...newTransfer };
        global.fetch = createModernFetchMock(expectedResponse);

        const result = await updateTransfer(oldTransfer, newTransfer);

        expect(result.sourceAccount).toBe(longAccountName);
        expect(result.destinationAccount).toBe(longAccountName);
      });

      it("should handle zero amounts", async () => {
        const oldTransfer = createTestTransfer({ amount: 100 });
        const newTransfer = createTestTransfer({ amount: 0 });

        const expectedResponse = { ...newTransfer };
        global.fetch = createModernFetchMock(expectedResponse);

        const result = await updateTransfer(oldTransfer, newTransfer);

        expect(result.amount).toBe(0);
      });

      it("should handle decimal precision amounts", async () => {
        const oldTransfer = createTestTransfer({ amount: 100 });
        const newTransfer = createTestTransfer({ amount: 123.456789 });

        const expectedResponse = { ...newTransfer };
        global.fetch = createModernFetchMock(expectedResponse);

        const result = await updateTransfer(oldTransfer, newTransfer);

        expect(result.amount).toBe(123.456789);
      });

      it("should handle past and future date changes", async () => {
        const oldTransfer = createTestTransfer({
          transactionDate: new Date("2024-01-01T00:00:00.000Z"),
        });

        // Test future date
        const futureDate = new Date("2025-12-31T23:59:59.000Z");
        const newTransferFuture = createTestTransfer({
          transactionDate: futureDate,
        });

        global.fetch = createModernFetchMock({ ...newTransferFuture });

        const resultFuture = await updateTransfer(
          oldTransfer,
          newTransferFuture,
        );
        expect(resultFuture.transactionDate).toEqual(futureDate);

        // Test past date
        const pastDate = new Date("2020-01-01T00:00:00.000Z");
        const newTransferPast = createTestTransfer({
          transactionDate: pastDate,
        });

        global.fetch = createModernFetchMock({ ...newTransferPast });

        const resultPast = await updateTransfer(oldTransfer, newTransferPast);
        expect(resultPast.transactionDate).toEqual(pastDate);
      });
    });

    describe("Console logging", () => {
      it("should log 404 errors specifically", async () => {
        const oldTransfer = createTestTransfer();
        const newTransfer = createTestTransfer();

        global.fetch = createModernErrorFetchMock("Transfer not found", 404);
        consoleSpy.start();

        try {
          await updateTransfer(oldTransfer, newTransfer);
        } catch (error) {
          // Expected error
        }

        const calls = consoleSpy.getCalls();
        expect(
          calls.error.some((call) =>
            call[0].includes("Failed to update transfer:"),
          ),
        ).toBe(true);
        expect(
          calls.error.some((call) => call[0].includes("An error occurred:")),
        ).toBe(true);
      });

      it("should log general errors", async () => {
        const oldTransfer = createTestTransfer();
        const newTransfer = createTestTransfer();

        global.fetch = jest
          .fn()
          .mockRejectedValue(new Error("Connection failed"));
        consoleSpy.start();

        try {
          await updateTransfer(oldTransfer, newTransfer);
        } catch (error) {
          // Expected error
        }

        const calls = consoleSpy.getCalls();
        expect(calls.error[0]).toEqual([
          "An error occurred: Connection failed",
        ]);
      });

      it("should not log 404 message for non-404 errors", async () => {
        const oldTransfer = createTestTransfer();
        const newTransfer = createTestTransfer();

        global.fetch = createModernErrorFetchMock("Internal server error", 500);
        consoleSpy.start();

        try {
          await updateTransfer(oldTransfer, newTransfer);
        } catch (error) {
          // Expected error
        }

        const calls = consoleSpy.getCalls();
        expect(
          calls.error.some((call) =>
            call[0].includes("Failed to update transfer:"),
          ),
        ).toBe(true);
        expect(
          calls.error.some((call) => call[0].includes("An error occurred:")),
        ).toBe(true);
        expect(
          calls.error.some((call) => call[0].includes("Internal server error")),
        ).toBe(true);
      });
    });

    describe("Integration scenarios", () => {
      it("should handle complete transfer update workflow", async () => {
        const oldTransfer = createTestTransfer({
          transferId: 567,
          sourceAccount: "old-checking",
          destinationAccount: "old-savings",
          amount: 1000,
          transactionDate: new Date("2024-01-15T10:00:00.000Z"),
        });

        const newTransfer = createTestTransfer({
          transferId: 567,
          sourceAccount: "new-checking",
          destinationAccount: "new-savings",
          amount: 2500,
          transactionDate: new Date("2024-02-15T14:30:00.000Z"),
        });

        const expectedResponse = {
          ...newTransfer,
          dateUpdated: new Date("2024-02-15T14:35:00.000Z"),
        };

        global.fetch = createModernFetchMock(expectedResponse);

        const result = await updateTransfer(oldTransfer, newTransfer);

        expect(result).toEqual(expectedResponse);
        expect(result.transferId).toBe(567);
        expect(result.amount).toBe(2500);
        expect(result.sourceAccount).toBe("new-checking");
        expect(result.destinationAccount).toBe("new-savings");
      });

      it("should handle transfer update with server validation failure", async () => {
        const oldTransfer = createTestTransfer({ transferId: 123 });
        const newTransfer = createTestTransfer({
          transferId: 123,
          amount: -1000, // Invalid negative amount
        });

        global.fetch = createModernErrorFetchMock("Invalid amount", 400);
        consoleSpy.start();

        await expect(updateTransfer(oldTransfer, newTransfer)).rejects.toThrow(
          "Invalid amount",
        );

        const calls = consoleSpy.getCalls();
        expect(
          calls.error.some((call) =>
            call[0].includes("Failed to update transfer:"),
          ),
        ).toBe(true);
        expect(
          calls.error.some((call) => call[0].includes("An error occurred:")),
        ).toBe(true);
      });

      it("should handle transfer ID mismatch scenarios", async () => {
        const oldTransfer = createTestTransfer({ transferId: 100 });
        const newTransfer = createTestTransfer({ transferId: 200 }); // Different ID

        // The API endpoint should still use the old transfer ID
        global.fetch = createModernFetchMock({ transferId: 200 });

        await updateTransfer(oldTransfer, newTransfer);

        // Should use old transfer ID in endpoint, regardless of new transfer ID
        expect(fetch).toHaveBeenCalledWith(
          "/api/transfer/100",
          expect.any(Object),
        );
      });
    });
  });
});
