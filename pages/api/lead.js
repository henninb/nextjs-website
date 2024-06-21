import { NextResponse } from "next/server";

export const runtime = "edge";

export default async function POST(request) {
  let requestBody = {};
  try {
    requestBody = await request.json();
  } catch (e) {
    console.log("failed to parse json");
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
    });
  }

  const { vin, color, name, email } = requestBody;

  if (!vin || !color || !name || !email) {
    return new Response(JSON.stringify({ error: "Missing required fields" }), {
      status: 400,
    });
  }

  const data = {
    vin,
    color,
    name,
    email,
  };

  const cookies = request.headers.get('cookie');
    if (!cookies) {
      console.log('no cookies');
    } else {
      console.log('cookies found');
      console.log(cookies);
    }

  const pxCookies = request.headers.get('x-px-cookies') || '';
  if (!pxCookies) {
      console.log('pxCookies not found');
  } else {
    console.log(pxCookies);
  }


  try {
    const apiResponse = await fetch('https://f5x3msep1f.execute-api.us-east-1.amazonaws.com/prod/api-lead', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-bh-test': 1,
        // ...(cookies && { 'Cookie': cookies }),
      },
      body: JSON.stringify(data),
      // credentials: 'include'
    });

    if (!apiResponse.ok) {
      throw new Error('Failed to call the API');
    }

    const responseData = await apiResponse.json();

    return new Response(JSON.stringify(responseData), {
      status: apiResponse.status,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.log(error);
    return new Response(JSON.stringify({ error: "Failed to call API" }), {
      status: 500,
    });
  }
}
