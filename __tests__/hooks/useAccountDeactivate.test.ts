import React from "react";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import useAccountDeactivate, { deactivateAccount } from "../../hooks/useAccountDeactivate";
import Account from "../../model/Account";

jest.mock("../../utils/fetchUtils", () => ({
  fetchWithErrorHandling: jest.fn(),
  parseResponse: jest.fn(),
  FetchError: class FetchError extends Error {
    constructor(
      message: string,
      public status?: number,
    ) {
      super(message);
      this.name = "FetchError";
    }
  },
}));

jest.mock("../../utils/validation/sanitization", () => ({
  InputSanitizer: {
    sanitizeAccountName: jest.fn((value: string) => value),
  },
}));

jest.mock("../../utils/hookValidation", () => ({
  validateDelete: jest.fn(),
  HookValidationError: class HookValidationError extends Error {
    constructor(message: string) {
      super(message);
      this.name = "HookValidationError";
    }
  },
}));

jest.mock("../../utils/cacheUtils", () => ({
  QueryKeys: {
    account: jest.fn(() => ["account"]),
  },
  updateInList: jest.fn(),
}));

jest.mock("../../utils/logger", () => ({
  createHookLogger: jest.fn(() => ({
    debug: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
  })),
}));

import { fetchWithErrorHandling, parseResponse } from "../../utils/fetchUtils";
import { InputSanitizer } from "../../utils/validation/sanitization";
import { validateDelete } from "../../utils/hookValidation";

const mockFetchWithErrorHandling = fetchWithErrorHandling as jest.MockedFunction<
  typeof fetchWithErrorHandling
>;
const mockParseResponse = parseResponse as jest.MockedFunction<
  typeof parseResponse
>;
const mockSanitizeAccountName =
  InputSanitizer.sanitizeAccountName as jest.MockedFunction<
    typeof InputSanitizer.sanitizeAccountName
  >;
const mockValidateDelete = validateDelete as jest.MockedFunction<
  typeof validateDelete
>;

const createTestAccount = (overrides: Partial<Account> = {}): Account => ({
  accountId: 1,
  accountNameOwner: "checking_john",
  accountType: "debit",
  activeStatus: true,
  moniker: "0001",
  outstanding: 0,
  future: 0,
  cleared: 0,
  ...overrides,
});

describe("useAccountDeactivate - deactivateAccount", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchWithErrorHandling.mockResolvedValue({ status: 200 } as Response);
    mockSanitizeAccountName.mockImplementation((value: string) => value);
    mockValidateDelete.mockImplementation(() => {});
  });

  describe("validation and sanitization", () => {
    it("should call validateDelete with accountNameOwner field", async () => {
      const account = createTestAccount({ accountNameOwner: "checking_john" });
      mockParseResponse.mockResolvedValue(account);

      await deactivateAccount(account);

      expect(mockValidateDelete).toHaveBeenCalledWith(
        account,
        "accountNameOwner",
        "deactivateAccount",
      );
    });

    it("should sanitize accountNameOwner before building endpoint", async () => {
      const account = createTestAccount({ accountNameOwner: "checking_john" });
      mockParseResponse.mockResolvedValue(account);

      await deactivateAccount(account);

      expect(mockSanitizeAccountName).toHaveBeenCalledWith("checking_john");
    });

    it("should use sanitized name in endpoint URL", async () => {
      mockSanitizeAccountName.mockReturnValue("sanitized_account");
      const account = createTestAccount({ accountNameOwner: "raw_account" });
      mockParseResponse.mockResolvedValue(account);

      await deactivateAccount(account);

      const [url] = mockFetchWithErrorHandling.mock.calls[0];
      expect(url).toBe("/api/account/deactivate/sanitized_account");
    });
  });

  describe("successful deactivation", () => {
    it("should call fetchWithErrorHandling with correct PUT endpoint", async () => {
      const account = createTestAccount({ accountNameOwner: "checking_john" });
      mockParseResponse.mockResolvedValue(account);

      await deactivateAccount(account);

      expect(mockFetchWithErrorHandling).toHaveBeenCalledWith(
        "/api/account/deactivate/checking_john",
        { method: "PUT" },
      );
    });

    it("should return the deactivated account", async () => {
      const account = createTestAccount({ activeStatus: false });
      mockParseResponse.mockResolvedValue(account);

      const result = await deactivateAccount(account);

      expect(result).toStrictEqual(account);
    });

    it("should call parseResponse with the fetch response", async () => {
      const mockResponse = { status: 200 } as Response;
      mockFetchWithErrorHandling.mockResolvedValue(mockResponse);
      const account = createTestAccount();
      mockParseResponse.mockResolvedValue(account);

      await deactivateAccount(account);

      expect(mockParseResponse).toHaveBeenCalledWith(mockResponse);
    });

    it("should return null when parseResponse returns null", async () => {
      mockParseResponse.mockResolvedValue(null);
      const account = createTestAccount();

      const result = await deactivateAccount(account);

      expect(result).toBeNull();
    });

    it("should deactivate checking account", async () => {
      const account = createTestAccount({ accountNameOwner: "checking_john" });
      const deactivated = { ...account, activeStatus: false };
      mockParseResponse.mockResolvedValue(deactivated);

      const result = await deactivateAccount(account);

      expect(result?.activeStatus).toBe(false);
      expect(mockFetchWithErrorHandling).toHaveBeenCalledWith(
        "/api/account/deactivate/checking_john",
        expect.any(Object),
      );
    });

    it("should deactivate savings account", async () => {
      const account = createTestAccount({
        accountNameOwner: "savings_john",
        accountType: "credit",
      });
      mockParseResponse.mockResolvedValue(account);

      await deactivateAccount(account);

      expect(mockFetchWithErrorHandling).toHaveBeenCalledWith(
        "/api/account/deactivate/savings_john",
        expect.any(Object),
      );
    });

    it("should deactivate credit card account", async () => {
      const account = createTestAccount({
        accountNameOwner: "visa_john",
        accountType: "credit",
      });
      mockParseResponse.mockResolvedValue(account);

      await deactivateAccount(account);

      expect(mockFetchWithErrorHandling).toHaveBeenCalledWith(
        "/api/account/deactivate/visa_john",
        expect.any(Object),
      );
    });
  });

  describe("error handling", () => {
    it("should propagate 404 not found error", async () => {
      const { FetchError } = jest.requireMock("../../utils/fetchUtils");
      mockFetchWithErrorHandling.mockRejectedValue(
        new FetchError("Account not found", 404),
      );
      const account = createTestAccount();

      await expect(deactivateAccount(account)).rejects.toThrow(
        "Account not found",
      );
    });

    it("should propagate 409 conflict error", async () => {
      const { FetchError } = jest.requireMock("../../utils/fetchUtils");
      mockFetchWithErrorHandling.mockRejectedValue(
        new FetchError("Cannot deactivate account with pending transactions", 409),
      );
      const account = createTestAccount();

      await expect(deactivateAccount(account)).rejects.toThrow(
        "Cannot deactivate account with pending transactions",
      );
    });

    it("should propagate 500 server error", async () => {
      const { FetchError } = jest.requireMock("../../utils/fetchUtils");
      mockFetchWithErrorHandling.mockRejectedValue(
        new FetchError("Internal server error", 500),
      );
      const account = createTestAccount();

      await expect(deactivateAccount(account)).rejects.toThrow(
        "Internal server error",
      );
    });

    it("should propagate network errors", async () => {
      mockFetchWithErrorHandling.mockRejectedValue(
        new Error("Network request failed"),
      );
      const account = createTestAccount();

      await expect(deactivateAccount(account)).rejects.toThrow(
        "Network request failed",
      );
    });

    it("should propagate validation errors from validateDelete", async () => {
      mockValidateDelete.mockImplementation(() => {
        const { HookValidationError } = jest.requireMock(
          "../../utils/hookValidation",
        );
        throw new HookValidationError("accountNameOwner is required");
      });
      const account = createTestAccount({ accountNameOwner: "" });

      await expect(deactivateAccount(account)).rejects.toThrow(
        "accountNameOwner is required",
      );
    });
  });

  describe("request format", () => {
    it("should use PUT method", async () => {
      const account = createTestAccount();
      mockParseResponse.mockResolvedValue(account);

      await deactivateAccount(account);

      const [, options] = mockFetchWithErrorHandling.mock.calls[0];
      expect(options?.method).toBe("PUT");
    });

    it("should not send a body in PUT request", async () => {
      const account = createTestAccount();
      mockParseResponse.mockResolvedValue(account);

      await deactivateAccount(account);

      const [, options] = mockFetchWithErrorHandling.mock.calls[0];
      expect(options?.body).toBeUndefined();
    });
  });

  describe("various account types", () => {
    it.each(["checking_john", "savings_jane", "visa_bob", "amex_alice"])(
      "should deactivate account '%s'",
      async (accountName) => {
        const account = createTestAccount({ accountNameOwner: accountName });
        mockParseResponse.mockResolvedValue(account);

        await deactivateAccount(account);

        expect(mockFetchWithErrorHandling).toHaveBeenCalledWith(
          `/api/account/deactivate/${accountName}`,
          expect.any(Object),
        );
      },
    );
  });
});

// ---------------------------------------------------------------------------
// renderHook tests for useAccountDeactivate default export
// ---------------------------------------------------------------------------

const createAcctDeactivateQueryClient = () =>
  new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

const createAcctDeactivateWrapper = (queryClient: QueryClient) =>
  function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  };

describe("useAccountDeactivate hook", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchWithErrorHandling.mockResolvedValue({ status: 200 } as Response);
    mockParseResponse.mockResolvedValue(createTestAccount({ activeStatus: false }));
    mockSanitizeAccountName.mockImplementation((v: string) => v);
    mockValidateDelete.mockImplementation(() => {});
  });

  it("onSuccess calls updateInList with the deactivated account", async () => {
    const queryClient = createAcctDeactivateQueryClient();
    const account = createTestAccount({ accountId: 5 });
    const deactivated = { ...account, activeStatus: false };
    mockParseResponse.mockResolvedValue(deactivated);

    const { result } = renderHook(() => useAccountDeactivate(), {
      wrapper: createAcctDeactivateWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync({ oldRow: account });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const { updateInList } = jest.requireMock("../../utils/cacheUtils");
    expect(updateInList).toHaveBeenCalledWith(
      expect.anything(),
      ["account"],
      deactivated,
      "accountId",
    );
  });

  it("onError puts mutation into error state", async () => {
    const queryClient = createAcctDeactivateQueryClient();
    mockFetchWithErrorHandling.mockRejectedValue(new Error("Deactivate failed"));

    const { result } = renderHook(() => useAccountDeactivate(), {
      wrapper: createAcctDeactivateWrapper(queryClient),
    });

    const account = createTestAccount();

    await act(async () => {
      try {
        await result.current.mutateAsync({ oldRow: account });
      } catch {
        // expected
      }
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it("onSuccess invalidates transaction and totals queries via predicate", async () => {
    const queryClient = createAcctDeactivateQueryClient();
    const account = createTestAccount({ accountId: 7 });
    mockParseResponse.mockResolvedValue({ ...account, activeStatus: false });

    // Pre-populate queries so the predicates in onSuccess are actually invoked
    queryClient.setQueryData(["transaction", "checking", "paged"], []);
    queryClient.setQueryData(["totals", "checking"], { totals: 0, totalsCleared: 0, totalsFuture: 0, totalsOutstanding: 0 });

    const invalidateSpy = jest.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useAccountDeactivate(), {
      wrapper: createAcctDeactivateWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync({ oldRow: account });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Verify both predicate-based invalidations were called
    expect(invalidateSpy).toHaveBeenCalledWith(expect.objectContaining({ predicate: expect.any(Function) }));
  });
});
