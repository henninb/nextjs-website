# Hooks Normalization & Improvement Plan

**Project:** NextJS Website - Finance Application
**Date:** 2025-11-13
**Scope:** 79 custom React hooks normalization and improvement
**Estimated Effort:** 8-12 weeks (can be done incrementally)

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Current State Analysis](#current-state-analysis)
3. [Implementation Phases](#implementation-phases)
4. [Detailed Action Items](#detailed-action-items)
5. [Code Examples & Templates](#code-examples--templates)
6. [Migration Strategy](#migration-strategy)
7. [Testing Strategy](#testing-strategy)
8. [Success Metrics](#success-metrics)

---

## Executive Summary

### Goals

- **Security:** Add validation and sanitization to all user inputs (9% → 100%)
- **Consistency:** Standardize patterns across 79 hooks
- **Architecture:** Resolve REST/GraphQL redundancy (27% duplication)
- **Maintainability:** Reduce code duplication by ~40%
- **Type Safety:** Improve error handling and TypeScript coverage

### Impact Assessment

- **Lines of Code:** ~5,300 lines across 79 files
- **Security Improvements:** 72 hooks need validation/sanitization
- **Code Reduction:** Estimated 30-40% reduction via utilities
- **Breaking Changes:** Minimal (internal hook implementation only)

### Priority Ranking

1. **Phase 1:** Foundation & Security (Weeks 1-3) - **CRITICAL**
2. **Phase 2:** Consistency & Auth (Weeks 4-6) - **HIGH**
3. **Phase 3:** Architecture (Weeks 7-9) - **MEDIUM**
4. **Phase 4:** Optimization (Weeks 10-12) - **LOW**

---

## Current State Analysis

### Hooks Inventory

| Category      | Count  | Notes                                      |
| ------------- | ------ | ------------------------------------------ |
| Fetch (REST)  | 23     | React Query with consistent patterns       |
| Insert (REST) | 16     | 7 have validation, 9 missing               |
| Update (REST) | 16     | 0 have validation                          |
| Delete (REST) | 17     | 2 have sanitization                        |
| GraphQL       | 21     | Duplicate functionality, excessive logging |
| Custom State  | 4      | Non-React Query (localStorage, auth)       |
| **Total**     | **79** | Average 67 lines/hook                      |

### Critical Issues

#### Security Vulnerabilities (Priority: CRITICAL)

- **Validation Coverage:** 9% (7/79 hooks)
- **Sanitization Coverage:** 3% (2/79 hooks)
- **Risk Areas:**
  - URL path parameters (accountNameOwner, guid, etc.)
  - User-controlled identifiers in all update/delete operations
  - GraphQL query variables

#### Consistency Problems (Priority: HIGH)

- **Logging:** 50 hooks use console.log/error inconsistently
- **Auth Gating:** 43% of fetch hooks missing authentication checks
- **Error Handling:** 3 different patterns across hooks
- **Cache Updates:** 3 different strategies with no documentation

#### Architecture Issues (Priority: MEDIUM)

- **REST/GraphQL Duplication:** 21 GraphQL hooks duplicate REST (27%)
- **Cache Fragmentation:** Dual cache keys (e.g., "account" vs "accountsGQL")
- **Magic Numbers:** staleTime and retry hardcoded 75+ times

---

## Implementation Phases

### Phase 1: Foundation & Security (Weeks 1-3) ⚠️ CRITICAL

**Goal:** Establish shared utilities and fix security vulnerabilities

**Deliverables:**

1. Centralized query configuration
2. Standardized error handling utilities
3. Comprehensive validation layer
4. Input sanitization for all operations
5. Shared fetch utilities

**Effort:** 3 weeks, 1 developer
**Impact:** Fixes critical security issues, enables phases 2-4

---

### Phase 2: Consistency & Authentication (Weeks 4-6) 📊 HIGH

**Goal:** Apply consistent patterns and proper authentication

**Deliverables:**

1. Unified logging strategy
2. Authentication gating for all protected queries
3. Consistent cache update patterns
4. AbortController for request cancellation
5. Improved TypeScript error handling

**Effort:** 3 weeks, 1 developer
**Impact:** Improves reliability, UX, and maintainability

---

### Phase 3: Architecture Improvements (Weeks 7-9) 🏗️ MEDIUM

**Goal:** Resolve architectural redundancies and create reusable patterns

**Deliverables:**

1. REST vs GraphQL strategy decision
2. Hook factories for CRUD operations
3. Unified cache key strategy
4. Export helper functions for testability
5. Migration of deprecated patterns

**Effort:** 3 weeks, 1 developer
**Impact:** Reduces duplication by 40%, improves testability

---

### Phase 4: Optimization (Weeks 10-12) 🚀 LOW

**Goal:** Performance improvements and developer experience

**Deliverables:**

1. Optimistic updates for mutations
2. Request deduplication
3. Performance monitoring
4. Developer documentation
5. Hook composition patterns

**Effort:** 3 weeks, 1 developer
**Impact:** Better UX, faster development cycles

---

## Detailed Action Items

### Phase 1: Foundation & Security

#### 1.1 Create Centralized Query Configuration

**File:** `/utils/queryConfig.ts`

**Tasks:**

- [ ] Extract default query options (staleTime, retry)
- [ ] Create `createAuthenticatedQuery` helper
- [ ] Create `createAuthenticatedMutation` helper
- [ ] Add JSDoc documentation
- [ ] Write unit tests

**Code Template:**

```typescript
// utils/queryConfig.ts
import {
  useQuery,
  useMutation,
  QueryKey,
  UseQueryOptions,
  UseMutationOptions,
} from "@tanstack/react-query";
import { useAuth } from "../components/AuthProvider";

/**
 * Default configuration for all queries
 */
export const DEFAULT_QUERY_CONFIG = {
  staleTime: 5 * 60 * 1000, // 5 minutes
  retry: 1,
  refetchOnWindowFocus: false,
} as const;

/**
 * Default configuration for all mutations
 */
export const DEFAULT_MUTATION_CONFIG = {
  retry: 1,
} as const;

/**
 * Creates a query that automatically gates on authentication
 */
export function useAuthenticatedQuery<TData = unknown, TError = Error>(
  queryKey: QueryKey,
  queryFn: (context: { signal?: AbortSignal }) => Promise<TData>,
  options?: Omit<UseQueryOptions<TData, TError>, "queryKey" | "queryFn">,
) {
  const { isAuthenticated, loading } = useAuth();

  return useQuery<TData, TError>({
    ...DEFAULT_QUERY_CONFIG,
    queryKey,
    queryFn,
    enabled: !loading && isAuthenticated && (options?.enabled ?? true),
    ...options,
  });
}

/**
 * Creates a mutation with default configuration
 */
export function useStandardMutation<
  TData = unknown,
  TError = Error,
  TVariables = void,
>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: UseMutationOptions<TData, TError, TVariables>,
) {
  return useMutation<TData, TError, TVariables>({
    ...DEFAULT_MUTATION_CONFIG,
    mutationFn,
    ...options,
  });
}
```

**Migration Example:**

```typescript
// Before
export default function useAccountFetch() {
  const { isAuthenticated, loading } = useAuth();

  return useQuery<Account[], Error>({
    queryKey: ["account"],
    queryFn: fetchAccountData,
    staleTime: 5 * 60 * 1000,
    retry: 1,
    enabled: !loading && isAuthenticated,
  });
}

// After
import { useAuthenticatedQuery } from "../utils/queryConfig";

export default function useAccountFetch() {
  return useAuthenticatedQuery(["account"], fetchAccountData);
}
```

**Affected Hooks:** 75 hooks (all React Query hooks)

---

#### 1.2 Standardized Error Handling

**File:** `/utils/fetchUtils.ts`

**Tasks:**

- [ ] Create `handleFetchError` utility
- [ ] Create `FetchError` class with status codes
- [ ] Add retry logic for network errors
- [ ] Add error categorization (client vs server)
- [ ] Write unit tests

**Code Template:**

```typescript
// utils/fetchUtils.ts

/**
 * Custom error class for fetch operations
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
  }

  get isClientError(): boolean {
    return this.status !== undefined && this.status >= 400 && this.status < 500;
  }

  get isServerError(): boolean {
    return this.status !== undefined && this.status >= 500;
  }

  get isNetworkError(): boolean {
    return this.status === undefined;
  }
}

/**
 * Standardized error handler for fetch responses
 */
export async function handleFetchError(response: Response): Promise<never> {
  let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
  let errorBody: unknown;

  try {
    errorBody = await response.json();
    if (errorBody && typeof errorBody === "object") {
      const body = errorBody as Record<string, unknown>;
      errorMessage = (body.response ||
        body.message ||
        body.error ||
        errorMessage) as string;
    }
  } catch {
    // Failed to parse JSON, use default message
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
 */
export const DEFAULT_FETCH_OPTIONS: RequestInit = {
  credentials: "include",
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
} as const;

/**
 * Wrapper for fetch with standardized error handling
 */
export async function fetchWithErrorHandling(
  url: string,
  options?: RequestInit,
): Promise<Response> {
  try {
    const response = await fetch(url, {
      ...DEFAULT_FETCH_OPTIONS,
      ...options,
      headers: {
        ...DEFAULT_FETCH_OPTIONS.headers,
        ...options?.headers,
      },
    });

    if (!response.ok) {
      await handleFetchError(response);
    }

    return response;
  } catch (error: unknown) {
    if (error instanceof FetchError) {
      throw error;
    }

    // Network error or other issue
    const message =
      error instanceof Error ? error.message : "Network request failed";
    throw new FetchError(message);
  }
}

/**
 * Parse response with null handling for 204 No Content
 */
export async function parseResponse<T>(response: Response): Promise<T | null> {
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
    );
  }
}
```

**Migration Example:**

```typescript
// Before
export const deleteAccount = async (
  payload: Account,
): Promise<Account | null> => {
  try {
    const endpoint = `/api/account/${payload.accountNameOwner}`;
    const response = await fetch(endpoint, { method: "DELETE" });

    if (!response.ok) {
      let errorMessage = "";
      try {
        const errorBody = await response.json();
        errorMessage = errorBody?.response || "No error message returned.";
      } catch (error) {
        throw new Error(`Failed to parse error response: ${error.message}`);
      }
      throw new Error(errorMessage || "cannot throw a null value");
    }

    return response.status !== 204 ? await response.json() : null;
  } catch (error: any) {
    console.log(`An error occurred: ${error.message}`);
    throw error;
  }
};

// After
import { fetchWithErrorHandling, parseResponse } from "../utils/fetchUtils";
import { sanitizeAccountName } from "../utils/sanitization";

export const deleteAccount = async (
  payload: Account,
): Promise<Account | null> => {
  const sanitizedName = sanitizeAccountName(payload.accountNameOwner);
  if (!sanitizedName) {
    throw new FetchError("Invalid account name provided", 400);
  }

  const endpoint = `/api/account/${sanitizedName}`;
  const response = await fetchWithErrorHandling(endpoint, { method: "DELETE" });
  return parseResponse<Account>(response);
};
```

**Affected Hooks:** 79 hooks (all hooks with fetch operations)

---

#### 1.3 Comprehensive Validation Layer

**File:** `/utils/hookValidation.ts`

**Tasks:**

- [ ] Create validation wrapper for all operations (CRUD)
- [ ] Add pre-mutation validation
- [ ] Create entity-specific validators (extend existing)
- [ ] Add validation error types
- [ ] Write comprehensive tests

**Code Template:**

```typescript
// utils/hookValidation.ts
import {
  DataValidator,
  hookValidators,
  ValidationError,
  ValidationResult,
} from "./validation";

/**
 * Standard validation wrapper for all hook operations
 */
export class HookValidator {
  /**
   * Validate data before insert operation
   */
  static validateInsert<T>(
    data: T,
    validator: (data: T) => ValidationResult<T>,
    operationName: string,
  ): T {
    const result = hookValidators.validateApiPayload(
      data,
      validator,
      operationName,
    );

    if (!result.isValid) {
      const errorMessages =
        result.errors?.map((err) => err.message).join(", ") ||
        "Validation failed";
      throw new ValidationError(
        `${operationName} validation failed: ${errorMessages}`,
      );
    }

    return result.validatedData;
  }

  /**
   * Validate data before update operation
   */
  static validateUpdate<T>(
    newData: T,
    oldData: T,
    validator: (data: T) => ValidationResult<T>,
    operationName: string,
  ): T {
    // Validate new data
    const result = hookValidators.validateApiPayload(
      newData,
      validator,
      operationName,
    );

    if (!result.isValid) {
      const errorMessages =
        result.errors?.map((err) => err.message).join(", ") ||
        "Validation failed";
      throw new ValidationError(
        `${operationName} validation failed: ${errorMessages}`,
      );
    }

    return result.validatedData;
  }

  /**
   * Validate identifier before delete operation
   */
  static validateDelete<T extends { [key: string]: any }>(
    data: T,
    identifierKey: keyof T,
    operationName: string,
  ): T {
    const identifier = data[identifierKey];

    if (
      !identifier ||
      (typeof identifier === "string" && identifier.trim() === "")
    ) {
      throw new ValidationError(
        `${operationName}: Invalid ${String(identifierKey)} provided`,
      );
    }

    return data;
  }

  /**
   * Validate GUID format
   */
  static validateGuid(guid: string, operationName: string): string {
    const guidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (!guidRegex.test(guid)) {
      throw new ValidationError(`${operationName}: Invalid GUID format`);
    }

    return guid;
  }

  /**
   * Validate account name format
   */
  static validateAccountName(
    accountName: string,
    operationName: string,
  ): string {
    if (!accountName || accountName.trim() === "") {
      throw new ValidationError(`${operationName}: Account name is required`);
    }

    // Add additional account name validation rules
    if (accountName.length > 100) {
      throw new ValidationError(`${operationName}: Account name too long`);
    }

    return accountName.trim();
  }
}

/**
 * Validation decorators for common patterns
 */
export function withValidation<T>(
  validator: (data: T) => ValidationResult<T>,
  operationName: string,
) {
  return function <U extends T>(data: U): U {
    return HookValidator.validateInsert(
      data,
      validator as any,
      operationName,
    ) as U;
  };
}
```

**Migration Example:**

```typescript
// Before (no validation)
export const updateAccount = async (
  payload: Account,
): Promise<Account | null> => {
  const endpoint = `/api/account/${payload.accountNameOwner}`;
  const response = await fetch(endpoint, {
    method: "PUT",
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return await response.json();
};

// After (with validation)
import { HookValidator } from "../utils/hookValidation";
import { DataValidator } from "../utils/validation";
import { fetchWithErrorHandling, parseResponse } from "../utils/fetchUtils";

export const updateAccount = async (
  newData: Account,
  oldData: Account,
): Promise<Account | null> => {
  // Validate new data
  const validatedData = HookValidator.validateUpdate(
    newData,
    oldData,
    DataValidator.validateAccount,
    "updateAccount",
  );

  // Validate account name
  const accountName = HookValidator.validateAccountName(
    validatedData.accountNameOwner,
    "updateAccount",
  );

  const endpoint = `/api/account/${accountName}`;
  const response = await fetchWithErrorHandling(endpoint, {
    method: "PUT",
    body: JSON.stringify(validatedData),
  });

  return parseResponse<Account>(response);
};
```

**New Validators Needed:**

Add to `/utils/validation.ts`:

- `validateTransfer`
- `validateMedicalExpense`
- `validateFamilyMember`
- `validateValidationAmount`
- `validatePendingTransaction`

**Affected Hooks:** 72 hooks (all insert/update/delete without validation)

---

#### 1.4 Input Sanitization Layer

**File:** `/utils/sanitization.ts`

**Tasks:**

- [ ] Create comprehensive sanitization utilities
- [ ] Add GUID sanitization (extend existing)
- [ ] Add account name sanitization
- [ ] Add category/description sanitization
- [ ] Write unit tests with XSS/injection scenarios

**Code Template:**

```typescript
// utils/sanitization.ts
import { InputSanitizer } from "./security";

/**
 * Extended sanitization utilities for hooks
 */
export class HookSanitizer {
  /**
   * Sanitize GUID for URL usage
   */
  static sanitizeGuid(guid: string): string {
    if (!guid) {
      throw new Error("GUID is required");
    }

    // Remove any characters that aren't valid in a GUID
    const sanitized = guid.replace(/[^a-f0-9-]/gi, "").toLowerCase();

    // Validate format
    const guidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
    if (!guidRegex.test(sanitized)) {
      throw new Error("Invalid GUID format");
    }

    return sanitized;
  }

  /**
   * Sanitize account name for URL usage
   */
  static sanitizeAccountName(accountName: string): string {
    if (!accountName || accountName.trim() === "") {
      throw new Error("Account name is required");
    }

    // Use existing InputSanitizer
    const sanitized = InputSanitizer.sanitizeAccountName(accountName);

    if (!sanitized) {
      throw new Error("Account name sanitization failed");
    }

    return sanitized;
  }

  /**
   * Sanitize category name
   */
  static sanitizeCategoryName(category: string): string {
    if (!category || category.trim() === "") {
      throw new Error("Category is required");
    }

    // Remove potentially dangerous characters
    const sanitized = category
      .trim()
      .replace(/[<>\"'`]/g, "") // Remove HTML/script characters
      .replace(/\\/g, "") // Remove backslashes
      .slice(0, 100); // Limit length

    if (sanitized === "") {
      throw new Error("Category contains only invalid characters");
    }

    return sanitized;
  }

  /**
   * Sanitize description
   */
  static sanitizeDescription(description: string): string {
    if (!description || description.trim() === "") {
      throw new Error("Description is required");
    }

    const sanitized = description
      .trim()
      .replace(/[<>\"'`]/g, "")
      .slice(0, 500);

    if (sanitized === "") {
      throw new Error("Description contains only invalid characters");
    }

    return sanitized;
  }

  /**
   * Sanitize parameter name (key)
   */
  static sanitizeParameterName(paramName: string): string {
    if (!paramName || paramName.trim() === "") {
      throw new Error("Parameter name is required");
    }

    const sanitized = paramName
      .trim()
      .replace(/[^a-zA-Z0-9_.-]/g, "") // Only allow alphanumeric, underscore, dot, dash
      .slice(0, 100);

    if (sanitized === "") {
      throw new Error("Parameter name contains only invalid characters");
    }

    return sanitized;
  }

  /**
   * Sanitize numeric ID
   */
  static sanitizeNumericId(
    id: number | string,
    fieldName: string = "ID",
  ): number {
    const numId = typeof id === "string" ? parseInt(id, 10) : id;

    if (isNaN(numId) || numId < 0 || !Number.isInteger(numId)) {
      throw new Error(`Invalid ${fieldName}: must be a positive integer`);
    }

    return numId;
  }

  /**
   * Sanitize object for URL query parameters
   */
  static sanitizeForUrl(value: string): string {
    return encodeURIComponent(value.trim());
  }
}
```

**Migration Example:**

```typescript
// Before (minimal sanitization)
export const deleteTransaction = async (
  payload: Transaction,
): Promise<Transaction | null> => {
  const endpoint = `/api/transaction/${payload.guid}`;
  const response = await fetch(endpoint, { method: "DELETE" });
  // ...
};

// After (with sanitization)
import { HookSanitizer } from "../utils/sanitization";

export const deleteTransaction = async (
  payload: Transaction,
): Promise<Transaction | null> => {
  const sanitizedGuid = HookSanitizer.sanitizeGuid(payload.guid);
  const endpoint = `/api/transaction/${sanitizedGuid}`;
  const response = await fetchWithErrorHandling(endpoint, { method: "DELETE" });
  return parseResponse<Transaction>(response);
};
```

**Affected Hooks:** 77 hooks (all except useAccountUsageTracking, useSportsData)

---

#### 1.5 Shared Fetch Utilities with AbortController

**File:** `/utils/fetchUtils.ts` (extend existing)

**Tasks:**

- [ ] Add AbortController support to all fetch operations
- [ ] Create timeout wrapper
- [ ] Add request deduplication
- [ ] Write cancellation tests

**Code Addition:**

```typescript
// utils/fetchUtils.ts (extend)

/**
 * Fetch with automatic timeout and abort support
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

    return parseResponse<T>(response) as Promise<T>;
  };
}
```

**Migration Example:**

```typescript
// Before
const fetchAccountData = async (): Promise<Account[] | null> => {
  const response = await fetch("/api/account/active", {
    method: "GET",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`);
  }

  return response.status !== 204 ? await response.json() : null;
};

export default function useAccountFetch() {
  return useAuthenticatedQuery(["account"], fetchAccountData);
}

// After
import { createQueryFn } from "../utils/fetchUtils";

const fetchAccountData = createQueryFn<Account[]>("/api/account/active", {
  method: "GET",
});

export default function useAccountFetch() {
  return useAuthenticatedQuery(["account"], fetchAccountData);
}
```

**Affected Hooks:** 23 fetch hooks

---

### Phase 2: Consistency & Authentication

#### 2.1 Unified Logging Strategy

**File:** `/utils/logger.ts`

**Tasks:**

- [ ] Create structured logging utility
- [ ] Add log levels (debug, info, warn, error)
- [ ] Add environment-based filtering
- [ ] Remove debug console.log from production
- [ ] Write logging tests

**Code Template:**

```typescript
// utils/logger.ts

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

interface LogContext {
  hook?: string;
  operation?: string;
  data?: unknown;
  [key: string]: unknown;
}

class Logger {
  private level: LogLevel;

  constructor() {
    // Set log level based on environment
    this.level =
      process.env.NODE_ENV === "production" ? LogLevel.WARN : LogLevel.DEBUG;
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.level;
  }

  private formatMessage(
    level: string,
    message: string,
    context?: LogContext,
  ): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` | ${JSON.stringify(context)}` : "";
    return `[${timestamp}] [${level}] ${message}${contextStr}`;
  }

  debug(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.log(this.formatMessage("DEBUG", message, context));
    }
  }

  info(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.log(this.formatMessage("INFO", message, context));
    }
  }

  warn(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(this.formatMessage("WARN", message, context));
    }
  }

  error(message: string, error?: Error | unknown, context?: LogContext): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      const errorContext = {
        ...context,
        error:
          error instanceof Error
            ? {
                message: error.message,
                stack: error.stack,
                name: error.name,
              }
            : error,
      };
      console.error(this.formatMessage("ERROR", message, errorContext));
    }
  }

  // Hook-specific logging
  hookDebug(hookName: string, operation: string, data?: unknown): void {
    this.debug(`[${hookName}] ${operation}`, {
      hook: hookName,
      operation,
      data,
    });
  }

  hookError(hookName: string, operation: string, error: Error | unknown): void {
    this.error(`[${hookName}] ${operation} failed`, error, {
      hook: hookName,
      operation,
    });
  }
}

export const logger = new Logger();

/**
 * Hook logger wrapper
 */
export function createHookLogger(hookName: string) {
  return {
    debug: (operation: string, data?: unknown) =>
      logger.hookDebug(hookName, operation, data),
    info: (message: string, context?: LogContext) =>
      logger.info(message, { hook: hookName, ...context }),
    warn: (message: string, context?: LogContext) =>
      logger.warn(message, { hook: hookName, ...context }),
    error: (operation: string, error: Error | unknown) =>
      logger.hookError(hookName, operation, error),
  };
}
```

**Migration Example:**

```typescript
// Before
export default function useAccountFetchGql() {
  const { isAuthenticated, loading } = useAuth();

  console.log("[useAccountFetchGql] Hook state:", { isAuthenticated, loading });

  return useQuery<Account[], Error>({
    queryKey: ["accountsGQL"],
    queryFn: async () => {
      console.log("[useAccountFetchGql] Starting GraphQL query");
      const data = await graphqlRequest<AccountsQueryResult>({
        query: ACCOUNTS_QUERY,
      });
      console.log("[useAccountFetchGql] Raw GraphQL response:", { data });
      // ... more logs
    },
    onError: (error) => {
      console.log("[useAccountFetchGql] Error:", error);
    },
  });
}

// After
import { createHookLogger } from "../utils/logger";

const log = createHookLogger("useAccountFetchGql");

export default function useAccountFetchGql() {
  return useAuthenticatedQuery(
    ["accountsGQL"],
    async ({ signal }) => {
      log.debug("Starting GraphQL query");
      const data = await graphqlRequest<AccountsQueryResult>({
        query: ACCOUNTS_QUERY,
        signal,
      });
      log.debug("Query successful", { recordCount: data.accounts?.length });
      return mapAccountsFromGraphQL(data);
    },
    {
      onError: (error) => {
        log.error("Query failed", error);
      },
    },
  );
}
```

**Cleanup Tasks:**

- [ ] Remove 200+ debug console.log statements from GraphQL hooks
- [ ] Replace console.log with logger.error in error handlers
- [ ] Add structured logging to complex operations
- [ ] Configure log levels per environment

**Affected Hooks:** 50 hooks with logging

---

#### 2.2 Complete Authentication Gating

**Tasks:**

- [ ] Add `useAuth` to all fetch hooks missing it
- [ ] Document which endpoints are public vs protected
- [ ] Add auth checks to mutation hooks
- [ ] Test unauthorized access scenarios

**Migration Example:**

```typescript
// Before (no auth gating)
export default function useTotalsFetch(accountNameOwner: string) {
  return useQuery<Totals, Error>({
    queryKey: getTotalsKey(accountNameOwner),
    queryFn: () => fetchTotals(accountNameOwner),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}

// After (with auth gating)
import { useAuthenticatedQuery } from "../utils/queryConfig";

export default function useTotalsFetch(accountNameOwner: string) {
  return useAuthenticatedQuery(getTotalsKey(accountNameOwner), ({ signal }) =>
    fetchTotals(accountNameOwner, signal),
  );
}
```

**Hooks to Update (10 hooks):**

- useTransactionByAccountFetch
- useTransactionByCategoryFetch
- useTransactionByDescriptionFetch
- usePendingTransactionFetch
- useMedicalExpenseFetch
- useFamilyMemberFetch
- useValidationAmountFetch
- useValidationAmountsFetchAll
- useTotalsFetch
- useTotalsPerAccountFetch

---

#### 2.3 Consistent Cache Update Patterns

**File:** `/utils/cacheUtils.ts`

**Tasks:**

- [ ] Document cache update strategies
- [ ] Create helpers for common patterns
- [ ] Add type-safe cache key helpers
- [ ] Write cache update tests

**Code Template:**

```typescript
// utils/cacheUtils.ts
import { QueryClient } from "@tanstack/react-query";

/**
 * Cache update strategies
 */
export class CacheUpdateStrategies {
  /**
   * Optimistically add item to list cache
   * Use for: Insert operations
   */
  static addToList<T>(
    queryClient: QueryClient,
    queryKey: unknown[],
    newItem: T,
    position: "start" | "end" = "start",
  ): void {
    const oldData = queryClient.getQueryData<T[]>(queryKey);

    if (oldData) {
      const newData =
        position === "start" ? [newItem, ...oldData] : [...oldData, newItem];
      queryClient.setQueryData(queryKey, newData);
    } else {
      queryClient.setQueryData(queryKey, [newItem]);
    }
  }

  /**
   * Optimistically update item in list cache
   * Use for: Update operations (same entity)
   */
  static updateInList<T extends { [key: string]: any }>(
    queryClient: QueryClient,
    queryKey: unknown[],
    updatedItem: T,
    idKey: keyof T,
  ): void {
    const oldData = queryClient.getQueryData<T[]>(queryKey);

    if (oldData) {
      const newData = oldData.map((item) =>
        item[idKey] === updatedItem[idKey] ? updatedItem : item,
      );
      queryClient.setQueryData(queryKey, newData);
    }
  }

  /**
   * Optimistically remove item from list cache
   * Use for: Delete operations
   */
  static removeFromList<T extends { [key: string]: any }>(
    queryClient: QueryClient,
    queryKey: unknown[],
    itemToRemove: T,
    idKey: keyof T,
  ): void {
    const oldData = queryClient.getQueryData<T[]>(queryKey);

    if (oldData) {
      const newData = oldData.filter(
        (item) => item[idKey] !== itemToRemove[idKey],
      );
      queryClient.setQueryData(queryKey, newData);
    }
  }

  /**
   * Invalidate related queries
   * Use for: Cross-entity updates, complex updates
   */
  static invalidateRelated(
    queryClient: QueryClient,
    queryKeys: unknown[][],
  ): void {
    queryKeys.forEach((key) => {
      queryClient.invalidateQueries({ queryKey: key });
    });
  }

  /**
   * Update aggregate/totals cache
   * Use for: Financial totals after transaction changes
   */
  static updateTotals(
    queryClient: QueryClient,
    queryKey: unknown[],
    updateFn: (oldTotals: any) => any,
  ): void {
    const oldTotals = queryClient.getQueryData(queryKey);
    if (oldTotals) {
      const newTotals = updateFn(oldTotals);
      queryClient.setQueryData(queryKey, newTotals);
    } else {
      // Invalidate if no cached data
      queryClient.invalidateQueries({ queryKey });
    }
  }
}

/**
 * Type-safe query key builders
 */
export const QueryKeys = {
  account: () => ["account"] as const,
  accountGql: () => ["accountsGQL"] as const,
  category: () => ["category"] as const,
  categoryGql: () => ["categoriesGQL"] as const,
  description: () => ["description"] as const,
  descriptionGql: () => ["descriptionsGQL"] as const,
  parameter: () => ["parameter"] as const,
  parameterGql: () => ["parametersGQL"] as const,
  payment: () => ["payment"] as const,
  paymentGql: () => ["paymentsGQL"] as const,
  paymentRequired: () => ["paymentRequired"] as const,
  transfer: () => ["transfer"] as const,
  transferGql: () => ["transfersGQL"] as const,
  transactionByAccount: (accountName: string) =>
    ["transaction", accountName] as const,
  transactionByCategory: (category: string) =>
    ["transaction", "category", category] as const,
  transactionByDescription: (description: string) =>
    ["transaction", "description", description] as const,
  pendingTransaction: () => ["pendingTransaction"] as const,
  medicalExpense: () => ["medicalExpense"] as const,
  familyMember: () => ["familyMember"] as const,
  validationAmount: () => ["validationAmount"] as const,
  validationAmounts: () => ["validationAmounts"] as const,
  totals: (accountName: string) => ["totals", accountName] as const,
  totalsPerAccount: () => ["totalsPerAccount"] as const,
} as const;
```

**Migration Example:**

```typescript
// Before (manual cache update)
export default function useAccountInsert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables: { payload: Account }) =>
      insertAccount(variables.payload),
    onSuccess: (response: Account) => {
      const oldData: Account[] | undefined = queryClient.getQueryData([
        "account",
      ]);
      const newData = oldData ? [response, ...oldData] : [response];
      queryClient.setQueryData(["account"], newData);
    },
  });
}

// After (using cache utility)
import { CacheUpdateStrategies, QueryKeys } from "../utils/cacheUtils";

export default function useAccountInsert() {
  const queryClient = useQueryClient();

  return useStandardMutation(
    (variables: { payload: Account }) => insertAccount(variables.payload),
    {
      mutationKey: ["insertAccount"],
      onSuccess: (response) => {
        CacheUpdateStrategies.addToList(
          queryClient,
          QueryKeys.account(),
          response,
          "start",
        );
      },
    },
  );
}
```

**Documentation Needed:**

Create `/docs/cache-strategies.md`:

```markdown
# Cache Update Strategies

## When to Use Each Strategy

### 1. Optimistic Update (setQueryData)

**Use when:**

- Single entity update
- Response contains full updated entity
- No cascading effects

**Examples:** Account insert, Category update (same category)

### 2. Invalidation (invalidateQueries)

**Use when:**

- Cross-entity updates (e.g., transaction moved to different account)
- Complex calculations needed
- Response doesn't contain full updated data

**Examples:** Transaction account change, Payment deletion affecting totals

### 3. Hybrid (setQueryData + invalidateQueries)

**Use when:**

- Update affects multiple related entities
- Some caches can be optimistically updated, others need refetch

**Examples:** Transaction update with account change

### 4. Totals Update (specialized)

**Use when:**

- Updating aggregate calculations
- Avoiding full refetch for simple arithmetic

**Examples:** Transaction amount change affecting account totals
```

**Affected Hooks:** 49 mutation hooks

---

#### 2.4 Improved TypeScript Error Handling

**Tasks:**

- [ ] Replace `any` with `unknown` in catch blocks
- [ ] Add type guards for error checking
- [ ] Create custom error types
- [ ] Update error handling in all hooks

**Code Template:**

```typescript
// utils/errorHandling.ts

/**
 * Type guard to check if value is an Error
 */
export function isError(value: unknown): value is Error {
  return value instanceof Error;
}

/**
 * Type guard to check if value is FetchError
 */
export function isFetchError(value: unknown): value is FetchError {
  return value instanceof FetchError;
}

/**
 * Extract error message from unknown error
 */
export function getErrorMessage(error: unknown): string {
  if (isError(error)) {
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

/**
 * Safe error handler for React Query
 */
export function handleQueryError(error: unknown, operationName: string): void {
  const message = getErrorMessage(error);
  logger.error(`${operationName} failed`, error, { operationName });

  // You can add additional error reporting here (e.g., Sentry)
}
```

**Migration Example:**

```typescript
// Before
export const insertAccount = async (
  payload: Account,
): Promise<Account | null> => {
  try {
    // ... operation
  } catch (error: any) {
    console.log(`An error occurred: ${error.message}`);
    throw error;
  }
};

// After
import { getErrorMessage } from "../utils/errorHandling";

export const insertAccount = async (
  payload: Account,
): Promise<Account | null> => {
  try {
    // ... operation
  } catch (error: unknown) {
    const message = getErrorMessage(error);
    logger.error("Insert account failed", error, {
      operation: "insertAccount",
    });
    throw error;
  }
};
```

**Affected Hooks:** 79 hooks (all with error handling)

---

### Phase 3: Architecture Improvements

#### 3.1 REST vs GraphQL Strategy Decision

**Tasks:**

- [ ] Analyze usage patterns of REST vs GraphQL
- [ ] Measure performance differences
- [ ] Make architectural decision
- [ ] Create migration plan
- [ ] Document strategy

**Decision Framework:**

| Factor           | REST               | GraphQL                  |
| ---------------- | ------------------ | ------------------------ |
| Current Usage    | Primary (58 hooks) | Secondary (21 hooks)     |
| Backend Support  | Full API           | Limited                  |
| Cache Complexity | Simple             | Complex (manual mapping) |
| Data Flexibility | Fixed endpoints    | Flexible queries         |
| Overhead         | Lower              | Higher (transformations) |

**Recommended Strategy:**

**Option A: Consolidate on REST** (Recommended)

- Remove 21 GraphQL hooks
- Keep REST as primary
- GraphQL only for complex queries if needed
- Reduces codebase by ~1,400 lines

**Option B: Consolidate on GraphQL**

- Migrate 58 REST hooks to GraphQL
- Requires backend GraphQL maturity
- Better for complex, nested data
- Higher initial migration cost

**Option C: Hybrid (Current State)**

- Keep both but unify cache keys
- Add adapter layer
- Document when to use which
- No code reduction

**Migration Example (Option A - Remove GraphQL):**

```typescript
// Remove: hooks/useAccountFetchGql.ts (entire file)
// Keep: hooks/useAccountFetch.ts

// Update components using GraphQL hooks:
// Before
import useAccountFetchGql from "../hooks/useAccountFetchGql";

function MyComponent() {
  const { data } = useAccountFetchGql();
  // ...
}

// After
import useAccountFetch from "../hooks/useAccountFetch";

function MyComponent() {
  const { data } = useAccountFetch();
  // ...
}
```

**Affected Hooks (Option A):**

- DELETE: 21 GraphQL hooks (~1,400 lines)
- UPDATE: Components using GraphQL hooks (need audit)

---

#### 3.2 Hook Factories for CRUD Operations

**File:** `/utils/hookFactory.ts`

**Tasks:**

- [ ] Create generic CRUD hook factory
- [ ] Add type-safe entity configuration
- [ ] Generate hooks from configuration
- [ ] Write factory tests

**Code Template:**

```typescript
// utils/hookFactory.ts
import { useQueryClient } from "@tanstack/react-query";
import { useAuthenticatedQuery, useStandardMutation } from "./queryConfig";
import {
  createQueryFn,
  fetchWithErrorHandling,
  parseResponse,
} from "./fetchUtils";
import { HookValidator } from "./hookValidation";
import { HookSanitizer } from "./sanitization";
import { CacheUpdateStrategies } from "./cacheUtils";
import { ValidationResult } from "./validation";

/**
 * Configuration for CRUD operations
 */
interface CrudConfig<T, TIdentifier = string> {
  entityName: string;
  baseUrl: string;
  queryKey: unknown[];
  validator?: (data: T) => ValidationResult<T>;
  identifierKey: keyof T;
  sanitizeIdentifier?: (id: TIdentifier) => TIdentifier;
}

/**
 * Create standard CRUD hooks for an entity
 */
export function createCrudHooks<
  T extends { [key: string]: any },
  TIdentifier = string,
>(config: CrudConfig<T, TIdentifier>) {
  const {
    entityName,
    baseUrl,
    queryKey,
    validator,
    identifierKey,
    sanitizeIdentifier,
  } = config;

  /**
   * Fetch hook
   */
  function useFetch() {
    return useAuthenticatedQuery(
      queryKey,
      createQueryFn<T[]>(baseUrl, { method: "GET" }),
    );
  }

  /**
   * Insert hook
   */
  function useInsert() {
    const queryClient = useQueryClient();

    return useStandardMutation(
      async (payload: T): Promise<T | null> => {
        // Validate if validator provided
        const validatedData = validator
          ? HookValidator.validateInsert(
              payload,
              validator,
              `insert${entityName}`,
            )
          : payload;

        const response = await fetchWithErrorHandling(baseUrl, {
          method: "POST",
          body: JSON.stringify(validatedData),
        });

        return parseResponse<T>(response);
      },
      {
        mutationKey: [`insert${entityName}`],
        onSuccess: (response) => {
          if (response) {
            CacheUpdateStrategies.addToList(
              queryClient,
              queryKey,
              response,
              "start",
            );
          }
        },
      },
    );
  }

  /**
   * Update hook
   */
  function useUpdate() {
    const queryClient = useQueryClient();

    return useStandardMutation(
      async (variables: { newData: T; oldData: T }): Promise<T | null> => {
        const { newData, oldData } = variables;

        // Validate if validator provided
        const validatedData = validator
          ? HookValidator.validateUpdate(
              newData,
              oldData,
              validator,
              `update${entityName}`,
            )
          : newData;

        // Sanitize identifier
        const identifier = oldData[identifierKey];
        const sanitizedId = sanitizeIdentifier
          ? sanitizeIdentifier(identifier as TIdentifier)
          : identifier;

        const url = `${baseUrl}/${sanitizedId}`;
        const response = await fetchWithErrorHandling(url, {
          method: "PUT",
          body: JSON.stringify(validatedData),
        });

        return parseResponse<T>(response);
      },
      {
        mutationKey: [`update${entityName}`],
        onSuccess: (response) => {
          if (response) {
            CacheUpdateStrategies.updateInList(
              queryClient,
              queryKey,
              response,
              identifierKey,
            );
          }
        },
      },
    );
  }

  /**
   * Delete hook
   */
  function useDelete() {
    const queryClient = useQueryClient();

    return useStandardMutation(
      async (payload: T): Promise<T | null> => {
        // Validate identifier exists
        HookValidator.validateDelete(
          payload,
          identifierKey,
          `delete${entityName}`,
        );

        // Sanitize identifier
        const identifier = payload[identifierKey];
        const sanitizedId = sanitizeIdentifier
          ? sanitizeIdentifier(identifier as TIdentifier)
          : identifier;

        const url = `${baseUrl}/${sanitizedId}`;
        const response = await fetchWithErrorHandling(url, {
          method: "DELETE",
        });

        return parseResponse<T>(response);
      },
      {
        mutationKey: [`delete${entityName}`],
        onSuccess: (_, variables) => {
          CacheUpdateStrategies.removeFromList(
            queryClient,
            queryKey,
            variables,
            identifierKey,
          );
        },
      },
    );
  }

  return {
    useFetch,
    useInsert,
    useUpdate,
    useDelete,
  };
}
```

**Usage Example:**

```typescript
// hooks/useAccountCrud.ts (NEW - replaces 4 separate files)
import { createCrudHooks } from "../utils/hookFactory";
import { DataValidator } from "../utils/validation";
import { HookSanitizer } from "../utils/sanitization";
import { QueryKeys } from "../utils/cacheUtils";
import Account from "../model/Account";

const accountCrud = createCrudHooks<Account>({
  entityName: "Account",
  baseUrl: "/api/account",
  queryKey: QueryKeys.account(),
  validator: DataValidator.validateAccount,
  identifierKey: "accountNameOwner",
  sanitizeIdentifier: HookSanitizer.sanitizeAccountName,
});

export const useAccountFetch = accountCrud.useFetch;
export const useAccountInsert = accountCrud.useInsert;
export const useAccountUpdate = accountCrud.useUpdate;
export const useAccountDelete = accountCrud.useDelete;

// Backwards compatibility (optional)
export default useAccountFetch;
```

**Before/After Comparison:**

```
Before (4 files, ~320 lines total):
- hooks/useAccountFetch.ts (67 lines)
- hooks/useAccountInsert.ts (88 lines)
- hooks/useAccountUpdate.ts (73 lines)
- hooks/useAccountDelete.ts (92 lines)

After (1 file, ~25 lines):
- hooks/useAccountCrud.ts (25 lines)

Reduction: ~295 lines (92% reduction for this entity)
```

**Entities to Migrate:**

- Account (4 hooks → 1 file)
- Category (4 hooks → 1 file)
- Description (4 hooks → 1 file)
- Parameter (4 hooks → 1 file)
- Payment (4 hooks → 1 file)
- Transfer (4 hooks → 1 file)
- MedicalExpense (4 hooks → 1 file)
- FamilyMember (3 hooks → 1 file)
- ValidationAmount (4 hooks → 1 file)

**Estimated Reduction:** ~2,500 lines of code

---

#### 3.3 Export Helper Functions for Testability

**Tasks:**

- [ ] Export all async operation functions
- [ ] Export setup/transformation functions
- [ ] Update tests to use exported functions
- [ ] Document testing patterns

**Migration Example:**

```typescript
// Before (functions not exported)
const insertAccount = async (payload: Account): Promise<Account | null> => {
  // ... implementation
};

export default function useAccountInsert() {
  return useMutation({
    mutationFn: (variables: { payload: Account }) =>
      insertAccount(variables.payload),
  });
}

// After (functions exported)
export const insertAccount = async (
  payload: Account,
): Promise<Account | null> => {
  // ... implementation
};

export default function useAccountInsert() {
  return useStandardMutation(
    (variables: { payload: Account }) => insertAccount(variables.payload),
    {
      mutationKey: ["insertAccount"],
      onSuccess: (response) => {
        // ... cache update
      },
    },
  );
}
```

**Test Example:**

```typescript
// __tests__/hooks/useAccountInsert.test.ts

// Before (testing hook only)
import useAccountInsert from "../../hooks/useAccountInsert";

describe("useAccountInsert", () => {
  it("should insert account", async () => {
    const { result } = renderHook(() => useAccountInsert());
    await act(async () => {
      await result.current.mutateAsync({ payload: mockAccount });
    });
    // Assertions...
  });
});

// After (testing function directly + hook)
import useAccountInsert, { insertAccount } from "../../hooks/useAccountInsert";

describe("insertAccount function", () => {
  it("should validate and insert account", async () => {
    const result = await insertAccount(mockAccount);
    expect(result).toEqual(mockAccount);
  });

  it("should throw on invalid data", async () => {
    await expect(insertAccount(invalidAccount)).rejects.toThrow(
      "validation failed",
    );
  });
});

describe("useAccountInsert hook", () => {
  it("should update cache on success", async () => {
    // Hook integration test...
  });
});
```

**Affected Hooks:** 49 mutation hooks

---

### Phase 4: Optimization

#### 4.1 Optimistic Updates

**Tasks:**

- [ ] Identify high-frequency mutations
- [ ] Implement optimistic updates
- [ ] Add rollback on error
- [ ] Measure perceived performance improvement

**Code Template:**

```typescript
// utils/optimisticUpdates.ts
import { QueryClient } from "@tanstack/react-query";

/**
 * Perform optimistic update with automatic rollback
 */
export function createOptimisticUpdate<T, TVariables>(
  queryClient: QueryClient,
  queryKey: unknown[],
  updateFn: (oldData: T | undefined, variables: TVariables) => T,
) {
  return {
    onMutate: async (variables: TVariables) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey });

      // Snapshot previous value
      const previousData = queryClient.getQueryData<T>(queryKey);

      // Optimistically update
      if (previousData) {
        const newData = updateFn(previousData, variables);
        queryClient.setQueryData(queryKey, newData);
      }

      // Return context with snapshot
      return { previousData };
    },
    onError: (_error: unknown, _variables: TVariables, context: any) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData);
      }
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey });
    },
  };
}
```

**Usage Example:**

```typescript
// hooks/useTransactionUpdate.ts
import { createOptimisticUpdate } from "../utils/optimisticUpdates";

export default function useTransactionUpdate() {
  const queryClient = useQueryClient();
  const accountKey = ["transaction", "chase_brian"];

  return useStandardMutation(
    (variables: { newRow: Transaction; oldRow: Transaction }) =>
      updateTransaction(variables.newRow, variables.oldRow),
    {
      mutationKey: ["updateTransaction"],
      ...createOptimisticUpdate<
        Transaction[],
        { newRow: Transaction; oldRow: Transaction }
      >(queryClient, accountKey, (oldData, variables) => {
        if (!oldData) return [];
        return oldData.map((row) =>
          row.guid === variables.oldRow.guid ? variables.newRow : row,
        );
      }),
    },
  );
}
```

**High-Frequency Mutations to Optimize:**

- Transaction update/insert
- Transaction state changes
- Payment updates
- Category/description changes

---

#### 4.2 Request Deduplication

**Tasks:**

- [ ] Identify duplicate requests
- [ ] Implement request caching
- [ ] Add React Query deduplication
- [ ] Monitor network traffic reduction

**Code Template:**

```typescript
// React Query already handles deduplication, but we can optimize:

// utils/queryConfig.ts (extend)
export const DEFAULT_QUERY_CONFIG = {
  staleTime: 5 * 60 * 1000,
  retry: 1,
  refetchOnWindowFocus: false, // Prevent unnecessary refetches
  refetchOnMount: false, // Use cached data on mount if fresh
  refetchOnReconnect: true, // Refetch on network reconnect
} as const;
```

---

#### 4.3 Performance Monitoring

**File:** `/utils/performanceMonitoring.ts`

**Tasks:**

- [ ] Add performance tracking to queries
- [ ] Monitor mutation success rates
- [ ] Track cache hit rates
- [ ] Create performance dashboard

**Code Template:**

```typescript
// utils/performanceMonitoring.ts

interface PerformanceMetrics {
  operation: string;
  duration: number;
  success: boolean;
  cacheHit?: boolean;
  timestamp: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private maxMetrics = 1000;

  track(metric: PerformanceMetrics): void {
    this.metrics.push(metric);

    // Keep only recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }

    // Log in development
    if (process.env.NODE_ENV === "development") {
      console.log(
        `[Perf] ${metric.operation}: ${metric.duration.toFixed(2)}ms`,
      );
    }
  }

  getMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  getAverageDuration(operation: string): number {
    const filtered = this.metrics.filter((m) => m.operation === operation);
    if (filtered.length === 0) return 0;

    const total = filtered.reduce((sum, m) => sum + m.duration, 0);
    return total / filtered.length;
  }

  getSuccessRate(operation: string): number {
    const filtered = this.metrics.filter((m) => m.operation === operation);
    if (filtered.length === 0) return 0;

    const successful = filtered.filter((m) => m.success).length;
    return (successful / filtered.length) * 100;
  }
}

export const performanceMonitor = new PerformanceMonitor();

/**
 * Wrapper to track query performance
 */
export function withPerformanceTracking<T>(
  operation: string,
  fn: () => Promise<T>,
): Promise<T> {
  const start = performance.now();

  return fn()
    .then((result) => {
      const duration = performance.now() - start;
      performanceMonitor.track({
        operation,
        duration,
        success: true,
        timestamp: Date.now(),
      });
      return result;
    })
    .catch((error) => {
      const duration = performance.now() - start;
      performanceMonitor.track({
        operation,
        duration,
        success: false,
        timestamp: Date.now(),
      });
      throw error;
    });
}
```

---

#### 4.4 Developer Documentation

**File:** `/docs/hooks-guide.md`

**Tasks:**

- [ ] Document hook patterns
- [ ] Create hook creation guide
- [ ] Add troubleshooting section
- [ ] Document cache strategies

**Template:**

```markdown
# Hooks Development Guide

## Creating a New Hook

### 1. Use Hook Factory (Recommended)

For standard CRUD operations, use the hook factory:

\`\`\`typescript
// hooks/useEntityCrud.ts
import { createCrudHooks } from "../utils/hookFactory";
import { DataValidator } from "../utils/validation";
import { QueryKeys } from "../utils/cacheUtils";
import Entity from "../model/Entity";

const entityCrud = createCrudHooks<Entity>({
entityName: "Entity",
baseUrl: "/api/entity",
queryKey: QueryKeys.entity(),
validator: DataValidator.validateEntity, // optional
identifierKey: "entityId",
sanitizeIdentifier: (id) => id, // optional
});

export const useEntityFetch = entityCrud.useFetch;
export const useEntityInsert = entityCrud.useInsert;
export const useEntityUpdate = entityCrud.useUpdate;
export const useEntityDelete = entityCrud.useDelete;
\`\`\`

### 2. Custom Hook (For Complex Logic)

For hooks with custom logic:

\`\`\`typescript
import { useAuthenticatedQuery } from "../utils/queryConfig";
import { createQueryFn } from "../utils/fetchUtils";
import { createHookLogger } from "../utils/logger";

const log = createHookLogger("useCustomHook");

export default function useCustomHook(param: string) {
return useAuthenticatedQuery(
["custom", param],
async ({ signal }) => {
log.debug("Fetching data", { param });
// Custom logic here
return data;
}
);
}
\`\`\`

## Hook Patterns

### Fetch Hook

- Use `useAuthenticatedQuery` for protected endpoints
- Use `createQueryFn` for simple GET requests
- Add proper logging with `createHookLogger`

### Mutation Hook

- Use `useStandardMutation` for mutations
- Validate input with `HookValidator`
- Sanitize identifiers with `HookSanitizer`
- Update cache with `CacheUpdateStrategies`

## Troubleshooting

### Hook doesn't refetch on mount

- Check `enabled` condition in query options
- Verify authentication state
- Check `staleTime` configuration

### Cache not updating after mutation

- Verify cache key matches query key
- Check `onSuccess` callback
- Use React Query DevTools to debug

### TypeScript errors in tests

- Export helper functions for testing
- Use proper type guards in error handling
- Mock authentication properly
```

---

## Migration Strategy

### Phase 1 Migration (Weeks 1-3)

**Week 1: Foundation**

- [ ] Create `/utils/queryConfig.ts`
- [ ] Create `/utils/fetchUtils.ts`
- [ ] Create `/utils/logger.ts`
- [ ] Write unit tests for utilities
- [ ] Review and approve utilities

**Week 2: Security**

- [ ] Create `/utils/hookValidation.ts`
- [ ] Create `/utils/sanitization.ts`
- [ ] Add validators for all entities
- [ ] Write validation tests
- [ ] Review security implementation

**Week 3: Migration**

- [ ] Migrate 5 hooks to new pattern (pilot)
- [ ] Test migrated hooks
- [ ] Migrate remaining 74 hooks
- [ ] Update tests
- [ ] Code review

### Phase 2 Migration (Weeks 4-6)

**Week 4: Logging**

- [ ] Replace console.log with logger (50 hooks)
- [ ] Remove debug logs from GraphQL hooks
- [ ] Test logging in dev/prod
- [ ] Code review

**Week 5: Auth & Cache**

- [ ] Add auth gating to 10 fetch hooks
- [ ] Create `/utils/cacheUtils.ts`
- [ ] Migrate cache updates (49 hooks)
- [ ] Test cache behavior
- [ ] Code review

**Week 6: Error Handling**

- [ ] Update error handling (79 hooks)
- [ ] Replace `any` with `unknown`
- [ ] Add error type guards
- [ ] Test error scenarios
- [ ] Code review

### Phase 3 Migration (Weeks 7-9)

**Week 7: Strategy Decision**

- [ ] Audit GraphQL vs REST usage
- [ ] Measure performance differences
- [ ] Make architectural decision
- [ ] Create migration plan
- [ ] Stakeholder approval

**Week 8-9: Hook Factory**

- [ ] Create `/utils/hookFactory.ts`
- [ ] Migrate 9 entities to factory pattern
- [ ] Update component imports
- [ ] Test all migrations
- [ ] Remove old hook files
- [ ] Code review

### Phase 4 Migration (Weeks 10-12)

**Week 10: Optimistic Updates**

- [ ] Identify high-frequency mutations
- [ ] Implement optimistic updates
- [ ] Test rollback behavior
- [ ] Measure performance improvement

**Week 11: Performance**

- [ ] Create performance monitoring
- [ ] Optimize query configuration
- [ ] Measure improvements
- [ ] Document findings

**Week 12: Documentation**

- [ ] Create developer guide
- [ ] Document patterns
- [ ] Create troubleshooting guide
- [ ] Team training session

---

## Testing Strategy

### Unit Tests

**Test Coverage Goals:**

- Utilities: 100% (critical security functions)
- Helper functions: 90%
- Hook factories: 95%

**Example Test Structure:**

```typescript
// __tests__/utils/hookValidation.test.ts
describe("HookValidator", () => {
  describe("validateInsert", () => {
    it("should validate valid data", () => {
      const result = HookValidator.validateInsert(
        validAccount,
        DataValidator.validateAccount,
        "test",
      );
      expect(result).toEqual(validAccount);
    });

    it("should throw on invalid data", () => {
      expect(() =>
        HookValidator.validateInsert(
          invalidAccount,
          DataValidator.validateAccount,
          "test",
        ),
      ).toThrow("validation failed");
    });
  });

  describe("validateGuid", () => {
    it("should validate valid GUID", () => {
      const guid = "550e8400-e29b-41d4-a716-446655440000";
      expect(HookValidator.validateGuid(guid, "test")).toBe(guid);
    });

    it("should throw on invalid GUID", () => {
      expect(() => HookValidator.validateGuid("invalid", "test")).toThrow(
        "Invalid GUID",
      );
    });
  });
});
```

### Integration Tests

**Test Scenarios:**

1. Authentication flow with gated queries
2. Cache updates after mutations
3. Optimistic update rollback
4. Error handling and recovery
5. Cross-hook interactions (e.g., transaction + totals)

**Example Integration Test:**

```typescript
// __tests__/integration/accountCrud.test.tsx
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAccountFetch, useAccountInsert } from "../../hooks/useAccountCrud";

describe("Account CRUD Integration", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
  });

  it("should fetch and insert account", async () => {
    const wrapper = ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    // Fetch accounts
    const { result: fetchResult } = renderHook(() => useAccountFetch(), { wrapper });
    await waitFor(() => expect(fetchResult.current.isSuccess).toBe(true));

    const initialCount = fetchResult.current.data?.length || 0;

    // Insert account
    const { result: insertResult } = renderHook(() => useAccountInsert(), { wrapper });
    await insertResult.current.mutateAsync({ payload: mockAccount });

    // Verify cache updated
    await waitFor(() => {
      const updatedData = queryClient.getQueryData(["account"]);
      expect(updatedData).toHaveLength(initialCount + 1);
    });
  });
});
```

### Manual Testing Checklist

**Phase 1 Completion:**

- [ ] All hooks use centralized configuration
- [ ] All mutations validate input
- [ ] All URL parameters are sanitized
- [ ] Error messages are user-friendly
- [ ] No console.log in production build

**Phase 2 Completion:**

- [ ] Protected endpoints require authentication
- [ ] Cache updates consistently
- [ ] No TypeScript `any` in catch blocks
- [ ] Logging levels work per environment

**Phase 3 Completion:**

- [ ] GraphQL/REST strategy documented
- [ ] Hook factory generates working hooks
- [ ] All helper functions exported
- [ ] Component imports still work

**Phase 4 Completion:**

- [ ] Optimistic updates feel instant
- [ ] Performance metrics collected
- [ ] Developer guide complete
- [ ] Team trained on new patterns

---

## Success Metrics

### Code Quality Metrics

| Metric                 | Before         | Target       | Measurement             |
| ---------------------- | -------------- | ------------ | ----------------------- |
| Validation Coverage    | 9% (7/79)      | 100% (79/79) | Hooks with validation   |
| Sanitization Coverage  | 3% (2/79)      | 95% (75/79)  | Hooks with sanitization |
| Code Duplication       | ~40%           | <10%         | SonarQube analysis      |
| TypeScript `any` usage | 79 occurrences | 0            | ESLint check            |
| Lines of Code          | ~5,300         | ~3,200       | Hook directory          |

### Security Metrics

| Metric                 | Before  | Target | Measurement   |
| ---------------------- | ------- | ------ | ------------- |
| Unvalidated Mutations  | 72      | 0      | Manual audit  |
| Unsanitized URL Params | 77      | 0      | Manual audit  |
| XSS Vulnerabilities    | Unknown | 0      | Security scan |
| Injection Risks        | High    | Low    | Security scan |

### Performance Metrics

| Metric                | Before | Target | Measurement             |
| --------------------- | ------ | ------ | ----------------------- |
| Average Query Time    | TBD    | <500ms | Performance monitor     |
| Cache Hit Rate        | TBD    | >80%   | React Query DevTools    |
| Mutation Success Rate | TBD    | >99%   | Error tracking          |
| Bundle Size           | TBD    | -15%   | webpack-bundle-analyzer |

### Developer Experience Metrics

| Metric                 | Before   | Target      | Measurement          |
| ---------------------- | -------- | ----------- | -------------------- |
| Time to Create Hook    | ~2 hours | ~15 minutes | Developer survey     |
| Hook Test Coverage     | 65%      | 90%         | Jest coverage        |
| Documentation Coverage | 10%      | 100%        | Manual audit         |
| Onboarding Time        | TBD      | -50%        | New developer survey |

---

## Risk Mitigation

### High-Risk Changes

1. **Cache Key Changes**
   - **Risk:** Breaking existing cache invalidation
   - **Mitigation:** Create backward-compatible key builders, gradual migration
   - **Rollback:** Keep old keys temporarily, use both

2. **Validation Breaking Changes**
   - **Risk:** Previously valid data now rejected
   - **Mitigation:** Analyze existing data, add migration scripts
   - **Rollback:** Make validation opt-in initially

3. **GraphQL Removal (if chosen)**
   - **Risk:** Breaking components using GraphQL hooks
   - **Mitigation:** Component audit, parallel implementation
   - **Rollback:** Keep GraphQL hooks in separate branch

### Medium-Risk Changes

4. **Error Handling Changes**
   - **Risk:** Different error messages breaking error handling
   - **Mitigation:** Test all error paths, maintain error contracts
   - **Rollback:** Feature flag for old error handling

5. **Logging Changes**
   - **Risk:** Missing critical logs
   - **Mitigation:** Parallel logging during transition
   - **Rollback:** Keep console.log during rollout

### Low-Risk Changes

6. **TypeScript Improvements**
   - **Risk:** Type errors during migration
   - **Mitigation:** Gradual migration, comprehensive tests
   - **Rollback:** Revert type changes per file

---

## Rollout Plan

### Progressive Rollout Strategy

**Stage 1: Pilot (Week 3)**

- Migrate 5 low-risk hooks
- Deploy to development
- Monitor for 1 week
- Gather team feedback

**Stage 2: Batch Migration (Weeks 4-6)**

- Migrate 25 hooks per week
- Deploy to staging after each batch
- Run integration tests
- Fix issues before next batch

**Stage 3: Complete Migration (Weeks 7-9)**

- Migrate remaining hooks
- Deploy to production with feature flags
- Monitor error rates
- Gradual rollout to users (10% → 50% → 100%)

**Stage 4: Cleanup (Weeks 10-12)**

- Remove old code
- Remove feature flags
- Archive deprecated hooks
- Update documentation

### Feature Flags

```typescript
// utils/featureFlags.ts
export const FEATURE_FLAGS = {
  USE_NEW_VALIDATION: process.env.NEXT_PUBLIC_NEW_VALIDATION === "true",
  USE_HOOK_FACTORY: process.env.NEXT_PUBLIC_HOOK_FACTORY === "true",
  USE_NEW_LOGGING: process.env.NEXT_PUBLIC_NEW_LOGGING === "true",
} as const;

// Usage in hooks
import { FEATURE_FLAGS } from "../utils/featureFlags";

export default function useAccountInsert() {
  if (FEATURE_FLAGS.USE_HOOK_FACTORY) {
    return useAccountInsertNew();
  }
  return useAccountInsertOld();
}
```

---

## Appendix

### A. File Structure After Migration

```
/hooks
  /crud (NEW)
    useAccountCrud.ts
    useCategoryCrud.ts
    useDescriptionCrud.ts
    useParameterCrud.ts
    usePaymentCrud.ts
    useTransferCrud.ts
    useMedicalExpenseCrud.ts
    useFamilyMemberCrud.ts
    useValidationAmountCrud.ts
  /specialized (NEW)
    useTransactionByAccount.ts
    useTransactionByCategory.ts
    useTransactionByDescription.ts
    usePendingTransaction.ts
    useTotals.ts
    useSpendingTrends.ts
    useAccountUsageTracking.ts
    useSportsData.ts
    useUser.ts
    useLoginProcess.ts
    useLogoutProcess.ts
    useUserAccountRegister.ts
  /deprecated (archive GraphQL hooks if removed)

/utils (NEW/UPDATED)
  queryConfig.ts (NEW)
  fetchUtils.ts (NEW)
  hookValidation.ts (NEW)
  sanitization.ts (EXTENDED)
  cacheUtils.ts (NEW)
  logger.ts (NEW)
  hookFactory.ts (NEW)
  errorHandling.ts (NEW)
  performanceMonitoring.ts (NEW)
  featureFlags.ts (NEW)

/docs (NEW)
  hooks-guide.md
  cache-strategies.md
  migration-guide.md
```

### B. Estimated Effort Breakdown

| Phase     | Tasks                 | Lines Changed | Developer Days | Calendar Days |
| --------- | --------------------- | ------------- | -------------- | ------------- |
| Phase 1   | Foundation & Security | ~3,500        | 15             | 21            |
| Phase 2   | Consistency & Auth    | ~2,000        | 12             | 21            |
| Phase 3   | Architecture          | ~2,500        | 13             | 21            |
| Phase 4   | Optimization          | ~1,000        | 10             | 21            |
| **Total** |                       | **~9,000**    | **50**         | **84**        |

**Assumptions:**

- 1 experienced developer (can adjust for team size)
- 60% coding, 40% testing/review
- No major blockers
- Stakeholder reviews don't delay timeline

### C. Dependencies

**External Dependencies:**

- @tanstack/react-query: 5.87.1 (current)
- No new dependencies required

**Internal Dependencies:**

- Existing validation utilities
- Existing security utilities
- AuthProvider component
- GraphQL client (if keeping GraphQL)

### D. Communication Plan

**Stakeholders:**

- Engineering team (weekly updates)
- Product team (milestone reviews)
- QA team (testing coordination)
- DevOps (deployment coordination)

**Communication Channels:**

- Daily: Slack updates on progress
- Weekly: Team sync on blockers
- Bi-weekly: Demo of completed phases
- End of phase: Retrospective

---

## Conclusion

This normalization plan will:

1. **Improve Security**: 100% validation/sanitization coverage
2. **Reduce Code**: 40% reduction in hook code (~2,100 lines)
3. **Increase Consistency**: Standardized patterns across all hooks
4. **Enhance Maintainability**: Centralized utilities, better tests
5. **Boost Developer Experience**: Hook factory, better docs

**Recommended Approach:**

- Start with Phase 1 (security critical)
- Phases 2-4 can be done in parallel if resources available
- Use feature flags for gradual rollout
- Measure success metrics throughout

**Next Steps:**

1. Review and approve this plan
2. Set up project tracking (Jira/GitHub Projects)
3. Assign developers
4. Begin Phase 1 Week 1 tasks
5. Schedule weekly checkpoints

---

**Document Version:** 1.0
**Last Updated:** 2025-11-13
**Owner:** Engineering Team
**Reviewers:** TBD
