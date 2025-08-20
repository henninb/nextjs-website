import React from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import useUserAccountRegister from "../../hooks/useUserAccountRegister";
import User from "../../model/User";
import { DataValidator, hookValidators } from "../../utils/validation";

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

const mockValidateApiPayload = hookValidators.validateApiPayload as jest.Mock;

afterEach(() => {
  jest.clearAllMocks();
});

// Create a fresh QueryClient for each test
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });

const createWrapper =
  (queryClient: QueryClient) =>
  ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

describe("useUserAccountRegister", () => {
  const validUser: User = {
    username: "test@example.com",
    password: "Test123@",
    firstName: "John",
    lastName: "Doe",
  };

  beforeEach(() => {
    // Mock successful validation by default
    mockValidateApiPayload.mockReturnValue({
      isValid: true,
      validatedData: validUser,
      errors: [],
    });
  });

  it("should register user successfully with 201 response", async () => {
    const queryClient = createTestQueryClient();

    // Mock the global fetch function to return 201 success
    const originalFetch = global.fetch;
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 201 }));

    const { result } = renderHook(() => useUserAccountRegister(), {
      wrapper: createWrapper(queryClient),
    });

    // Execute the registration mutation
    result.current.mutate({ payload: validUser });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Verify fetch was called with correct parameters
    expect(global.fetch).toHaveBeenCalledWith("/api/user/register", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(validUser),
    });

    // Verify validation was called
    expect(mockValidateApiPayload).toHaveBeenCalledWith(
      validUser,
      DataValidator.validateUser,
      "userAccountRegister",
    );

    // Restore original fetch
    global.fetch = originalFetch;
  });

  it("should handle validation errors", async () => {
    const queryClient = createTestQueryClient();

    const validationErrors = [
      { message: "Username is required" },
      { message: "Password is too weak" },
    ];

    // Mock validation failure
    mockValidateApiPayload.mockReturnValue({
      isValid: false,
      validatedData: null,
      errors: validationErrors,
    });

    const { result } = renderHook(() => useUserAccountRegister(), {
      wrapper: createWrapper(queryClient),
    });

    result.current.mutate({ payload: validUser });

    await waitFor(() => expect(result.current.isError).toBe(true));

    // Verify error contains validation messages
    expect(result.current.error?.message).toBe(
      "User registration validation failed: Username is required, Password is too weak",
    );

    // Verify fetch was not called
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("should handle validation errors without specific messages", async () => {
    const queryClient = createTestQueryClient();

    // Mock validation failure without error details
    mockValidateApiPayload.mockReturnValue({
      isValid: false,
      validatedData: null,
      errors: null,
    });

    const { result } = renderHook(() => useUserAccountRegister(), {
      wrapper: createWrapper(queryClient),
    });

    result.current.mutate({ payload: validUser });

    await waitFor(() => expect(result.current.isError).toBe(true));

    // Verify default error message
    expect(result.current.error?.message).toBe(
      "User registration validation failed: Validation failed",
    );
  });

  it("should handle registration error with response message", async () => {
    const queryClient = createTestQueryClient();

    // Mock the global fetch function to return 400 with error message
    const originalFetch = global.fetch;
    global.fetch = jest.fn().mockResolvedValueOnce(
      new Response(JSON.stringify({ response: "Username already exists" }), {
        status: 400,
      }),
    );

    const { result } = renderHook(() => useUserAccountRegister(), {
      wrapper: createWrapper(queryClient),
    });

    result.current.mutate({ payload: validUser });

    await waitFor(() => expect(result.current.isError).toBe(true));

    // Verify error message from response
    expect(result.current.error?.message).toBe("Username already exists");

    // Restore original fetch
    global.fetch = originalFetch;
  });

  it("should handle registration error without response message", async () => {
    const queryClient = createTestQueryClient();

    // Mock the global fetch function to return 400 without error message
    const originalFetch = global.fetch;
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({}), { status: 400 }));

    const { result } = renderHook(() => useUserAccountRegister(), {
      wrapper: createWrapper(queryClient),
    });

    result.current.mutate({ payload: validUser });

    await waitFor(() => expect(result.current.isError).toBe(true));

    // The hook implementation throws "No error message returned." first, then wraps it
    expect(result.current.error?.message).toBe(
      "Failed to parse error response: No error message returned.",
    );

    // Restore original fetch
    global.fetch = originalFetch;
  });

  it("should handle unparseable error response", async () => {
    const queryClient = createTestQueryClient();

    // Mock the global fetch function to return invalid JSON
    const originalFetch = global.fetch;
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(new Response("Invalid JSON", { status: 400 }));

    const { result } = renderHook(() => useUserAccountRegister(), {
      wrapper: createWrapper(queryClient),
    });

    result.current.mutate({ payload: validUser });

    await waitFor(() => expect(result.current.isError).toBe(true));

    // Verify error message for unparseable response
    expect(result.current.error?.message).toContain(
      "Failed to parse error response",
    );

    // Restore original fetch
    global.fetch = originalFetch;
  });

  it("should handle network errors", async () => {
    const queryClient = createTestQueryClient();

    // Mock the global fetch function to throw network error
    const originalFetch = global.fetch;
    global.fetch = jest
      .fn()
      .mockRejectedValueOnce(new Error("Network failure"));

    const { result } = renderHook(() => useUserAccountRegister(), {
      wrapper: createWrapper(queryClient),
    });

    result.current.mutate({ payload: validUser });

    await waitFor(() => expect(result.current.isError).toBe(true));

    // Verify error message
    expect(result.current.error?.message).toBe("Network failure");

    // Restore original fetch
    global.fetch = originalFetch;
  });

  it("should handle 500 server errors", async () => {
    const queryClient = createTestQueryClient();

    // Mock the global fetch function to return 500 with error message
    const originalFetch = global.fetch;
    global.fetch = jest.fn().mockResolvedValueOnce(
      new Response(JSON.stringify({ response: "Internal server error" }), {
        status: 500,
      }),
    );

    const { result } = renderHook(() => useUserAccountRegister(), {
      wrapper: createWrapper(queryClient),
    });

    result.current.mutate({ payload: validUser });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error?.message).toBe("Internal server error");

    // Restore original fetch
    global.fetch = originalFetch;
  });

  it("should return null for 201 status", async () => {
    const queryClient = createTestQueryClient();

    // Mock the global fetch function to return 201
    const originalFetch = global.fetch;
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 201 }));

    const { result } = renderHook(() => useUserAccountRegister(), {
      wrapper: createWrapper(queryClient),
    });

    result.current.mutate({ payload: validUser });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // For 201 status, should return null instead of payload
    expect(result.current.data).toBe(null);

    // Restore original fetch
    global.fetch = originalFetch;
  });

  it("should return payload for non-201 success status", async () => {
    const queryClient = createTestQueryClient();

    // Mock the global fetch function to return 200
    const originalFetch = global.fetch;
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 200 }));

    const { result } = renderHook(() => useUserAccountRegister(), {
      wrapper: createWrapper(queryClient),
    });

    result.current.mutate({ payload: validUser });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // For non-201 status, should return the payload
    expect(result.current.data).toEqual(validUser);

    // Restore original fetch
    global.fetch = originalFetch;
  });

  it("should include credentials and correct headers in request", async () => {
    const queryClient = createTestQueryClient();

    let capturedOptions: any;

    // Mock the global fetch function and capture options
    const originalFetch = global.fetch;
    global.fetch = jest.fn().mockImplementation((url, options) => {
      capturedOptions = options;
      return Promise.resolve(new Response(null, { status: 201 }));
    });

    const { result } = renderHook(() => useUserAccountRegister(), {
      wrapper: createWrapper(queryClient),
    });

    result.current.mutate({ payload: validUser });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Verify request options
    expect(capturedOptions.method).toBe("POST");
    expect(capturedOptions.credentials).toBe("include");
    expect(capturedOptions.headers["Content-Type"]).toBe("application/json");
    expect(capturedOptions.body).toBe(JSON.stringify(validUser));

    // Restore original fetch
    global.fetch = originalFetch;
  });

  it("should log username for security without exposing sensitive data", async () => {
    const queryClient = createTestQueryClient();
    const consoleSpy = jest.spyOn(console, "log").mockImplementation();

    // Mock the global fetch function
    const originalFetch = global.fetch;
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 201 }));

    const { result } = renderHook(() => useUserAccountRegister(), {
      wrapper: createWrapper(queryClient),
    });

    result.current.mutate({ payload: validUser });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Verify that username is logged but password is not
    expect(consoleSpy).toHaveBeenCalledWith(
      "User registration attempt for username:",
      validUser.username,
    );

    // Verify password is not logged anywhere
    const allLogs = consoleSpy.mock.calls.flat();
    const passwordInLogs = allLogs.some(
      (log) => typeof log === "string" && log.includes(validUser.password),
    );
    expect(passwordInLogs).toBe(false);

    consoleSpy.mockRestore();
    global.fetch = originalFetch;
  });

  it("should update query cache on successful registration", async () => {
    const queryClient = createTestQueryClient();

    // Mock the global fetch function
    const originalFetch = global.fetch;
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 201 }));

    const { result } = renderHook(() => useUserAccountRegister(), {
      wrapper: createWrapper(queryClient),
    });

    result.current.mutate({ payload: validUser });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Verify query cache was updated
    const cacheData = queryClient.getQueryData(["userAccount"]);
    expect(cacheData).toBe(null); // For 201 status, data is null

    // Restore original fetch
    global.fetch = originalFetch;
  });
});
