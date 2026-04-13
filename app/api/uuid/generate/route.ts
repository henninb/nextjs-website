import { NextRequest } from "next/server";

export const runtime = "edge";

const ALLOWED_ORIGINS_PROD = [
  "https://finance.bhenning.com",
  "https://vercel.bhenning.com",
  "https://www.bhenning.com",
];

const ALLOWED_ORIGINS_DEV = [
  "http://localhost:3000",
  "http://dev.finance.bhenning.com:3000",
];

function getCORSOrigin(req: NextRequest): string {
  const allowedOrigins =
    process.env.NODE_ENV === "production"
      ? ALLOWED_ORIGINS_PROD
      : ALLOWED_ORIGINS_DEV;
  const requestOrigin = req.headers.get("origin") || "";
  return allowedOrigins.includes(requestOrigin)
    ? requestOrigin
    : allowedOrigins[0];
}

export async function POST(req: NextRequest) {
  try {
    const uuid = crypto.randomUUID();
    const timestamp = Date.now();
    const corsOrigin = getCORSOrigin(req);

    const headers = new Headers({
      "Content-Type": "application/json",
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      Pragma: "no-cache",
      Expires: "0",
      "X-Content-Type-Options": "nosniff",
      "Access-Control-Allow-Origin": corsOrigin,
      Vary: "Origin",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Credentials": "true",
    });

    return new Response(JSON.stringify({ uuid, timestamp }), {
      status: 200,
      headers,
    });
  } catch (error: unknown) {
    console.error("UUID generation error:", error);

    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
