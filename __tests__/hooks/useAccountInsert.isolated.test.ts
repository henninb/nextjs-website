import Account from "../../model/Account";
import {
  createFetchMock,
  createErrorFetchMock,
  ConsoleSpy,
  createTestAccount,
  simulateNetworkError,
} from "../../testHelpers";

// Mock validation utilities
jest.mock("../../utils/validation", () => ({
  DataValidator: {
    validateAccount: jest.fn(),
  },
  hookValidators: {
    validateApiPayload: jest.fn(),
  },
  ValidationError: jest.fn(),
}));

import { setupNewAccount, insertAccount } from "../../hooks/useAccountInsert";
import { hookValidators, DataValidator } from "../../utils/validation";

describe("Account Insert Functions (Isolated)", () => {
  const mockAccount = createTestAccount({
    accountNameOwner: "newTestAccount",
    accountType: "savings",
    activeStatus: false, // This should be overridden to true
    moniker: "New Account",
    outstanding: 100.0,
    future: 200.0,
    cleared: 50.0,
  });

  const mockValidateApiPayload = hookValidators.validateApiPayload as jest.Mock;
  let consoleSpy: ConsoleSpy;
  let mockConsole: any;

  beforeEach(() => {
    consoleSpy = new ConsoleSpy();
    mockConsole = consoleSpy.start();
    jest.clearAllMocks();

    // Reset validation mocks to default success state
    mockValidateApiPayload.mockReturnValue({
      isValid: true,
      validatedData: mockAccount,
      errors: null,
    });
  });

  afterEach(() => {
    consoleSpy.stop();
  });

  describe("setupNewAccount function", () => {
    it("should set default values for new account", () => {
      const inputAccount = createTestAccount({
        accountNameOwner: "testAccount",
        accountType: "checking",
        moniker: "Test",
      });

      const result = setupNewAccount(inputAccount);

      expect(result).toEqual(
        expect.objectContaining({
          cleared: 0.0,
          future: 0.0,
          outstanding: 0.0,
          activeStatus: true,
          accountNameOwner: "testAccount",
          accountType: "checking",
          moniker: "Test",
        }),
      );
      expect(result.dateClosed).toEqual(new Date(0));
      expect(result.dateAdded).toBeInstanceOf(Date);
      expect(result.dateUpdated).toBeInstanceOf(Date);
      expect(result.validationDate).toEqual(new Date(0));
    });

    it("should preserve existing values when provided", () => {
      const inputAccount = createTestAccount({
        accountNameOwner: "testAccount",
        cleared: 100.0,
        future: 200.0,
        outstanding: 50.0,
      });

      const result = setupNewAccount(inputAccount);

      expect(result.cleared).toBe(100.0);
      expect(result.future).toBe(200.0);
      expect(result.outstanding).toBe(50.0);
    });

    it("should always force activeStatus to true", () => {
      const inactiveAccount = createTestAccount({
        activeStatus: false,
      });

      const result = setupNewAccount(inactiveAccount);

      expect(result.activeStatus).toBe(true);
    });

    it("should maintain activeStatus as true when already true", () => {
      const activeAccount = createTestAccount({
        activeStatus: true,
      });

      const result = setupNewAccount(activeAccount);

      expect(result.activeStatus).toBe(true);
    });

    it("should set proper date defaults", () => {
      const inputAccount = createTestAccount();
      const beforeSetup = new Date();

      const result = setupNewAccount(inputAccount);

      const afterSetup = new Date();

      expect(result.dateClosed).toEqual(new Date(0));
      expect(result.validationDate).toEqual(new Date(0));
      // Allow for small timing differences (within 1 second)
      expect(Math.abs(result.dateAdded.getTime() - beforeSetup.getTime())).toBeLessThanOrEqual(1000);
      expect(result.dateAdded.getTime()).toBeLessThanOrEqual(
        afterSetup.getTime(),
      );
      expect(result.dateUpdated.getTime()).toBeGreaterThanOrEqual(
        beforeSetup.getTime(),
      );
      expect(result.dateUpdated.getTime()).toBeLessThanOrEqual(
        afterSetup.getTime(),
      );
    });
  });

  describe("insertAccount function", () => {
    describe("Successful insertion", () => {
      it("should insert account successfully with 201 response", async () => {
        const responseAccount = createTestAccount({
          accountId: 123,
          accountNameOwner: "newTestAccount",
          activeStatus: true,
        });
        global.fetch = createFetchMock(responseAccount, { status: 201 });

        const result = await insertAccount(mockAccount);

        expect(result).toEqual(responseAccount);
        expect(global.fetch).toHaveBeenCalledWith(
          "/api/account/insert",
          expect.objectContaining({
            method: "POST",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
            body: expect.stringContaining('"activeStatus":true'),
          }),
        );
        expect(mockConsole.log).toHaveBeenCalledWith(
          "Inserting account for:",
          mockAccount.accountNameOwner,
        );
      });

      it("should handle 204 no content response", async () => {
        global.fetch = createFetchMock(null, { status: 204 });

        const result = await insertAccount(mockAccount);

        expect(result).toBeNull();
        expect(global.fetch).toHaveBeenCalledWith(
          "/api/account/insert",
          expect.any(Object),
        );
      });

      it("should validate account before insertion", async () => {
        global.fetch = createFetchMock(mockAccount, { status: 201 });

        await insertAccount(mockAccount);

        expect(
          mockValidateApiPayload,
        ).toHaveBeenCalledWith(
          mockAccount,
          DataValidator.validateAccount,
          "insertAccount",
        );
      });

      it("should use validated data in payload", async () => {
        const validatedAccount = createTestAccount({
          accountNameOwner: "validated",
        });
        mockValidateApiPayload.mockReturnValue({
          isValid: true,
          validatedData: validatedAccount,
          errors: null,
        });
        global.fetch = createFetchMock(validatedAccount, { status: 201 });

        await insertAccount(mockAccount);

        expect(global.fetch).toHaveBeenCalledWith(
          "/api/account/insert",
          expect.objectContaining({
            body: expect.stringContaining('"accountNameOwner":"validated"'),
          }),
        );
      });
    });

    describe("Validation failures", () => {
      it("should reject with validation error when validation fails", async () => {
        mockValidateApiPayload.mockReturnValue({
          isValid: false,
          validatedData: null,
          errors: [
            { message: "Account name is required" },
            { message: "Invalid account type" },
          ],
        });

        await expect(insertAccount(mockAccount)).rejects.toThrow(
          "Account validation failed: Account name is required, Invalid account type",
        );

        expect(global.fetch).not.toHaveBeenCalled();
        expect(mockConsole.log).toHaveBeenCalledWith(
          "An error occurred: Account validation failed: Account name is required, Invalid account type",
        );
      });

      it("should handle validation error without specific error messages", async () => {
        mockValidateApiPayload.mockReturnValue({
          isValid: false,
          validatedData: null,
          errors: null,
        });

        await expect(insertAccount(mockAccount)).rejects.toThrow(
          "Account validation failed: Validation failed",
        );

        expect(global.fetch).not.toHaveBeenCalled();
      });

      it("should handle empty error array", async () => {
        mockValidateApiPayload.mockReturnValue({
          isValid: false,
          validatedData: null,
          errors: [],
        });

        await expect(insertAccount(mockAccount)).rejects.toThrow(
          "Account validation failed: Validation failed",
        );
      });
    });

    describe("Server errors", () => {
      it("should handle server error with specific error message", async () => {
        global.fetch = jest.fn().mockResolvedValueOnce({
          ok: false,
          status: 400,
          json: jest
            .fn()
            .mockResolvedValueOnce({ response: "Account already exists" }),
        });

        await expect(insertAccount(mockAccount)).rejects.toThrow(
          "Account already exists",
        );
        expect(mockConsole.log).toHaveBeenCalledWith("Account already exists");
        expect(mockConsole.log).toHaveBeenCalledWith(
          "An error occurred: Account already exists",
        );
      });

      it("should handle server error without error message", async () => {
        global.fetch = jest.fn().mockResolvedValueOnce({
          ok: false,
          status: 400,
          json: jest.fn().mockResolvedValueOnce({}),
        });

        await expect(insertAccount(mockAccount)).rejects.toThrow(
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

        await expect(insertAccount(mockAccount)).rejects.toThrow(
          "Failed to parse error response: Invalid JSON",
        );
        expect(mockConsole.log).toHaveBeenCalledWith(
          "Failed to parse error response: Invalid JSON",
        );
      });

      it("should handle non-JSON error responses", async () => {
        global.fetch = jest.fn().mockResolvedValueOnce({
          ok: false,
          status: 500,
          json: jest.fn().mockRejectedValueOnce(new Error("Unexpected token")),
        });

        await expect(insertAccount(mockAccount)).rejects.toThrow(
          "Failed to parse error response: Unexpected token",
        );
        expect(mockConsole.log).toHaveBeenCalledWith(
          "Failed to parse error response: Unexpected token",
        );
      });
    });

    describe("Network and parsing errors", () => {
      it("should handle network errors", async () => {
        global.fetch = simulateNetworkError();

        await expect(insertAccount(mockAccount)).rejects.toThrow(
          "Network error",
        );
        expect(mockConsole.log).toHaveBeenCalledWith(
          "An error occurred: Network error",
        );
      });

      it("should handle fetch rejection", async () => {
        global.fetch = jest
          .fn()
          .mockRejectedValueOnce(new Error("Connection refused"));

        await expect(insertAccount(mockAccount)).rejects.toThrow(
          "Connection refused",
        );
        expect(mockConsole.log).toHaveBeenCalledWith(
          "An error occurred: Connection refused",
        );
      });
    });

    describe("HTTP request validation", () => {
      it("should include correct headers", async () => {
        global.fetch = createFetchMock(mockAccount, { status: 201 });

        await insertAccount(mockAccount);

        expect(global.fetch).toHaveBeenCalledWith(
          "/api/account/insert",
          expect.objectContaining({
            headers: {
              "Content-Type": "application/json",
            },
          }),
        );
      });

      it("should include credentials", async () => {
        global.fetch = createFetchMock(mockAccount, { status: 201 });

        await insertAccount(mockAccount);

        expect(global.fetch).toHaveBeenCalledWith(
          "/api/account/insert",
          expect.objectContaining({
            credentials: "include",
          }),
        );
      });

      it("should use POST method", async () => {
        global.fetch = createFetchMock(mockAccount, { status: 201 });

        await insertAccount(mockAccount);

        expect(global.fetch).toHaveBeenCalledWith(
          "/api/account/insert",
          expect.objectContaining({
            method: "POST",
          }),
        );
      });

      it("should send to correct endpoint", async () => {
        global.fetch = createFetchMock(mockAccount, { status: 201 });

        await insertAccount(mockAccount);

        expect(global.fetch).toHaveBeenCalledWith(
          "/api/account/insert",
          expect.any(Object),
        );
      });
    });

    describe("Account data variations", () => {
      it("should handle account with all fields", async () => {
        const fullAccount = createTestAccount({
          accountNameOwner: "fullAccount",
          accountType: "credit",
          activeStatus: true,
          moniker: "Full Account",
          outstanding: 150.0,
          future: 250.0,
          cleared: 75.0,
        });
        mockValidateApiPayload.mockReturnValue({
          isValid: true,
          validatedData: fullAccount,
          errors: null,
        });
        global.fetch = createFetchMock(fullAccount, { status: 201 });

        await insertAccount(fullAccount);

        expect(global.fetch).toHaveBeenCalledWith(
          "/api/account/insert",
          expect.objectContaining({
            body: expect.stringContaining('"accountNameOwner":"fullAccount"'),
          }),
        );
      });

      it("should handle account with minimal fields", async () => {
        const minimalAccount = createTestAccount({
          accountNameOwner: "minimal",
          accountType: "checking",
        });
        mockValidateApiPayload.mockReturnValue({
          isValid: true,
          validatedData: minimalAccount,
          errors: null,
        });
        global.fetch = createFetchMock(minimalAccount, { status: 201 });

        await insertAccount(minimalAccount);

        expect(global.fetch).toHaveBeenCalledWith(
          "/api/account/insert",
          expect.objectContaining({
            body: expect.stringContaining('"accountNameOwner":"minimal"'),
          }),
        );
      });

      it("should handle special characters in account name", async () => {
        const specialAccount = createTestAccount({
          accountNameOwner: "account-with_special@chars.123",
        });
        mockValidateApiPayload.mockReturnValue({
          isValid: true,
          validatedData: specialAccount,
          errors: null,
        });
        global.fetch = createFetchMock(specialAccount, { status: 201 });

        await insertAccount(specialAccount);

        expect(mockConsole.log).toHaveBeenCalledWith(
          "Inserting account for:",
          "account-with_special@chars.123",
        );
      });

      it("should handle very long account names", async () => {
        const longName = "a".repeat(100);
        const longNameAccount = createTestAccount({
          accountNameOwner: longName,
        });
        mockValidateApiPayload.mockReturnValue({
          isValid: true,
          validatedData: longNameAccount,
          errors: null,
        });
        global.fetch = createFetchMock(longNameAccount, { status: 201 });

        await insertAccount(longNameAccount);

        expect(mockConsole.log).toHaveBeenCalledWith(
          "Inserting account for:",
          longName,
        );
      });

      it("should handle different account types", async () => {
        const accountTypes = [
          "checking",
          "savings",
          "credit",
          "debit",
          "investment",
        ];

        for (const accountType of accountTypes) {
          const typedAccount = createTestAccount({ accountType });
          mockValidateApiPayload.mockReturnValue(
            {
              isValid: true,
              validatedData: typedAccount,
              errors: null,
            },
          );
          global.fetch = createFetchMock(typedAccount, { status: 201 });

          await insertAccount(typedAccount);

          expect(global.fetch).toHaveBeenCalledWith(
            "/api/account/insert",
            expect.objectContaining({
              body: expect.stringContaining(`"accountType":"${accountType}"`),
            }),
          );

          jest.clearAllMocks();
        }
      });
    });

    describe("Business logic validation", () => {
      it("should always set activeStatus to true regardless of input", async () => {
        const inactiveAccount = createTestAccount({ activeStatus: false });
        mockValidateApiPayload.mockReturnValue({
          isValid: true,
          validatedData: inactiveAccount,
          errors: null,
        });
        global.fetch = createFetchMock(inactiveAccount, { status: 201 });

        await insertAccount(inactiveAccount);

        const requestBody = JSON.parse(
          (global.fetch as jest.Mock).mock.calls[0][1].body,
        );
        expect(requestBody.activeStatus).toBe(true);
      });

      it("should set default financial values when not provided", async () => {
        // Create account without financial fields, then setupNewAccount should add defaults
        const { outstanding, future, cleared, ...accountWithoutFinancials } =
          createTestAccount();
        mockValidateApiPayload.mockReturnValue({
          isValid: true,
          validatedData: accountWithoutFinancials,
          errors: null,
        });
        global.fetch = createFetchMock(accountWithoutFinancials, {
          status: 201,
        });

        await insertAccount(accountWithoutFinancials as any);

        const requestBody = JSON.parse(
          (global.fetch as jest.Mock).mock.calls[0][1].body,
        );
        expect(requestBody.outstanding).toBe(0.0);
        expect(requestBody.future).toBe(0.0);
        expect(requestBody.cleared).toBe(0.0);
      });

      it("should preserve provided financial values", async () => {
        const accountWithFinancials = createTestAccount({
          outstanding: 100.5,
          future: 200.75,
          cleared: 50.25,
        });
        mockValidateApiPayload.mockReturnValue({
          isValid: true,
          validatedData: accountWithFinancials,
          errors: null,
        });
        global.fetch = createFetchMock(accountWithFinancials, { status: 201 });

        await insertAccount(accountWithFinancials);

        const requestBody = JSON.parse(
          (global.fetch as jest.Mock).mock.calls[0][1].body,
        );
        expect(requestBody.outstanding).toBe(100.5);
        expect(requestBody.future).toBe(200.75);
        expect(requestBody.cleared).toBe(50.25);
      });

      it("should set proper date fields in payload", async () => {
        global.fetch = createFetchMock(mockAccount, { status: 201 });

        await insertAccount(mockAccount);

        const requestBody = JSON.parse(
          (global.fetch as jest.Mock).mock.calls[0][1].body,
        );
        expect(requestBody.dateClosed).toBe("1970-01-01T00:00:00.000Z");
        expect(requestBody.validationDate).toBe("1970-01-01T00:00:00.000Z");
        expect(new Date(requestBody.dateAdded)).toBeInstanceOf(Date);
        expect(new Date(requestBody.dateUpdated)).toBeInstanceOf(Date);
      });
    });

    describe("Console logging behavior", () => {
      it("should log account name for successful insertions", async () => {
        global.fetch = createFetchMock(mockAccount, { status: 201 });

        await insertAccount(mockAccount);

        expect(mockConsole.log).toHaveBeenCalledWith(
          "Inserting account for:",
          mockAccount.accountNameOwner,
        );
      });

      it("should log validation errors", async () => {
        mockValidateApiPayload.mockReturnValue({
          isValid: false,
          validatedData: null,
          errors: [{ message: "Invalid account" }],
        });

        await expect(insertAccount(mockAccount)).rejects.toThrow();
        expect(mockConsole.log).toHaveBeenCalledWith(
          "An error occurred: Account validation failed: Invalid account",
        );
      });

      it("should not log for validation failures before fetch", async () => {
        mockValidateApiPayload.mockReturnValue({
          isValid: false,
          validatedData: null,
          errors: [{ message: "Invalid" }],
        });

        await expect(insertAccount(mockAccount)).rejects.toThrow();

        // Should not log "Inserting account for:" for validation failures
        expect(mockConsole.log).not.toHaveBeenCalledWith(
          "Inserting account for:",
          expect.any(String),
        );
      });
    });

    describe("Status code handling", () => {
      it("should handle 200 OK as success", async () => {
        global.fetch = createFetchMock(mockAccount, { status: 200 });

        const result = await insertAccount(mockAccount);

        expect(result).toEqual(mockAccount);
      });

      it("should handle 409 Conflict", async () => {
        global.fetch = jest.fn().mockResolvedValueOnce({
          ok: false,
          status: 409,
          json: jest
            .fn()
            .mockResolvedValueOnce({ response: "Account name already exists" }),
        });

        await expect(insertAccount(mockAccount)).rejects.toThrow(
          "Account name already exists",
        );
      });

      it("should handle 422 Unprocessable Entity", async () => {
        global.fetch = jest.fn().mockResolvedValueOnce({
          ok: false,
          status: 422,
          json: jest
            .fn()
            .mockResolvedValueOnce({ response: "Invalid account data format" }),
        });

        await expect(insertAccount(mockAccount)).rejects.toThrow(
          "Invalid account data format",
        );
      });

      it("should handle 500 Internal Server Error", async () => {
        global.fetch = jest.fn().mockResolvedValueOnce({
          ok: false,
          status: 500,
          json: jest
            .fn()
            .mockResolvedValueOnce({ response: "Database connection failed" }),
        });

        await expect(insertAccount(mockAccount)).rejects.toThrow(
          "Database connection failed",
        );
      });
    });
  });
});
