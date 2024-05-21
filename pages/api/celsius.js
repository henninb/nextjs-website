import {NextResponse} from 'next/server';

export const runtime = 'edge';

function toCelsius(x) {
  return ((5.0/9.0) * (x - 32.0));
}

//curl -X GET http://localhost:3000/api/celsius -H "Content-Type: application/json" -d '{"fahrenheit":21}'
export default async function GET(request) {
  const requestBody = await request.json();
  const fahrenheit = requestBody.fahrenheit;
  const celsius = toCelsius(fahrenheit);

  if (fahrenheit === undefined) {
    return new Response(JSON.stringify({error: 'Fahrenheit temperature is required'}), {status: 400});
  }

  return NextResponse.json({celsius});
}
