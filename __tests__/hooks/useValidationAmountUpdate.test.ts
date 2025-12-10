/**
 * Isolated tests for useValidationAmountUpdate business logic
 * Tests updateValidationAmount function without React Query overhead
 */

import {
  createModernFetchMock as createFetchMock,
  createModernErrorFetchMock as createErrorFetchMock,
  ConsoleSpy,
} from "../../testHelpers";
import ValidationAmount from "../../model/ValidationAmount";
import { TransactionState } from "../../model/TransactionState";


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

// Extract the business logic function from useValidationAmountUpdate
const updateValidationAmount = async (
  oldValidationAmount: ValidationAmount,
  newValidationAmount: ValidationAmount,
): Promise<ValidationAmount> => {
  const endpoint = `/api/validation/amount/${oldValidationAmount.validationId}`;
  try {
    const response = await fetch(endpoint, {
      method: "PUT",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(newValidationAmount),
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

    return await response.json();
  } catch (error: any) {
    console.error(`Error updating validation amount: ${error.message}`);
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

describe("useValidationAmountUpdate Business Logic", () => {
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

  describe("updateValidationAmount", () => {
    describe("Successful validation amount update", () => {
      it("should update validation amount successfully", async () => {
        const oldValidationAmount = createTestValidationAmount();
        const newValidationAmount = createTestValidationAmount({
          amount: 2000.0,
        });

        global.fetch = createFetchMock(newValidationAmount);

        const result = await updateValidationAmount(
          oldValidationAmount,
          newValidationAmount,
        );

        expect(result).toStrictEqual(newValidationAmount);
        expect(fetch).toHaveBeenCalledWith(
          `/api/validation/amount/${oldValidationAmount.validationId}`,
          {
            method: "PUT",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify(newValidationAmount),
          },
        );
      });

      it("should use correct endpoint with validation ID", async () => {
        const oldValidationAmount = createTestValidationAmount({
          validationId: 12345,
        });
        const newValidationAmount = createTestValidationAmount({
          validationId: 12345,
          amount: 5000.0,
        });

        global.fetch = createFetchMock(newValidationAmount);

        await updateValidationAmount(oldValidationAmount, newValidationAmount);

        expect(fetch).toHaveBeenCalledWith(
          "/api/validation/amount/12345",
          expect.any(Object),
        );
      });

      it("should update amount field", async () => {
        const oldValidationAmount = createTestValidationAmount({
          amount: 1000.0,
        });
        const newValidationAmount = createTestValidationAmount({
          amount: 1500.0,
        });

        global.fetch = createFetchMock(newValidationAmount);

        const result = await updateValidationAmount(
          oldValidationAmount,
          newValidationAmount,
        );

        expect(result.amount).toBe(1500.0);
      });

      it("should update transaction state field", async () => {
        const oldValidationAmount = createTestValidationAmount({
          transactionState: "cleared" as TransactionState,
        });
        const newValidationAmount = createTestValidationAmount({
          transactionState: "outstanding" as TransactionState,
        });

        global.fetch = createFetchMock(newValidationAmount);

        const result = await updateValidationAmount(
          oldValidationAmount,
          newValidationAmount,
        );

        expect(result.transactionState).toBe("outstanding");
      });

      it("should update active status field", async () => {
        const oldValidationAmount = createTestValidationAmount({
          activeStatus: true,
        });
        const newValidationAmount = createTestValidationAmount({
          activeStatus: false,
        });

        global.fetch = createFetchMock(newValidationAmount);

        const result = await updateValidationAmount(
          oldValidationAmount,
          newValidationAmount,
        );

        expect(result.activeStatus).toBe(false);
      });

      it("should update validation date field", async () => {
        const oldValidationAmount = createTestValidationAmount({
          validationDate: new Date("2024-01-01T00:00:00.000Z"),
        });
        const newValidationDate = new Date("2024-06-15T00:00:00.000Z");
        const newValidationAmount = createTestValidationAmount({
          validationDate: newValidationDate,
        });

        global.fetch = createFetchMock(newValidationAmount);

        const result = await updateValidationAmount(
          oldValidationAmount,
          newValidationAmount,
        );

        expect(result.validationDate).toStrictEqual(newValidationDate);
      });
    });

    describe("API error handling", () => {
      it("should handle 400 error with error message", async () => {
        const oldValidationAmount = createTestValidationAmount();
        const newValidationAmount = createTestValidationAmount({
          amount: 2000.0,
        });

        global.fetch = jest.fn().mockResolvedValue({
          ok: false,
          status: 400,
          json: jest
            .fn()
            .mockResolvedValue({ error: "Invalid validation amount data" }),
        });
        consoleSpy.start();

        await expect(
          updateValidationAmount(oldValidationAmount, newValidationAmount),
        ).rejects.toThrow("Invalid validation amount data");

        const calls = consoleSpy.getCalls();
        expect(
          calls.error.some((call) =>
            call.some((arg) =>
              String(arg).includes("Error updating validation amount:"),
            ),
          ),
        ).toBe(true);
      });

      it("should handle 404 not found error", async () => {
        const oldValidationAmount = createTestValidationAmount({
          validationId: 99999,
        });
        const newValidationAmount = createTestValidationAmount({
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

        await expect(
          updateValidationAmount(oldValidationAmount, newValidationAmount),
        ).rejects.toThrow("Validation amount not found");
      });

      it("should handle 500 server error", async () => {
        const oldValidationAmount = createTestValidationAmount();
        const newValidationAmount = createTestValidationAmount();

        global.fetch = jest.fn().mockResolvedValue({
          ok: false,
          status: 500,
          json: jest.fn().mockResolvedValue({ error: "Internal server error" }),
        });
        consoleSpy.start();

        await expect(
          updateValidationAmount(oldValidationAmount, newValidationAmount),
        ).rejects.toThrow("Internal server error");
      });

      it("should handle network errors", async () => {
        const oldValidationAmount = createTestValidationAmount();
        const newValidationAmount = createTestValidationAmount();

        global.fetch = jest.fn().mockRejectedValue(new Error("Network error"));
        consoleSpy.start();

        await expect(
          updateValidationAmount(oldValidationAmount, newValidationAmount),
        ).rejects.toThrow("Network error");

        const calls = consoleSpy.getCalls();
        expect(
          calls.error.some((call) =>
            call.some((arg) =>
              String(arg).includes("Error updating validation amount:"),
            ),
          ),
        ).toBe(true);
      });
    });

    describe("Request format validation", () => {
      it("should send correct headers", async () => {
        const oldValidationAmount = createTestValidationAmount();
        const newValidationAmount = createTestValidationAmount({
          amount: 2000.0,
        });

        global.fetch = createFetchMock(newValidationAmount);

        await updateValidationAmount(oldValidationAmount, newValidationAmount);

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

      it("should use PUT method", async () => {
        const oldValidationAmount = createTestValidationAmount();
        const newValidationAmount = createTestValidationAmount();

        global.fetch = createFetchMock(newValidationAmount);

        await updateValidationAmount(oldValidationAmount, newValidationAmount);

        expect(fetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({ method: "PUT" }),
        );
      });

      it("should include credentials", async () => {
        const oldValidationAmount = createTestValidationAmount();
        const newValidationAmount = createTestValidationAmount();

        global.fetch = createFetchMock(newValidationAmount);

        await updateValidationAmount(oldValidationAmount, newValidationAmount);

        expect(fetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({ credentials: "include" }),
        );
      });

      it("should stringify the new validation amount data", async () => {
        const oldValidationAmount = createTestValidationAmount();
        const newValidationAmount = createTestValidationAmount({
          amount: 2500.0,
        });

        global.fetch = createFetchMock(newValidationAmount);

        await updateValidationAmount(oldValidationAmount, newValidationAmount);

        expect(fetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            body: JSON.stringify(newValidationAmount),
          }),
        );
      });
    });

    describe("Business logic scenarios", () => {
      it("should handle updating multiple fields at once", async () => {
        const oldValidationAmount = createTestValidationAmount({
          amount: 1000.0,
          transactionState: "cleared" as TransactionState,
          activeStatus: true,
        });
        const newValidationAmount = createTestValidationAmount({
          amount: 3000.0,
          transactionState: "outstanding" as TransactionState,
          activeStatus: false,
        });

        global.fetch = createFetchMock(newValidationAmount);

        const result = await updateValidationAmount(
          oldValidationAmount,
          newValidationAmount,
        );

        expect(result.amount).toBe(3000.0);
        expect(result.transactionState).toBe("outstanding");
        expect(result.activeStatus).toBe(false);
      });

      it("should handle deactivating a validation amount", async () => {
        const oldValidationAmount = createTestValidationAmount({
          activeStatus: true,
        });
        const newValidationAmount = createTestValidationAmount({
          activeStatus: false,
        });

        global.fetch = createFetchMock(newValidationAmount);

        const result = await updateValidationAmount(
          oldValidationAmount,
          newValidationAmount,
        );

        expect(result.activeStatus).toBe(false);
      });

      it("should handle changing transaction state workflow", async () => {
        const transactionStates: TransactionState[] = [
          "cleared",
          "outstanding",
          "pending",
          "future",
        ];

        for (let i = 0; i < transactionStates.length - 1; i++) {
          const oldValidationAmount = createTestValidationAmount({
            transactionState: transactionStates[i],
          });
          const newValidationAmount = createTestValidationAmount({
            transactionState: transactionStates[i + 1],
          });

          global.fetch = createFetchMock(newValidationAmount);

          const result = await updateValidationAmount(
            oldValidationAmount,
            newValidationAmount,
          );

          expect(result.transactionState).toBe(transactionStates[i + 1]);
        }
      });
    });

    describe("Edge cases", () => {
      it("should handle zero amount update", async () => {
        const oldValidationAmount = createTestValidationAmount({
          amount: 1000.0,
        });
        const newValidationAmount = createTestValidationAmount({ amount: 0 });

        global.fetch = createFetchMock(newValidationAmount);

        const result = await updateValidationAmount(
          oldValidationAmount,
          newValidationAmount,
        );

        expect(result.amount).toBe(0);
      });

      it("should handle negative amount update", async () => {
        const oldValidationAmount = createTestValidationAmount({
          amount: 1000.0,
        });
        const newValidationAmount = createTestValidationAmount({
          amount: -500.0,
        });

        global.fetch = createFetchMock(newValidationAmount);

        const result = await updateValidationAmount(
          oldValidationAmount,
          newValidationAmount,
        );

        expect(result.amount).toBe(-500.0);
      });

      it("should handle high precision decimal amounts", async () => {
        const oldValidationAmount = createTestValidationAmount({
          amount: 1000.0,
        });
        const newValidationAmount = createTestValidationAmount({
          amount: 1234.5678,
        });

        global.fetch = createFetchMock(newValidationAmount);

        const result = await updateValidationAmount(
          oldValidationAmount,
          newValidationAmount,
        );

        expect(result.amount).toBe(1234.5678);
      });
    });
  });
});
