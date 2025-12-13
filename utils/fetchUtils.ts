import { getCsrfHeaders, clearCsrfToken } from "./csrf";

/**
 * Custom error class for fetch operations with enhanced error information
 * Provides structured error data including HTTP status codes and response body
 */
export class FetchError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly statusText?: string,
    public readonly body?: unknown,
  ) {
    super(message);
    this.name = "FetchError";

    // Maintains proper stack trace for where error was thrown (V8 engines)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, FetchError);
    }
  }

  /**
   * Check if error is a client error (4xx status code)
   */
  get isClientError(): boolean {
    return this.status !== undefined && this.status >= 400 && this.status < 500;
  }

  /**
   * Check if error is a server error (5xx status code)
   */
  get isServerError(): boolean {
    return this.status !== undefined && this.status >= 500;
  }

  /**
   * Check if error is a network error (no status code available)
   */
  get isNetworkError(): boolean {
    return this.status === undefined;
  }

  /**
   * Check if error is authentication related (401 or 403)
   */
  get isAuthError(): boolean {
    return this.status === 401 || this.status === 403;
  }

  /**
   * Get user-friendly error message
   */
  getUserMessage(): string {
    if (this.isNetworkError) {
      return "Network connection error. Please check your internet connection.";
    }
    if (this.status === 401) {
      return "Authentication required. Please log in.";
    }
    if (this.status === 403) {
      return "Access denied. You don't have permission to perform this action.";
    }
    if (this.status === 404) {
      return "The requested resource was not found.";
    }
    if (this.isServerError) {
      return "Server error. Please try again later.";
    }
    return this.message;
  }
}

/**
 * Standardized error handler for fetch responses
 * Parses error response body and throws FetchError
 *
 * @param response - Fetch Response object
 * @throws {FetchError} Always throws with structured error information
 */
export async function handleFetchError(response: Response): Promise<never> {
  let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
  let errorBody: unknown;

  try {
    // Attempt to parse error response as JSON
    errorBody = await response.json();

    if (errorBody && typeof errorBody === "object") {
      const body = errorBody as Record<string, unknown>;
      // Try common error message fields
      errorMessage = (body.response ||
        body.message ||
        body.error ||
        errorMessage) as string;
    }
  } catch {
    // Failed to parse JSON, use default message
    // This is expected for non-JSON error responses
  }

  throw new FetchError(
    errorMessage,
    response.status,
    response.statusText,
    errorBody,
  );
}

/**
 * Standard fetch options with credentials and headers
 * Used as base configuration for all API requests
 */
export const DEFAULT_FETCH_OPTIONS: RequestInit = {
  credentials: "include", // Include cookies for authentication
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
} as const;

/**
 * Wrapper for fetch with standardized error handling
 * Automatically includes default options and handles errors consistently
 * Includes CSRF token protection for mutation requests (POST, PUT, DELETE, PATCH)
 *
 * @param url - URL to fetch
 * @param options - Additional fetch options (merged with defaults)
 * @returns Response object if successful
 * @throws {FetchError} On HTTP errors or network failures
 *
 * @example
 * ```typescript
 * const response = await fetchWithErrorHandling("/api/account", {
 *   method: "POST",
 *   body: JSON.stringify(data),
 * });
 * ```
 */
export async function fetchWithErrorHandling(
  url: string,
  options?: RequestInit,
): Promise<Response> {
  // Add CSRF headers for mutation requests
  const isMutation =
    options?.method &&
    ["POST", "PUT", "DELETE", "PATCH"].includes(options.method);
  console.log(`[fetchUtils] ${options?.method || "GET"} ${url}, isMutation:${isMutation}`);
  const csrfHeaders = isMutation ? await getCsrfHeaders() : {};
  console.log("[fetchUtils] CSRF headers:", csrfHeaders);

  try {
    const finalHeaders = {
      ...DEFAULT_FETCH_OPTIONS.headers,
      ...csrfHeaders,
      ...options?.headers,
    };
    console.log("[fetchUtils] Final headers:", Object.keys(finalHeaders).join(", "));
    const response = await fetch(url, {
      ...DEFAULT_FETCH_OPTIONS,
      ...options,
      headers: finalHeaders,
    });

    if (!response.ok) {
      // Handle CSRF token expiration
      if (response.status === 403 && isMutation) {
        try {
          const errorText =
            typeof response.text === "function"
              ? await response.text()
              : "";
          if (
            errorText.includes("CSRF") ||
            errorText.includes("Invalid CSRF token")
          ) {
            console.warn("[CSRF] Token invalid, clearing cache");
            clearCsrfToken();
          }
        } catch {
          // Ignore errors reading response text
        }
      }
      await handleFetchError(response);
    }

    return response;
  } catch (error: unknown) {
    // If already a FetchError, re-throw it
    if (error instanceof FetchError) {
      throw error;
    }

    // Network error or other issue
    if (error instanceof Error) {
      // Check for abort errors
      if (error.name === "AbortError") {
        throw new FetchError("Request timeout or cancelled");
      }

      throw new FetchError(`Network request failed: ${error.message}`);
    }

    // Unknown error type
    throw new FetchError("Network request failed with unknown error");
  }
}

/**
 * Parse response body with null handling for 204 No Content
 * Safely handles JSON parsing and empty responses
 *
 * @param response - Fetch Response object
 * @returns Parsed JSON data or null for 204 responses
 * @throws {FetchError} On parsing failures
 *
 * @example
 * ```typescript
 * const response = await fetchWithErrorHandling("/api/account");
 * const data = await parseResponse<Account[]>(response);
 * ```
 */
export async function parseResponse<T>(response: Response): Promise<T | null> {
  // HTTP 204 No Content - return null
  if (response.status === 204) {
    return null;
  }

  try {
    return (await response.json()) as T;
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to parse response";
    throw new FetchError(
      `Response parsing failed: ${message}`,
      response.status,
      response.statusText,
    );
  }
}

/**
 * Fetch with automatic timeout and abort support
 * Adds timeout functionality to prevent hanging requests
 *
 * @param url - URL to fetch
 * @param options - Fetch options with optional timeout property
 * @returns Response object if successful
 * @throws {FetchError} On timeout, HTTP errors, or network failures
 *
 * @example
 * ```typescript
 * const response = await fetchWithTimeout("/api/account", {
 *   method: "GET",
 *   timeout: 5000, // 5 second timeout
 * });
 * ```
 */
export async function fetchWithTimeout(
  url: string,
  options?: RequestInit & { timeout?: number },
): Promise<Response> {
  const timeout = options?.timeout ?? 30000; // 30 second default
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetchWithErrorHandling(url, {
      ...options,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return response;
  } catch (error: unknown) {
    clearTimeout(timeoutId);

    if (error instanceof Error && error.name === "AbortError") {
      throw new FetchError("Request timeout", undefined, "Timeout");
    }

    throw error;
  }
}

/**
 * Create a fetch function compatible with React Query
 * Returns a function that receives signal from React Query for cancellation
 *
 * @param url - URL to fetch
 * @param options - Fetch options (signal will be overridden by React Query)
 * @returns Function compatible with React Query queryFn
 *
 * @example
 * ```typescript
 * const fetchAccountData = createQueryFn<Account[]>("/api/account/active", {
 *   method: "GET",
 * });
 *
 * export default function useAccountFetch() {
 *   return useAuthenticatedQuery(["account"], fetchAccountData);
 * }
 * ```
 */
export function createQueryFn<T>(
  url: string,
  options?: Omit<RequestInit, "signal">,
) {
  return async ({ signal }: { signal?: AbortSignal }): Promise<T> => {
    const response = await fetchWithErrorHandling(url, {
      ...options,
      signal,
    });

    const data = await parseResponse<T>(response);

    // If parseResponse returns null but we expect data, throw error
    if (data === null && response.status !== 204) {
      throw new FetchError("Expected data but received null", response.status);
    }

    return data as T;
  };
}

/**
 * Create a mutation function with standard error handling
 * For POST, PUT, DELETE operations
 *
 * @param url - URL for the mutation
 * @param method - HTTP method (POST, PUT, DELETE, PATCH)
 * @returns Function that accepts payload and returns promise
 *
 * @example
 * ```typescript
 * export const insertAccount = createMutationFn<Account, Account>(
 *   "/api/account",
 *   "POST"
 * );
 *
 * // Usage
 * const result = await insertAccount(accountData);
 * ```
 */
export function createMutationFn<TData, TPayload = TData>(
  url: string | ((payload: TPayload) => string),
  method: "POST" | "PUT" | "DELETE" | "PATCH",
) {
  return async (payload: TPayload): Promise<TData | null> => {
    const finalUrl = typeof url === "function" ? url(payload) : url;

    const options: RequestInit = {
      method,
    };

    // Only add body for methods that support it
    if (method !== "DELETE") {
      options.body = JSON.stringify(payload);
    }

    const response = await fetchWithErrorHandling(finalUrl, options);
    return parseResponse<TData>(response);
  };
}

/**
 * Type guard to check if error is a FetchError
 */
export function isFetchError(error: unknown): error is FetchError {
  return error instanceof FetchError;
}

/**
 * Extract user-friendly error message from any error
 */
export function getErrorMessage(error: unknown): string {
  if (isFetchError(error)) {
    return error.getUserMessage();
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  if (error && typeof error === "object" && "message" in error) {
    return String(error.message);
  }

  return "An unknown error occurred";
}
