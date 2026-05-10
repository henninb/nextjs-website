import { fetchTransactionsByAccountPaged } from "../../hooks/useTransactionByAccountFetchPaged";

jest.mock("../../utils/validation/sanitization", () => ({
  InputSanitizer: {
    sanitizeForUrl: jest.fn((value: string) => value),
  },
}));

jest.mock("../../utils/cacheUtils", () => ({
  getAccountKey: jest.fn((account: string) => ["transaction", account]),
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

import { InputSanitizer } from "../../utils/validation/sanitization";

const mockSanitizeForUrl = InputSanitizer.sanitizeForUrl as jest.MockedFunction<
  typeof InputSanitizer.sanitizeForUrl
>;

const createTestTransaction = () => ({
  guid: "test-guid-1",
  transactionDate: new Date("2024-01-01"),
  accountNameOwner: "checking_john",
  accountType: "debit" as const,
  description: "Test transaction",
  category: "groceries",
  amount: 50.0,
  transactionState: "cleared" as const,
  reoccurring: false,
  notes: "",
  activeStatus: true,
  transactionId: 1,
});

const createPageResponse = (transactions = [createTestTransaction()]) => ({
  content: transactions,
  totalElements: transactions.length,
  totalPages: 1,
  number: 0,
  size: 50,
  numberOfElements: transactions.length,
  first: true,
  last: true,
  empty: transactions.length === 0,
});

describe("useTransactionByAccountFetchPaged - fetchTransactionsByAccountPaged", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSanitizeForUrl.mockImplementation((value: string) => value);
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe("successful fetch", () => {
    it("should fetch from correct endpoint with account name", async () => {
      const page = createPageResponse();
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue(page),
      });

      await fetchTransactionsByAccountPaged("checking_john", 0, 50);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/transaction/account/select/checking_john/paged"),
        expect.objectContaining({ method: "GET" }),
      );
    });

    it("should include page and size query parameters", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue(createPageResponse()),
      });

      await fetchTransactionsByAccountPaged("checking_john", 2, 25);

      const [url] = (global.fetch as jest.Mock).mock.calls[0];
      expect(url).toContain("page=2");
      expect(url).toContain("size=25");
    });

    it("should sanitize account name", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue(createPageResponse()),
      });

      await fetchTransactionsByAccountPaged("checking_john", 0, 50);

      expect(mockSanitizeForUrl).toHaveBeenCalledWith("checking_john");
    });

    it("should use sanitized account name in URL", async () => {
      mockSanitizeForUrl.mockReturnValue("sanitized_account");
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue(createPageResponse()),
      });

      await fetchTransactionsByAccountPaged("raw_account", 0, 50);

      const [url] = (global.fetch as jest.Mock).mock.calls[0];
      expect(url).toContain("sanitized_account");
    });

    it("should return page response with transactions", async () => {
      const page = createPageResponse([createTestTransaction(), createTestTransaction()]);
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue(page),
      });

      const result = await fetchTransactionsByAccountPaged("checking_john", 0, 50);

      expect(result).toStrictEqual(page);
      expect(result?.content).toHaveLength(2);
    });

    it("should return null for 204 response", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 204,
      });

      const result = await fetchTransactionsByAccountPaged("checking_john", 0, 50);

      expect(result).toBeNull();
    });

    it("should use GET method with credentials", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue(createPageResponse()),
      });

      await fetchTransactionsByAccountPaged("checking_john", 0, 50);

      const [, options] = (global.fetch as jest.Mock).mock.calls[0];
      expect(options.method).toBe("GET");
      expect(options.credentials).toBe("include");
    });
  });

  describe("error handling", () => {
    it("should throw for non-ok response", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
      });

      await expect(
        fetchTransactionsByAccountPaged("checking_john", 0, 50),
      ).rejects.toThrow();
    });

    it("should throw for 404 not found", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: "Not Found",
      });

      await expect(
        fetchTransactionsByAccountPaged("nonexistent_account", 0, 50),
      ).rejects.toThrow();
    });

    it("should handle network errors", async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error("Network failure"));

      await expect(
        fetchTransactionsByAccountPaged("checking_john", 0, 50),
      ).rejects.toThrow("Network failure");
    });
  });

  describe("pagination", () => {
    it("should request page 0", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue(createPageResponse()),
      });

      await fetchTransactionsByAccountPaged("checking_john", 0, 50);

      const [url] = (global.fetch as jest.Mock).mock.calls[0];
      expect(url).toContain("page=0");
    });

    it("should request page 5", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue(createPageResponse()),
      });

      await fetchTransactionsByAccountPaged("checking_john", 5, 50);

      const [url] = (global.fetch as jest.Mock).mock.calls[0];
      expect(url).toContain("page=5");
    });

    it("should handle various page sizes", async () => {
      const sizes = [10, 25, 50, 100];

      for (const size of sizes) {
        global.fetch = jest.fn().mockResolvedValue({
          ok: true,
          status: 200,
          json: jest.fn().mockResolvedValue(createPageResponse()),
        });

        await fetchTransactionsByAccountPaged("checking_john", 0, size);

        const [url] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toContain(`size=${size}`);
      }
    });
  });
});
