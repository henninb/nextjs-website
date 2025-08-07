import type { NextApiRequest, NextApiResponse } from "next";
import { randomUUID } from "crypto";
import {
  authCORS,
  validateCSRFToken,
} from "../../../utils/security/corsMiddleware";

export const runtime = "edge";

interface UUIDResponse {
  uuid: string;
  timestamp: number;
}

interface ErrorResponse {
  error: string;
}

// Rate limiting for UUID generation (basic implementation)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 100; // 100 UUIDs per minute per IP

function getRateLimitKey(req: NextApiRequest): string {
  // In production, you might want to use a more sophisticated IP detection
  return (
    (req.headers["x-forwarded-for"] as string) ||
    (req.headers["x-real-ip"] as string) ||
    req.socket?.remoteAddress ||
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

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<UUIDResponse | ErrorResponse>,
) {
  // Apply CORS policy for authentication routes
  if (!authCORS(req, res)) {
    return; // CORS middleware handled the response
  }

  // Only allow POST requests for UUID generation (more secure than GET)
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Validate CSRF token for additional security
  if (!validateCSRFToken(req)) {
    return res.status(403).json({ error: "CSRF token validation failed" });
  }

  try {
    // Basic authentication check (you should implement proper auth)
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // Rate limiting
    const rateLimitKey = getRateLimitKey(req);
    if (!checkRateLimit(rateLimitKey)) {
      return res
        .status(429)
        .json({ error: "Rate limit exceeded. Please try again later." });
    }

    // Generate cryptographically secure UUID
    const uuid = randomUUID();
    const timestamp = Date.now();

    // Add security headers
    res.setHeader(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate",
    );
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.setHeader("X-Content-Type-Options", "nosniff");

    return res.status(200).json({
      uuid,
      timestamp,
    });
  } catch (error: any) {
    console.error("UUID generation error:", error.message);

    return res.status(500).json({
      error:
        process.env.NODE_ENV === "production"
          ? "Internal server error"
          : `UUID generation failed: ${error.message}`,
    });
  }
}
