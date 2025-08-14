import { NextResponse } from "next/server";

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
      // Build the target URL
      const targetUrl = `https://finance.bhenning.com${url.pathname}${url.search}`;
      if (isDev) console.log("[MW] target=", targetUrl);

      // Do not log cookies or headers

      // Forward the request
      const response = await fetch(targetUrl, {
        method: request.method,
        headers: {
          ...Object.fromEntries(request.headers.entries()),
          // Ensure proper host header
          host: "finance.bhenning.com",
          // Forward the original host for CORS if needed
          "x-forwarded-host": request.headers.get("host"),
          "x-forwarded-proto": "https",
        },
        body:
          request.method !== "GET" && request.method !== "HEAD"
            ? await request.blob()
            : undefined,
      });
      if (isDev) console.log("[MW] upstream status=", response.status);

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
          "Content-Type, Authorization, X-Requested-With, Accept, Origin",
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
