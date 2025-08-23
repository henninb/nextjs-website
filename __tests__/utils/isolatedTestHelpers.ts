/**
 * Isolated Test Helpers
 * 
 * Utilities for creating isolated, fast-running tests that focus on pure business logic
 * without React, DOM, or external dependencies.
 */

// Mock Response for API testing
export class MockResponse implements Partial<Response> {
  ok: boolean;
  status: number;
  private data: any;
  private jsonError?: Error;

  constructor(data: any, options: { status?: number; ok?: boolean; jsonError?: Error } = {}) {
    this.data = data;
    this.status = options.status ?? 200;
    this.ok = options.ok ?? (this.status >= 200 && this.status < 300);
    this.jsonError = options.jsonError;
  }

  async json() {
    if (this.jsonError) {
      throw this.jsonError;
    }
    return this.data;
  }
}

// Simple fetch mock creator
export const createFetchMock = (response: any, options?: { status?: number; ok?: boolean; jsonError?: Error }) => {
  return jest.fn().mockResolvedValue(new MockResponse(response, options));
};

// Error fetch mock creator
export const createFetchErrorMock = (error: Error) => {
  return jest.fn().mockRejectedValue(error);
};

// Console spy helper
export class ConsoleSpy {
  private originalLog: typeof console.log;
  private mockLog: jest.Mock;

  constructor() {
    this.originalLog = console.log;
    this.mockLog = jest.fn();
  }

  start() {
    console.log = this.mockLog;
    return this.mockLog;
  }

  stop() {
    console.log = this.originalLog;
  }

  getCallsContaining(substring: string) {
    return this.mockLog.mock.calls.filter(call => 
      call.some(arg => typeof arg === 'string' && arg.includes(substring))
    );
  }

  wasCalledWith(message: string) {
    return this.mockLog.mock.calls.some(call => 
      call.some(arg => arg === message)
    );
  }
}

// Mock creator for isolated function testing
export const createIsolatedMock = <T extends (...args: any[]) => any>(
  implementation?: T
): jest.MockedFunction<T> => {
  return jest.fn(implementation) as jest.MockedFunction<T>;
};

// Validation result helper
export interface ValidationResult {
  isValid: boolean;
  errors?: string[];
}

export const createValidationResult = (isValid: boolean, errors?: string[]): ValidationResult => ({
  isValid,
  errors: !isValid && errors?.length ? errors : undefined,
});

// API Response helpers for consistent testing
export const createSuccessResponse = <T>(data: T, status: number = 200) => 
  new MockResponse(data, { status, ok: true });

export const createErrorResponse = (message: string, status: number = 400) => 
  new MockResponse({ response: message }, { status, ok: false });

export const createNetworkErrorResponse = () => 
  createFetchErrorMock(new Error("Network error"));

export const createTimeoutErrorResponse = () => 
  createFetchErrorMock(new Error("Request timeout"));

// Test data generators
export const createTestAccount = (overrides: Partial<any> = {}) => ({
  accountId: 123,
  accountNameOwner: "test_account",
  accountType: "debit",
  activeStatus: true,
  moniker: "0000",
  outstanding: 100,
  future: 300,
  cleared: 200,
  ...overrides,
});

export const createTestCategory = (overrides: Partial<any> = {}) => ({
  categoryId: 1,
  categoryName: "electronics",
  activeStatus: true,
  categoryCount: 10,
  dateAdded: new Date(),
  dateUpdated: new Date(),
  ...overrides,
});

// Async error testing helper
export const expectAsyncError = async <T>(
  asyncFunction: () => Promise<T>,
  expectedError: string | RegExp
) => {
  await expect(asyncFunction()).rejects.toThrow(expectedError);
};

// Input validation test cases generator
export const generateValidationTestCases = (
  validCases: Array<{ input: any; description: string }>,
  invalidCases: Array<{ input: any; description: string; expectedErrors?: string[] }>
) => ({
  valid: validCases,
  invalid: invalidCases,
});

// Mock cleanup helper
export const cleanupMocks = (...mocks: jest.Mock[]) => {
  mocks.forEach(mock => mock.mockClear());
};

// Environment variable mocker for isolated tests
export const mockEnvVar = (key: string, value: string) => {
  const original = process.env[key];
  process.env[key] = value;
  return () => {
    if (original === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = original;
    }
  };
};

// Date mocker for consistent date testing
export const mockDate = (date: string | Date) => {
  const mockDate = new Date(date);
  const originalDate = Date;
  
  global.Date = jest.fn(() => mockDate) as any;
  global.Date.now = jest.fn(() => mockDate.getTime());
  
  return () => {
    global.Date = originalDate;
  };
};

// Error boundary simulation for component logic
export const simulateError = <T>(fn: () => T, error: Error): jest.Mock => {
  return jest.fn(() => {
    throw error;
  });
};

export default {
  MockResponse,
  createFetchMock,
  createFetchErrorMock,
  ConsoleSpy,
  createIsolatedMock,
  createValidationResult,
  createSuccessResponse,
  createErrorResponse,
  createNetworkErrorResponse,
  createTimeoutErrorResponse,
  createTestAccount,
  createTestCategory,
  expectAsyncError,
  generateValidationTestCases,
  cleanupMocks,
  mockEnvVar,
  mockDate,
  simulateError,
};