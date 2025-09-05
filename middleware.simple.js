import { NextResponse } from "next/server";

// Ultra-simple middleware for Cloudflare Pages to avoid async_hooks
export const config = {
  matcher: ["/api/(.*)"],
  runtime: "experimental-edge",
};

export async function middleware(request) {
  const url = request.nextUrl.clone();
  
  // Local APIs that work on Cloudflare Pages
  const localApis = [
    "/api/nhl", "/api/nba", "/api/nfl", "/api/mlb", "/api/celsius", 
    "/api/fahrenheit", "/api/lead", "/api/player-ads", "/api/player-analytics",
    "/api/player-heartbeat", "/api/player-metadata", "/api/weather", 
    "/api/uuid", "/api/human"
  ];
  
  const normalizedPathname = url.pathname.replace(/\/+$/, "") || "/";
  
  // Allow local APIs through
  if (localApis.includes(normalizedPathname) || url.pathname.startsWith("/api/uuid/")) {
    return NextResponse.next();
  }
  
  // Block everything else
  return new NextResponse("API not available", { status: 503 });
}