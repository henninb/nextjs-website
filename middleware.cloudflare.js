import { NextResponse } from "next/server";

export const config = {
  matcher: [
    // Only match API routes - simplified for Cloudflare compatibility
    "/api/(.*)",
  ],
  runtime: "experimental-edge",
};

export async function middleware(request) {
  const url = request.nextUrl.clone();

  // Local APIs that should execute directly on Cloudflare Pages
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
  ];

  // Normalize pathname by removing trailing slashes
  const normalizedPathname = url.pathname.replace(/\/+$/, "") || "/";

  // Allow local APIs to pass through
  if (localApis.includes(normalizedPathname) || url.pathname.startsWith("/api/uuid/")) {
    return NextResponse.next();
  }

  // Block all other API routes for Cloudflare deployment
  // (Since we can't proxy to finance service from Cloudflare Pages)
  return new NextResponse(
    JSON.stringify({
      error: "API not available on Cloudflare Pages",
      message: "This API endpoint is only available on the main domain"
    }),
    {
      status: 503,
      headers: { "Content-Type": "application/json" }
    }
  );
}