// Mock HookValidator
jest.mock("../../utils/hookValidation", () => ({
  HookValidator: {
    validateInsert: jest.fn((data) => data),
    validateUpdate: jest.fn((newData) => newData),
    validateDelete: jest.fn(),
  },
  HookValidationError: class HookValidationError extends Error {
    constructor(message: string) {
      super(message);
      this.name = "HookValidationError";
    }
  },
}));

// Mock logger
jest.mock("../../utils/logger", () => ({
  createHookLogger: jest.fn(() => ({
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  })),
}));

import Account from "../../model/Account";
import {
  createFetchMock,
  createErrorFetchMock,
  createTestAccount,
  simulateNetworkError,
} from "../../testHelpers";

import { updateAccount } from "../../hooks/useAccountUpdate";
import { HookValidator } from "../../utils/hookValidation";


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

describe("updateAccount", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  const mockOldAccount = createTestAccount({
    accountId: 123,
    accountNameOwner: "test_account",
    accountType: "debit",
    activeStatus: true,
    moniker: "0000",
    outstanding: 100,
    future: 300,
    cleared: 200,
  });

  const mockNewAccount = createTestAccount({
    ...mockOldAccount,
    moniker: "1111",
    outstanding: 150,
  });

  const mockValidateUpdate = HookValidator.validateUpdate as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Successful updates", () => {
    it("should update account successfully", async () => {
      global.fetch = createFetchMock(mockNewAccount);

      const result = await updateAccount(mockOldAccount, mockNewAccount);

      expect(result).toStrictEqual(mockNewAccount);
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/account/test_account",
        expect.objectContaining({
          method: "PUT",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(mockNewAccount),
        }),
      );
    });

    it("should construct correct endpoint URL with account name (rename)", async () => {
      const accountWithDifferentName = createTestAccount({
        ...mockOldAccount,
        accountNameOwner: "savings_account",
      });
      global.fetch = createFetchMock(mockNewAccount);

      await updateAccount(accountWithDifferentName, mockNewAccount);

      // This is a rename from "savings_account" to "test_account"
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/account/rename?old=savings_account&new=test_account",
        expect.objectContaining({
          method: "PUT",
        }),
      );
    });

    it("should send new account data in request body", async () => {
      const updatedAccountData = createTestAccount({
        ...mockNewAccount,
        outstanding: 500,
        cleared: 750,
      });
      global.fetch = createFetchMock(updatedAccountData);

      await updateAccount(mockOldAccount, updatedAccountData);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify(updatedAccountData),
        }),
      );
    });

    it("should handle account name with special characters (rename)", async () => {
      const specialAccount = createTestAccount({
        ...mockOldAccount,
        accountNameOwner: "test & account",
      });
      global.fetch = createFetchMock(mockNewAccount);

      await updateAccount(specialAccount, mockNewAccount);

      // This is a rename from "test & account" (sanitized to "testaccount") to "test_account"
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/account/rename?old=testaccount&new=test_account",
        expect.objectContaining({
          method: "PUT",
        }),
      );
    });
  });

  describe("Error handling", () => {
    it("should handle server error responses", async () => {
      const errorMessage = "Cannot update this account";
      global.fetch = createErrorFetchMock(errorMessage, 400);

      await expect(
        updateAccount(mockOldAccount, mockNewAccount),
      ).rejects.toThrow("Cannot update this account");
    });

    it("should handle 404 errors with special logging", async () => {
      const notFoundResponse = { message: "Account not found" };
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: jest.fn().mockResolvedValueOnce(notFoundResponse),
      });

      await expect(
        updateAccount(mockOldAccount, mockNewAccount),
      ).rejects.toThrow("Account not found");
    });

    it("should handle network errors", async () => {
      global.fetch = simulateNetworkError();

      await expect(
        updateAccount(mockOldAccount, mockNewAccount),
      ).rejects.toThrow("Network error");
    });

    it("should handle JSON parsing errors in response", async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: jest.fn().mockRejectedValueOnce(new Error("Invalid JSON")),
      });

      await expect(
        updateAccount(mockOldAccount, mockNewAccount),
      ).rejects.toThrow("Invalid JSON");
    });

    it("should handle JSON parsing errors in 404 response", async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: jest.fn().mockRejectedValueOnce(new Error("Invalid JSON")),
      });

      await expect(
        updateAccount(mockOldAccount, mockNewAccount),
      ).rejects.toThrow("HTTP 404");
    });

    it("should handle various HTTP error statuses", async () => {
      const errorStatuses = [400, 401, 403, 409, 500, 502, 503];

      for (const status of errorStatuses) {
        global.fetch = createErrorFetchMock("Error occurred", status);

        await expect(
          updateAccount(mockOldAccount, mockNewAccount),
        ).rejects.toThrow("Error occurred");
      }
    });
  });

  describe("Request format validation", () => {
    it("should use PUT method", async () => {
      global.fetch = createFetchMock(mockNewAccount);

      await updateAccount(mockOldAccount, mockNewAccount);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: "PUT",
        }),
      );
    });

    it("should include credentials", async () => {
      global.fetch = createFetchMock(mockNewAccount);

      await updateAccount(mockOldAccount, mockNewAccount);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          credentials: "include",
        }),
      );
    });

    it("should include correct headers", async () => {
      global.fetch = createFetchMock(mockNewAccount);

      await updateAccount(mockOldAccount, mockNewAccount);

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

    it("should serialize new account data to JSON", async () => {
      global.fetch = createFetchMock(mockNewAccount);

      await updateAccount(mockOldAccount, mockNewAccount);

      const expectedBody = JSON.stringify(mockNewAccount);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expectedBody,
        }),
      );
    });
  });

  describe("Response handling", () => {
    it("should return parsed JSON response", async () => {
      const responseData = createTestAccount({
        ...mockNewAccount,
        accountId: 456,
        moniker: "2222",
      });
      global.fetch = createFetchMock(responseData);

      const result = await updateAccount(mockOldAccount, mockNewAccount);

      expect(result).toStrictEqual(responseData);
    });

    it("should handle empty response body", async () => {
      global.fetch = createFetchMock({});

      const result = await updateAccount(mockOldAccount, mockNewAccount);

      expect(result).toStrictEqual({});
    });

    it("should handle complex response data", async () => {
      const complexResponse = createTestAccount({
        ...mockNewAccount,
        additionalField: "extra data",
        nested: { property: "value" },
      });
      global.fetch = createFetchMock(complexResponse);

      const result = await updateAccount(mockOldAccount, mockNewAccount);

      expect(result).toStrictEqual(complexResponse);
    });
  });

  describe("Edge cases", () => {
    it("should handle account with empty account name (rename)", async () => {
      const accountWithEmptyName = createTestAccount({
        ...mockOldAccount,
        accountNameOwner: "",
      });
      global.fetch = createFetchMock(mockNewAccount);

      await updateAccount(accountWithEmptyName, mockNewAccount);

      // This is a rename operation (from "" to "test_account")
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/account/rename?old=&new=test_account",
        expect.objectContaining({
          method: "PUT",
        }),
      );
    });

    it("should handle account with null values", async () => {
      const accountWithNulls = {
        ...mockNewAccount,
        outstanding: null as any,
        future: null as any,
      };
      global.fetch = createFetchMock(mockNewAccount);

      await updateAccount(mockOldAccount, accountWithNulls);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify(accountWithNulls),
        }),
      );
    });

    it("should handle large account numbers", async () => {
      const largeAccountData = createTestAccount({
        ...mockNewAccount,
        accountId: 999999999,
        outstanding: 999999.99,
        future: -999999.99,
      });
      global.fetch = createFetchMock(largeAccountData);

      const result = await updateAccount(mockOldAccount, largeAccountData);

      expect(result).toStrictEqual(largeAccountData);
    });

    it("should handle different account types", async () => {
      const creditAccount = createTestAccount({
        ...mockOldAccount,
        accountType: "credit",
      });
      const updatedCreditAccount = createTestAccount({
        ...creditAccount,
        outstanding: -500,
      });
      global.fetch = createFetchMock(updatedCreditAccount);

      const result = await updateAccount(creditAccount, updatedCreditAccount);

      expect(result).toStrictEqual(updatedCreditAccount);
    });

    it("should handle account status changes", async () => {
      const deactivatedAccount = createTestAccount({
        ...mockNewAccount,
        activeStatus: false,
      });
      global.fetch = createFetchMock(deactivatedAccount);

      const result = await updateAccount(mockOldAccount, deactivatedAccount);

      expect(result).toStrictEqual(deactivatedAccount);
    });
  });

  describe("Rename vs Standard Update", () => {
    it("should use rename endpoint when accountNameOwner changes", async () => {
      const renamedAccount = createTestAccount({
        ...mockOldAccount,
        accountNameOwner: "renamed_account",
      });
      global.fetch = createFetchMock(renamedAccount);

      const result = await updateAccount(mockOldAccount, renamedAccount);

      expect(result).toStrictEqual(renamedAccount);
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/account/rename?old=test_account&new=renamed_account",
        expect.objectContaining({
          method: "PUT",
          credentials: "include",
        }),
      );
      // Rename endpoint doesn't send a body
      expect(global.fetch).not.toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.any(String),
        }),
      );
    });

    it("should use standard update endpoint when accountNameOwner stays the same", async () => {
      const updatedAccount = createTestAccount({
        ...mockOldAccount,
        accountNameOwner: "test_account", // Same name
        moniker: "9999",
        outstanding: 500,
      });
      global.fetch = createFetchMock(updatedAccount);

      const result = await updateAccount(mockOldAccount, updatedAccount);

      expect(result).toStrictEqual(updatedAccount);
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/account/test_account",
        expect.objectContaining({
          method: "PUT",
          body: JSON.stringify(updatedAccount),
        }),
      );
    });

    it("should use rename endpoint even when other fields also change", async () => {
      const fullyUpdatedAccount = createTestAccount({
        accountId: mockOldAccount.accountId,
        accountNameOwner: "new_account_name",
        accountType: "credit",
        activeStatus: false,
        moniker: "9999",
        outstanding: 1000,
        future: 2000,
        cleared: 3000,
      });
      global.fetch = createFetchMock(fullyUpdatedAccount);

      const result = await updateAccount(mockOldAccount, fullyUpdatedAccount);

      expect(result).toStrictEqual(fullyUpdatedAccount);
      // Since accountNameOwner changed, should use rename endpoint
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/account/rename?old=test_account&new=new_account_name",
        expect.objectContaining({
          method: "PUT",
        }),
      );
    });
  });

  describe("Business logic validation", () => {
    it("should preserve account ID in update operations", async () => {
      const updatedAccount = createTestAccount({
        ...mockNewAccount,
        accountId: mockOldAccount.accountId, // Should preserve ID
      });
      global.fetch = createFetchMock(updatedAccount);

      const result = await updateAccount(mockOldAccount, updatedAccount);

      expect(result.accountId).toBe(mockOldAccount.accountId);
    });
  });
});
