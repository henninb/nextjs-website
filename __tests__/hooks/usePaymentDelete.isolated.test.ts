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
    it("should delete payment successfully", async () => {
      const responseData = { ...mockPayment };
      global.fetch = createFetchMock(responseData, { status: 200 });

      const result = await deletePayment(mockPayment);

      expect(result).toEqual(responseData);
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/payment/1",
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

    it("should return payment data from response", async () => {
      const responseData = { ...mockPayment };
      global.fetch = createFetchMock(responseData, { status: 200 });

      const result = await deletePayment(mockPayment);

      expect(result).toEqual(responseData);
    });

    it("should construct correct endpoint URL with payment ID", async () => {
      const paymentWithDifferentId = createTestPayment({ paymentId: 123 });
      const responseData = { ...paymentWithDifferentId };
      global.fetch = createFetchMock(responseData, { status: 200 });

      await deletePayment(paymentWithDifferentId);

      expect(global.fetch).toHaveBeenCalledWith(
        "/api/payment/123",
        expect.any(Object),
      );
    });
  });

  describe("Error handling", () => {
    it("should handle server error with error message", async () => {
      const errorMessage = "Cannot delete payment with pending transactions";
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: jest.fn().mockResolvedValueOnce({ error: errorMessage }),
      });

      await expect(deletePayment(mockPayment)).rejects.toThrow(errorMessage);
      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.stringContaining("Failed to delete payment:"),
      );
    });

    it("should handle server error without error message", async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: jest.fn().mockResolvedValueOnce({}),
      });

      await expect(deletePayment(mockPayment)).rejects.toThrow(
        "HTTP error! Status: 400",
      );
      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.stringContaining("Failed to delete payment:"),
      );
    });

    it("should handle malformed error response", async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: jest.fn().mockRejectedValueOnce(new Error("Invalid JSON")),
      });

      await expect(deletePayment(mockPayment)).rejects.toThrow(
        "HTTP error! Status: 400",
      );
      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.stringContaining("Failed to delete payment:"),
      );
    });

    it("should handle empty error message gracefully", async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: jest.fn().mockResolvedValueOnce({}),
      });

      await expect(deletePayment(mockPayment)).rejects.toThrow(
        "HTTP error! Status: 400",
      );
      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.stringContaining("Failed to delete payment:"),
      );
    });

    it("should handle network errors", async () => {
      global.fetch = simulateNetworkError();

      await expect(deletePayment(mockPayment)).rejects.toThrow("Network error");
      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.stringContaining("An error occurred:"),
      );
    });

    it("should handle fetch rejection", async () => {
      global.fetch = jest
        .fn()
        .mockRejectedValueOnce(new Error("Connection failed"));

      await expect(deletePayment(mockPayment)).rejects.toThrow(
        "Connection failed",
      );
      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.stringContaining("An error occurred:"),
      );
    });
  });

  describe("Edge cases", () => {
    it("should handle payment with zero ID", async () => {
      const paymentWithZeroId = createTestPayment({ paymentId: 0 });
      const responseData = { ...paymentWithZeroId };
      global.fetch = createFetchMock(responseData, { status: 200 });

      await deletePayment(paymentWithZeroId);

      expect(global.fetch).toHaveBeenCalledWith(
        "/api/payment/0",
        expect.any(Object),
      );
    });

    it("should handle payment with negative ID", async () => {
      const paymentWithNegativeId = createTestPayment({ paymentId: -1 });
      const responseData = { ...paymentWithNegativeId };
      global.fetch = createFetchMock(responseData, { status: 200 });

      await deletePayment(paymentWithNegativeId);

      expect(global.fetch).toHaveBeenCalledWith(
        "/api/payment/-1",
        expect.any(Object),
      );
    });

    it("should handle payment with very large ID", async () => {
      const paymentWithLargeId = createTestPayment({ paymentId: 999999999 });
      const responseData = { ...paymentWithLargeId };
      global.fetch = createFetchMock(responseData, { status: 200 });

      await deletePayment(paymentWithLargeId);

      expect(global.fetch).toHaveBeenCalledWith(
        "/api/payment/999999999",
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

    it("should return JSON response", async () => {
      const responseData = { ...mockPayment };
      global.fetch = createFetchMock(responseData, { status: 200 });

      const result = await deletePayment(mockPayment);

      expect(result).toEqual(responseData);
    });
  });

  describe("HTTP headers and credentials", () => {
    it("should include correct headers in request", async () => {
      const responseData = { ...mockPayment };
      global.fetch = createFetchMock(responseData, { status: 200 });

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
      const responseData = { ...mockPayment };
      global.fetch = createFetchMock(responseData, { status: 200 });

      await deletePayment(mockPayment);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          credentials: "include",
        }),
      );
    });

    it("should use DELETE method", async () => {
      const responseData = { ...mockPayment };
      global.fetch = createFetchMock(responseData, { status: 200 });

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
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: jest.fn().mockResolvedValueOnce({ error: errorMessage }),
      });

      await expect(deletePayment(mockPayment)).rejects.toThrow();
      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.stringContaining("Failed to delete payment:"),
      );
    });

    it("should log general errors with context", async () => {
      global.fetch = simulateNetworkError();

      await expect(deletePayment(mockPayment)).rejects.toThrow();
      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.stringContaining("An error occurred:"),
      );
    });

    it("should not log anything for successful deletions", async () => {
      const responseData = { ...mockPayment };
      global.fetch = createFetchMock(responseData, { status: 200 });

      await deletePayment(mockPayment);

      expect(mockConsole.log).not.toHaveBeenCalled();
      expect(mockConsole.error).not.toHaveBeenCalled();
      expect(mockConsole.warn).not.toHaveBeenCalled();
    });
  });
});
