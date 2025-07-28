export const config = {
  runtime: "edge",
};

export async function onRequest(context) {
  const { request } = context;

  if (request.method !== "GET") {
    return new Response(JSON.stringify({ message: "Method not allowed" }), {
      status: 405,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  try {
    const url =
      "https://fixturedownload.com/feed/json/nfl-2025/minnesota-vikings";

    const apiResponse = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json, text/plain, */*",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Referer: "https://pages.bhenning.com/",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
      },
      cf: {
        cacheTtl: 300,
        cacheEverything: true,
      },
    });

    console.log("API Response status:", apiResponse.status);
    console.log(
      "API Response headers:",
      Object.fromEntries(apiResponse.headers),
    );

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      console.error("API Error response:", errorText);
      throw new Error(`HTTP ${apiResponse.status}: ${errorText}`);
    }

    const response = await apiResponse.json();

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET",
        "Access-Control-Allow-Headers": "Content-Type",
        "Cache-Control": "public, max-age=300, s-maxage=300",
      },
    });
  } catch (error) {
    console.error("NFL API error details:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });

    return new Response(
      JSON.stringify({
        message: "Failed to fetch NFL data",
        error: error.message,
        timestamp: new Date().toISOString(),
        debug: {
          url: "https://fixturedownload.com/feed/json/nfl-2025/minnesota-vikings",
          userAgent: "Chrome Browser",
        },
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      },
    );
  }
}
