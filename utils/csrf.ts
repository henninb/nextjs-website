/**
 * CSRF token utilities for securing mutation requests
 * Implements double-submit cookie pattern with Spring Security
 *
 * How it works:
 * 1. Fetch token from /api/csrf endpoint
 * 2. Spring Security sets XSRF-TOKEN cookie (accessible to JavaScript)
 * 3. Include token value in X-CSRF-TOKEN header for all mutations
 * 4. Spring Security validates token matches cookie
 *
 * @module csrf
 */

let csrfToken: string | null = null;
let csrfHeaderName: string = "X-CSRF-TOKEN";
let tokenFetchPromise: Promise<void> | null = null;

/**
 * Fetch CSRF token from backend
 * Implements singleton pattern to avoid duplicate fetches
 *
 * @returns Promise that resolves when token is fetched
 * @throws Error if token fetch fails
 */
export async function fetchCsrfToken(): Promise<void> {
  // Return existing fetch if in progress
  if (tokenFetchPromise) {
    return tokenFetchPromise;
  }

  tokenFetchPromise = (async () => {
    try {
      // Always use relative URL to go through Next.js proxy
      // This avoids SSL certificate issues in development
      const response = await fetch("/api/csrf", {
        credentials: "include",
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch CSRF token: ${response.status}`);
      }

      const data = await response.json();
      csrfToken = data.token;
      csrfHeaderName = data.headerName || "X-CSRF-TOKEN";

      console.log("[CSRF] Token fetched successfully");
    } catch (error) {
      console.error("[CSRF] Failed to fetch token:", error);
      csrfToken = null;
      throw error;
    } finally {
      tokenFetchPromise = null;
    }
  })();

  return tokenFetchPromise;
}

/**
 * Get current CSRF token, fetching if necessary
 *
 * @returns Promise resolving to token string or null if fetch failed
 */
export async function getCsrfToken(): Promise<string | null> {
  if (!csrfToken) {
    try {
      await fetchCsrfToken();
    } catch (error) {
      // Token fetch failed, return null
      return null;
    }
  }
  return csrfToken;
}

/**
 * Get CSRF headers for inclusion in requests
 *
 * @returns Promise resolving to headers object with CSRF token
 *
 * @example
 * ```typescript
 * const csrfHeaders = await getCsrfHeaders();
 * fetch('/api/account', {
 *   method: 'POST',
 *   headers: {
 *     'Content-Type': 'application/json',
 *     ...csrfHeaders,
 *   },
 *   body: JSON.stringify(data),
 * });
 * ```
 */
export async function getCsrfHeaders(): Promise<Record<string, string>> {
  console.log("[CSRF] getCsrfHeaders called");
  const token = await getCsrfToken();
  console.log(
    "[CSRF] Token retrieved:",
    token ? `${token.substring(0, 20)}...` : "null",
  );
  if (!token) {
    console.warn("[CSRF] No token available, returning empty headers");
    return {};
  }
  const headers = {
    [csrfHeaderName]: token,
  };
  console.log("[CSRF] Returning headers with", csrfHeaderName);
  return headers;
}

/**
 * Clear cached CSRF token (call on 403 errors to trigger refetch)
 *
 * Use this when you receive a 403 error that indicates the CSRF token
 * is invalid or expired. The next call to getCsrfToken() will fetch a fresh token.
 *
 * @example
 * ```typescript
 * if (response.status === 403 && errorText.includes('CSRF')) {
 *   clearCsrfToken();
 *   // Retry request - it will fetch a fresh token
 * }
 * ```
 */
export function clearCsrfToken(): void {
  csrfToken = null;
  console.log("[CSRF] Token cleared");
}

/**
 * Prefetch CSRF token (call on app initialization or login)
 *
 * This is optional but recommended to avoid delays on the first mutation request.
 * Non-critical: token will be fetched on first mutation if not prefetched.
 *
 * @returns Promise that resolves when token is fetched (or rejects silently)
 *
 * @example
 * ```typescript
 * // After successful login
 * await initCsrfToken();
 * ```
 */
export async function initCsrfToken(): Promise<void> {
  try {
    await fetchCsrfToken();
  } catch (error) {
    // Non-critical: token will be fetched on first mutation
    console.warn("[CSRF] Prefetch failed, will retry on first request");
  }
}
