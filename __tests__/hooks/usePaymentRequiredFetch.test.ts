import { fetchPaymentRequiredData } from "../../hooks/usePaymentRequiredFetch";
import PaymentRequired from "../../model/PaymentRequired";

jest.mock("../../utils/cacheUtils", () => ({
  QueryKeys: {
    paymentRequired: jest.fn(() => ["paymentRequired"]),
  },
}));

jest.mock("../../utils/queryConfig", () => ({
  useAuthenticatedQuery: jest.fn(),
}));

jest.mock("../../utils/logger", () => ({
  createHookLogger: jest.fn(() => ({
    debug: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
  })),
}));

const createTestPaymentRequired = (
  overrides: Partial<PaymentRequired> = {},
): PaymentRequired => ({
  accountNameOwner: "visa_john",
  accountType: "credit",
  moniker: "0001",
  outstanding: 250.0,
  future: 0.0,
  cleared: 0.0,
  ...overrides,
});

describe("usePaymentRequiredFetch - fetchPaymentRequiredData", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe("successful fetch", () => {
    it("should fetch from correct endpoint", async () => {
      const payments = [createTestPaymentRequired()];
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue(payments),
      });

      await fetchPaymentRequiredData();

      expect(global.fetch).toHaveBeenCalledWith(
        "/api/account/payment/required",
        expect.objectContaining({ method: "GET" }),
      );
    });

    it("should use GET method with credentials", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue([]),
      });

      await fetchPaymentRequiredData();

      const [, options] = (global.fetch as jest.Mock).mock.calls[0];
      expect(options.method).toBe("GET");
      expect(options.credentials).toBe("include");
    });

    it("should return array of payment required data", async () => {
      const payments = [
        createTestPaymentRequired({ accountNameOwner: "visa_john" }),
        createTestPaymentRequired({ accountNameOwner: "amex_jane" }),
      ];
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue(payments),
      });

      const result = await fetchPaymentRequiredData();

      expect(result).toStrictEqual(payments);
    });

    it("should return empty array when no payments required", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue([]),
      });

      const result = await fetchPaymentRequiredData();

      expect(result).toEqual([]);
    });

    it("should include content-type headers", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue([]),
      });

      await fetchPaymentRequiredData();

      const [, options] = (global.fetch as jest.Mock).mock.calls[0];
      expect(options.headers["Content-Type"]).toBe("application/json");
      expect(options.headers["Accept"]).toBe("application/json");
    });
  });

  describe("error handling", () => {
    it("should throw for 500 server error", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: jest.fn().mockResolvedValue({ error: "Server error" }),
      });

      await expect(fetchPaymentRequiredData()).rejects.toThrow();
    });

    it("should throw for 400 bad request", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: jest.fn().mockResolvedValue({ error: "Bad request" }),
      });

      await expect(fetchPaymentRequiredData()).rejects.toThrow();
    });

    it("should include status in error message", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 503,
        json: jest.fn().mockResolvedValue({}),
      });

      await expect(fetchPaymentRequiredData()).rejects.toThrow("503");
    });

    it("should handle network errors", async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error("Network failure"));

      await expect(fetchPaymentRequiredData()).rejects.toThrow("Network failure");
    });

    it("should handle JSON parse failure gracefully", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: jest.fn().mockRejectedValue(new Error("Invalid JSON")),
      });

      await expect(fetchPaymentRequiredData()).rejects.toThrow();
    });

    it("should throw for 401 unauthorized", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: jest.fn().mockResolvedValue({ error: "Unauthorized" }),
      });

      await expect(fetchPaymentRequiredData()).rejects.toThrow("401");
    });

    it("should throw for 403 forbidden", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 403,
        json: jest.fn().mockResolvedValue({ error: "Forbidden" }),
      });

      await expect(fetchPaymentRequiredData()).rejects.toThrow("403");
    });
  });

  describe("various payment scenarios", () => {
    it.each(["visa_john", "amex_jane", "mastercard_bob"])(
      "should fetch payment required for account '%s'",
      async (accountNameOwner) => {
        const payment = createTestPaymentRequired({ accountNameOwner });
        global.fetch = jest.fn().mockResolvedValue({
          ok: true,
          status: 200,
          json: jest.fn().mockResolvedValue([payment]),
        });

        const result = await fetchPaymentRequiredData();

        expect(result[0].accountNameOwner).toBe(accountNameOwner);
      },
    );
  });
});
