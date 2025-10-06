/**
 * Modern API Test Helpers
 * Test utilities for modern RESTful endpoints using ServiceResult pattern
 *
 * Key differences from legacy:
 * - Error responses use { error: "message" } instead of { response: "message" }
 * - Empty lists return [] instead of throwing 404
 * - Consistent HTTP status codes (200, 201, 204, 400, 401, 403, 404, 409, 500)
 */

// Re-export common utilities from legacy helpers
export {
  ConsoleSpy,
  createTestParameter,
  createTestAccount,
  createTestCategory,
  createTestPayment,
  createTestTransaction,
  createTestTransfer,
  createTestUser,
  createTestDescription,
} from "./testHelpers";

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
