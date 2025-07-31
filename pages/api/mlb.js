export const runtime = "edge";

export default async function handler(req) {
  if (req.method !== "GET") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const url = new URL("https://statsapi.mlb.com/api/v1/schedule");

    const params = {
      startDate: "1/01/2025",
      endDate: "12/31/2025",
      gameTypes: "R",
      sportId: 1,
      teamId: 142,
      hydrate: "decisions",
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
      throw new Error(`MLB API responded with status: ${apiResponse.status}`);
    }

    const response = await apiResponse.json();

    // Flatten the games from the nested dates structure
    let games = [];
    if (response.dates) {
      Object.entries(response.dates).forEach((entry) => {
        const [, value] = entry;
        games.push(value["games"]);
      });
    }

    return new Response(JSON.stringify(games.flat()), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("MLB API Error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch MLB data", details: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
