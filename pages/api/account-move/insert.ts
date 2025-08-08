import type { NextApiRequest, NextApiResponse } from "next";

export const runtime = "edge";

// Helper function to get Basic Auth header securely
const getBasicAuthHeader = () => {
  const username = process.env.BASIC_AUTH_USERNAME;
  const password = process.env.BASIC_AUTH_PASSWORD;

  if (!username || !password) {
    throw new Error(
      "Basic Auth credentials are missing in environment variables.",
    );
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
  dateClosed: new Date(0), // January 1, 1970 to indicate "not closed"
  dateAdded: new Date(),
  dateUpdated: new Date(),
  activeStatus: true,
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const payload = req.body;
    const newPayload = setupNewAccount(payload);

    const response = await fetch("http://localhost:3000/account/insert", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Uncomment this when Basic Auth is enabled
        // Authorization: getBasicAuthHeader(),
      },
      body: JSON.stringify(newPayload),
    });

    if (!response.ok) {
      if (response?.status === 404) {
        console.error(`API responded with status ${response.status}`);
        const fallbackPayload = setupNewAccount(req.body);
        return res.status(200).json(fallbackPayload); // Return fallback payload
      }

      console.error(`API responded with status ${response.status}`);
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error: any) {
    console.error("Error inserting account:", error.message);

    // Return a 500 error for other unexpected errors
    return res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
}
