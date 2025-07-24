import { NextResponse } from "next/server";

export const runtime = "edge";

export default async function GET() {
  const url = new URL(
    "https://fixturedownload.com/feed/json/nba-2024/minnesota-timberwolves",
  );
  const params = {};

  url.search = new URLSearchParams(params).toString();
  const apiResponse = await fetch(url.toString(), {
    method: "GET",
    redirect: "follow",
    headers: {
      "Content-Type": "application/json",
    },
  });
  const response = await apiResponse.json();
  return NextResponse.json(response);
}
