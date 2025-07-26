export const runtime = 'edge';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const apiUrl = "https://fixturedownload.com/feed/json/nfl-2025/minnesota-vikings";

    const apiResponse = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; NextJS API)",
        "Accept": "application/json",
      },
    });

    if (!apiResponse.ok) {
      throw new Error(`HTTP error! status: ${apiResponse.status}`);
    }

    const response = await apiResponse.json();

    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
    return res.status(200).json(response);
  } catch (error) {
    console.error('NFL API error:', error.message || error);
    return res.status(500).json({
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
