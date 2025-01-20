import type { NextApiRequest, NextApiResponse } from "next";

export const runtime = "edge";

// Sample data for fallback in case of an error or for testing
const dataTest = [
  {
    accountId: 1,
    accountNameOwner: "wfargo_brian",
    accountType: "debit",
    activeStatus: true,
    moniker: "0000",
    outstanding: 1500.25,
    future: 200.0,
    cleared: 1300.25,
  },
  {
    accountId: 2,
    accountNameOwner: "barclay-cash_brian",
    accountType: "credit",
    activeStatus: true,
    moniker: "0000",
    outstanding: 5000.75,
    future: 1000.0,
    cleared: 4000.75,
  },
  {
    accountId: 3,
    accountNameOwner: "barclay-savings_brian",
    accountType: "debit",
    activeStatus: true,
    moniker: "0000",
    outstanding: 5000.75,
    future: 1000.0,
    cleared: 4000.75,
  },
  {
    accountId: 4,
    accountNameOwner: "wellsfargo-cash_brian",
    accountType: "credit",
    activeStatus: true,
    moniker: "0000",
    outstanding: 5000.75,
    future: 1000.0,
    cleared: 4000.75,
  },
];

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
  console.log('handler is being called')
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const response = await fetch("http://localhost/account/select/active", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        //Authorization: getBasicAuthHeader(),
      },
    });

    if (!response.ok) {
      if( response?.status === 404) {
        console.error(`API responded with status ${response.status}`);
        //const fallbackPayload = setupNewAccount(req.body);
        return res.status(200).json(dataTest); // Return fallback payload
      }

      console.error(`API responded with status ${response.status}`);
      throw new Error(`API responded with status ${response.status}`);
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error: any) {
    console.error("Error fetching account data:", error.message);
    return res.status(500).json(dataTest); // Return fallback data in case of failure
  }
}
