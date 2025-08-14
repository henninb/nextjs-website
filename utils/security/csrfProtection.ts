import type { NextApiRequest, NextApiResponse } from "next";

/**
 * CSRF Protection Implementation
 * Implements double-submit cookie pattern and header token validation
 * for protecting against Cross-Site Request Forgery attacks
 */

// CSRF configuration
const CSRF_TOKEN_LENGTH = 32;
const CSRF_COOKIE_NAME = "__Host-csrf-token";
const CSRF_HEADER_NAME = "x-csrf-token";
const TOKEN_LIFETIME = 60 * 60 * 1000; // 1 hour in milliseconds

// Store for CSRF tokens (in production, use Redis or database)
const tokenStore = new Map<string, { timestamp: number; used: boolean }>();

// Rate limiting for CSRF token requests
const csrfRateLimits = new Map<string, { count: number; resetTime: number }>();
const CSRF_RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const CSRF_RATE_LIMIT_MAX = 50; // 50 token requests per minute per IP

/**
 * Generates a cryptographically secure CSRF token using Web Crypto API
 */
export function generateCSRFToken(): string {
  // Use Web Crypto API for edge runtime compatibility
  const array = new Uint8Array(CSRF_TOKEN_LENGTH);
  crypto.getRandomValues(array);

  // Convert to base64url encoding
  return Buffer.from(array).toString("base64url");
}

/**
 * Creates a secure CSRF token with timestamp
 */
function createSecureToken(): { token: string; timestamp: number } {
  const token = generateCSRFToken();
  const timestamp = Date.now();

  // Store token with metadata
  tokenStore.set(token, { timestamp, used: false });

  // Clean up old tokens
  cleanupExpiredTokens();

  return { token, timestamp };
}

/**
 * Validates CSRF token from request
 */
function validateToken(token: string): boolean {
  if (!token || typeof token !== "string") {
    return false;
  }

  const tokenData = tokenStore.get(token);
  if (!tokenData) {
    return false;
  }

  const { timestamp, used } = tokenData;
  const now = Date.now();

  // Check if token is expired
  if (now - timestamp > TOKEN_LIFETIME) {
    tokenStore.delete(token);
    return false;
  }

  // Check if token has already been used (prevent replay attacks)
  if (used) {
    return false;
  }

  // Mark token as used for one-time use
  tokenStore.set(token, { timestamp, used: true });
  return true;
}

/**
 * Clean up expired tokens from memory
 */
function cleanupExpiredTokens(): void {
  const now = Date.now();
  for (const [token, data] of tokenStore.entries()) {
    if (now - data.timestamp > TOKEN_LIFETIME) {
      tokenStore.delete(token);
    }
  }
}

/**
 * Rate limiting for CSRF token generation
 */
function checkCSRFRateLimit(clientIP: string): boolean {
  const now = Date.now();
  const limit = csrfRateLimits.get(clientIP);

  if (!limit) {
    csrfRateLimits.set(clientIP, {
      count: 1,
      resetTime: now + CSRF_RATE_LIMIT_WINDOW,
    });
    return true;
  }

  if (now > limit.resetTime) {
    csrfRateLimits.set(clientIP, {
      count: 1,
      resetTime: now + CSRF_RATE_LIMIT_WINDOW,
    });
    return true;
  }

  if (limit.count >= CSRF_RATE_LIMIT_MAX) {
    return false;
  }

  limit.count++;
  return true;
}

/**
 * Middleware for CSRF protection
 */
export function csrfProtection(
  req: NextApiRequest,
  res: NextApiResponse,
): boolean {
  const method = req.method?.toLowerCase();

  // GET, HEAD, OPTIONS requests don't need CSRF protection
  if (!method || ["get", "head", "options"].includes(method)) {
    return true;
  }

  // Get client IP for rate limiting
  const clientIP =
    req.headers["x-forwarded-for"] ||
    req.headers["x-real-ip"] ||
    req.connection?.remoteAddress ||
    "unknown";

  // Rate limit CSRF validation attempts
  if (!checkCSRFRateLimit(clientIP as string)) {
    res.status(429).json({ error: "Too many CSRF validation attempts" });
    return false;
  }

  try {
    // Double-submit cookie pattern validation
    const cookieToken = extractTokenFromCookie(req);
    const headerToken = req.headers[CSRF_HEADER_NAME] as string;

    if (!cookieToken || !headerToken) {
      console.warn(
        `CSRF tokens missing from ${clientIP}: cookie=${!!cookieToken}, header=${!!headerToken}`,
      );
      res.status(403).json({
        error: "CSRF token missing",
        details:
          process.env.NODE_ENV === "development"
            ? `Cookie: ${!!cookieToken}, Header: ${!!headerToken}`
            : undefined,
      });
      return false;
    }

    // Validate both tokens match and are valid
    if (cookieToken !== headerToken) {
      console.warn(`CSRF token mismatch from ${clientIP}`);
      res.status(403).json({ error: "CSRF token mismatch" });
      return false;
    }

    if (!validateToken(cookieToken)) {
      console.warn(`Invalid CSRF token from ${clientIP}`);
      res.status(403).json({ error: "Invalid CSRF token" });
      return false;
    }

    return true;
  } catch (error) {
    console.error("CSRF validation error:", error);
    res.status(500).json({ error: "CSRF validation failed" });
    return false;
  }
}

/**
 * Generate and set CSRF token in response
 */
export function setCSRFToken(
  req: NextApiRequest,
  res: NextApiResponse,
): string {
  const { token } = createSecureToken();

  // Set secure cookie with CSRF token
  const cookieOptions = [
    `${CSRF_COOKIE_NAME}=${token}`,
    `Max-Age=${TOKEN_LIFETIME / 1000}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Strict",
    ...(process.env.NODE_ENV === "production" ? ["Secure"] : []),
    ...(process.env.NODE_ENV === "production" ? ["Domain=.bhenning.com"] : []),
  ].join("; ");

  res.setHeader("Set-Cookie", cookieOptions);

  // Also return token for header usage
  return token;
}

/**
 * Extract CSRF token from cookie
 */
function extractTokenFromCookie(req: NextApiRequest): string | null {
  const cookies = req.headers.cookie;
  if (!cookies) return null;

  const cookieMatch = cookies.match(new RegExp(`${CSRF_COOKIE_NAME}=([^;]+)`));
  return cookieMatch ? cookieMatch[1] : null;
}

/**
 * CSRF token endpoint handler
 */
export async function handleCSRFTokenRequest(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Get client IP for rate limiting
    const clientIP =
      req.headers["x-forwarded-for"] ||
      req.headers["x-real-ip"] ||
      req.connection?.remoteAddress ||
      "unknown";

    // Rate limit token generation requests
    if (!checkCSRFRateLimit(clientIP as string)) {
      return res.status(429).json({ error: "Too many token requests" });
    }

    // Generate and set CSRF token
    const token = setCSRFToken(req, res);

    res.status(200).json({
      csrfToken: token,
      headerName: CSRF_HEADER_NAME,
      expires: Date.now() + TOKEN_LIFETIME,
    });
  } catch (error) {
    console.error("CSRF token generation error:", error);
    res.status(500).json({ error: "Token generation failed" });
  }
}

/**
 * Enhanced CSRF middleware with origin validation
 */
export function enhancedCSRFProtection(
  req: NextApiRequest,
  res: NextApiResponse,
): boolean {
  // First run standard CSRF protection
  if (!csrfProtection(req, res)) {
    return false;
  }

  // Additional origin validation for state-changing requests
  const method = req.method?.toLowerCase();
  if (method && ["post", "put", "delete", "patch"].includes(method)) {
    const origin = req.headers.origin;
    const referer = req.headers.referer;
    const host = req.headers.host;

    // Validate origin header
    if (!origin) {
      console.warn("Missing origin header on state-changing request");
      res.status(403).json({ error: "Origin header required" });
      return false;
    }

    // Check if origin matches expected hosts
    const allowedOrigins =
      process.env.NODE_ENV === "production"
        ? ["https://vercel.bhenning.com", "https://finance.bhenning.com"]
        : ["http://localhost:3000", "http://dev.finance.bhenning.com:3000"];

    if (!allowedOrigins.some((allowed) => origin.startsWith(allowed))) {
      console.warn(`Invalid origin for state-changing request: ${origin}`);
      res.status(403).json({ error: "Invalid origin" });
      return false;
    }

    // Validate referer if present
    if (
      referer &&
      !allowedOrigins.some((allowed) => referer.startsWith(allowed))
    ) {
      console.warn(`Invalid referer for state-changing request: ${referer}`);
      res.status(403).json({ error: "Invalid referer" });
      return false;
    }
  }

  return true;
}

/**
 * Utility to get CSRF token status for debugging
 */
export function getCSRFStatus(): {
  activeTokens: number;
  rateLimits: number;
  oldestToken: number | null;
} {
  cleanupExpiredTokens();

  let oldestTimestamp: number | null = null;
  for (const [, data] of tokenStore.entries()) {
    if (oldestTimestamp === null || data.timestamp < oldestTimestamp) {
      oldestTimestamp = data.timestamp;
    }
  }

  return {
    activeTokens: tokenStore.size,
    rateLimits: csrfRateLimits.size,
    oldestToken: oldestTimestamp,
  };
}
