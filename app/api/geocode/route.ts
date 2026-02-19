import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");

  if (!q || q.trim().length < 2) {
    return NextResponse.json({ error: "Query too short" }, { status: 400 });
  }

  const sanitized = q.trim().slice(0, 100).replace(/[<>"']/g, "");

  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(sanitized)}&format=json&limit=5&addressdetails=1`;

    const response = await fetch(url, {
      headers: {
        "User-Agent": "nextjs-bhenning-website/1.0",
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Geocoding service unavailable" },
        { status: 502 },
      );
    }

    const data = await response.json();
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch geocoding results" },
      { status: 500 },
    );
  }
}
