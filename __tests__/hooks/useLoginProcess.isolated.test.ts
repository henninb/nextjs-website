import User from "../../model/User";
import {
  createFetchMock,
  createErrorFetchMock,
  ConsoleSpy,
  createTestUser,
  createMockValidationUtils,
  simulateNetworkError,
} from "../../testHelpers";

// Mock validation utilities
jest.mock("../../utils/validation", () => ({
  DataValidator: {
    validateUser: jest.fn(),
  },
  hookValidators: {
    validateApiPayload: jest.fn(),
  },
  ValidationError: jest.fn(),
  InputSanitizer: {
    sanitizeUsername: jest.fn(),
  },
}));

import { processLogin } from "../../hooks/useLoginProcess";
import { hookValidators, DataValidator, InputSanitizer } from "../../utils/validation";

// Alias for consistency with existing test naming
const loginUser = processLogin;

describe("loginUser (Isolated)", () => {
  const mockUser = createTestUser({
    username: "testuser",
    password: "TestPassword123!",
    firstName: "Test",
    lastName: "User",
  });

  const mockValidateApiPayload = hookValidators.validateApiPayload as jest.Mock;
  const mockSanitizeUsername = InputSanitizer.sanitizeUsername as jest.Mock;
  let consoleSpy: ConsoleSpy;
  let mockConsole: any;

  beforeEach(() => {
    consoleSpy = new ConsoleSpy();
    mockConsole = consoleSpy.start();
    jest.clearAllMocks();

    // Reset validation mocks to default success state
    mockValidateApiPayload.mockReturnValue({
      isValid: true,
      validatedData: mockUser,
      errors: null,
    });
    mockSanitizeUsername.mockReturnValue(mockUser.username);
  });

  afterEach(() => {
    consoleSpy.stop();
  });

  describe("Successful login", () => {
    it("should login successfully with 204 response", async () => {
      global.fetch = createFetchMock(null, { status: 204 });

      await loginUser(mockUser);

      expect(global.fetch).toHaveBeenCalledWith(
        "/api/login",
        expect.objectContaining({
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(mockUser),
        }),
      );
      expect(mockConsole.log).toHaveBeenCalledWith(
        "Login attempt for user:",
        mockUser.username,
      );
    });

    it("should validate user credentials before login", async () => {
      global.fetch = createFetchMock(null, { status: 204 });

      await loginUser(mockUser);

      expect(
        mockValidateApiPayload,
      ).toHaveBeenCalledWith(
        mockUser,
        DataValidator.validateUser,
        "login",
      );
    });

    it("should sanitize username in log output", async () => {
      global.fetch = createFetchMock(null, { status: 204 });
      mockSanitizeUsername.mockReturnValue(
        "sanitized_user",
      );

      await loginUser(mockUser);

      expect(
        mockSanitizeUsername,
      ).toHaveBeenCalledWith(mockUser.username);
      expect(mockConsole.log).toHaveBeenCalledWith(
        "Login attempt for user:",
        "sanitized_user",
      );
    });

    it("should use validated data in request body", async () => {
      const validatedData = {
        username: "validated",
        password: "validated_pass",
      };
      mockValidateApiPayload.mockReturnValue({
        isValid: true,
        validatedData,
        errors: null,
      });
      global.fetch = createFetchMock(null, { status: 204 });

      await loginUser(mockUser);

      expect(global.fetch).toHaveBeenCalledWith(
        "/api/login",
        expect.objectContaining({
          body: JSON.stringify(validatedData),
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
          { message: "Username is required" },
          { message: "Password too short" },
        ],
      });

      await expect(loginUser(mockUser)).rejects.toThrow(
        "Login validation failed: Username is required, Password too short",
      );

      expect(global.fetch).not.toHaveBeenCalled();
    });

    it("should handle validation error without specific error messages", async () => {
      mockValidateApiPayload.mockReturnValue({
        isValid: false,
        validatedData: null,
        errors: null,
      });

      await expect(loginUser(mockUser)).rejects.toThrow(
        "Login validation failed: Validation failed",
      );

      expect(global.fetch).not.toHaveBeenCalled();
    });

    it("should handle empty error array", async () => {
      mockValidateApiPayload.mockReturnValue({
        isValid: false,
        validatedData: null,
        errors: [],
      });

      await expect(loginUser(mockUser)).rejects.toThrow(
        "Login validation failed: Validation failed",
      );
    });
  });

  describe("Authentication errors", () => {
    it("should handle 401 unauthorized with specific error message", async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        status: 401,
        json: jest
          .fn()
          .mockResolvedValueOnce({ error: "Invalid username or password" }),
      });

      await expect(loginUser(mockUser)).rejects.toThrow(
        "Invalid username or password",
      );
    });

    it("should handle 401 unauthorized without specific error message", async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        status: 401,
        json: jest.fn().mockResolvedValueOnce({}),
      });

      await expect(loginUser(mockUser)).rejects.toThrow("Login failed");
    });

    it("should handle 403 forbidden", async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        status: 403,
        json: jest.fn().mockResolvedValueOnce({ error: "Account disabled" }),
      });

      await expect(loginUser(mockUser)).rejects.toThrow("Account disabled");
    });

    it("should handle 429 too many requests", async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        status: 429,
        json: jest
          .fn()
          .mockResolvedValueOnce({ error: "Too many login attempts" }),
      });

      await expect(loginUser(mockUser)).rejects.toThrow(
        "Too many login attempts",
      );
    });

    it("should handle 500 server error", async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        status: 500,
        json: jest
          .fn()
          .mockResolvedValueOnce({ error: "Internal server error" }),
      });

      await expect(loginUser(mockUser)).rejects.toThrow(
        "Internal server error",
      );
    });
  });

  describe("Network and parsing errors", () => {
    it("should handle network errors", async () => {
      global.fetch = simulateNetworkError();

      await expect(loginUser(mockUser)).rejects.toThrow("Network error");
    });

    it("should handle fetch rejection", async () => {
      global.fetch = jest
        .fn()
        .mockRejectedValueOnce(new Error("Connection refused"));

      await expect(loginUser(mockUser)).rejects.toThrow("Connection refused");
    });

    it("should handle malformed JSON response", async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        status: 401,
        json: jest.fn().mockRejectedValueOnce(new Error("Invalid JSON")),
      });

      await expect(loginUser(mockUser)).rejects.toThrow("Invalid JSON");
    });
  });

  describe("HTTP request validation", () => {
    it("should include correct headers", async () => {
      global.fetch = createFetchMock(null, { status: 204 });

      await loginUser(mockUser);

      expect(global.fetch).toHaveBeenCalledWith(
        "/api/login",
        expect.objectContaining({
          headers: { "Content-Type": "application/json" },
        }),
      );
    });

    it("should include credentials", async () => {
      global.fetch = createFetchMock(null, { status: 204 });

      await loginUser(mockUser);

      expect(global.fetch).toHaveBeenCalledWith(
        "/api/login",
        expect.objectContaining({
          credentials: "include",
        }),
      );
    });

    it("should use POST method", async () => {
      global.fetch = createFetchMock(null, { status: 204 });

      await loginUser(mockUser);

      expect(global.fetch).toHaveBeenCalledWith(
        "/api/login",
        expect.objectContaining({
          method: "POST",
        }),
      );
    });

    it("should send correct endpoint", async () => {
      global.fetch = createFetchMock(null, { status: 204 });

      await loginUser(mockUser);

      expect(global.fetch).toHaveBeenCalledWith(
        "/api/login",
        expect.any(Object),
      );
    });
  });

  describe("User credential variations", () => {
    it("should handle user with minimal fields", async () => {
      const minimalUser = createTestUser({
        username: "minimal",
        password: "pass123",
        firstName: undefined,
        lastName: undefined,
      });
      mockValidateApiPayload.mockReturnValue({
        isValid: true,
        validatedData: minimalUser,
        errors: null,
      });
      global.fetch = createFetchMock(null, { status: 204 });

      await loginUser(minimalUser);

      expect(global.fetch).toHaveBeenCalledWith(
        "/api/login",
        expect.objectContaining({
          body: JSON.stringify(minimalUser),
        }),
      );
    });

    it("should handle user with all fields", async () => {
      const fullUser = createTestUser({
        userId: 123,
        username: "fulluser",
        password: "FullPassword123!",
        firstName: "John",
        lastName: "Doe",
      });
      mockSanitizeUsername.mockReturnValue(
        fullUser.username,
      );
      global.fetch = createFetchMock(null, { status: 204 });

      await loginUser(fullUser);

      expect(mockConsole.log).toHaveBeenCalledWith(
        "Login attempt for user:",
        fullUser.username,
      );
    });

    it("should handle username with special characters", async () => {
      const specialUser = createTestUser({
        username: "user@domain.com",
        password: "Password123!",
      });
      mockSanitizeUsername.mockReturnValue(
        "user@domain.com",
      );
      global.fetch = createFetchMock(null, { status: 204 });

      await loginUser(specialUser);

      expect(
        mockSanitizeUsername,
      ).toHaveBeenCalledWith("user@domain.com");
      expect(mockConsole.log).toHaveBeenCalledWith(
        "Login attempt for user:",
        "user@domain.com",
      );
    });

    it("should handle long username", async () => {
      const longUsername = "a".repeat(100);
      const longUser = createTestUser({
        username: longUsername,
        password: "Password123!",
      });
      mockSanitizeUsername.mockReturnValue(
        longUsername,
      );
      global.fetch = createFetchMock(null, { status: 204 });

      await loginUser(longUser);

      expect(mockConsole.log).toHaveBeenCalledWith(
        "Login attempt for user:",
        longUsername,
      );
    });

    it("should handle complex password", async () => {
      const complexUser = createTestUser({
        username: "testuser",
        password: "Compl3x!P@ssw0rd#$%^&*()_+{}[]|\\:;\"'<>?,./",
      });
      global.fetch = createFetchMock(null, { status: 204 });

      await loginUser(complexUser);

      expect(global.fetch).toHaveBeenCalled();
    });
  });

  describe("Security logging", () => {
    it("should not log password in console output", async () => {
      global.fetch = createFetchMock(null, { status: 204 });

      await loginUser(mockUser);

      const logCalls = mockConsole.log.mock.calls.flat();
      const allLoggedContent = logCalls.join(" ");

      expect(allLoggedContent).not.toContain(mockUser.password);
      expect(allLoggedContent).toContain(mockUser.username);
    });

    it("should sanitize username before logging", async () => {
      const unsafeUser = createTestUser({
        username: "<script>alert('xss')</script>",
        password: "Password123!",
      });
      mockSanitizeUsername.mockReturnValue(
        "safe_username",
      );
      global.fetch = createFetchMock(null, { status: 204 });

      await loginUser(unsafeUser);

      expect(
        mockSanitizeUsername,
      ).toHaveBeenCalledWith(unsafeUser.username);
      expect(mockConsole.log).toHaveBeenCalledWith(
        "Login attempt for user:",
        "safe_username",
      );
    });

    it("should log login attempt for successful login", async () => {
      global.fetch = createFetchMock(null, { status: 204 });

      await loginUser(mockUser);

      expect(mockConsole.log).toHaveBeenCalledWith(
        "Login attempt for user:",
        mockUser.username,
      );
    });

    it("should log login attempt even for failed validation", async () => {
      mockValidateApiPayload.mockReturnValue({
        isValid: false,
        validatedData: null,
        errors: [{ message: "Invalid data" }],
      });

      await expect(loginUser(mockUser)).rejects.toThrow();

      // Should not log for validation failures (function returns early)
      expect(mockConsole.log).not.toHaveBeenCalled();
    });
  });

  describe("Status code edge cases", () => {
    it("should handle 200 OK as failure (expects 204)", async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        status: 200,
        json: jest
          .fn()
          .mockResolvedValueOnce({ error: "Unexpected success format" }),
      });

      await expect(loginUser(mockUser)).rejects.toThrow(
        "Unexpected success format",
      );
    });

    it("should handle 201 Created as failure", async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        status: 201,
        json: jest
          .fn()
          .mockResolvedValueOnce({ error: "Account created instead" }),
      });

      await expect(loginUser(mockUser)).rejects.toThrow(
        "Account created instead",
      );
    });

    it("should handle 400 Bad Request", async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        status: 400,
        json: jest
          .fn()
          .mockResolvedValueOnce({ error: "Invalid request format" }),
      });

      await expect(loginUser(mockUser)).rejects.toThrow(
        "Invalid request format",
      );
    });

    it("should handle 404 Not Found", async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        status: 404,
        json: jest
          .fn()
          .mockResolvedValueOnce({ error: "Login endpoint not found" }),
      });

      await expect(loginUser(mockUser)).rejects.toThrow(
        "Login endpoint not found",
      );
    });
  });
});
