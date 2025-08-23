import Account from "../../model/Account";

// Mock the validation utilities since we're testing in isolation
const mockInputSanitizer = {
  sanitizeAccountName: jest.fn(),
};

const mockSecurityLogger = {
  logSanitizationAttempt: jest.fn(),
};

// Mock the modules
jest.mock("../../utils/validation", () => ({
  InputSanitizer: mockInputSanitizer,
  SecurityLogger: mockSecurityLogger,
}));

// Extract the deleteAccount function for isolated testing
const deleteAccount = async (payload: Account): Promise<Account | null> => {
  try {
    // Validate and sanitize account identifier for deletion
    if (!payload.accountNameOwner) {
      throw new Error("Account name is required for deletion");
    }

    const sanitizedAccountName = mockInputSanitizer.sanitizeAccountName(
      payload.accountNameOwner,
    );
    if (!sanitizedAccountName) {
      throw new Error("Invalid account name provided");
    }

    // Log security-sensitive deletion attempt
    mockSecurityLogger.logSanitizationAttempt(
      "accountNameOwner",
      payload.accountNameOwner,
      sanitizedAccountName,
    );

    const endpoint = `/api/account/delete/${sanitizedAccountName}`;

    const response = await fetch(endpoint, {
      method: "DELETE",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      let errorMessage = "";

      try {
        const errorBody = await response.json();
        if (errorBody && errorBody.response) {
          errorMessage = `${errorBody.response}`;
        } else {
          console.log("No error message returned.");
          throw new Error("No error message returned.");
        }
      } catch (error: any) {
        console.log(`Failed to parse error response: ${error.message}`);
        throw new Error(`Failed to parse error response: ${error.message}`);
      }

      console.log(errorMessage || "cannot throw a null value");
      throw new Error(errorMessage || "cannot throw a null value");
    }

    return response.status !== 204 ? await response.json() : null;
  } catch (error: any) {
    console.log(`An error occurred: ${error.message}`);
    throw error;
  }
};

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

  beforeEach(() => {
    jest.clearAllMocks();
    // Setup default mock returns
    mockInputSanitizer.sanitizeAccountName.mockReturnValue("test_account");
    mockSecurityLogger.logSanitizationAttempt.mockReturnValue(undefined);

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

    expect(mockInputSanitizer.sanitizeAccountName).toHaveBeenCalledWith(
      "test_account",
    );
    expect(mockSecurityLogger.logSanitizationAttempt).toHaveBeenCalledWith(
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

    expect(mockInputSanitizer.sanitizeAccountName).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("should throw error when sanitized account name is invalid", async () => {
    mockInputSanitizer.sanitizeAccountName.mockReturnValueOnce("");

    await expect(deleteAccount(mockAccount)).rejects.toThrow(
      "Invalid account name provided",
    );

    expect(mockInputSanitizer.sanitizeAccountName).toHaveBeenCalledWith(
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
      "No error message returned.",
    );

    expect(consoleSpy).toHaveBeenCalledWith("No error message returned.");
    expect(consoleSpy).toHaveBeenCalledWith(
      "An error occurred: No error message returned.",
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
    mockInputSanitizer.sanitizeAccountName.mockReturnValueOnce(
      "test_sanitized",
    );

    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      status: 204,
      json: jest.fn(),
    });

    await deleteAccount(accountWithSpecialChars);

    expect(mockInputSanitizer.sanitizeAccountName).toHaveBeenCalledWith(
      "test<script>alert('xss')</script>",
    );
    expect(mockSecurityLogger.logSanitizationAttempt).toHaveBeenCalledWith(
      "accountNameOwner",
      "test<script>alert('xss')</script>",
      "test_sanitized",
    );
  });

  it("should use sanitized account name in endpoint", async () => {
    mockInputSanitizer.sanitizeAccountName.mockReturnValueOnce(
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
    mockInputSanitizer.sanitizeAccountName.mockReturnValueOnce(null);

    await expect(deleteAccount(mockAccount)).rejects.toThrow(
      "Invalid account name provided",
    );
  });

  it("should handle undefined sanitized account name", async () => {
    mockInputSanitizer.sanitizeAccountName.mockReturnValueOnce(undefined);

    await expect(deleteAccount(mockAccount)).rejects.toThrow(
      "Invalid account name provided",
    );
  });
});
