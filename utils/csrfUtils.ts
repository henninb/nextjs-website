/**
 * Client-side CSRF token utility
 * Handles fetching and managing CSRF tokens for secure requests
 */

let csrfToken: string | null = null;
let tokenExpiry: number | null = null;

/**
 * Fetch a new CSRF token from the server
 */
export async function fetchCSRFToken(): Promise<string> {
  try {
    console.log("[CSRF] Fetching new CSRF token...");
    const response = await fetch("/api/csrf/token", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    });

    console.log("[CSRF] Token fetch response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[CSRF] Token fetch failed:", response.status, errorText);
      throw new Error(
        `CSRF token fetch failed: ${response.status} - ${errorText}`,
      );
    }

    const data = await response.json();
    csrfToken = data.csrfToken;
    tokenExpiry = data.expires;

    console.log(
      "[CSRF] Successfully fetched CSRF token, expires:",
      new Date(tokenExpiry),
    );
    return csrfToken;
  } catch (error) {
    console.error("Failed to fetch CSRF token:", error);
    throw error;
  }
}

/**
 * Get current CSRF token, fetching a new one if needed
 */
export async function getCSRFToken(): Promise<string> {
  const now = Date.now();

  // If we have a token and it's not expired (with 5 min buffer), use it
  if (csrfToken && tokenExpiry && now + 5 * 60 * 1000 < tokenExpiry) {
    return csrfToken;
  }

  // Otherwise fetch a new token
  return await fetchCSRFToken();
}

/**
 * Clear the cached CSRF token (useful after errors)
 */
export function clearCSRFToken(): void {
  csrfToken = null;
  tokenExpiry = null;
}

/**
 * Get headers with CSRF token for secure requests
 */
export async function getSecureHeaders(
  additionalHeaders: Record<string, string> = {},
): Promise<Record<string, string>> {
  const token = await getCSRFToken();

  console.log(
    "[CSRF] Adding CSRF token to headers:",
    token ? "token present" : "no token",
  );

  return {
    "Content-Type": "application/json",
    "x-csrf-token": token,
    ...additionalHeaders,
  };
}
