import { NextResponse } from "next/server";
import {
  sanitizeRequestHeaders,
  sanitizeResponseHeaders,
  validateHeaders,
  checkHeaderRateLimit,
} from "./utils/security/headerSanitization";

export const config = {
  matcher: [
    "/api/:path*",
    // Apply to non-static assets: exclude Next internals and favicon; handle
    // extension-based static assets in code below.
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
  runtime: "experimental-edge",
};

export async function middleware(request) {
  const isProduction = process.env.NODE_ENV === "production";
  const isDev = !isProduction;
  if (isDev) {
    console.log(
      "[MW] path=",
      request.nextUrl.pathname,
      "method=",
      request.method,
    );
  }

  // SECURITY: Additional safeguards
  const host = request.headers.get("host");
  const isLocalhost =
    host?.includes("localhost") || host?.includes("127.0.0.1");

  // CRITICAL: Prevent cookie rewriting in production
  // (no logging of headers/cookies)

  // SECURITY: Only allow proxy for approved localhost/development hosts
  if (!isProduction && !isLocalhost) {
    if (isDev) console.log("[MW] blocked unauthorized host");
    return new NextResponse("Forbidden", { status: 403 });
  }

  const url = request.nextUrl.clone();

  // Proxy /api/* requests in both development and production
  if (url.pathname.startsWith("/api/")) {
    if (isDev) console.log("[MW] proxying API route");
    try {
      // SECURITY: Get client IP for rate limiting
      const clientIP =
        request.headers.get("x-forwarded-for") ||
        request.headers.get("x-real-ip") ||
        "unknown";

      // SECURITY: Rate limit header validation requests
      if (!checkHeaderRateLimit(clientIP)) {
        console.warn(`[MW] Header rate limit exceeded for IP: ${clientIP}`);
        return new NextResponse("Too Many Requests", { status: 429 });
      }

      // SECURITY: Validate headers for suspicious patterns
      if (!validateHeaders(request.headers)) {
        console.warn(`[MW] Suspicious headers detected from IP: ${clientIP}`);
        return new NextResponse("Bad Request", { status: 400 });
      }

      // SECURITY: Basic CSRF validation for state-changing methods
      const method = request.method?.toLowerCase();
      if (method && ["post", "put", "delete", "patch"].includes(method)) {
        // Exempt authentication and public endpoints from CSRF protection
        const authEndpoints = [
          "/api/users/sign_in",
          "/api/login",
          "/api/register",
          "/api/auth",
          "/api/csrf/token",
          "/api/uuid/generate",
        ];

        const isAuthEndpoint = authEndpoints.some((endpoint) =>
          url.pathname.includes(endpoint),
        );

        if (!isAuthEndpoint) {
          const csrfHeader = request.headers.get("x-csrf-token");
          const origin = request.headers.get("origin");

          // Require CSRF token for state-changing operations (except auth)
          if (!csrfHeader) {
            console.warn(
              `[MW] Missing CSRF token for ${method.toUpperCase()} request from IP: ${clientIP}, path: ${url.pathname}`,
            );
            return new NextResponse("CSRF token required", { status: 403 });
          }

          // Validate origin for state-changing requests (except auth)
          if (!origin) {
            console.warn(
              `[MW] Missing origin header for ${method.toUpperCase()} request from IP: ${clientIP}, path: ${url.pathname}`,
            );
            return new NextResponse("Origin header required", { status: 403 });
          }

          // Check if origin matches expected hosts
          const allowedOrigins = isProduction
            ? ["https://vercel.bhenning.com", "https://finance.bhenning.com"]
            : [
                "http://localhost:3000",
                "http://localhost:3001",
                "http://dev.finance.bhenning.com:3000",
              ];

          if (!allowedOrigins.some((allowed) => origin.startsWith(allowed))) {
            console.warn(
              `[MW] Invalid origin for ${method.toUpperCase()} request: ${origin} from IP: ${clientIP}, path: ${url.pathname}`,
            );
            return new NextResponse("Invalid origin", { status: 403 });
          }
        } else {
          if (isDev)
            console.log(
              `[MW] Exempting auth endpoint from CSRF: ${url.pathname}`,
            );
        }
      }

      // Build the target URL
      const targetUrl = `https://finance.bhenning.com${url.pathname}${url.search}`;
      if (isDev) console.log("[MW] target=", targetUrl);

      // SECURITY: Sanitize request headers before forwarding
      const sanitizedHeaders = sanitizeRequestHeaders(
        request.headers,
        "finance.bhenning.com",
        request.headers.get("host") || "unknown",
      );

      // Forward the request with sanitized headers
      const response = await fetch(targetUrl, {
        method: request.method,
        headers: sanitizedHeaders,
        body:
          request.method !== "GET" && request.method !== "HEAD"
            ? await request.blob()
            : undefined,
      });
      if (isDev) console.log("[MW] upstream status=", response.status);

      // SECURITY: Sanitize response headers
      const responseHeaders = sanitizeResponseHeaders(response.headers);

      // Special handling for Set-Cookie headers (preserve existing logic)
      response.headers.forEach((value, key) => {
        if (key.toLowerCase() === "set-cookie") {
          // SECURITY: Only rewrite specific authentication cookies in development
          const isAuthCookie = /^(token|session|auth)=/i.test(value);
          const isDevelopment = process.env.NODE_ENV === "development";
          const isLocalhost = request.headers
            .get("host")
            ?.includes("localhost");

          if (isAuthCookie && isDevelopment && isLocalhost) {
            // Secure rewriting: only remove problematic attributes for auth cookies
            const modifiedCookie =
              value
                // Remove domain for any bhenning.com domain
                .replace(/;\s*Domain=\.?bhenning\.com/gi, "")
                // Remove Secure flag only for localhost HTTP
                .replace(/;\s*Secure(?=;|$)/gi, "")
                // Adjust SameSite for localhost compatibility
                .replace(/;\s*SameSite=None/gi, "; SameSite=Lax") +
              // Ensure HttpOnly is preserved for security
              (!/HttpOnly/i.test(value) ? "; HttpOnly" : "");
            responseHeaders.set(key, modifiedCookie);
          } else {
            // Non-auth cookies or production: pass through unchanged
            responseHeaders.set(key, value);
          }
        }
      });

      // Add CORS headers for development
      if (isDev) {
        responseHeaders.set(
          "Access-Control-Allow-Origin",
          request.headers.get("origin") || "http://localhost:3001",
        );
        responseHeaders.set("Access-Control-Allow-Credentials", "true");
        responseHeaders.set(
          "Access-Control-Allow-Methods",
          "GET, POST, PUT, DELETE, OPTIONS",
        );
        responseHeaders.set(
          "Access-Control-Allow-Headers",
          "Content-Type, Authorization, X-Requested-With, Accept, Origin, x-csrf-token",
        );
      }
      return new NextResponse(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
      });
    } catch (error) {
      console.error("[MW] proxy error:", isDev ? error : error?.message);
      return new NextResponse(
        JSON.stringify({ error: "Proxy error", message: error.message }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }
  } else {
    // Non-API routes: enforce no-store for dynamic/HTML content
    const pathname = url.pathname || "";
    const isStaticAsset =
      /\.(js|css|svg|png|jpg|jpeg|gif|webp|ico|ttf|otf|woff|woff2)$/i.test(
        pathname,
      );
    if (isStaticAsset || pathname.startsWith("/_next/")) {
      return NextResponse.next();
    }
    const res = NextResponse.next();
    res.headers.set("Cache-Control", "no-store");
    if (isDev) console.log("[MW] set no-store on dynamic route");
    return res;
  }

  // Continue with normal processing for non-API routes
  // (no header/cookie logging)
  return NextResponse.next();
}
