import { NextResponse } from "next/server";
import { isLocalhost, isVercelHost } from "./utils/security/hostValidation";

export const config = {
  matcher: [
    // Match ALL API routes - we'll filter locally inside the proxy
    "/api/(.*)",
    // Handle direct GraphQL requests in production
    "/graphql",
    // Apply to non-static assets: exclude Next internals and favicon; handle
    // extension-based static assets in code below.
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
  // Note: Next.js 16 proxy does not support runtime config
  // Edge runtime is now the default for proxy functions
};

export default async function proxy(request) {
  const isProduction = process.env.NODE_ENV === "production";
  const isDev = !isProduction;

  // Always log in production to debug API routing issues
  if (
    isProduction &&
    (request.nextUrl.pathname.startsWith("/api/") ||
      request.nextUrl.pathname === "/graphql")
  ) {
    console.log(
      "[MW PROD] intercepted:",
      request.nextUrl.pathname,
      "method=",
      request.method,
    );
  } else if (isDev) {
    console.log(
      "[MW] path=",
      request.nextUrl.pathname,
      "method=",
      request.method,
    );
  }

  const url = request.nextUrl.clone();

  // CRITICAL: Check for local APIs FIRST and return early to bypass ALL security checks
  // Local APIs should execute directly without any proxy intervention or host validation
  const localApis = [
    "/api/nhl",
    "/api/nba",
    "/api/nfl",
    "/api/mlb",
    "/api/celsius",
    "/api/fahrenheit",
    "/api/lead",
    "/api/player-ads",
    "/api/player-analytics",
    "/api/player-heartbeat",
    "/api/player-metadata",
    "/api/weather",
    "/api/uuid",
    "/api/human",
    "/api/health",
  ];

  // Normalize pathname by removing trailing slashes for consistent matching
  const normalizedPathname = url.pathname.replace(/\/+$/, "") || "/";

  if (localApis.includes(normalizedPathname)) {
    // Local API - skip all middleware processing entirely (including host validation)
    if (isProduction) {
      console.log(`[MW PROD] local API bypass: ${url.pathname}`);
    } else {
      console.log(`[MW] local API bypass: ${url.pathname}`);
    }
    return NextResponse.next();
  }

  // Handle /api/uuid/generate special case (has sub-path)
  if (url.pathname.startsWith("/api/uuid/")) {
    if (isProduction) {
      console.log(`[MW PROD] local API bypass: ${url.pathname}`);
    } else {
      console.log(`[MW] local API bypass: ${url.pathname}`);
    }
    return NextResponse.next();
  }

  // SECURITY: Additional safeguards (only for non-local APIs)
  const host =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const isLocalhostHost = isLocalhost(host);
  const isVercelProxy = isVercelHost(host);

  // DEBUG: Always log host detection in production for vercel.bhenning.com
  if (isProduction || isDev) {
    console.log(
      `[MW${isProduction ? " PROD" : ""}] Host: ${host}, isProduction: ${isProduction}, isLocalhost: ${isLocalhostHost}, isVercelProxy: ${isVercelProxy}`,
    );
  }

  // CRITICAL: Prevent cookie rewriting in production
  // (no logging of headers/cookies)

  // SECURITY: Only allow proxy for approved hosts (local APIs already bypassed above)
  if (!isProduction && !isLocalhostHost && !isVercelProxy) {
    console.log(
      `[MW${isProduction ? " PROD" : ""}] blocked unauthorized host: ${host} (isProduction: ${isProduction}, isLocalhost: ${isLocalhostHost}, isVercelProxy: ${isVercelProxy})`,
    );
    return new NextResponse("Forbidden", { status: 403 });
  }

  // CRITICAL: Proxy ALL finance /api/* requests and /graphql to finance.bhenning.com
  // This includes /api/me, /api/graphql, /graphql, and all other finance API endpoints
  if (url.pathname.startsWith("/api/") || url.pathname === "/graphql") {
    if (isDev) {
      console.log("[MW] proxying API route");
    } else {
      console.log("[MW PROD] entering proxy logic for:", url.pathname);
    }
    try {
      // Determine upstream origin from env (supports local dev + prod)
      // Prefer explicit API_PROXY_TARGET; fallback to NEXT_PUBLIC_API_BASE_URL; default to prod host.
      const upstreamOrigin =
        process.env.API_PROXY_TARGET ||
        (isProduction
          ? "https://finance.bhenning.com"
          : process.env.NEXT_PUBLIC_API_BASE_URL) ||
        "https://finance.bhenning.com";

      // Log upstream origin in production for debugging
      if (isProduction) {
        console.log("[MW PROD] upstream origin:", upstreamOrigin);
      }

      const isVercel = isVercelProxy; // Use secure validation from earlier

      // Map specific API routes for production backend compatibility
      let upstreamPath;
      if (
        (isProduction || isLocalhostHost || isVercelProxy) &&
        (url.pathname === "/api/graphql" || url.pathname === "/graphql")
      ) {
        // In production, both /api/graphql and /graphql map to /graphql on backend
        upstreamPath = "/graphql" + url.search;
      } else {
        // All other /api/* paths go to backend as-is
        upstreamPath = url.pathname + url.search;
      }

      const targetUrl = new URL(upstreamPath, upstreamOrigin).toString();
      const isMutation = ["POST", "PUT", "DELETE", "PATCH"].includes(request.method);

      if (isDev) {
        const hasToken = (request.headers.get("cookie") || "").includes(
          "token=",
        );
        console.log(`[MW] target= ${targetUrl} tokenCookie=${hasToken}`);
      } else {
        // Log in production for debugging API proxy issues
        console.log(`[MW PROD] target URL: ${targetUrl}`);
      }

      // Log CSRF header and cookie in development for debugging
      const csrfToken = request.headers.get("x-csrf-token");
      const cookieHeader = request.headers.get("cookie") || "";
      const hasXsrfCookie = cookieHeader.includes("XSRF-TOKEN=");
      if (isDev && isMutation) {
        console.log(`[MW] CSRF token header: ${csrfToken ? "present" : "missing"}`);
        console.log(`[MW] XSRF-TOKEN cookie: ${hasXsrfCookie ? "present" : "MISSING"}`);
        if (csrfToken && hasXsrfCookie) {
          // Extract just the cookie value to compare
          const cookieMatch = cookieHeader.match(/XSRF-TOKEN=([^;]+)/);
          if (cookieMatch) {
            console.log(`[MW] Token matches cookie: ${csrfToken === cookieMatch[1]}`);
          }
        }
      }

      // Forward the request with timeout for production reliability
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

      const headersToForward = {
        ...Object.fromEntries(request.headers.entries()),
        // Ensure proper host header based on upstream target
        host: new URL(upstreamOrigin).host,
        // Forward the original host for CORS if needed
        "x-forwarded-host": request.headers.get("host"),
        "x-forwarded-proto": "https",
      };

      if (isDev) {
        console.log("[MW] Headers being forwarded:", Object.keys(headersToForward).join(", "));
      }

      const response = await fetch(targetUrl, {
        method: request.method,
        headers: headersToForward,
        body:
          request.method !== "GET" && request.method !== "HEAD"
            ? await request.blob()
            : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      if (isDev) {
        console.log("[MW] upstream status=", response.status);
      } else {
        console.log("[MW PROD] upstream response status=", response.status);
      }

      // Create response with all headers
      const responseHeaders = new Headers();
      response.headers.forEach((value, key) => {
        // Skip headers that shouldn't be forwarded
        if (
          !["content-encoding", "transfer-encoding", "connection"].includes(
            key.toLowerCase(),
          )
        ) {
          // Secure Set-Cookie header rewriting for development only
          if (key.toLowerCase() === "set-cookie") {
            // SECURITY: Only rewrite specific authentication and CSRF cookies in development
            const isAuthCookie = /^(token|session|auth)=/i.test(value);
            const isCsrfCookie = /^XSRF-TOKEN=/i.test(value);
            const isDevelopment = process.env.NODE_ENV === "development";
            const cookieHost = request.headers.get("host");
            const isLocalhostCookie = isLocalhost(cookieHost);
            const isVercelCookie = isVercelHost(cookieHost);

            if (
              (isAuthCookie || isCsrfCookie) &&
              isDevelopment &&
              isLocalhostCookie &&
              !isVercelCookie
            ) {
              // Secure rewriting: only remove problematic attributes for auth/CSRF cookies
              const modifiedCookie = value
                // Remove domain for any bhenning.com domain
                .replace(/;\s*Domain=\.?[^;]*bhenning\.com[^;]*/gi, "")
                // Remove Secure flag only for localhost HTTP
                .replace(/;\s*Secure(?=;|$)/gi, "")
                // Adjust SameSite for localhost compatibility
                .replace(/;\s*SameSite=None/gi, "; SameSite=Lax")
                .replace(/;\s*SameSite=Strict/gi, "; SameSite=Lax");

              if (isDev && isCsrfCookie) {
                console.log(`[MW] CSRF cookie rewrite: ${value.substring(0, 80)}...`);
                console.log(`[MW] CSRF cookie modified: ${modifiedCookie.substring(0, 80)}...`);
              }

              responseHeaders.set(key, modifiedCookie);
            } else {
              // Non-auth/CSRF cookies or production: pass through unchanged
              responseHeaders.set(key, value);
            }
          } else {
            responseHeaders.set(key, value);
          }
        }
      });

      // Add CORS headers for development
      if (isDev) {
        responseHeaders.set(
          "Access-Control-Allow-Origin",
          request.headers.get("origin") || "http://localhost:3000",
        );
        responseHeaders.set("Access-Control-Allow-Credentials", "true");
        responseHeaders.set(
          "Access-Control-Allow-Methods",
          "GET, POST, PUT, DELETE, OPTIONS",
        );
        responseHeaders.set(
          "Access-Control-Allow-Headers",
          "Content-Type, Authorization, X-Requested-With, Accept, Origin, X-CSRF-TOKEN",
        );
      }
      const finalResponse = new NextResponse(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
      });

      // Log successful proxy in production
      if (isProduction) {
        console.log(
          "[MW PROD] successfully proxied:",
          url.pathname,
          "status:",
          response.status,
        );
      }

      return finalResponse;
    } catch (error) {
      const errorMsg = isDev ? error : error?.message;
      console.error(
        `[MW${isProduction ? " PROD" : ""}] proxy error:`,
        errorMsg,
      );

      // Handle timeout and network errors gracefully in production
      if (error.name === "AbortError") {
        console.error(
          `[MW${isProduction ? " PROD" : ""}] request timeout for:`,
          url.pathname,
        );
        return new NextResponse(
          JSON.stringify({
            error: "Request timeout",
            message: "The upstream service did not respond in time",
          }),
          {
            status: 504,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      return new NextResponse(
        JSON.stringify({ error: "Proxy error", message: error.message }),
        {
          status: 502,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // This should never be reached for /api/* or /graphql requests
    console.error(
      "[MW PROD] CRITICAL: API/GraphQL request fell through middleware!",
    );
    return new NextResponse("Internal Server Error", { status: 500 });
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
