import type { NextApiRequest, NextApiResponse } from "next";

// Fallback totals data for testing or in case of an error
const fallbackData = {
  totalsFuture: "-2055.70",
  totalsCleared: "152877.53",
  totals: "152326.56",
  totalsOutstanding: "1505.73",
};

// Helper function to get Basic Auth header securely
const getBasicAuthHeader = () => {
  const username = process.env.BASIC_AUTH_USERNAME;
  const password = process.env.BASIC_AUTH_PASSWORD;

  if (!username || !password) {
    throw new Error("Basic Auth credentials are missing in environment variables.");
  }

  return `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const response = await fetch("https://your-external-api.com/account/totals", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: getBasicAuthHeader(),
      },
      timeout: 0, // Optional: Manage long-running requests
    });

    if (!response.ok) {
      throw new Error(`API responded with status ${response.status}`);
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error: any) {
    console.error("Error fetching totals data:", error.message);
    return res.status(500).json(fallbackData); // Return fallback data on error
  }
}

