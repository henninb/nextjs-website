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
    validateTransfer: jest.fn(),
  },
  ValidationError: jest.fn(),
}));

import Transfer from "../../model/Transfer";
import {
  createTestTransfer,
  simulateNetworkError,
} from "../../testHelpers";
import {
  createModernFetchMock,
  createModernErrorFetchMock,
} from "../../testHelpers.modern";

import { deleteTransfer } from "../../hooks/useTransferDelete";
import { HookValidator } from "../../utils/hookValidation";

const mockValidateDelete = HookValidator.validateDelete as jest.Mock;

describe("deleteTransfer (Isolated)", () => {
  const mockTransfer = createTestTransfer({
    transferId: 1,
    sourceAccount: "checkingAccount",
    destinationAccount: "savingsAccount",
    transactionDate: new Date("2024-01-01"),
    amount: 500.0,
    guidSource: "src-guid-789",
    guidDestination: "dest-guid-101",
    activeStatus: true,
  });


  beforeEach(() => {
    jest.clearAllMocks();
    // Reset validation mock
    mockValidateDelete.mockImplementation(() => {});
  });

  afterEach(() => {
  });

  describe("Successful deletion", () => {
    it("should delete transfer successfully and return transfer data", async () => {
      global.fetch = createModernFetchMock(mockTransfer, { status: 200 });

      const result = await deleteTransfer(mockTransfer);

      expect(result).toEqual(mockTransfer);
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/transfer/1",
        expect.objectContaining({
          method: "DELETE",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }),
      );
    });

    it("should return transfer data for non-204 responses", async () => {
      const responseData = { ...mockTransfer, deleted: true };
      global.fetch = createModernFetchMock(responseData, { status: 200 });

      const result = await deleteTransfer(mockTransfer);

      expect(result).toEqual(responseData);
    });

    it("should construct correct endpoint URL with transfer ID", async () => {
      const transferWithDifferentId = createTestTransfer({ transferId: 999 });
      global.fetch = createModernFetchMock(null, { status: 204 });

      await deleteTransfer(transferWithDifferentId);

      expect(global.fetch).toHaveBeenCalledWith(
        "/api/transfer/999",
        expect.any(Object),
      );
    });
  });

  describe("Error handling", () => {
    it("should handle server error with error message", async () => {
      const errorMessage = "Cannot delete transfer with pending reconciliation";
      global.fetch = createModernErrorFetchMock(errorMessage, 400);

      await expect(deleteTransfer(mockTransfer)).rejects.toThrow(errorMessage);
    });

    it("should handle server error without error message", async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: jest.fn().mockResolvedValueOnce({}),
      });

      await expect(deleteTransfer(mockTransfer)).rejects.toThrow(
        "HTTP 400",
      );
    });

    it("should handle malformed error response", async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: jest.fn().mockRejectedValueOnce(new Error("Invalid JSON")),
      });

      await expect(deleteTransfer(mockTransfer)).rejects.toThrow(
        "HTTP 400",
      );
    });

    it("should handle empty error message gracefully", async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: jest.fn().mockResolvedValueOnce({ response: [] }),
      });

      await expect(deleteTransfer(mockTransfer)).rejects.toThrow(
        "HTTP 400",
      );
    });

    it("should handle network errors", async () => {
      global.fetch = simulateNetworkError();

      await expect(deleteTransfer(mockTransfer)).rejects.toThrow(
        "Network error",
      );
    });

    it("should handle fetch rejection", async () => {
      global.fetch = jest
        .fn()
        .mockRejectedValueOnce(new Error("Connection failed"));

      await expect(deleteTransfer(mockTransfer)).rejects.toThrow(
        "Connection failed",
      );
    });
  });

  describe("Edge cases", () => {
    it("should handle transfer with zero ID", async () => {
      const transferWithZeroId = createTestTransfer({ transferId: 0 });
      global.fetch = createModernFetchMock(null, { status: 204 });

      await deleteTransfer(transferWithZeroId);

      expect(global.fetch).toHaveBeenCalledWith(
        "/api/transfer/0",
        expect.any(Object),
      );
    });

    it("should handle transfer with negative ID", async () => {
      const transferWithNegativeId = createTestTransfer({ transferId: -1 });
      global.fetch = createModernFetchMock(null, { status: 204 });

      await deleteTransfer(transferWithNegativeId);

      expect(global.fetch).toHaveBeenCalledWith(
        "/api/transfer/-1",
        expect.any(Object),
      );
    });

    it("should handle transfer with very large ID", async () => {
      const transferWithLargeId = createTestTransfer({ transferId: 999999999 });
      global.fetch = createModernFetchMock(null, { status: 204 });

      await deleteTransfer(transferWithLargeId);

      expect(global.fetch).toHaveBeenCalledWith(
        "/api/transfer/999999999",
        expect.any(Object),
      );
    });
  });

  describe("Response parsing", () => {
    it("should handle JSON response correctly", async () => {
      const jsonResponse = {
        message: "Transfer deleted successfully",
        transferId: mockTransfer.transferId,
        affectedAccounts: [
          mockTransfer.sourceAccount,
          mockTransfer.destinationAccount,
        ],
        timestamp: "2024-01-01T00:00:00Z",
      };
      global.fetch = createModernFetchMock(jsonResponse, { status: 200 });

      const result = await deleteTransfer(mockTransfer);

      expect(result).toEqual(jsonResponse);
    });

    it("should handle empty JSON response", async () => {
      global.fetch = createModernFetchMock({}, { status: 200 });

      const result = await deleteTransfer(mockTransfer);

      expect(result).toEqual({});
    });

    it("should return transfer data from JSON response", async () => {
      global.fetch = createModernFetchMock(mockTransfer, { status: 200 });

      const result = await deleteTransfer(mockTransfer);

      expect(result).toEqual(mockTransfer);
    });

    it("should handle complex JSON response with transfer details", async () => {
      const complexResponse = {
        transfer: mockTransfer,
        sourceAccountBalance: 1500.0,
        destinationAccountBalance: 2000.0,
        reconciliationStatus: "pending",
        metadata: {
          deletedAt: "2024-01-01T10:30:00Z",
          deletedBy: "user456",
          reversalRequired: false,
        },
      };
      global.fetch = createModernFetchMock(complexResponse, { status: 200 });

      const result = await deleteTransfer(mockTransfer);

      expect(result).toEqual(complexResponse);
    });
  });

  describe("HTTP headers and credentials", () => {
    it("should include correct headers in request", async () => {
      global.fetch = createModernFetchMock(null, { status: 204 });

      await deleteTransfer(mockTransfer);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }),
      );
    });

    it("should include credentials in request", async () => {
      global.fetch = createModernFetchMock(null, { status: 204 });

      await deleteTransfer(mockTransfer);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          credentials: "include",
        }),
      );
    });

    it("should use DELETE method", async () => {
      global.fetch = createModernFetchMock(null, { status: 204 });

      await deleteTransfer(mockTransfer);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: "DELETE",
        }),
      );
    });
  });

  describe("Console logging behavior", () => {
    it("should log error messages from server", async () => {
      const errorMessage = "Transfer deletion failed due to business rules";
      global.fetch = createModernErrorFetchMock(errorMessage, 400);

      await expect(deleteTransfer(mockTransfer)).rejects.toThrow();
    });

    it("should log general errors with context", async () => {
      global.fetch = simulateNetworkError();

      await expect(deleteTransfer(mockTransfer)).rejects.toThrow();
    });

    it("should not log anything for successful deletions", async () => {
      global.fetch = createModernFetchMock(null, { status: 204 });

      await deleteTransfer(mockTransfer);

    });

    it("should log different transfer-specific error types", async () => {
      const transferErrorScenarios = [
        { error: "Source account balance insufficient", status: 400 },
        { error: "Transfer already processed", status: 409 },
        { error: "Invalid transfer amount", status: 422 },
        { error: "Transfer not found", status: 404 },
        { error: "Account reconciliation in progress", status: 423 },
      ];

      for (const scenario of transferErrorScenarios) {
        jest.clearAllMocks();

        global.fetch = createModernErrorFetchMock(
          scenario.error,
          scenario.status,
        );

        await expect(deleteTransfer(mockTransfer)).rejects.toThrow(
          scenario.error,
        );
      }
    });
  });

  describe("Transfer-specific validations", () => {
    it("should handle transfer with all required fields", async () => {
      const fullTransfer = createTestTransfer({
        transferId: 123,
        sourceAccount: "primaryChecking",
        destinationAccount: "emergencySavings",
        transactionDate: new Date("2024-02-15"),
        amount: 1250.75,
        guidSource: "full-src-guid-abc",
        guidDestination: "full-dest-guid-xyz",
        activeStatus: true,
        dateAdded: new Date("2024-02-14"),
        dateUpdated: new Date("2024-02-15"),
      });

      global.fetch = createModernFetchMock(null, { status: 204 });

      const result = await deleteTransfer(fullTransfer);

      expect(result).toBeNull();
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/transfer/123",
        expect.any(Object),
      );
    });

    it("should handle transfer with minimal required fields", async () => {
      const minimalTransfer = createTestTransfer({
        transferId: 456,
        sourceAccount: "basic",
        destinationAccount: "target",
        amount: 50.0,
      });

      global.fetch = createModernFetchMock(null, { status: 204 });

      const result = await deleteTransfer(minimalTransfer);

      expect(result).toBeNull();
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/transfer/456",
        expect.any(Object),
      );
    });

    it("should handle transfer with same source and destination accounts", async () => {
      const sameAccountTransfer = createTestTransfer({
        transferId: 789,
        sourceAccount: "sharedAccount",
        destinationAccount: "sharedAccount",
        amount: 100.0,
      });

      global.fetch = createModernFetchMock(null, { status: 204 });

      const result = await deleteTransfer(sameAccountTransfer);

      expect(result).toBeNull();
    });

    it("should handle transfer with large amounts", async () => {
      const largeAmountTransfer = createTestTransfer({
        transferId: 101,
        amount: 999999.99,
      });

      global.fetch = createModernFetchMock(null, { status: 204 });

      const result = await deleteTransfer(largeAmountTransfer);

      expect(result).toBeNull();
    });

    it("should handle transfer with zero amount", async () => {
      const zeroAmountTransfer = createTestTransfer({
        transferId: 202,
        amount: 0,
      });

      global.fetch = createModernFetchMock(null, { status: 204 });

      const result = await deleteTransfer(zeroAmountTransfer);

      expect(result).toBeNull();
    });
  });

  describe("Transfer business logic edge cases", () => {
    it("should handle transfer with special account names", async () => {
      const specialAccountTransfer = createTestTransfer({
        transferId: 303,
        sourceAccount: "Account with Spaces & Special-Chars@123",
        destinationAccount: "Destination_Account.with.dots",
      });

      global.fetch = createModernFetchMock(null, { status: 204 });

      const result = await deleteTransfer(specialAccountTransfer);

      expect(result).toBeNull();
    });

    it("should handle transfer with optional GUID fields", async () => {
      const guidTransfer = createTestTransfer({
        transferId: 404,
        guidSource: "source-12345-abcde",
        guidDestination: "dest-67890-fghij",
      });

      global.fetch = createModernFetchMock(null, { status: 204 });

      const result = await deleteTransfer(guidTransfer);

      expect(result).toBeNull();
    });

    it("should handle transfer without optional GUID fields", async () => {
      const noGuidTransfer = createTestTransfer({
        transferId: 505,
        guidSource: undefined,
        guidDestination: undefined,
      });

      global.fetch = createModernFetchMock(null, { status: 204 });

      const result = await deleteTransfer(noGuidTransfer);

      expect(result).toBeNull();
    });
  });
});
