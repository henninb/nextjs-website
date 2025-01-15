import type { NextApiRequest, NextApiResponse } from "next";

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
  const { accountNameOwner } = req.query;

  if (req.method !== "DELETE") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!accountNameOwner || typeof accountNameOwner !== "string") {
    return res.status(400).json({ error: "Invalid account name" });
  }

  try {
    const response = await fetch(`https://your-external-api.com/account/delete/${accountNameOwner}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        //Authorization: getBasicAuthHeader(),
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        const fallbackPayload = {"message": "deleted: `${accountNameOwner}`"};
        return res.status(200).json(fallbackPayload); // Return fallback payload
        //return res.status(404).json({ error: "Resource not found" });
      }
      throw new Error(`API responded with status ${response.status}`);
    }

  } catch (error: any) {
    console.error("Error deleting account:", error.message);
    return res.status(500).json({ error: "Internal server error", details: error.message });
  }
}

