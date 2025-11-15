import User from "../../model/User";
import {
  createFetchMock,
  createTestUser,
  simulateNetworkError,
} from "../../testHelpers";
import { userAccountRegister } from "../../hooks/useUserAccountRegister";
import { HookValidator } from "../../utils/hookValidation";

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

const mockValidateInsert = HookValidator.validateInsert as jest.Mock;
const { __mockLogger: mockLogger } = jest.requireMock(
  "../../utils/logger",
) as { __mockLogger: ReturnType<typeof createMockLogger> };

describe("userAccountRegister (isolated)", () => {
  const newUser = createTestUser({
    username: "new_user@example.com",
    password: "SampleP@ssw0rd",
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockLogger.debug.mockClear();
    mockLogger.error.mockClear();
    mockValidateInsert.mockImplementation((data: User) => data);
  });

  it("posts validated payload to /api/user/register", async () => {
    global.fetch = createFetchMock(null, { status: 201 });

    const result = await userAccountRegister(newUser);

    expect(result).toBeNull();
    expect(mockValidateInsert).toHaveBeenCalledWith(
      newUser,
      expect.any(Function),
      "userAccountRegister",
    );
    expect(global.fetch).toHaveBeenCalledWith("/api/user/register", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(newUser),
    });
  });

  it("returns original payload for non-201 responses", async () => {
    global.fetch = createFetchMock(newUser, { status: 200 });

    await expect(userAccountRegister(newUser)).resolves.toEqual(newUser);
  });

  it("surfaces validation failures before calling fetch", async () => {
    mockValidateInsert.mockImplementation(() => {
      throw new Error(
        "userAccountRegister validation failed: username is required",
      );
    });
    const fetchSpy = jest.fn();
    global.fetch = fetchSpy as any;

    await expect(userAccountRegister(newUser)).rejects.toThrow(
      "userAccountRegister validation failed: username is required",
    );
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("propagates network errors from fetch layer", async () => {
    global.fetch = simulateNetworkError();

    await expect(userAccountRegister(newUser)).rejects.toThrow("Network error");
  });

  it("handles error responses without a specific message", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 400,
      statusText: "Bad Request",
      json: jest.fn().mockResolvedValue({}),
    });

    await expect(userAccountRegister(newUser)).rejects.toThrow("HTTP 400");
  });

  it("logs registration lifecycle details", async () => {
    global.fetch = createFetchMock(null, { status: 201 });

    await userAccountRegister(newUser);

    expect(mockLogger.debug).toHaveBeenCalledWith(
      "Registering user account",
      expect.objectContaining({ username: newUser.username }),
    );
  });
});
