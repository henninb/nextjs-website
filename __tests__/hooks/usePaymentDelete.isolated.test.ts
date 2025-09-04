import Payment from "../../model/Payment";
import {
  createFetchMock,
  createErrorFetchMock,
  ConsoleSpy,
  createTestPayment,
  expectSuccessfulDeletion,
  expectValidationError,
  expectServerError,
  simulateNetworkError,
} from "../../testHelpers";

import { deletePayment } from "../../hooks/usePaymentDelete";

describe("deletePayment (Isolated)", () => {
  const mockPayment = createTestPayment({
    paymentId: 1,
    sourceAccount: "checking",
    destinationAccount: "savings",
    transactionDate: new Date("2024-01-01"),
    amount: 500.0,
    activeStatus: true,
  });

  let consoleSpy: ConsoleSpy;
  let mockConsole: any;

  beforeEach(() => {
    consoleSpy = new ConsoleSpy();
    mockConsole = consoleSpy.start();
    jest.clearAllMocks();
  });

  afterEach(() => {
    consoleSpy.stop();
  });

  describe("Successful deletion", () => {
    it("should delete payment successfully with 204 response", async () => {
      global.fetch = createFetchMock(null, { status: 204 });

      const result = await deletePayment(mockPayment);

      expect(result).toBeNull();
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/payment/delete/1",
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

    it("should return payment data for non-204 responses", async () => {
      const responseData = { ...mockPayment, deleted: true };
      global.fetch = createFetchMock(responseData, { status: 200 });

      const result = await deletePayment(mockPayment);

      expect(result).toEqual(responseData);
    });

    it("should construct correct endpoint URL with payment ID", async () => {
      const paymentWithDifferentId = createTestPayment({ paymentId: 123 });
      global.fetch = createFetchMock(null, { status: 204 });

      await deletePayment(paymentWithDifferentId);

      expect(global.fetch).toHaveBeenCalledWith(
        "/api/payment/delete/123",
        expect.any(Object),
      );
    });
  });

  describe("Error handling", () => {
    it("should handle server error with error message", async () => {
      const errorMessage = "Cannot delete payment with pending transactions";
      global.fetch = createErrorFetchMock(errorMessage, 400);

      await expect(deletePayment(mockPayment)).rejects.toThrow(errorMessage);
      expect(mockConsole.log).toHaveBeenCalledWith(errorMessage);
    });

    it("should handle server error without error message", async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: jest.fn().mockResolvedValueOnce({}),
      });

      await expect(deletePayment(mockPayment)).rejects.toThrow(
        "No error message returned.",
      );
      expect(mockConsole.log).toHaveBeenCalledWith(
        "No error message returned.",
      );
    });

    it("should handle malformed error response", async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: jest.fn().mockRejectedValueOnce(new Error("Invalid JSON")),
      });

      await expect(deletePayment(mockPayment)).rejects.toThrow(
        "Failed to parse error response: Invalid JSON",
      );
      expect(mockConsole.log).toHaveBeenCalledWith(
        "Failed to parse error response: Invalid JSON",
      );
    });

    it("should handle empty error message gracefully", async () => {
      // Use an empty array which is truthy but stringifies to empty string
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: jest.fn().mockResolvedValueOnce({ response: [] }),
      });

      await expect(deletePayment(mockPayment)).rejects.toThrow(
        "cannot throw a null value",
      );
      expect(mockConsole.log).toHaveBeenCalledWith("cannot throw a null value");
    });

    it("should handle network errors", async () => {
      global.fetch = simulateNetworkError();

      await expect(deletePayment(mockPayment)).rejects.toThrow("Network error");
      expect(mockConsole.log).toHaveBeenCalledWith(
        "An error occurred: Network error",
      );
    });

    it("should handle fetch rejection", async () => {
      global.fetch = jest
        .fn()
        .mockRejectedValueOnce(new Error("Connection failed"));

      await expect(deletePayment(mockPayment)).rejects.toThrow(
        "Connection failed",
      );
      expect(mockConsole.log).toHaveBeenCalledWith(
        "An error occurred: Connection failed",
      );
    });
  });

  describe("Edge cases", () => {
    it("should handle payment with zero ID", async () => {
      const paymentWithZeroId = createTestPayment({ paymentId: 0 });
      global.fetch = createFetchMock(null, { status: 204 });

      await deletePayment(paymentWithZeroId);

      expect(global.fetch).toHaveBeenCalledWith(
        "/api/payment/delete/0",
        expect.any(Object),
      );
    });

    it("should handle payment with negative ID", async () => {
      const paymentWithNegativeId = createTestPayment({ paymentId: -1 });
      global.fetch = createFetchMock(null, { status: 204 });

      await deletePayment(paymentWithNegativeId);

      expect(global.fetch).toHaveBeenCalledWith(
        "/api/payment/delete/-1",
        expect.any(Object),
      );
    });

    it("should handle payment with very large ID", async () => {
      const paymentWithLargeId = createTestPayment({ paymentId: 999999999 });
      global.fetch = createFetchMock(null, { status: 204 });

      await deletePayment(paymentWithLargeId);

      expect(global.fetch).toHaveBeenCalledWith(
        "/api/payment/delete/999999999",
        expect.any(Object),
      );
    });
  });

  describe("Response parsing", () => {
    it("should handle JSON response correctly", async () => {
      const jsonResponse = {
        message: "Payment deleted",
        timestamp: "2024-01-01",
      };
      global.fetch = createFetchMock(jsonResponse, { status: 200 });

      const result = await deletePayment(mockPayment);

      expect(result).toEqual(jsonResponse);
    });

    it("should handle empty JSON response", async () => {
      global.fetch = createFetchMock({}, { status: 200 });

      const result = await deletePayment(mockPayment);

      expect(result).toEqual({});
    });

    it("should prioritize 204 status over response body", async () => {
      // Even if there's a response body, 204 should return null
      const mockJson = jest.fn().mockResolvedValueOnce({ message: "ignored" });
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        status: 204,
        json: mockJson,
      });

      const result = await deletePayment(mockPayment);

      expect(result).toBeNull();
      // json() should not be called for 204 responses
      expect(mockJson).not.toHaveBeenCalled();
    });
  });

  describe("HTTP headers and credentials", () => {
    it("should include correct headers in request", async () => {
      global.fetch = createFetchMock(null, { status: 204 });

      await deletePayment(mockPayment);

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
      global.fetch = createFetchMock(null, { status: 204 });

      await deletePayment(mockPayment);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          credentials: "include",
        }),
      );
    });

    it("should use DELETE method", async () => {
      global.fetch = createFetchMock(null, { status: 204 });

      await deletePayment(mockPayment);

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
      const errorMessage = "Payment deletion failed";
      global.fetch = createErrorFetchMock(errorMessage, 400);

      await expect(deletePayment(mockPayment)).rejects.toThrow();
      expect(mockConsole.log).toHaveBeenCalledWith(errorMessage);
    });

    it("should log general errors with context", async () => {
      global.fetch = simulateNetworkError();

      await expect(deletePayment(mockPayment)).rejects.toThrow();
      expect(mockConsole.log).toHaveBeenCalledWith(
        "An error occurred: Network error",
      );
    });

    it("should not log anything for successful deletions", async () => {
      global.fetch = createFetchMock(null, { status: 204 });

      await deletePayment(mockPayment);

      expect(mockConsole.log).not.toHaveBeenCalled();
      expect(mockConsole.error).not.toHaveBeenCalled();
      expect(mockConsole.warn).not.toHaveBeenCalled();
    });
  });
});
