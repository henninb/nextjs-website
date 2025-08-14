/**
 * Header sanitization utilities for proxy requests
 * Implements secure header filtering to prevent header injection attacks
 * and ensure only safe headers are forwarded to upstream services
 */

// Headers that are safe to forward to upstream services
const ALLOWED_REQUEST_HEADERS = new Set([
  "accept",
  "accept-encoding",
  "accept-language",
  "authorization",
  "cache-control",
  "content-type",
  "content-length",
  "cookie",
  "user-agent",
  "x-requested-with",
  "x-csrf-token",
  "if-none-match",
  "if-modified-since",
  "origin",
  "referer",
]);

// Headers that should never be forwarded
const BLOCKED_REQUEST_HEADERS = new Set([
  "x-forwarded-for",
  "x-forwarded-proto",
  "x-forwarded-host",
  "x-real-ip",
  "forwarded",
  "cf-connecting-ip",
  "cf-ipcountry",
  "cf-ray",
  "cf-visitor",
  "true-client-ip",
  "x-cluster-client-ip",
  "x-forwarded-port",
  "x-forwarded-server",
  "x-original-forwarded-for",
  "x-original-url",
  "x-rewrite-url",
  "server",
  "date",
  "connection",
  "upgrade",
  "proxy-connection",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailers",
  "transfer-encoding",
]);

// Headers that should not be forwarded from response
const BLOCKED_RESPONSE_HEADERS = new Set([
  "content-encoding",
  "transfer-encoding",
  "connection",
  "upgrade",
  "proxy-connection",
  "proxy-authenticate",
  "date",
  "server",
  "x-powered-by",
  "via",
  "x-cache",
  "x-cache-hits",
  "x-timer",
  "x-served-by",
  "x-fastly-request-id",
  "cf-cache-status",
  "cf-ray",
  "report-to",
  "nel",
]);

/**
 * Sanitizes request headers before forwarding to upstream service
 * @param headers - Original request headers
 * @param targetHost - Target hostname for the upstream service
 * @param originalHost - Original request host
 * @returns Sanitized headers object
 */
export function sanitizeRequestHeaders(
  headers: Headers,
  targetHost: string,
  originalHost: string,
): Record<string, string> {
  const sanitizedHeaders: Record<string, string> = {};

  // Process each header
  headers.forEach((value, key) => {
    const lowerKey = key.toLowerCase();

    // Skip blocked headers
    if (BLOCKED_REQUEST_HEADERS.has(lowerKey)) {
      return;
    }

    // Only allow explicitly permitted headers
    if (ALLOWED_REQUEST_HEADERS.has(lowerKey)) {
      // Validate and sanitize header values
      const sanitizedValue = sanitizeHeaderValue(value);
      if (sanitizedValue) {
        sanitizedHeaders[key] = sanitizedValue;
      }
    }
  });

  // Always set the correct host header
  sanitizedHeaders["host"] = targetHost;

  // Add forwarded headers for CORS and logging purposes
  sanitizedHeaders["x-forwarded-host"] = originalHost;
  sanitizedHeaders["x-forwarded-proto"] = "https";

  // Add timestamp for request tracking
  sanitizedHeaders["x-proxy-timestamp"] = Date.now().toString();

  return sanitizedHeaders;
}

/**
 * Sanitizes response headers before forwarding to client
 * @param headers - Original response headers
 * @returns Sanitized headers
 */
export function sanitizeResponseHeaders(headers: Headers): Headers {
  const sanitizedHeaders = new Headers();

  headers.forEach((value, key) => {
    const lowerKey = key.toLowerCase();

    // Skip blocked response headers
    if (BLOCKED_RESPONSE_HEADERS.has(lowerKey)) {
      return;
    }

    // Special handling for Set-Cookie headers (already handled in middleware)
    if (lowerKey === "set-cookie") {
      sanitizedHeaders.set(key, value);
      return;
    }

    // Special handling for security headers
    if (
      lowerKey.startsWith("x-") ||
      lowerKey.includes("security") ||
      lowerKey.includes("csp")
    ) {
      const sanitizedValue = sanitizeHeaderValue(value);
      if (sanitizedValue) {
        sanitizedHeaders.set(key, sanitizedValue);
      }
      return;
    }

    // Allow standard response headers with sanitization
    const allowedResponseHeaders = new Set([
      "content-type",
      "content-length",
      "cache-control",
      "expires",
      "last-modified",
      "etag",
      "location",
      "www-authenticate",
      "access-control-allow-origin",
      "access-control-allow-methods",
      "access-control-allow-headers",
      "access-control-allow-credentials",
      "access-control-max-age",
      "access-control-expose-headers",
      "vary",
    ]);

    if (allowedResponseHeaders.has(lowerKey)) {
      const sanitizedValue = sanitizeHeaderValue(value);
      if (sanitizedValue) {
        sanitizedHeaders.set(key, sanitizedValue);
      }
    }
  });

  return sanitizedHeaders;
}

/**
 * Sanitizes individual header values to prevent injection attacks
 * @param value - Header value to sanitize
 * @returns Sanitized header value or null if invalid
 */
function sanitizeHeaderValue(value: string): string | null {
  if (!value || typeof value !== "string") {
    return null;
  }

  // Remove control characters and normalize whitespace
  let sanitized = value
    .replace(/[\x00-\x1F\x7F-\x9F]/g, "") // Remove control characters
    .replace(/\s+/g, " ") // Normalize whitespace
    .trim();

  // Limit header value length to prevent DoS
  if (sanitized.length > 8192) {
    sanitized = sanitized.substring(0, 8192);
  }

  // Additional validation for specific header patterns
  if (sanitized.includes("\n") || sanitized.includes("\r")) {
    return null; // Prevent header injection
  }

  return sanitized || null;
}

/**
 * Validates that request headers don't contain suspicious patterns
 * @param headers - Headers to validate
 * @returns true if headers are valid, false otherwise
 */
export function validateHeaders(headers: Headers): boolean {
  const suspiciousPatterns = [
    /\r\n/g, // CRLF injection
    /\0/g, // Null byte injection
    /<script/i, // XSS attempt
    /javascript:/i, // JavaScript protocol
    /data:.*base64/i, // Data URI with base64
  ];

  for (const [key, value] of headers.entries()) {
    const combined = `${key}: ${value}`;

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(combined)) {
        console.warn(`Suspicious header pattern detected: ${key}`);
        return false;
      }
    }
  }

  return true;
}

/**
 * Rate limiting for header validation (basic implementation)
 */
const headerValidationLimits = new Map<
  string,
  { count: number; resetTime: number }
>();
const HEADER_RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const HEADER_RATE_LIMIT_MAX = 100; // 100 requests per minute per IP

export function checkHeaderRateLimit(clientIP: string): boolean {
  const now = Date.now();
  const limit = headerValidationLimits.get(clientIP);

  if (!limit) {
    headerValidationLimits.set(clientIP, {
      count: 1,
      resetTime: now + HEADER_RATE_LIMIT_WINDOW,
    });
    return true;
  }

  if (now > limit.resetTime) {
    headerValidationLimits.set(clientIP, {
      count: 1,
      resetTime: now + HEADER_RATE_LIMIT_WINDOW,
    });
    return true;
  }

  if (limit.count >= HEADER_RATE_LIMIT_MAX) {
    return false;
  }

  limit.count++;
  return true;
}
