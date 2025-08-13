import { NextResponse } from "next/server";

export const config = {
  matcher: ["/api/:path*"],
  runtime: "experimental-edge",
};

export async function middleware(request) {
  console.log("=== MIDDLEWARE DEBUG START ===");
  console.log("Middleware triggered for path:", request.nextUrl.pathname);
  console.log("Full URL:", request.nextUrl.href);
  console.log("Method:", request.method);
  console.log("Host:", request.headers.get("host"));
  console.log("NODE_ENV:", process.env.NODE_ENV);

  // SECURITY: Additional safeguards
  const host = request.headers.get("host");
  const isProduction = process.env.NODE_ENV === "production";
  const isLocalhost =
    host?.includes("localhost") || host?.includes("127.0.0.1");

  // CRITICAL: Prevent cookie rewriting in production
  if (isProduction) {
    console.log("🔒 PRODUCTION MODE: Cookie rewriting disabled for security");
  }

  // SECURITY: Only allow proxy for approved localhost/development hosts
  if (!isProduction && !isLocalhost) {
    console.log("🚨 SECURITY: Unauthorized host attempted proxy:", host);
    return new NextResponse("Forbidden", { status: 403 });
  }

  const url = request.nextUrl.clone();

  // Proxy /api/* requests in both development and production
  if (url.pathname.startsWith("/api/")) {
    console.log(
      "✅ CONDITIONS MET: Entering proxy logic for API route",
    );
    console.log("Path starts with /api/:", url.pathname.startsWith("/api/"));
    console.log("NODE_ENV:", process.env.NODE_ENV);
    try {
      // Build the target URL
      const targetUrl = `https://finance.bhenning.com${url.pathname}${url.search}`;
      console.log("Proxying request to:", targetUrl);

      // Log all cookies being forwarded
      const cookies = request.headers.get("cookie");
      console.log("🍪 Cookies being forwarded:", cookies);

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
      console.log(
        "Received response from external API with status:",
        response.status,
      );
      console.log(
        "Response headers:",
        Object.fromEntries(response.headers.entries()),
      );

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
            console.log("🍪 Original Set-Cookie header:", value);

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

              console.log("🔒 Securely modified auth cookie:", modifiedCookie);
              responseHeaders.set(key, modifiedCookie);
            } else {
              // Non-auth cookies or production: pass through unchanged
              console.log(
                "🔒 Cookie passed through unchanged (non-auth or production)",
              );
              responseHeaders.set(key, value);
            }
          } else {
            responseHeaders.set(key, value);
          }
        }
      });

      // Add CORS headers for development
      responseHeaders.set(
        "Access-Control-Allow-Origin",
        request.headers.get("origin") || "*",
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
      console.log("✅ RETURNING PROXIED RESPONSE");
      console.log(
        "Final response headers:",
        Object.fromEntries(responseHeaders.entries()),
      );
      return new NextResponse(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
      });
    } catch (error) {
      console.error("❌ PROXY ERROR:", error);
      console.error("Error details:", error.message, error.stack);
      return new NextResponse(
        JSON.stringify({ error: "Proxy error", message: error.message }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }
  } else {
    console.log("❌ CONDITIONS NOT MET - Not proxying");
    console.log("Path starts with /api/:", url.pathname.startsWith("/api/"));
  }

  // Continue with normal processing for non-API routes
  console.log("🔄 CONTINUING WITH NEXTRESPONSE.NEXT()");
  console.log("=== MIDDLEWARE DEBUG END ===");
  return NextResponse.next();
}
