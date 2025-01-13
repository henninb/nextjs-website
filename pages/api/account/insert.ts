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

// Function to set up the new account payload
const setupNewAccount = (payload: any) => ({
  accountNameOwner: payload.accountNameOwner,
  accountType: payload.accountType,
  moniker: payload.moniker,
  cleared: 0.0,
  future: 0.0,
  outstanding: 0.0,
  dateClosed: new Date(0),
  dateAdded: new Date(),
  dateUpdated: new Date(),
  activeStatus: true,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const payload = req.body;
    const newPayload = setupNewAccount(payload);

    const response = await fetch("https://your-external-api.com/account/insert", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: getBasicAuthHeader(),
      },
      body: JSON.stringify(newPayload),
      timeout: 0, // Optional: Ensure proper handling of long-running requests
    });

    if (!response.ok) {
      if (response.status === 404) {
        console.error("Resource not found (404).");
        const fallbackPayload = setupNewAccount(payload);
        return res.status(404).json(fallbackPayload);
      }
      throw new Error(`API responded with status ${response.status}`);
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error: any) {
    console.error("Error inserting account:", error.message);
    return res.status(500).json({ error: "Internal server error", details: error.message });
  }
}

