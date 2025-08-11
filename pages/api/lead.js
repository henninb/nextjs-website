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

  const cookies = request.headers.get("cookie");
  if (!cookies) {
    console.log("no cookies");
  } else {
    console.log("cookies found");
    console.log(cookies);
  }

  const pxCookies = request.headers.get("x-px-cookies") || "";
  if (!pxCookies) {
    console.log("pxCookies not found");
  } else {
    console.log(pxCookies);
  }

  try {
    const apiResponse = await fetch(
      "https://f5x3msep1f.execute-api.us-east-1.amazonaws.com/prod/api-lead",
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "x-bh-test": 1,
        },
        body: JSON.stringify(data),
      },
    );

    let responseBody;
    try {
      responseBody = await apiResponse.json();
    } catch (jsonError) {
      console.log("Failed to parse response JSON", jsonError);
      responseBody = await apiResponse.text();
    }

    if (!apiResponse.ok) {
      console.error("API call failed with status:", apiResponse.status);
      console.error("API response body:", responseBody);
      return new Response(
        JSON.stringify({ error: "Failed to call API", details: responseBody }),
        {
          status: apiResponse.status,
        },
      );
    }

    return new Response(JSON.stringify(responseBody), {
      status: apiResponse.status,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.log(error);
    return new Response(JSON.stringify({ error: "Failed to call API" }), {
      status: 500,
    });
  }
}
