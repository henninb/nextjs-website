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
  phone: z.string().trim().min(10, "Phone number must be at least 10 digits").max(15),
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

  let data;
  try {
    const sanitized = sanitizeLead(parse.data);
    data = {
      vin: sanitized.vin,
      color: sanitized.color,
      name: sanitized.name,
      email: sanitized.email,
      phone: sanitized.phone,
    };
  } catch (sanitizeError) {
    return new Response(
      JSON.stringify({ error: "Input sanitization failed" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  const responseBody = {
    leadId: `LEAD-${Date.now()}`,
    status: "submitted",
    ...data,
  };

  return new Response(JSON.stringify(responseBody), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
}
