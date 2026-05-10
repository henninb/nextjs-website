import React from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fetchAllValidationAmounts } from "../../hooks/useValidationAmountsFetchAll";
import useValidationAmountsFetchAll from "../../hooks/useValidationAmountsFetchAll";
import ValidationAmount from "../../model/ValidationAmount";
import { TransactionState } from "../../model/TransactionState";

jest.mock("../../utils/validation/sanitization", () => ({
  InputSanitizer: {
    sanitizeAccountName: jest.fn((value: string) => value),
  },
}));

jest.mock("../../utils/cacheUtils", () => ({
  QueryKeys: {
    validationAmountAll: jest.fn((account: string) => [
      "validationAmountAll",
      account,
    ]),
  },
}));

jest.mock("../../utils/queryConfig", () =>
  jest.requireActual("../../utils/queryConfig"),
);

jest.mock("../../components/AuthProvider", () => ({
  useAuth: () => ({
    isAuthenticated: true,
    loading: false,
    user: null,
    login: jest.fn(),
    logout: jest.fn(),
  }),
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

const mockSanitizeAccountName =
  InputSanitizer.sanitizeAccountName as jest.MockedFunction<
    typeof InputSanitizer.sanitizeAccountName
  >;

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

describe("useValidationAmountsFetchAll - fetchAllValidationAmounts", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSanitizeAccountName.mockImplementation((value: string) => value);
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe("successful fetch", () => {
    it("should fetch from correct endpoint with account name", async () => {
      const amounts = [createTestValidationAmount()];
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue(amounts),
      });

      await fetchAllValidationAmounts("checking_john");

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/validation/amount/active"),
        expect.objectContaining({ method: "GET" }),
      );
    });

    it("should include accountNameOwner in query parameters", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue([]),
      });

      await fetchAllValidationAmounts("checking_john");

      const [url] = (global.fetch as jest.Mock).mock.calls[0];
      expect(url).toContain("accountNameOwner=checking_john");
    });

    it("should include transactionState=cleared in query", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue([]),
      });

      await fetchAllValidationAmounts("checking_john");

      const [url] = (global.fetch as jest.Mock).mock.calls[0];
      expect(url).toContain("transactionState=cleared");
    });

    it("should return array of validation amounts", async () => {
      const amounts = [
        createTestValidationAmount({ validationId: 1 }),
        createTestValidationAmount({ validationId: 2, amount: 2000 }),
      ];
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue(amounts),
      });

      const result = await fetchAllValidationAmounts("checking_john");

      expect(result).toStrictEqual(amounts);
    });

    it("should sanitize account name", async () => {
      mockSanitizeAccountName.mockReturnValue("sanitized_account");
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue([]),
      });

      await fetchAllValidationAmounts("raw_account");

      expect(mockSanitizeAccountName).toHaveBeenCalledWith("raw_account");
    });

    it("should use sanitized account name in URL", async () => {
      mockSanitizeAccountName.mockReturnValue("sanitized_account");
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue([]),
      });

      await fetchAllValidationAmounts("raw_account");

      const [url] = (global.fetch as jest.Mock).mock.calls[0];
      expect(url).toContain("sanitized_account");
    });

    it("should return empty array when response is not an array", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue({ data: [] }),
      });

      const result = await fetchAllValidationAmounts("checking_john");

      expect(result).toEqual([]);
    });

    it("should use GET method with credentials", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue([]),
      });

      await fetchAllValidationAmounts("checking_john");

      const [, options] = (global.fetch as jest.Mock).mock.calls[0];
      expect(options.method).toBe("GET");
      expect(options.credentials).toBe("include");
    });
  });

  describe("404 handling", () => {
    it("should return empty array for 404 response", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 404,
      });

      const result = await fetchAllValidationAmounts("checking_john");

      expect(result).toEqual([]);
    });

    it("should not throw for 404 response", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 404,
      });

      await expect(
        fetchAllValidationAmounts("new_account"),
      ).resolves.toEqual([]);
    });
  });

  describe("error handling", () => {
    it("should throw for 500 server error", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: jest.fn().mockResolvedValue({ error: "Server error" }),
      });

      await expect(
        fetchAllValidationAmounts("checking_john"),
      ).rejects.toThrow();
    });

    it("should throw for 400 bad request", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: jest.fn().mockResolvedValue({ error: "Bad request" }),
      });

      await expect(
        fetchAllValidationAmounts("checking_john"),
      ).rejects.toThrow();
    });

    it("should include status in error message", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 503,
        json: jest.fn().mockResolvedValue({}),
      });

      await expect(
        fetchAllValidationAmounts("checking_john"),
      ).rejects.toThrow("503");
    });

    it("should handle network errors", async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error("Network failure"));

      await expect(
        fetchAllValidationAmounts("checking_john"),
      ).rejects.toThrow("Network failure");
    });

    it("should handle JSON parse failure in error response gracefully", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: jest.fn().mockRejectedValue(new Error("Invalid JSON")),
      });

      await expect(
        fetchAllValidationAmounts("checking_john"),
      ).rejects.toThrow();
    });
  });

  describe("URL encoding", () => {
    it("should URL-encode special characters in account name", async () => {
      mockSanitizeAccountName.mockReturnValue("account with spaces");
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue([]),
      });

      await fetchAllValidationAmounts("account with spaces");

      const [url] = (global.fetch as jest.Mock).mock.calls[0];
      expect(url).toContain("account%20with%20spaces");
    });
  });
});

const createValidationAllQueryClient = () =>
  new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

const createValidationAllWrapper = (queryClient: QueryClient) =>
  function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  };

describe("useValidationAmountsFetchAll hook", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("returns validation amounts on successful fetch", async () => {
    const mockAmounts = [
      { validationId: 1, amount: 500, transactionState: "cleared", activeStatus: true },
    ];
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue(mockAmounts),
    });

    const queryClient = createValidationAllQueryClient();
    const { result } = renderHook(() => useValidationAmountsFetchAll("checking_john"), {
      wrapper: createValidationAllWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toStrictEqual(mockAmounts);
  });

  it("enters error state when fetch returns server error", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: jest.fn().mockResolvedValue({}),
    });

    const queryClient = createValidationAllQueryClient();
    const { result } = renderHook(() => useValidationAmountsFetchAll("checking_john"), {
      wrapper: createValidationAllWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.isError).toBe(true), { timeout: 5000 });
  });

  it("is disabled when accountNameOwner is empty", () => {
    global.fetch = jest.fn();

    const queryClient = createValidationAllQueryClient();
    const { result } = renderHook(() => useValidationAmountsFetchAll(""), {
      wrapper: createValidationAllWrapper(queryClient),
    });

    expect(global.fetch).not.toHaveBeenCalled();
    expect(result.current.isLoading).toBe(false);
  });
});
