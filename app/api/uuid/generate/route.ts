import { NextRequest } from "next/server";
import { getErrorMessage } from "../../../../types";

export const runtime = "edge";

// Rate limiting for UUID generation (basic implementation)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 100; // 100 UUIDs per minute per IP

function getRateLimitKey(req: NextRequest): string {
  // In production, you might want to use a more sophisticated IP detection
  return (
    req.headers.get("x-forwarded-for") ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const limit = rateLimitMap.get(key);

  if (!limit) {
    rateLimitMap.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (now > limit.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (limit.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }

  limit.count++;
  return true;
}

export async function POST(req: NextRequest) {
  try {
    // Rate limiting
    const rateLimitKey = getRateLimitKey(req);
    if (!checkRateLimit(rateLimitKey)) {
      return new Response(
        JSON.stringify({
          error: "Rate limit exceeded. Please try again later.",
        }),
        {
          status: 429,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Generate cryptographically secure UUID
    const uuid = crypto.randomUUID();
    const timestamp = Date.now();

    // Create response with security headers
    const headers = new Headers({
      "Content-Type": "application/json",
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      Pragma: "no-cache",
      Expires: "0",
      "X-Content-Type-Options": "nosniff",
      "Access-Control-Allow-Origin": "http://dev.finance.bhenning.com:3000",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Credentials": "true",
    });

    return new Response(
      JSON.stringify({
        uuid,
        timestamp,
      }),
      {
        status: 200,
        headers,
      },
    );
  } catch (error: unknown) {
    const errorMessage = getErrorMessage(error);
    console.error("UUID generation error:", errorMessage);

    return new Response(
      JSON.stringify({
        error:
          process.env.NODE_ENV === "production"
            ? "Internal server error"
            : `UUID generation failed: ${errorMessage}`,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
