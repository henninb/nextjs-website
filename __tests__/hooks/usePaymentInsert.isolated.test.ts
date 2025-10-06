import Payment from "../../model/Payment";
import {
  createFetchMock,
  createErrorFetchMock,
  ConsoleSpy,
  createTestPayment,
  simulateNetworkError,
  createMockValidationUtils,
} from "../../testHelpers";

// Mock validation utilities
jest.mock("../../utils/validation", () => ({
  DataValidator: {
    validatePayment: jest.fn(),
  },
  hookValidators: {
    validateApiPayload: jest.fn(),
  },
  ValidationError: jest.fn(),
}));

// Mock UUID generator
jest.mock("../../utils/security/secureUUID", () => ({
  generateSecureUUID: jest.fn(),
}));

import { setupNewPayment, insertPayment } from "../../hooks/usePaymentInsert";
import { hookValidators, DataValidator } from "../../utils/validation";
import { generateSecureUUID } from "../../utils/security/secureUUID";

describe("Payment Insert Functions (Isolated)", () => {
  const mockPayment = createTestPayment({
    paymentId: 0,
    sourceAccount: "source123",
    destinationAccount: "dest456",
    transactionDate: new Date("2024-12-01"),
    amount: 150.0,
    activeStatus: true,
  });

  const mockValidateApiPayload = hookValidators.validateApiPayload as jest.Mock;
  const mockGenerateSecureUUID = generateSecureUUID as jest.Mock;
  let consoleSpy: ConsoleSpy;
  let mockConsole: any;
  let uuidCounter = 0;

  beforeEach(() => {
    consoleSpy = new ConsoleSpy();
    mockConsole = consoleSpy.start();
    jest.clearAllMocks();
    uuidCounter = 0;

    // Reset validation mocks to default success state
    mockValidateApiPayload.mockReturnValue({
      isValid: true,
      validatedData: mockPayment,
      errors: null,
    });

    // Mock UUID generation to return unique UUIDs
    mockGenerateSecureUUID.mockImplementation(() => {
      uuidCounter++;
      return Promise.resolve(`test-uuid-${uuidCounter.toString().padStart(4, "0")}-0000-0000-0000-000000000000`);
    });
  });

  afterEach(() => {
    consoleSpy.stop();
  });

  describe("setupNewPayment function", () => {
    it("should extract required payment fields", async () => {
      const inputPayment = createTestPayment({
        paymentId: 123, // Should be excluded
        sourceAccount: "test_source",
        destinationAccount: "test_dest",
        amount: 250.0,
        transactionDate: new Date("2024-01-15"),
        guidSource: "guid-source-123",
        guidDestination: "guid-dest-456",
        activeStatus: true, // Should be excluded
      });

      const result = await setupNewPayment(inputPayment);

      expect(result).toEqual({
        amount: 250.0,
        transactionDate: new Date("2024-01-15"),
        sourceAccount: "test_source",
        destinationAccount: "test_dest",
        guidSource: "guid-source-123",
        guidDestination: "guid-dest-456",
        activeStatus: true,
      });
    });

    it("should handle payment with missing optional fields and generate UUIDs", async () => {
      const minimalPayment = createTestPayment({
        sourceAccount: "source",
        destinationAccount: "dest",
        amount: 100.0,
        transactionDate: new Date("2024-01-01"),
      });

      const result = await setupNewPayment(minimalPayment);

      expect(result).toEqual({
        amount: 100.0,
        transactionDate: new Date("2024-01-01"),
        sourceAccount: "source",
        destinationAccount: "dest",
        guidSource: "test-uuid-0001-0000-0000-0000-000000000000",
        guidDestination: "test-uuid-0002-0000-0000-0000-000000000000",
        activeStatus: true,
      });
    });

    it("should handle null and undefined values and generate UUIDs", async () => {
      const paymentWithNulls = {
        ...mockPayment,
        amount: null,
        guidSource: undefined,
        guidDestination: null,
      };

      const result = await setupNewPayment(paymentWithNulls);

      expect(result).toEqual({
        amount: null,
        transactionDate: mockPayment.transactionDate,
        sourceAccount: mockPayment.sourceAccount,
        destinationAccount: mockPayment.destinationAccount,
        guidSource: "test-uuid-0001-0000-0000-0000-000000000000",
        guidDestination: "test-uuid-0002-0000-0000-0000-000000000000",
        activeStatus: true,
      });
    });
  });

  describe("insertPayment function", () => {
    beforeEach(() => {
      mockValidateApiPayload.mockReturnValue({
        isValid: true,
        validatedData: mockPayment,
      });
    });

    describe("Successful insertion", () => {
      it("should insert payment successfully", async () => {
        const mockResponse = createTestPayment({
          paymentId: 789,
          sourceAccount: "source123",
          destinationAccount: "dest456",
          amount: 150.0,
        });

        global.fetch = createFetchMock(mockResponse, { status: 201 });

        const result = await insertPayment(mockPayment);

        expect(result).toEqual(mockResponse);
        expect(global.fetch).toHaveBeenCalledWith(
          "/api/payment",
          expect.objectContaining({
            method: "POST",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
          }),
        );

        // Verify the body contains required fields (no paymentId for new inserts)
        const fetchCall = (global.fetch as jest.Mock).mock.calls[0][1];
        const bodyObj = JSON.parse(fetchCall.body);
        expect(bodyObj.paymentId).toBeUndefined();
        expect(bodyObj.amount).toBe(mockPayment.amount);
        expect(bodyObj.sourceAccount).toBe(mockPayment.sourceAccount);
        expect(bodyObj.destinationAccount).toBe(mockPayment.destinationAccount);
        expect(bodyObj.activeStatus).toBe(true);
        expect(bodyObj.guidSource).toMatch(/^test-uuid-\d{4}-0000-0000-0000-000000000000$/);
        expect(bodyObj.guidDestination).toMatch(/^test-uuid-\d{4}-0000-0000-0000-000000000000$/);
      });

      it("should handle 204 no content response", async () => {
        global.fetch = createFetchMock(null, { status: 204 });

        const result = await insertPayment(mockPayment);

        expect(result).toBeNull();
      });

      it("should use validated data from validation", async () => {
        const validatedPayment = createTestPayment({
          ...mockPayment,
          sourceAccount: "sanitized_source",
        });

        mockValidateApiPayload.mockReturnValue({
          isValid: true,
          validatedData: validatedPayment,
        });

        global.fetch = createFetchMock(validatedPayment);

        await insertPayment(mockPayment);

        // Verify the fetch was called with correct data (UUIDs will be auto-generated)
        const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
        const bodyObj = JSON.parse(fetchCall[1].body);
        expect(bodyObj.sourceAccount).toBe("sanitized_source");
        expect(bodyObj.guidSource).toMatch(/^test-uuid-\d{4}-0000-0000-0000-000000000000$/);
        expect(bodyObj.guidDestination).toMatch(/^test-uuid-\d{4}-0000-0000-0000-000000000000$/);
      });

      it("should handle different success status codes", async () => {
        const successStatuses = [200, 201];

        for (const status of successStatuses) {
          const mockResponse = createTestPayment({ paymentId: status });
          global.fetch = createFetchMock(mockResponse, { status });

          const result = await insertPayment(mockPayment);

          if (status === 204) {
            expect(result).toBeNull();
          } else {
            expect(result).toEqual(mockResponse);
          }
        }
      });
    });

    describe("Validation handling", () => {
      it("should handle validation failures", async () => {
        const validationError = { message: "Amount must be positive" };

        mockValidateApiPayload.mockReturnValue({
          isValid: false,
          errors: [validationError],
        });

        await expect(insertPayment(mockPayment)).rejects.toThrow(
          "Payment validation failed: Amount must be positive",
        );

        expect(global.fetch).not.toHaveBeenCalled();
      });

      it("should handle validation failures with multiple errors", async () => {
        const validationErrors = [
          { message: "Amount must be positive" },
          { message: "Source account is required" },
        ];

        mockValidateApiPayload.mockReturnValue({
          isValid: false,
          errors: validationErrors,
        });

        await expect(insertPayment(mockPayment)).rejects.toThrow(
          "Payment validation failed: Amount must be positive, Source account is required",
        );
      });

      it("should handle validation failures without error details", async () => {
        mockValidateApiPayload.mockReturnValue({
          isValid: false,
        });

        await expect(insertPayment(mockPayment)).rejects.toThrow(
          "Payment validation failed: Validation failed",
        );
      });

      it("should call validation with correct parameters", async () => {
        global.fetch = createFetchMock(mockPayment);

        await insertPayment(mockPayment);

        expect(mockValidateApiPayload).toHaveBeenCalledWith(
          mockPayment,
          DataValidator.validatePayment,
          "insertPayment",
        );
      });
    });

    describe("Error handling", () => {
      it("should handle server error with error message", async () => {
        const errorMessage = "Invalid payment amount";
        global.fetch = jest.fn().mockResolvedValueOnce({
          ok: false,
          status: 400,
          json: jest.fn().mockResolvedValueOnce({ error: errorMessage }),
        });

        await expect(insertPayment(mockPayment)).rejects.toThrow(errorMessage);
        expect(mockConsole.error).toHaveBeenCalledWith(
          expect.stringContaining("Failed to insert payment:"),
        );
      });

      it("should handle server error without error message", async () => {
        global.fetch = jest.fn().mockResolvedValueOnce({
          ok: false,
          status: 400,
          json: jest.fn().mockResolvedValueOnce({}),
        });

        await expect(insertPayment(mockPayment)).rejects.toThrow(
          "HTTP error! Status: 400",
        );
        expect(mockConsole.error).toHaveBeenCalledWith(
          expect.stringContaining("Failed to insert payment:"),
        );
      });

      it("should handle JSON parsing errors in error response", async () => {
        global.fetch = jest.fn().mockResolvedValueOnce({
          ok: false,
          status: 400,
          json: jest.fn().mockRejectedValueOnce(new Error("Invalid JSON")),
        });

        await expect(insertPayment(mockPayment)).rejects.toThrow(
          "HTTP error! Status: 400",
        );
        expect(mockConsole.error).toHaveBeenCalledWith(
          expect.stringContaining("Failed to insert payment:"),
        );
      });

      it("should handle empty error message gracefully", async () => {
        global.fetch = jest.fn().mockResolvedValueOnce({
          ok: false,
          status: 500,
          json: jest.fn().mockResolvedValueOnce({}),
        });

        await expect(insertPayment(mockPayment)).rejects.toThrow(
          "HTTP error! Status: 500",
        );
        expect(mockConsole.error).toHaveBeenCalledWith(
          expect.stringContaining("Failed to insert payment:"),
        );
      });

      it("should handle network errors", async () => {
        global.fetch = simulateNetworkError();

        await expect(insertPayment(mockPayment)).rejects.toThrow(
          "Network error",
        );
        expect(mockConsole.error).toHaveBeenCalledWith(
          expect.stringContaining("An error occurred:"),
        );
      });

      it("should handle various HTTP error statuses", async () => {
        const errorStatuses = [400, 401, 403, 409, 422, 500];

        for (const status of errorStatuses) {
          const errorMessage = `Error ${status}`;
          global.fetch = jest.fn().mockResolvedValueOnce({
            ok: false,
            status,
            json: jest.fn().mockResolvedValueOnce({ error: errorMessage }),
          });

          await expect(insertPayment(mockPayment)).rejects.toThrow(
            errorMessage,
          );
        }
      });
    });

    describe("Request format validation", () => {
      it("should use POST method", async () => {
        global.fetch = createFetchMock(mockPayment);

        await insertPayment(mockPayment);

        expect(global.fetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            method: "POST",
          }),
        );
      });

      it("should include credentials", async () => {
        global.fetch = createFetchMock(mockPayment);

        await insertPayment(mockPayment);

        expect(global.fetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            credentials: "include",
          }),
        );
      });

      it("should include correct headers", async () => {
        global.fetch = createFetchMock(mockPayment);

        await insertPayment(mockPayment);

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

      it("should use correct endpoint", async () => {
        global.fetch = createFetchMock(mockPayment);

        await insertPayment(mockPayment);

        expect(global.fetch).toHaveBeenCalledWith(
          "/api/payment",
          expect.any(Object),
        );
      });
    });

    describe("Response handling", () => {
      it("should return parsed JSON response", async () => {
        const responseData = createTestPayment({
          paymentId: 999,
          sourceAccount: "response_source",
          amount: 300.0,
        });
        global.fetch = createFetchMock(responseData);

        const result = await insertPayment(mockPayment);

        expect(result).toEqual(responseData);
      });

      it("should handle empty response body", async () => {
        global.fetch = createFetchMock({});

        const result = await insertPayment(mockPayment);

        expect(result).toEqual({});
      });

      it("should handle complex response data", async () => {
        const complexResponse = createTestPayment({
          ...mockPayment,
          paymentId: 123,
          additionalField: "extra data",
          metadata: { createdBy: "system" },
        });
        global.fetch = createFetchMock(complexResponse);

        const result = await insertPayment(mockPayment);

        expect(result).toEqual(complexResponse);
      });
    });

    describe("Edge cases", () => {
      it("should handle payment with all optional fields", async () => {
        const fullPayment = createTestPayment({
          paymentId: 0,
          sourceAccount: "full_source",
          destinationAccount: "full_dest",
          amount: 500.0,
          transactionDate: new Date("2024-06-15"),
          guidSource: "source-guid-123",
          guidDestination: "dest-guid-456",
          activeStatus: true,
          description: "Full payment test",
        });

        mockValidateApiPayload.mockReturnValue({
          isValid: true,
          validatedData: fullPayment,
        });

        const mockResponse = createTestPayment({ paymentId: 888 });
        global.fetch = createFetchMock(mockResponse);

        const result = await insertPayment(fullPayment);

        expect(result).toEqual(mockResponse);

        const expectedPayload = await setupNewPayment(fullPayment);
        expect(global.fetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            body: JSON.stringify(expectedPayload),
          }),
        );
      });

      it("should handle large payment amounts", async () => {
        const largePayment = createTestPayment({
          amount: 999999.99,
          sourceAccount: "large_source",
        });

        mockValidateApiPayload.mockReturnValue({
          isValid: true,
          validatedData: largePayment,
        });

        const mockResponse = createTestPayment({ paymentId: 777 });
        global.fetch = createFetchMock(mockResponse);

        const result = await insertPayment(largePayment);

        expect(result).toEqual(mockResponse);
      });

      it("should handle payment with special characters in account names", async () => {
        const specialPayment = createTestPayment({
          sourceAccount: "source & account",
          destinationAccount: "dest (special)",
        });

        mockValidateApiPayload.mockReturnValue({
          isValid: true,
          validatedData: specialPayment,
        });

        const mockResponse = createTestPayment({ paymentId: 666 });
        global.fetch = createFetchMock(mockResponse);

        const result = await insertPayment(specialPayment);

        expect(result).toEqual(mockResponse);
      });

      it("should handle null values in payment data", async () => {
        const paymentWithNulls = {
          ...mockPayment,
          guidSource: null,
          guidDestination: undefined,
        };

        mockValidateApiPayload.mockReturnValue({
          isValid: true,
          validatedData: paymentWithNulls,
        });

        global.fetch = createFetchMock(mockPayment);

        await insertPayment(paymentWithNulls);

        // Verify the fetch was called with correct data (UUIDs will be auto-generated)
        const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
        const bodyObj = JSON.parse(fetchCall[1].body);
        expect(bodyObj.amount).toBe(mockPayment.amount);
        expect(bodyObj.guidSource).toMatch(/^test-uuid-\d{4}-0000-0000-0000-000000000000$/);
        expect(bodyObj.guidDestination).toMatch(/^test-uuid-\d{4}-0000-0000-0000-000000000000$/);
      });
    });

    describe("Business logic validation", () => {
      it("should enforce validation before API call", async () => {
        const mockResponse = createTestPayment({ paymentId: 123 });
        global.fetch = createFetchMock(mockResponse);

        await insertPayment(mockPayment);

        expect(mockValidateApiPayload).toHaveBeenCalled();
        expect(global.fetch).toHaveBeenCalled();
      });

      it("should use setupNewPayment to prepare data", async () => {
        const originalPayment = createTestPayment({
          paymentId: 999, // Should be excluded by setupNewPayment
          sourceAccount: "original_source",
          destinationAccount: "original_dest",
          amount: 100.0,
          transactionDate: new Date("2024-01-01"),
          guidSource: "guid-123",
          guidDestination: "guid-456",
          activeStatus: true, // Should be excluded by setupNewPayment
        });

        mockValidateApiPayload.mockReturnValue({
          isValid: true,
          validatedData: originalPayment,
        });

        global.fetch = createFetchMock(originalPayment);

        await insertPayment(originalPayment);

        // Verify the payload was sent without paymentId
        const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
        const bodyObj = JSON.parse(fetchCall[1].body);
        expect(bodyObj.paymentId).toBeUndefined();
        expect(bodyObj.sourceAccount).toBe("original_source");
        expect(bodyObj.guidSource).toBe("guid-123");
        expect(bodyObj.guidDestination).toBe("guid-456");
      });

      it("should preserve paymentId of 0 for new payments", async () => {
        const newPayment = createTestPayment({
          paymentId: 0,
          sourceAccount: "new_source",
        });

        mockValidateApiPayload.mockReturnValue({
          isValid: true,
          validatedData: newPayment,
        });

        const responsePayment = createTestPayment({
          paymentId: 555,
          sourceAccount: "new_source",
        });
        global.fetch = createFetchMock(responsePayment);

        const result = await insertPayment(newPayment);

        expect(result.paymentId).toBe(555); // Server assigns new ID
      });
    });
  });
});
