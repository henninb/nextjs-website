import { NextResponse } from "next/server";

export const config = {
  matcher: ["/api/(.*)"],
  // Try without runtime specification to let Cloudflare handle it
};

export function middleware(request) {
  // Ultra-minimal middleware - just routing
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

  const pathname = request.nextUrl.pathname.replace(/\/+$/, "") || "/";

  if (localApis.includes(pathname) || pathname.startsWith("/api/uuid/")) {
    return NextResponse.next();
  }

  return new NextResponse("API not available", { status: 503 });
}
