import {NextResponse} from 'next/server';

export const runtime = 'edge';

export default async function GET() {
  const url = new URL('https://statsapi.mlb.com/api/v1/schedule')

  const params = {
      startDate: "1/01/2024",
      endDate: "12/31/2024",
      gameTypes: "R",
      sportId: 1,
      teamId: 142,
      hydrate: "decisions"
  };

  url.search = new URLSearchParams(params).toString();
  const apiResponse = await fetch(url.toString(), {
      method: 'GET',
      redirect: 'follow',
      headers: {
          "Content-Type": "application/json",
      },
  });
  const response = await apiResponse.json();
  return NextResponse.json(response);
}
