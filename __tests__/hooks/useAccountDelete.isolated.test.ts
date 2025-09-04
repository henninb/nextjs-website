import Account from "../../model/Account";

// Mock the validation utilities since we're testing in isolation
jest.mock("../../utils/validation", () => ({
  InputSanitizer: {
    sanitizeAccountName: jest.fn(),
  },
  SecurityLogger: {
    logSanitizationAttempt: jest.fn(),
  },
}));

import { deleteAccount } from "../../hooks/useAccountDelete";
import { InputSanitizer, SecurityLogger } from "../../utils/validation";

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

  const mockSanitizeAccountName = InputSanitizer.sanitizeAccountName as jest.Mock;
  const mockLogSanitizationAttempt = SecurityLogger.logSanitizationAttempt as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    // Setup default mock returns
    mockSanitizeAccountName.mockReturnValue("test_account");
    mockLogSanitizationAttempt.mockReturnValue(undefined);

    // Reset console.log spy if it exists
    if (jest.isMockFunction(console.log)) {
      (console.log as jest.Mock).mockRestore();
    }
  });

  it("should delete account successfully with 204 status", async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      status: 204,
      json: jest.fn(),
    });

    const result = await deleteAccount(mockAccount);

    expect(mockSanitizeAccountName).toHaveBeenCalledWith(
      "test_account",
    );
    expect(mockLogSanitizationAttempt).toHaveBeenCalledWith(
      "accountNameOwner",
      "test_account",
      "test_account",
    );
    expect(fetch).toHaveBeenCalledWith("/api/account/delete/test_account", {
      method: "DELETE",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
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

    await expect(deleteAccount(invalidAccount)).rejects.toThrow(
      "Account name is required for deletion",
    );

    expect(mockSanitizeAccountName).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("should throw error when sanitized account name is invalid", async () => {
    mockSanitizeAccountName.mockReturnValueOnce("");

    await expect(deleteAccount(mockAccount)).rejects.toThrow(
      "Invalid account name provided",
    );

    expect(mockSanitizeAccountName).toHaveBeenCalledWith(
      "test_account",
    );
    expect(fetch).not.toHaveBeenCalled();
  });

  it("should handle API error response", async () => {
    const consoleSpy = jest.spyOn(console, "log");
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

    expect(consoleSpy).toHaveBeenCalledWith("Cannot delete this account");
    expect(consoleSpy).toHaveBeenCalledWith(
      "An error occurred: Cannot delete this account",
    );
    consoleSpy.mockRestore();
  });

  it("should handle error response without message", async () => {
    const consoleSpy = jest.spyOn(console, "log");
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: jest.fn().mockResolvedValueOnce({}),
    });

    await expect(deleteAccount(mockAccount)).rejects.toThrow(
      "Failed to parse error response: No error message returned.",
    );

    expect(consoleSpy).toHaveBeenCalledWith("No error message returned.");
    expect(consoleSpy).toHaveBeenCalledWith(
      "Failed to parse error response: No error message returned.",
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      "An error occurred: Failed to parse error response: No error message returned.",
    );
    consoleSpy.mockRestore();
  });

  it("should handle JSON parsing errors", async () => {
    const consoleSpy = jest.spyOn(console, "log");
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: jest.fn().mockRejectedValueOnce(new Error("Invalid JSON")),
    });

    await expect(deleteAccount(mockAccount)).rejects.toThrow(
      "Failed to parse error response: Invalid JSON",
    );

    expect(consoleSpy).toHaveBeenCalledWith(
      "Failed to parse error response: Invalid JSON",
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      "An error occurred: Failed to parse error response: Invalid JSON",
    );
    consoleSpy.mockRestore();
  });

  it("should handle network errors", async () => {
    const consoleSpy = jest.spyOn(console, "log");
    global.fetch = jest.fn().mockRejectedValueOnce(new Error("Network error"));

    await expect(deleteAccount(mockAccount)).rejects.toThrow("Network error");

    expect(consoleSpy).toHaveBeenCalledWith("An error occurred: Network error");
    consoleSpy.mockRestore();
  });

  it("should log security events correctly", async () => {
    const accountWithSpecialChars = {
      ...mockAccount,
      accountNameOwner: "test<script>alert('xss')</script>",
    };
    mockSanitizeAccountName.mockReturnValueOnce(
      "test_sanitized",
    );

    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      status: 204,
      json: jest.fn(),
    });

    await deleteAccount(accountWithSpecialChars);

    expect(mockSanitizeAccountName).toHaveBeenCalledWith(
      "test<script>alert('xss')</script>",
    );
    expect(mockLogSanitizationAttempt).toHaveBeenCalledWith(
      "accountNameOwner",
      "test<script>alert('xss')</script>",
      "test_sanitized",
    );
  });

  it("should use sanitized account name in endpoint", async () => {
    mockSanitizeAccountName.mockReturnValueOnce(
      "sanitized_name",
    );

    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      status: 204,
      json: jest.fn(),
    });

    await deleteAccount(mockAccount);

    expect(fetch).toHaveBeenCalledWith(
      "/api/account/delete/sanitized_name",
      expect.any(Object),
    );
  });

  it("should handle null sanitized account name", async () => {
    mockSanitizeAccountName.mockReturnValueOnce(null);

    await expect(deleteAccount(mockAccount)).rejects.toThrow(
      "Invalid account name provided",
    );
  });

  it("should handle undefined sanitized account name", async () => {
    mockSanitizeAccountName.mockReturnValueOnce(undefined);

    await expect(deleteAccount(mockAccount)).rejects.toThrow(
      "Invalid account name provided",
    );
  });
});
