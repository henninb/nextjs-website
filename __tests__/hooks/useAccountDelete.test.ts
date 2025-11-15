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

// Mock the validation utilities since we're testing in isolation
jest.mock("../../utils/validation/sanitization", () => ({
  InputSanitizer: {
    sanitizeAccountName: jest.fn(),
  },
  SecurityLogger: {
    logSanitizationAttempt: jest.fn(),
  },
}));

import Account from "../../model/Account";
import { deleteAccount } from "../../hooks/useAccountDelete";
import { InputSanitizer, SecurityLogger } from "../../utils/validation/sanitization";
import { HookValidator } from "../../utils/hookValidation";

describe("deleteAccount (Isolated)", () => {
  const mockAccount: Account = {
    accountId: 123,
    accountNameOwner: "test_account",
    accountType: "debit",
    activeStatus: true,
    moniker: "0000",
    outstanding: 100,
    future: 300,
    cleared: 200,
  };

  const mockSanitizeAccountName =
    InputSanitizer.sanitizeAccountName as jest.Mock;
  const mockLogSanitizationAttempt =
    SecurityLogger.logSanitizationAttempt as jest.Mock;
  const mockValidateDelete = HookValidator.validateDelete as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    // Setup default mock returns
    mockSanitizeAccountName.mockReturnValue("test_account");
    mockLogSanitizationAttempt.mockReturnValue(undefined);
    mockValidateDelete.mockImplementation(() => {}); // Reset to no-op
  });

  it("should delete account successfully with 204 status", async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      status: 204,
      json: jest.fn(),
    });

    const result = await deleteAccount(mockAccount);

    expect(mockValidateDelete).toHaveBeenCalledWith(
      mockAccount,
      "accountNameOwner",
      "deleteAccount",
    );
    expect(mockSanitizeAccountName).toHaveBeenCalledWith("test_account");
    expect(fetch).toHaveBeenCalledWith("/api/account/test_account", {
      method: "DELETE",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
            Accept: "application/json",
      },
    });
    expect(result).toBeNull();
  });

  it("should return JSON data when status is not 204", async () => {
    const mockResponse = { message: "Account deleted" };
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValueOnce(mockResponse),
    });

    const result = await deleteAccount(mockAccount);

    expect(result).toEqual(mockResponse);
  });

  it("should throw error when accountNameOwner is missing", async () => {
    const invalidAccount = { ...mockAccount, accountNameOwner: "" };
    mockValidateDelete.mockImplementation(() => {
      throw new Error("deleteAccount: Invalid accountNameOwner provided");
    });

    await expect(deleteAccount(invalidAccount)).rejects.toThrow(
      "deleteAccount: Invalid accountNameOwner provided",
    );

    expect(mockValidateDelete).toHaveBeenCalledWith(
      invalidAccount,
      "accountNameOwner",
      "deleteAccount",
    );
    expect(mockSanitizeAccountName).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("should validate using HookValidator before sanitization", async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      status: 204,
      json: jest.fn(),
    });

    await deleteAccount(mockAccount);

    expect(mockValidateDelete).toHaveBeenCalledWith(
      mockAccount,
      "accountNameOwner",
      "deleteAccount",
    );
    expect(mockSanitizeAccountName).toHaveBeenCalledWith("test_account");
  });

  it("should handle API error response", async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: jest.fn().mockResolvedValueOnce({
        response: "Cannot delete this account",
      }),
    });

    await expect(deleteAccount(mockAccount)).rejects.toThrow(
      "Cannot delete this account",
    );
  });

  it("should handle error response without message", async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: jest.fn().mockResolvedValueOnce({}),
    });

    await expect(deleteAccount(mockAccount)).rejects.toThrow(
      "HTTP 400",
    );
  });

  it("should handle JSON parsing errors", async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: jest.fn().mockRejectedValueOnce(new Error("Invalid JSON")),
    });

    await expect(deleteAccount(mockAccount)).rejects.toThrow(
      "HTTP 400",
    );
  });

  it("should handle network errors", async () => {
    global.fetch = jest.fn().mockRejectedValueOnce(new Error("Network error"));

    await expect(deleteAccount(mockAccount)).rejects.toThrow("Network error");
  });

  it("should sanitize account name with special characters", async () => {
    const accountWithSpecialChars = {
      ...mockAccount,
      accountNameOwner: "test<script>alert('xss')</script>",
    };
    mockSanitizeAccountName.mockReturnValue("test_sanitized");

    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      status: 204,
      json: jest.fn(),
    });

    await deleteAccount(accountWithSpecialChars);

    expect(mockSanitizeAccountName).toHaveBeenCalledWith(
      "test<script>alert('xss')</script>",
    );
    expect(fetch).toHaveBeenCalledWith(
      "/api/account/test_sanitized",
      expect.any(Object),
    );
  });

  it("should use sanitized account name in endpoint", async () => {
    mockSanitizeAccountName.mockReturnValue("sanitized_name");

    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      status: 204,
      json: jest.fn(),
    });

    await deleteAccount(mockAccount);

    expect(fetch).toHaveBeenCalledWith(
      "/api/account/sanitized_name",
      expect.any(Object),
    );
  });

});
