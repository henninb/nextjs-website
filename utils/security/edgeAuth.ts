/**
 * Edge-compatible session validation.
 *
 * Validates the caller's session by forwarding their cookie to the Spring
 * backend's /api/me endpoint. If /api/me returns anything other than 200 the
 * caller is considered unauthenticated.
 *
 * Compatible with Next.js edge runtime — no Node.js APIs used.
 */

function getUpstreamOrigin(): string {
  return (
    process.env.API_PROXY_TARGET ||
    (process.env.NODE_ENV === "production"
      ? "https://finance.bhenning.com"
      : process.env.NEXT_PUBLIC_API_BASE_URL) ||
    "https://finance.bhenning.com"
  );
}

/**
 * Returns true if the request carries a valid session recognised by the
 * Spring backend. Throws only on unexpected network failures (not on 401/403).
 */
export async function isSessionValid(req: Request): Promise<boolean> {
  const cookieHeader = req.headers.get("cookie");
  if (!cookieHeader) return false;

  const upstreamOrigin = getUpstreamOrigin();
  const meUrl = `${upstreamOrigin}/api/me`;

  try {
    const res = await fetch(meUrl, {
      method: "GET",
      headers: {
        cookie: cookieHeader,
        accept: "application/json",
      },
    });
    return res.ok;
  } catch {
    // Network failure — fail closed (deny access)
    return false;
  }
}
