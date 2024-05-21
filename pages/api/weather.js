import {NextResponse} from 'next/server';

export const runtime = 'edge';

export default async function GET() {

  const url = new URL('https://api.weather.com/v2/pws/observations/current')

  const params = {
      apiKey: "e1f10a1e78da46f5b10a1e78da96f525",
      units: "e",
      stationId: "KMNCOONR65",
      format: "json"
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
