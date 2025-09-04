/**
 * Isolated tests for useUserAccountRegister business logic
 * Tests the userAccountRegister function without React Query/React overhead
 */

import { userAccountRegister } from "../../hooks/useUserAccountRegister";
import User from "../../model/User";
import {
  createFetchMock,
  createErrorFetchMock,
  ConsoleSpy,
  simulateNetworkError,
  simulateTimeoutError,
  createMockResponse,
  createTestUser,
  createMockValidationUtils,
} from "../../testHelpers";

// Mock the validation utils
jest.mock("../../utils/validation", () => ({
  DataValidator: {
    validateUser: jest.fn(),
  },
  hookValidators: {
    validateApiPayload: jest.fn(),
  },
  ValidationError: jest.fn(),
}));

import { hookValidators } from "../../utils/validation";

describe("userAccountRegister (Isolated)", () => {
  let consoleSpy: ConsoleSpy;
  const originalFetch = global.fetch;
  const mockValidateApiPayload = hookValidators.validateApiPayload as jest.Mock;

  beforeEach(() => {
    consoleSpy = new ConsoleSpy();
    jest.clearAllMocks();
  });

  afterEach(() => {
    consoleSpy.stop();
    global.fetch = originalFetch;
  });

  describe("Successful User Registration", () => {
    it("should register user successfully with 201 response", async () => {
      const testUser = createTestUser();
      const mockConsoleLog = consoleSpy.start().log;

      mockValidateApiPayload.mockReturnValue({
        isValid: true,
        validatedData: testUser,
        errors: [],
      });
      global.fetch = createFetchMock(null, { status: 201 });

      const result = await userAccountRegister(testUser);

      expect(result).toBeNull();
      expect(global.fetch).toHaveBeenCalledWith("/api/user/register", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(testUser),
      });
      expect(mockConsoleLog).toHaveBeenCalledWith(
        "User registration attempt for username:",
        testUser.username
      );
    });

    it("should return payload for non-201 success responses", async () => {
      const testUser = createTestUser();

      mockValidateApiPayload.mockReturnValue({
        isValid: true,
        validatedData: testUser,
        errors: [],
      });
      global.fetch = createFetchMock(testUser, { status: 200 });

      const result = await userAccountRegister(testUser);

      expect(result).toEqual(testUser);
    });

    it("should use validated data from validation utils", async () => {
      const originalUser = createTestUser({ username: "  test@example.com  " });
      const sanitizedUser = createTestUser({ username: "test@example.com" });

      mockValidateApiPayload.mockReturnValue({
        isValid: true,
        validatedData: sanitizedUser,
        errors: [],
      });
      global.fetch = createFetchMock(null, { status: 201 });

      await userAccountRegister(originalUser);

      expect(global.fetch).toHaveBeenCalledWith(
        "/api/user/register",
        expect.objectContaining({
          body: JSON.stringify(sanitizedUser),
        })
      );
    });

    it("should handle registration with all user fields", async () => {
      const completeUser = createTestUser({
        userId: 123,
        username: "complete@example.com",
        password: "CompletePassword123!",
        firstName: "Complete",
        lastName: "User",
      });

      mockValidateApiPayload.mockReturnValue({
        isValid: true,
        validatedData: completeUser,
        errors: [],
      });
      global.fetch = createFetchMock(null, { status: 201 });

      const result = await userAccountRegister(completeUser);

      expect(result).toBeNull();
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/user/register",
        expect.objectContaining({
          body: JSON.stringify(completeUser),
        })
      );
    });
  });

  describe("Validation Logic", () => {
    it("should handle validation errors with specific messages", async () => {
      const testUser = createTestUser();
      const mockConsoleLog = consoleSpy.start().log;

      const validationErrors = [
        { message: "Username is required" },
        { message: "Password is too weak" },
        { message: "First name must be at least 2 characters" },
      ];

      mockValidateApiPayload.mockReturnValue({
        isValid: false,
        validatedData: null,
        errors: validationErrors,
      });

      await expect(userAccountRegister(testUser)).rejects.toThrow(
        "User registration validation failed: Username is required, Password is too weak, First name must be at least 2 characters"
      );

      expect(mockConsoleLog).toHaveBeenCalledWith(
        "An error occurred: User registration validation failed: Username is required, Password is too weak, First name must be at least 2 characters"
      );
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it("should handle validation errors without specific messages", async () => {
      const testUser = createTestUser();

      mockValidateApiPayload.mockReturnValue({
        isValid: false,
        validatedData: null,
        errors: null,
      });

      await expect(userAccountRegister(testUser)).rejects.toThrow(
        "User registration validation failed: Validation failed"
      );

      expect(global.fetch).not.toHaveBeenCalled();
    });

    it("should handle validation errors with empty error array", async () => {
      const testUser = createTestUser();

      mockValidateApiPayload.mockReturnValue({
        isValid: false,
        validatedData: null,
        errors: [],
      });

      await expect(userAccountRegister(testUser)).rejects.toThrow(
        "User registration validation failed: Validation failed"
      );

      expect(global.fetch).not.toHaveBeenCalled();
    });

    it("should call validation with correct parameters", async () => {
      const testUser = createTestUser();
      const { DataValidator } = require("../../utils/validation");

      mockValidateApiPayload.mockReturnValue({
        isValid: true,
        validatedData: testUser,
        errors: [],
      });
      global.fetch = createFetchMock(null, { status: 201 });

      await userAccountRegister(testUser);

      expect(mockValidateApiPayload).toHaveBeenCalledWith(
        testUser,
        DataValidator.validateUser,
        "userAccountRegister"
      );
    });
  });

  describe("Error Handling", () => {
    it("should handle 400 error with response message", async () => {
      const testUser = createTestUser();
      const mockConsoleLog = consoleSpy.start().log;

      mockValidateApiPayload.mockReturnValue({
        isValid: true,
        validatedData: testUser,
        errors: [],
      });

      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 400,
        statusText: "Bad Request",
        json: jest.fn().mockResolvedValue({ response: "Username already exists" }),
      });

      await expect(userAccountRegister(testUser)).rejects.toThrow("Username already exists");

      expect(mockConsoleLog).toHaveBeenCalledWith(
        "An error occurred: Username already exists"
      );
    });

    it("should handle 500 error with response message", async () => {
      const testUser = createTestUser();

      mockValidateApiPayload.mockReturnValue({
        isValid: true,
        validatedData: testUser,
        errors: [],
      });

      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
        json: jest.fn().mockResolvedValue({ response: "Internal server error" }),
      });

      await expect(userAccountRegister(testUser)).rejects.toThrow("Internal server error");
    });

    it("should handle error response without message", async () => {
      const testUser = createTestUser();
      const mockConsoleLog = consoleSpy.start().log;

      mockValidateApiPayload.mockReturnValue({
        isValid: true,
        validatedData: testUser,
        errors: [],
      });

      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 400,
        statusText: "Bad Request",
        json: jest.fn().mockResolvedValue({}),
      });

      await expect(userAccountRegister(testUser)).rejects.toThrow(
        "Failed to parse error response: No error message returned."
      );

      expect(mockConsoleLog).toHaveBeenCalledWith("No error message returned.");
      expect(mockConsoleLog).toHaveBeenCalledWith(
        "Failed to parse error response: No error message returned."
      );
    });

    it("should handle unparseable error response", async () => {
      const testUser = createTestUser();
      const mockConsoleLog = consoleSpy.start().log;

      mockValidateApiPayload.mockReturnValue({
        isValid: true,
        validatedData: testUser,
        errors: [],
      });

      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 400,
        statusText: "Bad Request",
        json: jest.fn().mockRejectedValue(new Error("Unexpected token")),
      });

      await expect(userAccountRegister(testUser)).rejects.toThrow(
        "Failed to parse error response: Unexpected token"
      );

      expect(mockConsoleLog).toHaveBeenCalledWith(
        "Failed to parse error response: Unexpected token"
      );
    });

    it("should handle network errors", async () => {
      const testUser = createTestUser();
      const mockConsoleLog = consoleSpy.start().log;

      mockValidateApiPayload.mockReturnValue({
        isValid: true,
        validatedData: testUser,
        errors: [],
      });
      global.fetch = simulateNetworkError();

      await expect(userAccountRegister(testUser)).rejects.toThrow("Network error");

      expect(mockConsoleLog).toHaveBeenCalledWith("An error occurred: Network error");
    });

    it("should handle timeout errors", async () => {
      const testUser = createTestUser();

      mockValidateApiPayload.mockReturnValue({
        isValid: true,
        validatedData: testUser,
        errors: [],
      });
      global.fetch = simulateTimeoutError();

      await expect(userAccountRegister(testUser)).rejects.toThrow("Request timeout");
    });
  });

  describe("Security and Logging", () => {
    it("should log username for security without exposing password", async () => {
      const testUser = createTestUser({
        username: "security@example.com",
        password: "SecretPassword123!",
      });
      const mockConsoleLog = consoleSpy.start().log;

      mockValidateApiPayload.mockReturnValue({
        isValid: true,
        validatedData: testUser,
        errors: [],
      });
      global.fetch = createFetchMock(null, { status: 201 });

      await userAccountRegister(testUser);

      expect(mockConsoleLog).toHaveBeenCalledWith(
        "User registration attempt for username:",
        "security@example.com"
      );

      // Verify password is never logged
      const allLogs = mockConsoleLog.mock.calls.flat();
      const passwordInLogs = allLogs.some(
        (log) => typeof log === "string" && log.includes("SecretPassword123!")
      );
      expect(passwordInLogs).toBe(false);
    });

    it("should log errors without exposing sensitive data", async () => {
      const testUser = createTestUser({
        password: "SensitivePassword123!",
      });
      const mockConsoleLog = consoleSpy.start().log;

      mockValidateApiPayload.mockReturnValue({
        isValid: false,
        validatedData: null,
        errors: [{ message: "Invalid username format" }],
      });

      await expect(userAccountRegister(testUser)).rejects.toThrow();

      // Check that sensitive data is not in logs
      const allLogs = mockConsoleLog.mock.calls.flat();
      const passwordInLogs = allLogs.some(
        (log) => typeof log === "string" && log.includes("SensitivePassword123!")
      );
      expect(passwordInLogs).toBe(false);
    });

    it("should re-throw original error after logging", async () => {
      const testUser = createTestUser();
      const mockConsoleLog = consoleSpy.start().log;
      const originalError = new Error("Original error");

      mockValidateApiPayload.mockReturnValue({
        isValid: true,
        validatedData: testUser,
        errors: [],
      });

      global.fetch = jest.fn().mockRejectedValue(originalError);

      await expect(userAccountRegister(testUser)).rejects.toThrow(originalError);

      expect(mockConsoleLog).toHaveBeenCalledWith("An error occurred: Original error");
    });
  });

  describe("Request Configuration", () => {
    it("should use correct HTTP method and headers", async () => {
      const testUser = createTestUser();

      mockValidateApiPayload.mockReturnValue({
        isValid: true,
        validatedData: testUser,
        errors: [],
      });
      global.fetch = createFetchMock(null, { status: 201 });

      await userAccountRegister(testUser);

      expect(global.fetch).toHaveBeenCalledWith(
        "/api/user/register",
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(testUser),
        }
      );
    });

    it("should include credentials for authentication", async () => {
      const testUser = createTestUser();

      mockValidateApiPayload.mockReturnValue({
        isValid: true,
        validatedData: testUser,
        errors: [],
      });
      global.fetch = createFetchMock(null, { status: 201 });

      await userAccountRegister(testUser);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          credentials: "include",
        })
      );
    });

    it("should send data as JSON in request body", async () => {
      const testUser = createTestUser();

      mockValidateApiPayload.mockReturnValue({
        isValid: true,
        validatedData: testUser,
        errors: [],
      });
      global.fetch = createFetchMock(null, { status: 201 });

      await userAccountRegister(testUser);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            "Content-Type": "application/json",
          }),
          body: JSON.stringify(testUser),
        })
      );
    });
  });

  describe("User Registration Business Logic", () => {
    it("should handle different user data formats", async () => {
      const users = [
        createTestUser({ username: "user1@example.com", firstName: "John", lastName: "Doe" }),
        createTestUser({ username: "user2@test.org", firstName: "Jane", lastName: "Smith" }),
        createTestUser({ username: "admin@company.com", firstName: "Admin", lastName: "User" }),
      ];

      for (const user of users) {
        mockValidateApiPayload.mockReturnValue({
          isValid: true,
          validatedData: user,
          errors: [],
        });
        global.fetch = createFetchMock(null, { status: 201 });

        const result = await userAccountRegister(user);
        expect(result).toBeNull();
      }
    });

    it("should handle edge cases with user names", async () => {
      const edgeUsers = [
        createTestUser({ firstName: "A", lastName: "B" }), // Short names
        createTestUser({ firstName: "Very".repeat(20), lastName: "Long".repeat(20) }), // Long names
        createTestUser({ firstName: "José", lastName: "García" }), // Special characters
        createTestUser({ firstName: "John-Paul", lastName: "O'Connor" }), // Hyphens and apostrophes
      ];

      for (const user of edgeUsers) {
        mockValidateApiPayload.mockReturnValue({
          isValid: true,
          validatedData: user,
          errors: [],
        });
        global.fetch = createFetchMock(null, { status: 201 });

        const result = await userAccountRegister(user);
        expect(result).toBeNull();
      }
    });

    it("should handle different email formats", async () => {
      const emailFormats = [
        "simple@example.com",
        "user.name@example.com",
        "user+tag@example.com",
        "user_name@example-domain.com",
        "user123@domain123.co.uk",
      ];

      for (const email of emailFormats) {
        const user = createTestUser({ username: email });
        mockValidateApiPayload.mockReturnValue({
          isValid: true,
          validatedData: user,
          errors: [],
        });
        global.fetch = createFetchMock(null, { status: 201 });

        const result = await userAccountRegister(user);
        expect(result).toBeNull();
      }
    });

    it("should handle registration with minimum required fields", async () => {
      const minimalUser = {
        username: "minimal@example.com",
        password: "MinimalPassword123!",
        firstName: "Min",
        lastName: "User",
      };

      mockValidateApiPayload.mockReturnValue({
        isValid: true,
        validatedData: minimalUser,
        errors: [],
      });
      global.fetch = createFetchMock(null, { status: 201 });

      const result = await userAccountRegister(minimalUser);

      expect(result).toBeNull();
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/user/register",
        expect.objectContaining({
          body: JSON.stringify(minimalUser),
        })
      );
    });
  });

  describe("Response Status Handling", () => {
    it("should return null for 201 Created", async () => {
      const testUser = createTestUser();

      mockValidateApiPayload.mockReturnValue({
        isValid: true,
        validatedData: testUser,
        errors: [],
      });
      global.fetch = createFetchMock(null, { status: 201 });

      const result = await userAccountRegister(testUser);

      expect(result).toBeNull();
    });

    it("should return payload for 200 OK", async () => {
      const testUser = createTestUser();

      mockValidateApiPayload.mockReturnValue({
        isValid: true,
        validatedData: testUser,
        errors: [],
      });
      global.fetch = createFetchMock(testUser, { status: 200 });

      const result = await userAccountRegister(testUser);

      expect(result).toEqual(testUser);
    });

    it("should return payload for other success status codes", async () => {
      const testUser = createTestUser();
      const statusCodes = [202, 204];

      for (const status of statusCodes) {
        mockValidateApiPayload.mockReturnValue({
          isValid: true,
          validatedData: testUser,
          errors: [],
        });
        global.fetch = createFetchMock(testUser, { status });

        const result = await userAccountRegister(testUser);
        expect(result).toEqual(testUser);
      }
    });
  });
});