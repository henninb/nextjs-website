import Account from "../../model/Account";
import {
  createFetchMock,
  createErrorFetchMock,
  ConsoleSpy,
  createTestAccount,
  simulateNetworkError,
} from "../../testHelpers";

import { updateAccount } from "../../hooks/useAccountUpdate";

describe("updateAccount (Isolated)", () => {
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

  describe("Successful updates", () => {
    it("should update account successfully", async () => {
      global.fetch = createFetchMock(mockNewAccount);

      const result = await updateAccount(mockOldAccount, mockNewAccount);

      expect(result).toEqual(mockNewAccount);
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/account/update/test_account",
        expect.objectContaining({
          method: "PUT",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(mockNewAccount),
        }),
      );
    });

    it("should construct correct endpoint URL with account name", async () => {
      const accountWithDifferentName = createTestAccount({
        ...mockOldAccount,
        accountNameOwner: "savings_account",
      });
      global.fetch = createFetchMock(mockNewAccount);

      await updateAccount(accountWithDifferentName, mockNewAccount);

      expect(global.fetch).toHaveBeenCalledWith(
        "/api/account/update/savings_account",
        expect.any(Object),
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

    it("should handle account name with special characters", async () => {
      const specialAccount = createTestAccount({
        ...mockOldAccount,
        accountNameOwner: "test & account",
      });
      global.fetch = createFetchMock(mockNewAccount);

      await updateAccount(specialAccount, mockNewAccount);

      expect(global.fetch).toHaveBeenCalledWith(
        "/api/account/update/test & account",
        expect.any(Object),
      );
    });
  });

  describe("Error handling", () => {
    it("should handle server error responses", async () => {
      const errorMessage = "Cannot update this account";
      global.fetch = createErrorFetchMock(errorMessage, 400);

      await expect(
        updateAccount(mockOldAccount, mockNewAccount),
      ).rejects.toThrow("HTTP error! status: 400");
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
      ).rejects.toThrow("HTTP error! status: 404");

      expect(mockConsole.log).toHaveBeenCalledWith(
        "Resource not found (404).",
        notFoundResponse,
      );
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
      ).rejects.toThrow("Invalid JSON");
    });

    it("should handle various HTTP error statuses", async () => {
      const errorStatuses = [400, 401, 403, 409, 500, 502, 503];

      for (const status of errorStatuses) {
        global.fetch = createErrorFetchMock("Error occurred", status);

        await expect(
          updateAccount(mockOldAccount, mockNewAccount),
        ).rejects.toThrow(`HTTP error! status: ${status}`);
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

      expect(result).toEqual(responseData);
    });

    it("should handle empty response body", async () => {
      global.fetch = createFetchMock({});

      const result = await updateAccount(mockOldAccount, mockNewAccount);

      expect(result).toEqual({});
    });

    it("should handle complex response data", async () => {
      const complexResponse = createTestAccount({
        ...mockNewAccount,
        additionalField: "extra data",
        nested: { property: "value" },
      });
      global.fetch = createFetchMock(complexResponse);

      const result = await updateAccount(mockOldAccount, mockNewAccount);

      expect(result).toEqual(complexResponse);
    });
  });

  describe("Edge cases", () => {
    it("should handle account with empty account name", async () => {
      const accountWithEmptyName = createTestAccount({
        ...mockOldAccount,
        accountNameOwner: "",
      });
      global.fetch = createFetchMock(mockNewAccount);

      await updateAccount(accountWithEmptyName, mockNewAccount);

      expect(global.fetch).toHaveBeenCalledWith(
        "/api/account/update/",
        expect.any(Object),
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

      expect(result).toEqual(largeAccountData);
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

      expect(result).toEqual(updatedCreditAccount);
    });

    it("should handle account status changes", async () => {
      const deactivatedAccount = createTestAccount({
        ...mockNewAccount,
        activeStatus: false,
      });
      global.fetch = createFetchMock(deactivatedAccount);

      const result = await updateAccount(mockOldAccount, deactivatedAccount);

      expect(result).toEqual(deactivatedAccount);
    });
  });

  describe("Business logic validation", () => {
    it("should allow updating all account fields", async () => {
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

      expect(result).toEqual(fullyUpdatedAccount);
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/account/update/test_account", // Uses old account name in endpoint
        expect.objectContaining({
          body: JSON.stringify(fullyUpdatedAccount), // Sends new data
        }),
      );
    });

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
