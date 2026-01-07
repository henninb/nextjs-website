import User from "../../model/User";
import {
  createFetchMock,
  simulateNetworkError,
  createTestUser,
} from "../../testHelpers";
import { processLogin } from "../../hooks/useLoginProcess";
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

function createMockLogger() {
  return {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
}

jest.mock("../../utils/hookValidation", () => ({
  HookValidator: {
    validateInsert: jest.fn((data) => data),
    validateUpdate: jest.fn((updated) => updated),
    validateDelete: jest.fn(),
  },
  HookValidationError: class HookValidationError extends Error {
    constructor(message: string) {
      super(message);
      this.name = "HookValidationError";
    }
  },
}));

jest.mock("../../utils/logger", () => {
  const logger = createMockLogger();
  return {
    createHookLogger: jest.fn(() => logger),
    __mockLogger: logger,
  };
});

jest.mock("../../utils/validation", () => ({
  DataValidator: {
    validateUser: jest.fn(),
  },
}));

jest.mock("../../utils/validation/sanitization", () => ({
  InputSanitizer: {
    sanitizeUsername: jest.fn((username: string) => username.trim()),
  },
}));

const mockValidateInsert = HookValidator.validateInsert as jest.Mock;
const { __mockLogger: mockLogger } = jest.requireMock("../../utils/logger") as {
  __mockLogger: ReturnType<typeof createMockLogger>;
};
const { InputSanitizer } = jest.requireMock(
  "../../utils/validation/sanitization",
) as {
  InputSanitizer: { sanitizeUsername: jest.Mock };
};

describe("processLogin", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  const baseUser = createTestUser({
    username: "TestUser",
    password: "Secret123!",
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockLogger.debug.mockClear();
    mockLogger.error.mockClear();
    InputSanitizer.sanitizeUsername.mockImplementation((username: string) =>
      username.trim(),
    );
    mockValidateInsert.mockImplementation((data: User) => data);
  });

  it("sends validated payload to /api/login with credentials", async () => {
    const responseUser = createTestUser();
    global.fetch = createFetchMock(responseUser, { status: 204 });

    await expect(processLogin(baseUser)).resolves.toBeUndefined();

    expect(mockValidateInsert).toHaveBeenCalledWith(
      baseUser,
      expect.any(Function),
      "login",
    );
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/login",
      expect.objectContaining({
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(baseUser),
      }),
    );
  });

  it("logs sanitized usernames for diagnostics", async () => {
    const dirtyUser = createTestUser({
      username: "  Unsafe-User! ",
    });
    InputSanitizer.sanitizeUsername.mockReturnValue("safeuser");
    global.fetch = createFetchMock(null, { status: 204 });

    await processLogin(dirtyUser);

    expect(InputSanitizer.sanitizeUsername).toHaveBeenCalledWith(
      dirtyUser.username,
    );
    expect(mockLogger.debug).toHaveBeenCalledWith(
      "Processing login",
      expect.objectContaining({ username: "safeuser" }),
    );
  });

  it("throws validation errors before calling fetch", async () => {
    mockValidateInsert.mockImplementation(() => {
      throw new Error("login validation failed: username required");
    });
    const fetchSpy = jest.fn();
    global.fetch = fetchSpy as any;

    await expect(processLogin(baseUser)).rejects.toThrow(
      "login validation failed: username required",
    );
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("propagates authentication failures (401/403)", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      status: 401,
      json: jest.fn().mockResolvedValue({ error: "Invalid credentials" }),
    });

    await expect(processLogin(baseUser)).rejects.toThrow("Invalid credentials");
  });

  it("handles non-JSON error responses gracefully", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      status: 500,
      json: jest.fn().mockRejectedValue(new Error("Invalid JSON")),
    });

    await expect(processLogin(baseUser)).rejects.toThrow("HTTP 500: undefined");
  });

  it("handles unexpected success statuses by parsing response body", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      status: 200,
      json: jest.fn().mockResolvedValue({ error: "Unexpected success format" }),
    });

    await expect(processLogin(baseUser)).rejects.toThrow(
      "Unexpected success format",
    );
  });

  it("propagates network failures from fetch", async () => {
    global.fetch = simulateNetworkError();

    await expect(processLogin(baseUser)).rejects.toThrow("Network error");
    expect(mockLogger.error).not.toHaveBeenCalled();
  });

  it("throws response error when server returns generic failure", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      status: 500,
      json: jest.fn().mockResolvedValue({}),
    });

    await expect(processLogin(baseUser)).rejects.toThrow("HTTP 500: undefined");
  });
});
