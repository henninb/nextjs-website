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
  options: { status?: number; ok?: boolean } = {}
): MockResponse => ({
  ok: options.ok ?? true,
  status: options.status ?? 200,
  statusText: options.status === 204 ? "No Content" : "OK",
  json: jest.fn().mockResolvedValue(data),
  text: jest.fn().mockResolvedValue(JSON.stringify(data)),
});

export const createErrorResponse = (
  message: string,
  status: number = 400
): MockResponse => ({
  ok: false,
  status,
  statusText: "Bad Request",
  json: jest.fn().mockResolvedValue({ response: message }),
  text: jest.fn().mockResolvedValue(JSON.stringify({ response: message })),
});

export const createFetchMock = (
  responseData: any,
  options: { status?: number; ok?: boolean } = {}
) => {
  return jest.fn().mockResolvedValue(createMockResponse(responseData, options));
};

export const createErrorFetchMock = (
  message: string,
  status: number = 400
) => {
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
    console.log = this.mockLog;
    console.error = this.mockError;
    console.warn = this.mockWarn;
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
  totals: 1000.00,
  totalsBalanced: 1000.00,
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
  amount: 100.00,
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
  amount: 100.00,
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
  amount: 100.00,
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
export const expectSuccessfulDeletion = async (deleteFunction: Function, payload: any) => {
  global.fetch = createFetchMock(null, { status: 204 });
  const result = await deleteFunction(payload);
  expect(result).toBeNull();
  expect(global.fetch).toHaveBeenCalledWith(
    expect.stringContaining("/delete/"),
    expect.objectContaining({
      method: "DELETE",
      credentials: "include",
    })
  );
};

export const expectValidationError = async (
  deleteFunction: Function,
  payload: any,
  expectedError: string
) => {
  await expect(deleteFunction(payload)).rejects.toThrow(expectedError);
};

export const expectServerError = async (
  deleteFunction: Function,
  payload: any,
  errorMessage = "Server error"
) => {
  global.fetch = createErrorResponse(errorMessage, 400);
  await expect(deleteFunction(payload)).rejects.toThrow(errorMessage);
};