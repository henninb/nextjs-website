import { NextResponse } from "next/server";

export const runtime = "edge";

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

export async function GET(req) {
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
    // Plymouth, MN (55303) coordinates
    const latitude = 45.0105;
    const longitude = -93.4556;

    const url = new URL("https://api.open-meteo.com/v1/forecast");
    const params = {
      latitude,
      longitude,
      current:
        "temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,pressure_msl",
      temperature_unit: "fahrenheit",
      wind_speed_unit: "mph",
      precipitation_unit: "inch",
      timezone: "America/Chicago",
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

    // Transform Open-Meteo data to match expected format
    const transformedData = {
      observations: [
        {
          obsTimeLocal: data.current.time,
          imperial: {
            temp: Math.round(data.current.temperature_2m),
            windChill: Math.round(data.current.apparent_temperature),
            pressure: (data.current.pressure_msl * 0.02953).toFixed(2), // Convert hPa to inHg
          },
          humidity: data.current.relative_humidity_2m,
          windSpeed: Math.round(data.current.wind_speed_10m),
          precipitation: data.current.precipitation,
          weatherCode: data.current.weather_code,
        },
      ],
    };

    const res = NextResponse.json(transformedData);
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
