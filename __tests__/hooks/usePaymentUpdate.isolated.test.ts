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
        `/api/payment/${oldPayment.paymentId}`,
        expect.objectContaining({
          method: "PUT",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }),
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

      // Modern version sends complete newPayment object
      expect(requestBody.amount).toBe(150.0);
      expect(requestBody.sourceAccount).toBe("source456");
      expect(requestBody.destinationAccount).toBe("dest789");
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

      expect(requestBody.transactionDate).toContain("2023-10-15");
      expect(requestBody.amount).toBe(200.0);
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
    });
  });

  describe("Error Handling", () => {
    it("should throw error for 400 bad request", async () => {
      const oldPayment = createTestPayment({ paymentId: 123 });
      const newPayment = createTestPayment({
        ...oldPayment,
        amount: -50.0, // Invalid amount
      });

      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: jest.fn().mockResolvedValue({ error: "Bad Request" }),
      });

      await expect(updatePayment(oldPayment, newPayment)).rejects.toThrow(
        "Bad Request",
      );
    });

    it("should handle 500 server errors", async () => {
      const oldPayment = createTestPayment({ paymentId: 123 });
      const newPayment = createTestPayment({ ...oldPayment });

      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: jest.fn().mockResolvedValue({ error: "Internal Server Error" }),
      });

      await expect(updatePayment(oldPayment, newPayment)).rejects.toThrow(
        "Internal Server Error",
      );
    });

    it("should handle 401 unauthorized errors", async () => {
      const oldPayment = createTestPayment({ paymentId: 123 });
      const newPayment = createTestPayment({ ...oldPayment });

      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: jest.fn().mockResolvedValue({ error: "Unauthorized" }),
      });

      await expect(updatePayment(oldPayment, newPayment)).rejects.toThrow(
        "Unauthorized",
      );
    });

    it("should handle 403 forbidden errors", async () => {
      const oldPayment = createTestPayment({ paymentId: 123 });
      const newPayment = createTestPayment({ ...oldPayment });

      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 403,
        json: jest.fn().mockResolvedValue({ error: "Forbidden" }),
      });

      await expect(updatePayment(oldPayment, newPayment)).rejects.toThrow(
        "Forbidden",
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
    });

    it("should handle timeout errors", async () => {
      const oldPayment = createTestPayment({ paymentId: 123 });
      const newPayment = createTestPayment({ ...oldPayment });

      global.fetch = simulateTimeoutError();

      await expect(updatePayment(oldPayment, newPayment)).rejects.toThrow(
        "Request timeout",
      );
    });

    it("should handle connection refused errors", async () => {
      const oldPayment = createTestPayment({ paymentId: 123 });
      const newPayment = createTestPayment({ ...oldPayment });

      global.fetch = simulateNetworkError();

      await expect(updatePayment(oldPayment, newPayment)).rejects.toThrow(
        "Network error",
      );
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

    it("should send complete newPayment in request", async () => {
      const oldPayment = createTestPayment({
        paymentId: 123,
        transactionDate: new Date("2023-12-01T10:30:00.000Z"),
      });

      const newPayment = createTestPayment({ ...oldPayment });

      global.fetch = createFetchMock(newPayment);

      await updatePayment(oldPayment, newPayment);

      const result = await updatePayment(oldPayment, newPayment);

      expect(result).toEqual(newPayment);
      expect(global.fetch).toHaveBeenCalledWith(
        `/api/payment/123`,
        expect.objectContaining({
          method: "PUT",
        }),
      );
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
      expect(requestBody.transactionDate).toContain("2023-12-01");
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

      expect(requestBody.transactionDate).toContain("2024-01-01");
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
  });
});
