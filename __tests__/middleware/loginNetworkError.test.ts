import { processLogin } from "../../hooks/useLoginProcess";
import { createTestUser } from "../../testHelpers";

// Mock the validation utilities at the module level
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

describe("Login Network Error - TDD", () => {
  const mockUser = createTestUser({
    username: "test@example.com",
    password: "TestPassword123!",
    firstName: "Test",
    lastName: "User",
  });

  beforeEach(() => {
    jest.clearAllMocks();

    // Set up the mocks for each test
    const {
      hookValidators,
      InputSanitizer,
    } = require("../../utils/validation");
    hookValidators.validateApiPayload.mockReturnValue({
      isValid: true,
      validatedData: mockUser,
      errors: null,
    });
    InputSanitizer.sanitizeUsername.mockReturnValue(mockUser.username);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should fail with fetch error mimicking middleware proxy issue", async () => {
    // Simulate the exact fetch error from middleware
    global.fetch = jest.fn().mockRejectedValue(new Error("fetch failed"));

    // This should fail with the same error we're seeing in the logs
    await expect(processLogin(mockUser)).rejects.toThrow("fetch failed");

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/login",
      expect.objectContaining({
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mockUser),
      }),
    );
  });

  it("should handle upstream server connection failures", async () => {
    // Mock a connection refusal (common when upstream server is down)
    global.fetch = jest
      .fn()
      .mockRejectedValue(new Error("ECONNREFUSED: Connection refused"));

    await expect(processLogin(mockUser)).rejects.toThrow("ECONNREFUSED");
  });
});
