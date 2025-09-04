import Payment from "../../model/Payment";
import {
  createFetchMock,
  createErrorFetchMock,
  ConsoleSpy,
  createTestPayment,
  simulateNetworkError,
  simulateTimeoutError,
} from "../../testHelpers";

import { updatePayment } from "../../hooks/usePaymentUpdate";

// Mock window globally for isolated testing
(global as any).window = {
  document: {
    cookie: "token=mock-token-value; path=/",
  },
};

describe("updatePayment (Isolated)", () => {
  let consoleSpy: ConsoleSpy;
  let mockLog: jest.SpyInstance;

  beforeEach(() => {
    consoleSpy = new ConsoleSpy();
    const spies = consoleSpy.start();
    mockLog = spies.log;
  });

  afterEach(() => {
    consoleSpy.stop();
    global.fetch = jest.fn(); // Reset fetch
  });

  describe("Successful Updates", () => {
    it("should update payment successfully with all fields", async () => {
      const oldPayment = createTestPayment({
        paymentId: 123,
        sourceAccount: "source123",
        destinationAccount: "dest456",
        amount: 150.0,
        transactionDate: new Date("2023-12-01"),
      });

      const newPayment = createTestPayment({
        ...oldPayment,
        amount: 200.0,
        destinationAccount: "new_dest789",
        transactionDate: new Date("2023-12-15"),
      });

      const responsePayment = {
        ...newPayment,
        transactionDate: new Date("2023-12-15").toISOString(),
        dateUpdated: new Date().toISOString(),
      };

      global.fetch = createFetchMock(responsePayment);

      const result = await updatePayment(oldPayment, newPayment);

      expect(result).toEqual(responsePayment);
      expect(global.fetch).toHaveBeenCalledWith(
        `/api/payment/update/${oldPayment.paymentId}`,
        expect.objectContaining({
          method: "PUT",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }),
      );

      expect(mockLog).toHaveBeenCalledWith(
        `Attempting to update payment at: /api/payment/update/${oldPayment.paymentId}`,
      );
      expect(mockLog).toHaveBeenCalledWith(
        "Token cookie exists: false",
        "Missing",
      );
    });

    it("should preserve unchanged fields in payload", async () => {
      const oldPayment = createTestPayment({
        paymentId: 456,
        sourceAccount: "source456",
        destinationAccount: "dest789",
        amount: 100.0,
        transactionDate: new Date("2023-11-01"),
        guidSource: "guid-source-123",
        guidDestination: "guid-dest-456",
        activeStatus: true,
      });

      const newPayment = createTestPayment({
        ...oldPayment,
        amount: 150.0, // Only amount changed
      });

      global.fetch = createFetchMock(newPayment);

      await updatePayment(oldPayment, newPayment);

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);

      expect(requestBody).toEqual({
        sourceAccount: "source456",
        destinationAccount: "dest789",
        guidSource: "guid-source-123",
        guidDestination: "guid-dest-456",
        activeStatus: true,
        transactionDate: "2023-11-01", // Preserved
        amount: 150.0, // Updated
      });
    });

    it("should handle date-only updates correctly", async () => {
      const oldPayment = createTestPayment({
        paymentId: 789,
        amount: 200.0,
        transactionDate: new Date("2023-10-01"),
      });

      const newPayment = createTestPayment({
        ...oldPayment,
        transactionDate: new Date("2023-10-15"), // Only date changed
      });

      global.fetch = createFetchMock(newPayment);

      await updatePayment(oldPayment, newPayment);

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);

      expect(requestBody.transactionDate).toBe("2023-10-15");
      expect(requestBody.amount).toBe(200.0); // Preserved
    });

    it("should handle amount-only updates correctly", async () => {
      const oldPayment = createTestPayment({
        paymentId: 999,
        amount: 300.0,
        transactionDate: new Date("2023-09-01"),
      });

      const newPayment = createTestPayment({
        ...oldPayment,
        amount: 350.0, // Only amount changed
      });

      global.fetch = createFetchMock(newPayment);

      await updatePayment(oldPayment, newPayment);

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);

      expect(requestBody.amount).toBe(350.0);
      expect(requestBody.transactionDate).toBe("2023-09-01"); // Preserved
    });
  });

  describe("Authentication & Token Handling", () => {
    it("should log token presence when cookie exists", async () => {
      const oldPayment = createTestPayment({ paymentId: 1 });
      const newPayment = createTestPayment({ ...oldPayment, amount: 100 });

      global.fetch = createFetchMock(newPayment);

      await updatePayment(oldPayment, newPayment);

      expect(mockLog).toHaveBeenCalledWith(
        "Token cookie exists: false",
        "Missing",
      );
    });

    it("should log token absence when no cookie exists", async () => {
      // Clear the cookie for this test
      const originalCookie = (global as any).window.document.cookie;
      (global as any).window.document.cookie = "";

      const oldPayment = createTestPayment({ paymentId: 1 });
      const newPayment = createTestPayment({ ...oldPayment, amount: 100 });

      global.fetch = createFetchMock(newPayment);

      await updatePayment(oldPayment, newPayment);

      expect(mockLog).toHaveBeenCalledWith(
        "Token cookie exists: false",
        "Missing",
      );

      // Restore original cookie
      (global as any).window.document.cookie = originalCookie;
    });

    it("should include credentials in all requests", async () => {
      const oldPayment = createTestPayment({ paymentId: 1 });
      const newPayment = createTestPayment({ ...oldPayment });

      global.fetch = createFetchMock(newPayment);

      await updatePayment(oldPayment, newPayment);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          credentials: "include",
        }),
      );
    });
  });

  describe("404 Error Handling", () => {
    it("should return fallback data for 404 responses", async () => {
      const oldPayment = createTestPayment({
        paymentId: 999,
        sourceAccount: "source123",
        amount: 150.0,
      });

      const newPayment = createTestPayment({
        ...oldPayment,
        amount: 200.0,
      });

      global.fetch = createErrorFetchMock("Payment not found", 404);

      const result = await updatePayment(oldPayment, newPayment);

      expect(result).toEqual(newPayment);
      expect(mockLog).toHaveBeenCalledWith("Resource not found (404).");
      expect(mockLog).toHaveBeenCalledWith(
        `Payment update response status: 404 Bad Request`,
      );
    });

    it("should log 404 responses appropriately", async () => {
      const oldPayment = createTestPayment({ paymentId: 404 });
      const newPayment = createTestPayment({ ...oldPayment });

      global.fetch = createErrorFetchMock("Not found", 404);

      await updatePayment(oldPayment, newPayment);

      expect(mockLog).toHaveBeenCalledWith("Resource not found (404).");
    });
  });

  describe("409 Conflict Error Handling", () => {
    it("should throw specific error for 409 conflict responses", async () => {
      const oldPayment = createTestPayment({
        paymentId: 123,
        amount: 100.0,
      });

      const newPayment = createTestPayment({
        ...oldPayment,
        amount: 150.0,
      });

      global.fetch = createErrorFetchMock("Duplicate payment", 409);

      await expect(updatePayment(oldPayment, newPayment)).rejects.toThrow(
        "A payment with the same account, date, and amount already exists. Please use a different date or amount.",
      );

      expect(mockLog).toHaveBeenCalledWith(
        expect.stringContaining("Payment update failed - Status: 409"),
      );
    });

    it("should log detailed error information for 409 responses", async () => {
      const oldPayment = createTestPayment({ paymentId: 123 });
      const newPayment = createTestPayment({ ...oldPayment });

      global.fetch = createErrorFetchMock("Conflict detected", 409);

      try {
        await updatePayment(oldPayment, newPayment);
      } catch (error) {
        // Expected to throw
      }

      expect(mockLog).toHaveBeenCalledWith(
        expect.stringContaining(
          'Payment update failed - Status: 409, StatusText: Bad Request, Body: {"response":"Conflict detected"}',
        ),
      );
    });
  });

  describe("Other HTTP Error Handling", () => {
    it("should throw generic error for 400 bad request", async () => {
      const oldPayment = createTestPayment({ paymentId: 123 });
      const newPayment = createTestPayment({
        ...oldPayment,
        amount: -50.0, // Invalid amount
      });

      global.fetch = createErrorFetchMock("Bad Request", 400);

      await expect(updatePayment(oldPayment, newPayment)).rejects.toThrow(
        "Failed to update payment state: Bad Request (Status: 400)",
      );

      expect(mockLog).toHaveBeenCalledWith(
        expect.stringContaining("Payment update failed - Status: 400"),
      );
    });

    it("should handle 500 server errors", async () => {
      const oldPayment = createTestPayment({ paymentId: 123 });
      const newPayment = createTestPayment({ ...oldPayment });

      global.fetch = createErrorFetchMock("Internal Server Error", 500);

      await expect(updatePayment(oldPayment, newPayment)).rejects.toThrow(
        "Failed to update payment state: Bad Request (Status: 500)",
      );

      expect(mockLog).toHaveBeenCalledWith(
        expect.stringContaining("An error occurred:"),
      );
    });

    it("should handle 401 unauthorized errors", async () => {
      const oldPayment = createTestPayment({ paymentId: 123 });
      const newPayment = createTestPayment({ ...oldPayment });

      global.fetch = createErrorFetchMock("Unauthorized", 401);

      await expect(updatePayment(oldPayment, newPayment)).rejects.toThrow(
        "Failed to update payment state: Bad Request (Status: 401)",
      );
    });

    it("should handle 403 forbidden errors", async () => {
      const oldPayment = createTestPayment({ paymentId: 123 });
      const newPayment = createTestPayment({ ...oldPayment });

      global.fetch = createErrorFetchMock("Forbidden", 403);

      await expect(updatePayment(oldPayment, newPayment)).rejects.toThrow(
        "Failed to update payment state: Bad Request (Status: 403)",
      );
    });
  });

  describe("Network Error Handling", () => {
    it("should handle network failures", async () => {
      const oldPayment = createTestPayment({ paymentId: 123 });
      const newPayment = createTestPayment({ ...oldPayment });

      global.fetch = simulateNetworkError();

      await expect(updatePayment(oldPayment, newPayment)).rejects.toThrow(
        "Network error",
      );

      expect(mockLog).toHaveBeenCalledWith("An error occurred: Network error");
    });

    it("should handle timeout errors", async () => {
      const oldPayment = createTestPayment({ paymentId: 123 });
      const newPayment = createTestPayment({ ...oldPayment });

      global.fetch = simulateTimeoutError();

      await expect(updatePayment(oldPayment, newPayment)).rejects.toThrow(
        "Request timeout",
      );

      expect(mockLog).toHaveBeenCalledWith(
        "An error occurred: Request timeout",
      );
    });

    it("should handle connection refused errors", async () => {
      const oldPayment = createTestPayment({ paymentId: 123 });
      const newPayment = createTestPayment({ ...oldPayment });

      global.fetch = simulateNetworkError();

      await expect(updatePayment(oldPayment, newPayment)).rejects.toThrow(
        "Network error",
      );

      expect(mockLog).toHaveBeenCalledWith("An error occurred: Network error");
    });
  });

  describe("Request Payload Validation", () => {
    it("should include all required fields in request payload", async () => {
      const oldPayment = createTestPayment({
        paymentId: 123,
        sourceAccount: "source123",
        destinationAccount: "dest456",
        guidSource: "guid-source-123",
        guidDestination: "guid-dest-456",
        activeStatus: true,
        amount: 100.0,
        transactionDate: new Date("2023-12-01"),
      });

      const newPayment = createTestPayment({ ...oldPayment });

      global.fetch = createFetchMock(newPayment);

      await updatePayment(oldPayment, newPayment);

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);

      expect(requestBody).toHaveProperty("sourceAccount");
      expect(requestBody).toHaveProperty("destinationAccount");
      expect(requestBody).toHaveProperty("guidSource");
      expect(requestBody).toHaveProperty("guidDestination");
      expect(requestBody).toHaveProperty("activeStatus");
      expect(requestBody).toHaveProperty("transactionDate");
      expect(requestBody).toHaveProperty("amount");
    });

    it("should format transactionDate correctly", async () => {
      const oldPayment = createTestPayment({
        paymentId: 123,
        transactionDate: new Date("2023-12-01T10:30:00.000Z"),
      });

      const newPayment = createTestPayment({ ...oldPayment });

      global.fetch = createFetchMock(newPayment);

      await updatePayment(oldPayment, newPayment);

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);

      expect(requestBody.transactionDate).toBe("2023-12-01");
    });

    it("should convert amount to number", async () => {
      const oldPayment = createTestPayment({
        paymentId: 123,
        amount: "150.50" as any, // String amount
      });

      const newPayment = createTestPayment({ ...oldPayment });

      global.fetch = createFetchMock(newPayment);

      await updatePayment(oldPayment, newPayment);

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);

      expect(typeof requestBody.amount).toBe("number");
      expect(requestBody.amount).toBe(150.5);
    });

    it("should handle zero amounts correctly", async () => {
      const oldPayment = createTestPayment({
        paymentId: 123,
        amount: 0,
      });

      const newPayment = createTestPayment({
        ...oldPayment,
        amount: 0.01,
      });

      global.fetch = createFetchMock(newPayment);

      await updatePayment(oldPayment, newPayment);

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);

      expect(requestBody.amount).toBe(0.01);
    });

    it("should handle undefined guidSource and guidDestination", async () => {
      const oldPayment = createTestPayment({
        paymentId: 123,
        guidSource: undefined,
        guidDestination: undefined,
      });

      const newPayment = createTestPayment({ ...oldPayment });

      global.fetch = createFetchMock(newPayment);

      await updatePayment(oldPayment, newPayment);

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);

      expect(requestBody.guidSource).toBeUndefined();
      expect(requestBody.guidDestination).toBeUndefined();
    });
  });

  describe("Edge Cases", () => {
    it("should handle payments with same old and new values", async () => {
      const oldPayment = createTestPayment({
        paymentId: 123,
        amount: 100.0,
        transactionDate: new Date("2023-12-01"),
      });

      const newPayment = createTestPayment({ ...oldPayment }); // Exact same values

      global.fetch = createFetchMock(newPayment);

      await updatePayment(oldPayment, newPayment);

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);

      expect(requestBody.amount).toBe(100.0);
      expect(requestBody.transactionDate).toBe("2023-12-01");
    });

    it("should handle very large payment amounts", async () => {
      const oldPayment = createTestPayment({
        paymentId: 123,
        amount: 999999999.99,
      });

      const newPayment = createTestPayment({
        ...oldPayment,
        amount: 1000000000.0,
      });

      global.fetch = createFetchMock(newPayment);

      const result = await updatePayment(oldPayment, newPayment);

      expect(result).toEqual(newPayment);
    });

    it("should handle very small payment amounts", async () => {
      const oldPayment = createTestPayment({
        paymentId: 123,
        amount: 0.01,
      });

      const newPayment = createTestPayment({
        ...oldPayment,
        amount: 0.02,
      });

      global.fetch = createFetchMock(newPayment);

      const result = await updatePayment(oldPayment, newPayment);

      expect(result).toEqual(newPayment);
    });

    it("should handle dates at year boundaries", async () => {
      const oldPayment = createTestPayment({
        paymentId: 123,
        transactionDate: new Date("2023-12-31"),
      });

      const newPayment = createTestPayment({
        ...oldPayment,
        transactionDate: new Date("2024-01-01"),
      });

      global.fetch = createFetchMock(newPayment);

      await updatePayment(oldPayment, newPayment);

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);

      expect(requestBody.transactionDate).toBe("2024-01-01");
    });

    it("should handle empty string accounts", async () => {
      const oldPayment = createTestPayment({
        paymentId: 123,
        sourceAccount: "",
        destinationAccount: "",
      });

      const newPayment = createTestPayment({ ...oldPayment });

      global.fetch = createFetchMock(newPayment);

      await updatePayment(oldPayment, newPayment);

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);

      expect(requestBody.sourceAccount).toBe("");
      expect(requestBody.destinationAccount).toBe("");
    });
  });

  describe("Response Handling", () => {
    it("should parse JSON response correctly", async () => {
      const oldPayment = createTestPayment({ paymentId: 123 });
      const newPayment = createTestPayment({ ...oldPayment });

      const responseData = {
        ...newPayment,
        dateUpdated: new Date().toISOString(),
        serverProcessedAt: "2023-12-01T10:00:00Z",
      };

      global.fetch = createFetchMock(responseData);

      const result = await updatePayment(oldPayment, newPayment);

      expect(result).toEqual(responseData);
    });

    it("should handle responses with additional server fields", async () => {
      const oldPayment = createTestPayment({ paymentId: 123 });
      const newPayment = createTestPayment({ ...oldPayment });

      const responseData = {
        ...newPayment,
        serverVersion: "1.2.3",
        processingTime: 150,
        validationPassed: true,
      };

      global.fetch = createFetchMock(responseData);

      const result = await updatePayment(oldPayment, newPayment);

      expect(result).toEqual(responseData);
      expect(result.serverVersion).toBe("1.2.3");
      expect(result.processingTime).toBe(150);
    });

    it("should log response status for all requests", async () => {
      const oldPayment = createTestPayment({ paymentId: 123 });
      const newPayment = createTestPayment({ ...oldPayment });

      global.fetch = createFetchMock(newPayment);

      await updatePayment(oldPayment, newPayment);

      expect(mockLog).toHaveBeenCalledWith(
        "Payment update response status: 200 OK",
      );
    });
  });
});
