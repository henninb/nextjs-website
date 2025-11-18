/**
 * Test utilities for isolated business logic testing
 * Provides common patterns for testing pure functions without React/MSW overhead
 */

// Mock response utilities
export interface MockResponse {
  ok: boolean;
  status: number;
  statusText: string;
  json: () => Promise<any>;
  text: () => Promise<string>;
}

export const createMockResponse = (
  data: any,
  options: { status?: number; ok?: boolean } = {},
): MockResponse => ({
  ok: options.ok ?? true,
  status: options.status ?? 200,
  statusText: options.status === 204 ? "No Content" : "OK",
  json: jest.fn().mockResolvedValue(data),
  text: jest.fn().mockResolvedValue(JSON.stringify(data)),
});

export const createErrorResponse = (
  message: string,
  status: number = 400,
): MockResponse => ({
  ok: false,
  status,
  statusText: "Bad Request",
  json: jest.fn().mockResolvedValue({ response: message }),
  text: jest.fn().mockResolvedValue(JSON.stringify({ response: message })),
});

export const createFetchMock = (
  responseData: any,
  options: { status?: number; ok?: boolean } = {},
) => {
  return jest.fn().mockResolvedValue(createMockResponse(responseData, options));
};

export const createErrorFetchMock = (message: string, status: number = 400) => {
  return jest.fn().mockResolvedValue(createErrorResponse(message, status));
};

// Console utilities for testing logging behavior
export class ConsoleSpy {
  private originalConsole: typeof console;
  private mockLog: jest.SpyInstance;
  private mockError: jest.SpyInstance;
  private mockWarn: jest.SpyInstance;

  constructor() {
    this.originalConsole = console;
    this.mockLog = jest.fn();
    this.mockError = jest.fn();
    this.mockWarn = jest.fn();
  }

  start() {
    console.log = this.mockLog as any;
    console.error = this.mockError as any;
    console.warn = this.mockWarn as any;
    return {
      log: this.mockLog,
      error: this.mockError,
      warn: this.mockWarn,
    };
  }

  stop() {
    console.log = this.originalConsole.log;
    console.error = this.originalConsole.error;
    console.warn = this.originalConsole.warn;
  }

  getCalls() {
    return {
      log: this.mockLog.mock.calls,
      error: this.mockError.mock.calls,
      warn: this.mockWarn.mock.calls,
    };
  }
}

// Test data generators
export const createTestAccount = (overrides = {}) => ({
  accountId: 1,
  accountNameOwner: "testAccount",
  accountType: "checking",
  activeStatus: true,
  moniker: "Test Account",
  outstanding: 0.0,
  future: 0.0,
  cleared: 0.0,
  totals: 1000.0,
  totalsBalanced: 1000.0,
  dateClosed: new Date(0),
  dateAdded: new Date(),
  dateUpdated: new Date(),
  validationDate: new Date(0),
  ...overrides,
});

export const createTestCategory = (overrides = {}) => ({
  categoryId: 1,
  categoryName: "electronics",
  activeStatus: true,
  ...overrides,
});

export const createTestPayment = (overrides = {}) => ({
  transactionId: 1,
  accountNameOwner: "testAccount",
  transactionDate: "2024-01-01",
  description: "Test payment",
  category: "electronics",
  amount: 100.0,
  cleared: 0,
  reoccurring: false,
  notes: "",
  receiptImageId: 0,
  ...overrides,
});

export const createTestTransaction = (overrides = {}) => ({
  transactionId: 1,
  guid: "test-guid-123",
  accountId: 100,
  accountType: "checking",
  accountNameOwner: "testAccount",
  transactionDate: new Date("2024-01-01"),
  description: "Test transaction",
  category: "electronics",
  amount: 100.0,
  transactionState: "outstanding",
  transactionType: "expense",
  activeStatus: true,
  reoccurringType: "onetime",
  notes: "",
  dueDate: "2024-12-31",
  ...overrides,
});

export const createTestTransfer = (overrides = {}) => ({
  transferId: 1,
  sourceAccount: "fromAccount",
  destinationAccount: "toAccount",
  transactionDate: new Date("2024-01-01"),
  amount: 100.0,
  guidSource: "source-guid-123",
  guidDestination: "dest-guid-456",
  activeStatus: true,
  dateAdded: new Date("2024-01-01"),
  dateUpdated: new Date("2024-01-01"),
  ...overrides,
});

export const createTestParameter = (overrides = {}) => ({
  parameterId: 1,
  parameterName: "testParameter",
  parameterValue: "testValue",
  activeStatus: true,
  ...overrides,
});

export const createTestUser = (overrides = {}) => ({
  userId: 1,
  username: "testuser",
  password: "TestPassword123!",
  firstName: "Test",
  lastName: "User",
  ...overrides,
});

export const createTestDescription = (overrides = {}) => ({
  descriptionId: 1,
  descriptionName: "testDescription",
  activeStatus: true,
  dateAdded: new Date("2024-01-01"),
  dateUpdated: new Date("2024-01-01"),
  ...overrides,
});

// Common mock setups for security utilities
export const createMockValidationUtils = () => ({
  InputSanitizer: {
    sanitizeAccountName: jest.fn((input) => input?.trim()),
    sanitizeString: jest.fn((input) => input?.trim()),
    sanitizeAmount: jest.fn((input) => parseFloat(input)),
    sanitizeUsername: jest.fn((input) => input?.trim()),
  },
  SecurityLogger: {
    logSanitizationAttempt: jest.fn(),
    logValidationFailure: jest.fn(),
    logSecurityEvent: jest.fn(),
  },
  hookValidators: {
    validateApiPayload: jest.fn(() => ({
      isValid: true,
      validatedData: { username: "testuser", password: "TestPassword123!" },
      errors: null,
    })),
  },
  DataValidator: {
    validateUser: jest.fn(() => ({ isValid: true })),
    validateCategory: jest.fn(() => ({ isValid: true })),
    validatePayment: jest.fn(() => ({ isValid: true })),
    validateTransaction: jest.fn(() => ({ isValid: true })),
  },
});

// Error simulation utilities
export const simulateNetworkError = () => {
  return jest.fn().mockRejectedValue(new Error("Network error"));
};

export const simulateTimeoutError = () => {
  return jest.fn().mockRejectedValue(new Error("Request timeout"));
};

export const simulateServerError = (message = "Internal server error") => {
  return createFetchMock({ response: message }, { status: 500, ok: false });
};

// Validation helpers
export const expectSuccessfulDeletion = async (
  deleteFunction: Function,
  payload: any,
) => {
  global.fetch = createFetchMock(null, { status: 204 });
  const result = await deleteFunction(payload);
  expect(result).toBeNull();
  expect(global.fetch).toHaveBeenCalledWith(
    expect.stringContaining("/delete/"),
    expect.objectContaining({
      method: "DELETE",
      credentials: "include",
    }),
  );
};

export const expectValidationError = async (
  deleteFunction: Function,
  payload: any,
  expectedError: string,
) => {
  await expect(deleteFunction(payload)).rejects.toThrow(expectedError);
};

export const expectServerError = async (
  deleteFunction: Function,
  payload: any,
  errorMessage = "Server error",
) => {
  global.fetch = createErrorFetchMock(errorMessage, 400);
  await expect(deleteFunction(payload)).rejects.toThrow(errorMessage);
};

/**
 * Modern API Test Helpers
 * Test utilities for modern RESTful endpoints using ServiceResult pattern
 *
 * Key differences from legacy:
 * - Error responses use { error: "message" } instead of { response: "message" }
 * - Empty lists return [] instead of throwing 404
 * - Consistent HTTP status codes (200, 201, 204, 400, 401, 403, 404, 409, 500)
 */

// Modern mock response utilities
export interface ModernMockResponse {
  ok: boolean;
  status: number;
  statusText: string;
  json: () => Promise<any>;
  text: () => Promise<string>;
}

/**
 * Create a modern success response
 */
export const createModernMockResponse = (
  data: any,
  options: { status?: number; ok?: boolean } = {},
): ModernMockResponse => ({
  ok: options.ok ?? true,
  status: options.status ?? 200,
  statusText: options.status === 204 ? "No Content" : "OK",
  json: jest.fn().mockResolvedValue(data),
  text: jest.fn().mockResolvedValue(JSON.stringify(data)),
});

/**
 * Create a modern error response with ServiceResult pattern
 * Uses { error: "message" } format
 */
export const createModernErrorResponse = (
  message: string,
  status: number = 400,
): ModernMockResponse => ({
  ok: false,
  status,
  statusText: getStatusText(status),
  json: jest.fn().mockResolvedValue({ error: message }),
  text: jest.fn().mockResolvedValue(JSON.stringify({ error: message })),
});

/**
 * Create a modern validation error response
 * Uses { errors: ["message1", "message2"] } format
 */
export const createModernValidationErrorResponse = (
  errors: string[],
  status: number = 400,
): ModernMockResponse => ({
  ok: false,
  status,
  statusText: getStatusText(status),
  json: jest.fn().mockResolvedValue({ errors }),
  text: jest.fn().mockResolvedValue(JSON.stringify({ errors })),
});

/**
 * Create a modern fetch mock for success responses
 */
export const createModernFetchMock = (
  responseData: any,
  options: { status?: number; ok?: boolean } = {},
) => {
  return jest
    .fn()
    .mockResolvedValue(createModernMockResponse(responseData, options));
};

/**
 * Create a modern fetch mock for error responses
 */
export const createModernErrorFetchMock = (
  message: string,
  status: number = 400,
) => {
  return jest
    .fn()
    .mockResolvedValue(createModernErrorResponse(message, status));
};

/**
 * Create a modern fetch mock for validation errors
 */
export const createModernValidationErrorFetchMock = (
  errors: string[],
  status: number = 400,
) => {
  return jest
    .fn()
    .mockResolvedValue(createModernValidationErrorResponse(errors, status));
};

/**
 * Get HTTP status text for a given status code
 */
function getStatusText(status: number): string {
  const statusTexts: Record<number, string> = {
    200: "OK",
    201: "Created",
    204: "No Content",
    400: "Bad Request",
    401: "Unauthorized",
    403: "Forbidden",
    404: "Not Found",
    409: "Conflict",
    500: "Internal Server Error",
    503: "Service Unavailable",
  };
  return statusTexts[status] || "Unknown";
}

/**
 * Modern error simulation utilities
 */
export const simulateModernNetworkError = () => {
  return jest.fn().mockRejectedValue(new Error("Network error"));
};

export const simulateModernTimeoutError = () => {
  return jest.fn().mockRejectedValue(new Error("Request timeout"));
};

export const simulateModernServerError = (
  message = "Internal server error",
) => {
  return createModernErrorFetchMock(message, 500);
};

/**
 * Modern validation helpers for testing CRUD operations
 */
export const expectModernSuccessfulFetch = async (
  fetchFunction: Function,
  expectedData: any,
) => {
  global.fetch = createModernFetchMock(expectedData);
  const result = await fetchFunction();
  expect(result).toEqual(expectedData);
};

export const expectModernSuccessfulCreate = async (
  createFunction: Function,
  payload: any,
  expectedResponse: any,
) => {
  global.fetch = createModernFetchMock(expectedResponse, { status: 201 });
  const result = await createFunction(payload);
  expect(result).toEqual(expectedResponse);
};

export const expectModernSuccessfulUpdate = async (
  updateFunction: Function,
  oldData: any,
  newData: any,
  expectedResponse: any,
) => {
  global.fetch = createModernFetchMock(expectedResponse);
  const result = await updateFunction(oldData, newData);
  expect(result).toEqual(expectedResponse);
};

export const expectModernSuccessfulDeletion = async (
  deleteFunction: Function,
  payload: any,
) => {
  global.fetch = createModernFetchMock(null, { status: 204 });
  const result = await deleteFunction(payload);
  expect(result).toBeNull();
};

export const expectModernValidationError = async (
  apiFunction: Function,
  payload: any,
  expectedError: string,
) => {
  global.fetch = createModernErrorFetchMock(expectedError, 400);
  await expect(apiFunction(payload)).rejects.toThrow(expectedError);
};

export const expectModernNotFoundError = async (
  apiFunction: Function,
  payload: any,
  expectedError: string = "Not found",
) => {
  global.fetch = createModernErrorFetchMock(expectedError, 404);
  await expect(apiFunction(payload)).rejects.toThrow(expectedError);
};

export const expectModernUnauthorizedError = async (
  apiFunction: Function,
  payload: any,
) => {
  global.fetch = createModernErrorFetchMock("Unauthorized", 401);
  await expect(apiFunction(payload)).rejects.toThrow("Unauthorized");
};

export const expectModernServerError = async (
  apiFunction: Function,
  payload: any,
  errorMessage = "Internal server error",
) => {
  global.fetch = createModernErrorFetchMock(errorMessage, 500);
  await expect(apiFunction(payload)).rejects.toThrow(errorMessage);
};

/**
 * Modern endpoint pattern helpers
 */
export const modernEndpoints = {
  // Standard CRUD patterns (no action prefixes)
  list: (resource: string) => `/api/${resource}/active`,
  get: (resource: string, id: string | number) => `/api/${resource}/${id}`,
  create: (resource: string) => `/api/${resource}`,
  update: (resource: string, id: string | number) => `/api/${resource}/${id}`,
  delete: (resource: string, id: string | number) => `/api/${resource}/${id}`,
};

/**
 * Verify modern endpoint structure
 */
export const verifyModernEndpoint = (
  actualEndpoint: string,
  expectedResource: string,
  operation: "list" | "get" | "create" | "update" | "delete",
  id?: string | number,
) => {
  const expected =
    operation === "list"
      ? modernEndpoints.list(expectedResource)
      : operation === "create"
        ? modernEndpoints.create(expectedResource)
        : modernEndpoints[operation](expectedResource, id!);

  expect(actualEndpoint).toBe(expected);
};
