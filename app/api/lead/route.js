export const runtime = "edge";

import { z } from "zod";
import { InputSanitizer } from "../../../utils/validation/sanitization";

const LeadSchema = z.object({
  vin: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-HJ-NPR-Z0-9]{11,17}$/i, "Invalid VIN")
    .max(17),
  color: z.string().trim().min(1).max(30),
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email(),
  phone: z.string().trim().min(1).max(20),
});

function sanitizeLead(input) {
  return {
    vin: String(input.vin || "").toUpperCase(),
    color: InputSanitizer.sanitizeText(String(input.color || "")),
    name: InputSanitizer.sanitizeText(String(input.name || "")),
    email: InputSanitizer.sanitizeEmail(String(input.email || "")),
    phone: input.phone
      ? InputSanitizer.sanitizeText(String(input.phone))
      : null,
  };
}

export async function POST(request) {
  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }
  let requestBody = {};
  try {
    requestBody = await request.json();
  } catch (e) {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
    });
  }

  const parse = LeadSchema.safeParse(requestBody);
  if (!parse.success) {
    return new Response(
      JSON.stringify({
        error: "Validation failed",
        details: parse.error.issues,
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  const { vin, color, name, email, phone } = sanitizeLead(parse.data);

  const data = {
    vin,
    color,
    name,
    email,
    phone,
  };

  // Do not log cookies or header values

  try {
    const apiResponse = await fetch(
      "https://f5x3msep1f.execute-api.us-east-1.amazonaws.com/prod/api-lead",
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "x-bh-test": 1,
        },
        body: JSON.stringify(data),
      },
    );

    let responseBody;
    try {
      responseBody = await apiResponse.json();
    } catch (jsonError) {
      responseBody = await apiResponse.text();
    }

    if (!apiResponse.ok) {
      return new Response(JSON.stringify({ error: "Lead service error" }), {
        status: 502,
        headers: { "Content-Type": "application/json" },
      });
    }

    const res = new Response(JSON.stringify(responseBody), {
      status: apiResponse.status,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });
    res.headers.set("Cache-Control", "no-store");
    return res;
  } catch (error) {
    return new Response(JSON.stringify({ error: "Failed to submit lead" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
