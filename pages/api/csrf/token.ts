import type { NextApiRequest, NextApiResponse } from "next";
import { handleCSRFTokenRequest } from "../../../utils/security/csrfProtection";
import { publicCORS } from "../../../utils/security/corsMiddleware";

/**
 * CSRF Token Generation Endpoint
 * Provides secure CSRF tokens for state-changing operations
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  // Apply CORS policy for public endpoints
  const corsResult = publicCORS(req, res);
  if (!corsResult) {
    return; // CORS middleware handled the response
  }

  // Handle CSRF token generation
  return handleCSRFTokenRequest(req, res);
}
