/**
 * Isolated tests for useTransferInsert business logic
 * Tests insertTransfer function without React Query overhead
 * Using modern endpoint: POST /api/transfer
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
    validateTransfer: jest.fn(),
  },
  ValidationError: jest.fn(),
}));

import {
  createModernFetchMock,
  createModernErrorFetchMock,
} from "../../testHelpers.modern";
import Transfer from "../../model/Transfer";

import {
  overRideTransferValues,
  insertTransfer,
} from "../../hooks/useTransferInsert";
import { HookValidator } from "../../utils/hookValidation";

const mockValidateInsert = HookValidator.validateInsert as jest.Mock;

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

describe("useTransferInsert Business Logic (Isolated)", () => {

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset validation mock
    mockValidateInsert.mockImplementation((data) => data);
  });

  afterEach(() => {
  });

  describe("overRideTransferValues", () => {
    it("should preserve amount and transactionDate properties", () => {
      const testTransfer = createTestTransfer({
        amount: 1000,
        transactionDate: new Date("2024-02-15T00:00:00.000Z"),
      });

      const result = overRideTransferValues(testTransfer);

      expect(result.amount).toBe(1000);
      expect(result.transactionDate).toEqual(
        new Date("2024-02-15T00:00:00.000Z"),
      );
      expect(result.sourceAccount).toBe(testTransfer.sourceAccount);
      expect(result.destinationAccount).toBe(testTransfer.destinationAccount);
    });

    it("should handle undefined amount gracefully", () => {
      const testTransfer = createTestTransfer({ amount: undefined as any });

      const result = overRideTransferValues(testTransfer);

      expect(result.amount).toBeUndefined();
      expect(result.transactionDate).toBeDefined();
    });

    it("should handle undefined transactionDate gracefully", () => {
      const testTransfer = createTestTransfer({
        transactionDate: undefined as any,
      });

      const result = overRideTransferValues(testTransfer);

      expect(result.amount).toBeDefined();
      expect(result.transactionDate).toBeUndefined();
    });

    it("should preserve all original properties through spread", () => {
      const testTransfer = createTestTransfer({
        transferId: 99,
        sourceAccount: "special-account",
        guidSource: "special-guid",
        activeStatus: false,
      });

      const result = overRideTransferValues(testTransfer);

      expect(result.transferId).toBe(99);
      expect(result.sourceAccount).toBe("special-account");
      expect(result.guidSource).toBe("special-guid");
      expect(result.activeStatus).toBe(false);
    });

    it("should handle null payload properties", () => {
      const testTransfer = {
        ...createTestTransfer(),
        amount: null as any,
        transactionDate: null as any,
      };

      const result = overRideTransferValues(testTransfer);

      expect(result.amount).toBeNull();
      expect(result.transactionDate).toBeNull();
    });

    it("should maintain property order with amount and transactionDate first", () => {
      const testTransfer = createTestTransfer();

      const result = overRideTransferValues(testTransfer);
      const keys = Object.keys(result);

      expect(keys[0]).toBe("amount");
      expect(keys[1]).toBe("transactionDate");
    });
  });

  describe("insertTransfer", () => {
    describe("Successful transfer creation", () => {
      it("should create transfer successfully with 200 response", async () => {
        const testTransfer = createTestTransfer();
        const expectedResponse = {
          ...testTransfer,
          transferId: 42,
        };

        global.fetch = createModernFetchMock(expectedResponse);

        const result = await insertTransfer(testTransfer);

        expect(result).toEqual(expectedResponse);
        expect(fetch).toHaveBeenCalledWith("/api/transfer", {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(overRideTransferValues(testTransfer)),
        });
      });

      it("should handle 204 no content response", async () => {
        const testTransfer = createTestTransfer();
        global.fetch = createModernFetchMock(null, { status: 204 });

        const result = await insertTransfer(testTransfer);

        expect(result).toBeNull();
      });

      it("should apply override values to payload", async () => {
        const testTransfer = createTestTransfer({
          amount: 750,
          transactionDate: new Date("2024-03-01T00:00:00.000Z"),
        });

        global.fetch = createModernFetchMock({ transferId: 1 });

        await insertTransfer(testTransfer);

        const expectedPayload = overRideTransferValues(testTransfer);
        expect(fetch).toHaveBeenCalledWith(
          "/api/transfer",
          expect.objectContaining({
            body: JSON.stringify(expectedPayload),
          }),
        );
      });
    });

    describe("API error handling", () => {
      it("should handle 400 error with response message", async () => {
        const testTransfer = createTestTransfer();
        global.fetch = createModernErrorFetchMock("Invalid transfer data", 400);

        await expect(insertTransfer(testTransfer)).rejects.toThrow(
          "Invalid transfer data",
        );

      });

      it("should handle 409 conflict error for duplicate transfer", async () => {
        const testTransfer = createTestTransfer();
        global.fetch = createModernErrorFetchMock(
          "Transfer already exists",
          409,
        );

        await expect(insertTransfer(testTransfer)).rejects.toThrow(
          "Transfer already exists",
        );

      });

      it("should handle 500 server error", async () => {
        const testTransfer = createTestTransfer();
        global.fetch = createModernErrorFetchMock("Internal server error", 500);

        await expect(insertTransfer(testTransfer)).rejects.toThrow(
          "Internal server error",
        );

      });

      it("should handle error response without message", async () => {
        const testTransfer = createTestTransfer();
        global.fetch = jest.fn().mockResolvedValue({
          ok: false,
          status: 400,
          json: jest.fn().mockResolvedValue({}),
        });

        await expect(insertTransfer(testTransfer)).rejects.toThrow(
          "HTTP 400",
        );

      });

      it("should handle malformed error response", async () => {
        const testTransfer = createTestTransfer();
        global.fetch = jest.fn().mockResolvedValue({
          ok: false,
          status: 400,
          json: jest.fn().mockRejectedValue(new Error("Invalid JSON")),
        });

        await expect(insertTransfer(testTransfer)).rejects.toThrow(
          "HTTP 400",
        );

      });

      it("should handle network errors", async () => {
        const testTransfer = createTestTransfer();
        global.fetch = jest.fn().mockRejectedValue(new Error("Network error"));

        await expect(insertTransfer(testTransfer)).rejects.toThrow(
          "Network error",
        );

      });

      it("should handle timeout errors", async () => {
        const testTransfer = createTestTransfer();
        global.fetch = jest
          .fn()
          .mockRejectedValue(new Error("Request timeout"));

        await expect(insertTransfer(testTransfer)).rejects.toThrow(
          "Request timeout",
        );

      });
    });

    describe("Request format validation", () => {
      it("should send correct headers", async () => {
        const testTransfer = createTestTransfer();
        global.fetch = createModernFetchMock({ transferId: 1 });

        await insertTransfer(testTransfer);

        expect(fetch).toHaveBeenCalledWith("/api/transfer", {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: expect.any(String),
        });
      });

      it("should use correct endpoint", async () => {
        const testTransfer = createTestTransfer();
        global.fetch = createModernFetchMock({ transferId: 1 });

        await insertTransfer(testTransfer);

        expect(fetch).toHaveBeenCalledWith("/api/transfer", expect.any(Object));
      });

      it("should send POST method", async () => {
        const testTransfer = createTestTransfer();
        global.fetch = createModernFetchMock({ transferId: 1 });

        await insertTransfer(testTransfer);

        expect(fetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({ method: "POST" }),
        );
      });

      it("should include credentials", async () => {
        const testTransfer = createTestTransfer();
        global.fetch = createModernFetchMock({ transferId: 1 });

        await insertTransfer(testTransfer);

        expect(fetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({ credentials: "include" }),
        );
      });
    });

    describe("Business logic scenarios", () => {
      it("should handle inter-account transfers", async () => {
        const testTransfer = createTestTransfer({
          sourceAccount: "checking-primary",
          destinationAccount: "savings-emergency",
          amount: 2500,
        });

        global.fetch = createModernFetchMock({
          transferId: 1,
          ...testTransfer,
        });

        const result = await insertTransfer(testTransfer);

        expect(result.sourceAccount).toBe("checking-primary");
        expect(result.destinationAccount).toBe("savings-emergency");
        expect(result.amount).toBe(2500);
      });

      it("should handle small amount transfers", async () => {
        const testTransfer = createTestTransfer({ amount: 0.01 });

        global.fetch = createModernFetchMock({
          transferId: 1,
          ...testTransfer,
        });

        const result = await insertTransfer(testTransfer);

        expect(result.amount).toBe(0.01);
      });

      it("should handle large amount transfers", async () => {
        const testTransfer = createTestTransfer({ amount: 999999.99 });

        global.fetch = createModernFetchMock({
          transferId: 1,
          ...testTransfer,
        });

        const result = await insertTransfer(testTransfer);

        expect(result.amount).toBe(999999.99);
      });

      it("should handle future-dated transfers", async () => {
        const futureDate = new Date("2025-12-31T23:59:59.000Z");
        const testTransfer = createTestTransfer({
          transactionDate: futureDate,
        });

        global.fetch = createModernFetchMock({
          transferId: 1,
          ...testTransfer,
        });

        const result = await insertTransfer(testTransfer);

        expect(result.transactionDate).toEqual(futureDate);
      });

      it("should handle past-dated transfers", async () => {
        const pastDate = new Date("2023-01-01T00:00:00.000Z");
        const testTransfer = createTestTransfer({ transactionDate: pastDate });

        global.fetch = createModernFetchMock({
          transferId: 1,
          ...testTransfer,
        });

        const result = await insertTransfer(testTransfer);

        expect(result.transactionDate).toEqual(pastDate);
      });

      it("should preserve GUID associations", async () => {
        const testTransfer = createTestTransfer({
          guidSource: "abc123-def456-ghi789",
          guidDestination: "xyz987-uvw654-rst321",
        });

        global.fetch = createModernFetchMock({
          transferId: 1,
          ...testTransfer,
        });

        const result = await insertTransfer(testTransfer);

        expect(result.guidSource).toBe("abc123-def456-ghi789");
        expect(result.guidDestination).toBe("xyz987-uvw654-rst321");
      });

      it("should handle inactive status transfers", async () => {
        const testTransfer = createTestTransfer({ activeStatus: false });

        global.fetch = createModernFetchMock({
          transferId: 1,
          ...testTransfer,
        });

        const result = await insertTransfer(testTransfer);

        expect(result.activeStatus).toBe(false);
      });
    });

    describe("Edge cases", () => {
      it("should handle special characters in account names", async () => {
        const testTransfer = createTestTransfer({
          sourceAccount: "Account & Co: 2024!",
          destinationAccount: "Savings@Bank#1",
        });

        global.fetch = createModernFetchMock({
          transferId: 1,
          ...testTransfer,
        });

        const result = await insertTransfer(testTransfer);

        expect(result.sourceAccount).toBe("Account & Co: 2024!");
        expect(result.destinationAccount).toBe("Savings@Bank#1");
      });

      it("should handle unicode characters in account names", async () => {
        const testTransfer = createTestTransfer({
          sourceAccount: "账户支票 Checking",
          destinationAccount: "储蓄账户 Savings 💰",
        });

        global.fetch = createModernFetchMock({
          transferId: 1,
          ...testTransfer,
        });

        const result = await insertTransfer(testTransfer);

        expect(result.sourceAccount).toBe("账户支票 Checking");
        expect(result.destinationAccount).toBe("储蓄账户 Savings 💰");
      });

      it("should handle very long account names", async () => {
        const longAccountName = "A".repeat(500);
        const testTransfer = createTestTransfer({
          sourceAccount: longAccountName,
          destinationAccount: longAccountName,
        });

        global.fetch = createModernFetchMock({
          transferId: 1,
          ...testTransfer,
        });

        const result = await insertTransfer(testTransfer);

        expect(result.sourceAccount).toBe(longAccountName);
        expect(result.destinationAccount).toBe(longAccountName);
      });

      it("should handle zero amounts", async () => {
        const testTransfer = createTestTransfer({ amount: 0 });

        global.fetch = createModernFetchMock({
          transferId: 1,
          ...testTransfer,
        });

        const result = await insertTransfer(testTransfer);

        expect(result.amount).toBe(0);
      });

      it("should handle decimal precision amounts", async () => {
        const testTransfer = createTestTransfer({ amount: 123.456789 });

        global.fetch = createModernFetchMock({
          transferId: 1,
          ...testTransfer,
        });

        const result = await insertTransfer(testTransfer);

        expect(result.amount).toBe(123.456789);
      });
    });

    describe("Integration scenarios", () => {
      it("should handle complete successful transfer flow", async () => {
        const testTransfer = createTestTransfer({
          sourceAccount: "primary-checking",
          destinationAccount: "emergency-savings",
          amount: 1500,
          transactionDate: new Date("2024-06-15T14:30:00.000Z"),
        });

        const expectedResponse = {
          transferId: 123,
          sourceAccount: "primary-checking",
          destinationAccount: "emergency-savings",
          amount: 1500,
          transactionDate: new Date("2024-06-15T14:30:00.000Z"),
          guidSource: "generated-source-guid",
          guidDestination: "generated-dest-guid",
          activeStatus: true,
          dateAdded: new Date("2024-06-15T14:35:00.000Z"),
          dateUpdated: new Date("2024-06-15T14:35:00.000Z"),
        };

        global.fetch = createModernFetchMock(expectedResponse);

        const result = await insertTransfer(testTransfer);

        expect(result).toEqual(expectedResponse);
        expect(result.transferId).toBe(123);
        expect(result.amount).toBe(1500);
      });

      it("should handle transfer validation to API error chain", async () => {
        const testTransfer = createTestTransfer();

        // API returns validation error
        global.fetch = createModernErrorFetchMock(
          "Insufficient funds in source account",
          400,
        );

        await expect(insertTransfer(testTransfer)).rejects.toThrow(
          "Insufficient funds in source account",
        );

      });

      it("should handle duplicate transfer detection", async () => {
        const testTransfer = createTestTransfer();

        // API returns duplicate error
        global.fetch = createModernErrorFetchMock(
          "Transfer with same details already exists",
          409,
        );

        await expect(insertTransfer(testTransfer)).rejects.toThrow(
          "Transfer with same details already exists",
        );

      });
    });
  });
});
