export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const url = new URL(
      "https://fixturedownload.com/feed/json/nfl-2025/minnesota-vikings",
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
    return res.status(200).json(response);
  } catch (error) {
    console.error('NFL API error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
