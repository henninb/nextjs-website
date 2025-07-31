// Traditional Next.js API handler (not edge runtime)

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
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

    res.status(200).json(games.flat());
  } catch (error) {
    console.error("MLB API Error:", error);
    res
      .status(500)
      .json({ error: "Failed to fetch MLB data", details: error.message });
  }
}
