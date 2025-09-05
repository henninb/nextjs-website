import { NextResponse } from "next/server";


function toFahrenheit(x) {
  return x * (9.0 / 5.0) + 32.0;
}

//curl -X GET http://localhost:3000/api/fahrenheit -H "Content-Type: application/json" -d '{"celsius":21}'
export default async function GET(request) {
  const requestBody = await request.json();
  const celsius = requestBody.celsius;

  if (celsius === undefined) {
    return new Response(
      JSON.stringify({ error: "Celsius temperature is required" }),
      { status: 400 },
    );
  }

  const fahrenheit = toFahrenheit(celsius);

  return NextResponse.json({ fahrenheit });
}
