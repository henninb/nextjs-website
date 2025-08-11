import { NextResponse } from "next/server";

export const config = {
  matcher: ["/api/:path*"],
  runtime: "experimental-edge",
};

export async function middleware(request) {
  const url = request.nextUrl.clone();

  // Only proxy /api/* requests in development
  if (
    process.env.NODE_ENV === "development" &&
    url.pathname.startsWith("/api/")
  ) {
    try {
      // Build the target URL
      const targetUrl = `https://finance.bhenning.com${url.pathname}${url.search}`;

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

      // Create response with all headers
      const responseHeaders = new Headers();
      response.headers.forEach((value, key) => {
        // Skip headers that shouldn't be forwarded
        if (
          !["content-encoding", "transfer-encoding", "connection"].includes(
            key.toLowerCase(),
          )
        ) {
          responseHeaders.set(key, value);
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

      return new NextResponse(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
      });
    } catch (error) {
      console.error("Proxy error:", error);
      return new NextResponse(
        JSON.stringify({ error: "Proxy error", message: error.message }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }
  }

  // Continue with normal processing for non-API routes
  return NextResponse.next();
}
