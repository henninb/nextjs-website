import { NextResponse } from "next/server";


// Simple in-memory rate limiting
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 60; // per IP per window

function rateLimitKey(req) {
  return (
    req.headers.get("x-forwarded-for") ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

function checkRateLimit(key) {
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  if (!entry || now > entry.reset) {
    rateLimitMap.set(key, { count: 1, reset: now + RATE_LIMIT_WINDOW });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX_REQUESTS) return false;
  entry.count += 1;
  return true;
}

export default async function handler(req) {
  if (req.method !== "GET") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  const apiKey = process.env.WEATHER_API_KEY;
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "Weather service misconfigured" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  const key = rateLimitKey(req);
  if (!checkRateLimit(key)) {
    return new Response(
      JSON.stringify({ error: "Rate limit exceeded. Try again later." }),
      {
        status: 429,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  try {
    const url = new URL("https://api.weather.com/v2/pws/observations/current");
    const params = {
      apiKey,
      units: "e",
      stationId: "KMNCOONR65",
      format: "json",
    };
    url.search = new URLSearchParams(params).toString();

    const apiResponse = await fetch(url.toString(), {
      method: "GET",
      redirect: "follow",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!apiResponse.ok) {
      return new Response(
        JSON.stringify({ error: "Upstream weather API error" }),
        {
          status: 502,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const data = await apiResponse.json();
    const res = NextResponse.json(data);
    res.headers.set("Cache-Control", "no-store");
    return res;
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Failed to fetch weather data" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
