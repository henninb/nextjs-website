/**
 * Isolated tests for useValidationAmountDelete business logic
 * Tests deleteValidationAmount function without React Query overhead
 */

import {
  createModernFetchMock as createFetchMock,
  createModernErrorFetchMock as createErrorFetchMock,
  ConsoleSpy,
} from "../../testHelpers.modern";
import ValidationAmount from "../../model/ValidationAmount";
import { TransactionState } from "../../model/TransactionState";

// Extract the business logic function from useValidationAmountDelete
const deleteValidationAmount = async (
  payload: ValidationAmount,
): Promise<ValidationAmount | null> => {
  try {
    const endpoint = `/api/validation/amount/${payload.validationId}`;

    const response = await fetch(endpoint, {
      method: "DELETE",
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
        errorBody.error ||
        errorBody.errors?.join(", ") ||
        `HTTP error! Status: ${response.status}`;
      throw new Error(errorMessage);
    }

    return response.status !== 204 ? await response.json() : null;
  } catch (error: any) {
    console.error(`Error deleting validation amount: ${error.message}`);
    throw error;
  }
};

// Helper function to create test validation amount data
const createTestValidationAmount = (
  overrides: Partial<ValidationAmount> = {},
): ValidationAmount => ({
  validationId: 1,
  validationDate: new Date("2024-01-01T00:00:00.000Z"),
  accountId: 100,
  amount: 1000.0,
  transactionState: "cleared" as TransactionState,
  activeStatus: true,
  dateAdded: new Date("2024-01-01T10:00:00.000Z"),
  dateUpdated: new Date("2024-01-01T10:00:00.000Z"),
  ...overrides,
});

describe("useValidationAmountDelete Business Logic (Isolated)", () => {
  let consoleSpy: ConsoleSpy;

  beforeEach(() => {
    consoleSpy = new ConsoleSpy();
    jest.clearAllMocks();
  });

  afterEach(() => {
    consoleSpy.stop();
  });

  describe("deleteValidationAmount", () => {
    describe("Successful validation amount deletion", () => {
      it("should delete validation amount successfully with 200 response", async () => {
        const testPayload = createTestValidationAmount();

        global.fetch = createFetchMock(testPayload);

        const result = await deleteValidationAmount(testPayload);

        expect(result).toEqual(testPayload);
        expect(fetch).toHaveBeenCalledWith(
          `/api/validation/amount/${testPayload.validationId}`,
          {
            method: "DELETE",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
          },
        );
      });

      it("should delete validation amount successfully with 204 response", async () => {
        const testPayload = createTestValidationAmount();

        global.fetch = jest.fn().mockResolvedValue({
          ok: true,
          status: 204,
        });

        const result = await deleteValidationAmount(testPayload);

        expect(result).toBeNull();
        expect(fetch).toHaveBeenCalledWith(
          `/api/validation/amount/${testPayload.validationId}`,
          expect.any(Object),
        );
      });

      it("should use correct endpoint with validation ID", async () => {
        const testPayload = createTestValidationAmount({
          validationId: 12345,
        });

        global.fetch = createFetchMock(testPayload);

        await deleteValidationAmount(testPayload);

        expect(fetch).toHaveBeenCalledWith(
          "/api/validation/amount/12345",
          expect.any(Object),
        );
      });

      it("should handle deletion of different validation IDs", async () => {
        const validationIds = [1, 100, 999, 12345, 99999];

        for (const validationId of validationIds) {
          const testPayload = createTestValidationAmount({ validationId });

          global.fetch = createFetchMock(testPayload);

          await deleteValidationAmount(testPayload);

          expect(fetch).toHaveBeenCalledWith(
            `/api/validation/amount/${validationId}`,
            expect.any(Object),
          );
        }
      });
    });

    describe("API error handling", () => {
      it("should handle 400 error with error message", async () => {
        const testPayload = createTestValidationAmount();

        global.fetch = jest.fn().mockResolvedValue({
          ok: false,
          status: 400,
          json: jest.fn().mockResolvedValue({ error: "Invalid request" }),
        });
        consoleSpy.start();

        await expect(deleteValidationAmount(testPayload)).rejects.toThrow(
          "Invalid request",
        );

        const calls = consoleSpy.getCalls();
        expect(
          calls.error.some((call) =>
            call.some((arg) =>
              String(arg).includes("Error deleting validation amount:"),
            ),
          ),
        ).toBe(true);
      });

      it("should handle 404 not found error", async () => {
        const testPayload = createTestValidationAmount({
          validationId: 99999,
        });

        global.fetch = jest.fn().mockResolvedValue({
          ok: false,
          status: 404,
          json: jest
            .fn()
            .mockResolvedValue({ error: "Validation amount not found" }),
        });
        consoleSpy.start();

        await expect(deleteValidationAmount(testPayload)).rejects.toThrow(
          "Validation amount not found",
        );
      });

      it("should handle 409 conflict error", async () => {
        const testPayload = createTestValidationAmount();

        global.fetch = jest.fn().mockResolvedValue({
          ok: false,
          status: 409,
          json: jest.fn().mockResolvedValue({
            error: "Cannot delete validation amount with dependencies",
          }),
        });
        consoleSpy.start();

        await expect(deleteValidationAmount(testPayload)).rejects.toThrow(
          "Cannot delete validation amount with dependencies",
        );
      });

      it("should handle 500 server error", async () => {
        const testPayload = createTestValidationAmount();

        global.fetch = jest.fn().mockResolvedValue({
          ok: false,
          status: 500,
          json: jest.fn().mockResolvedValue({ error: "Internal server error" }),
        });
        consoleSpy.start();

        await expect(deleteValidationAmount(testPayload)).rejects.toThrow(
          "Internal server error",
        );
      });

      it("should handle error response without message", async () => {
        const testPayload = createTestValidationAmount();

        global.fetch = jest.fn().mockResolvedValue({
          ok: false,
          status: 400,
          json: jest.fn().mockResolvedValue({}),
        });
        consoleSpy.start();

        await expect(deleteValidationAmount(testPayload)).rejects.toThrow(
          "HTTP error! Status: 400",
        );
      });

      it("should handle malformed error response", async () => {
        const testPayload = createTestValidationAmount();

        global.fetch = jest.fn().mockResolvedValue({
          ok: false,
          status: 400,
          json: jest.fn().mockRejectedValue(new Error("Invalid JSON")),
        });
        consoleSpy.start();

        await expect(deleteValidationAmount(testPayload)).rejects.toThrow(
          "HTTP error! Status: 400",
        );
      });

      it("should handle network errors", async () => {
        const testPayload = createTestValidationAmount();

        global.fetch = jest.fn().mockRejectedValue(new Error("Network error"));
        consoleSpy.start();

        await expect(deleteValidationAmount(testPayload)).rejects.toThrow(
          "Network error",
        );

        const calls = consoleSpy.getCalls();
        expect(
          calls.error.some((call) =>
            call.some((arg) =>
              String(arg).includes("Error deleting validation amount:"),
            ),
          ),
        ).toBe(true);
      });
    });

    describe("Request format validation", () => {
      it("should send correct headers", async () => {
        const testPayload = createTestValidationAmount();

        global.fetch = createFetchMock(testPayload);

        await deleteValidationAmount(testPayload);

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

      it("should use DELETE method", async () => {
        const testPayload = createTestValidationAmount();

        global.fetch = createFetchMock(testPayload);

        await deleteValidationAmount(testPayload);

        expect(fetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({ method: "DELETE" }),
        );
      });

      it("should include credentials", async () => {
        const testPayload = createTestValidationAmount();

        global.fetch = createFetchMock(testPayload);

        await deleteValidationAmount(testPayload);

        expect(fetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({ credentials: "include" }),
        );
      });

      it("should use validation ID in endpoint", async () => {
        const testPayload = createTestValidationAmount({
          validationId: 54321,
        });

        global.fetch = createFetchMock(testPayload);

        await deleteValidationAmount(testPayload);

        expect(fetch).toHaveBeenCalledWith(
          "/api/validation/amount/54321",
          expect.any(Object),
        );
      });
    });

    describe("Business logic scenarios", () => {
      it("should handle deletion of cleared validation amount", async () => {
        const testPayload = createTestValidationAmount({
          transactionState: "cleared" as TransactionState,
        });

        global.fetch = createFetchMock(testPayload);

        const result = await deleteValidationAmount(testPayload);

        expect(result).toEqual(testPayload);
      });

      it("should handle deletion of outstanding validation amount", async () => {
        const testPayload = createTestValidationAmount({
          transactionState: "outstanding" as TransactionState,
        });

        global.fetch = createFetchMock(testPayload);

        const result = await deleteValidationAmount(testPayload);

        expect(result).toEqual(testPayload);
      });

      it("should handle deletion of inactive validation amount", async () => {
        const testPayload = createTestValidationAmount({
          activeStatus: false,
        });

        global.fetch = createFetchMock(testPayload);

        const result = await deleteValidationAmount(testPayload);

        expect(result).toEqual(testPayload);
      });

      it("should handle deletion of old validation amounts", async () => {
        const oldDate = new Date("2020-01-01T00:00:00.000Z");
        const testPayload = createTestValidationAmount({
          validationDate: oldDate,
        });

        global.fetch = createFetchMock(testPayload);

        const result = await deleteValidationAmount(testPayload);

        expect(result).toEqual(testPayload);
      });
    });

    describe("Edge cases", () => {
      it("should handle deletion with various response codes", async () => {
        const testPayload = createTestValidationAmount();

        // Test 200 OK with body
        global.fetch = jest.fn().mockResolvedValue({
          ok: true,
          status: 200,
          json: jest.fn().mockResolvedValue(testPayload),
        });

        let result = await deleteValidationAmount(testPayload);
        expect(result).toEqual(testPayload);

        // Test 204 No Content
        global.fetch = jest.fn().mockResolvedValue({
          ok: true,
          status: 204,
        });

        result = await deleteValidationAmount(testPayload);
        expect(result).toBeNull();
      });

      it("should handle deletion of validation amount with large ID", async () => {
        const testPayload = createTestValidationAmount({
          validationId: 999999999,
        });

        global.fetch = createFetchMock(testPayload);

        await deleteValidationAmount(testPayload);

        expect(fetch).toHaveBeenCalledWith(
          "/api/validation/amount/999999999",
          expect.any(Object),
        );
      });

      it("should handle deletion of validation amount with zero amount", async () => {
        const testPayload = createTestValidationAmount({ amount: 0 });

        global.fetch = createFetchMock(testPayload);

        const result = await deleteValidationAmount(testPayload);

        expect(result).toEqual(testPayload);
      });

      it("should handle deletion of validation amount with negative amount", async () => {
        const testPayload = createTestValidationAmount({ amount: -1000.0 });

        global.fetch = createFetchMock(testPayload);

        const result = await deleteValidationAmount(testPayload);

        expect(result).toEqual(testPayload);
      });
    });

    describe("Console logging", () => {
      it("should log API error messages", async () => {
        const testPayload = createTestValidationAmount();

        global.fetch = createErrorFetchMock("Deletion failed", 400);
        consoleSpy.start();

        try {
          await deleteValidationAmount(testPayload);
        } catch (error) {
          // Expected error
        }

        const calls = consoleSpy.getCalls();
        expect(
          calls.error.some((call) =>
            call.some((arg) =>
              String(arg).includes(
                "Error deleting validation amount: Deletion failed",
              ),
            ),
          ),
        ).toBe(true);
      });

      it("should log network errors", async () => {
        const testPayload = createTestValidationAmount();

        global.fetch = jest
          .fn()
          .mockRejectedValue(new Error("Connection failed"));
        consoleSpy.start();

        try {
          await deleteValidationAmount(testPayload);
        } catch (error) {
          // Expected error
        }

        const calls = consoleSpy.getCalls();
        expect(
          calls.error.some((call) =>
            call.some((arg) =>
              String(arg).includes(
                "Error deleting validation amount: Connection failed",
              ),
            ),
          ),
        ).toBe(true);
      });
    });
  });
});
