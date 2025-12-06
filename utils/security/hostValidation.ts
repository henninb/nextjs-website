/**
 * Secure host validation utilities to prevent URL substring sanitization vulnerabilities.
 *
 * SECURITY: Using includes() for host validation is insecure because it matches anywhere in the string.
 * For example, host.includes("vercel.bhenning.com") would incorrectly match:
 * - "evil-vercel.bhenning.com"
 * - "vercel.bhenning.com.attacker.com"
 *
 * This module provides secure alternatives using exact matching and proper subdomain validation.
 */

/**
 * Checks if a host is localhost (exact match for localhost or 127.0.0.1)
 * @param host - The hostname to check
 * @returns true if the host is localhost or 127.0.0.1
 */
export function isLocalhost(host: string | null | undefined): boolean {
  if (!host) return false;

  // Handle IPv6 addresses in brackets (e.g., [::1]:8080)
  let hostname = host.toLowerCase();
  if (hostname.startsWith("[")) {
    // Extract IPv6 address from brackets
    const endBracket = hostname.indexOf("]");
    if (endBracket !== -1) {
      hostname = hostname.substring(0, endBracket + 1);
    }
  } else {
    // Remove port for IPv4 and regular hostnames
    hostname = hostname.split(":")[0];
  }

  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "0.0.0.0" ||
    hostname === "[::1]" || // IPv6 localhost with brackets
    hostname === "::1"
  ); // IPv6 localhost without brackets
}

/**
 * Checks if a host matches a specific domain or is a subdomain of it
 * @param host - The hostname to check
 * @param domain - The domain to match against (e.g., "vercel.bhenning.com")
 * @returns true if host exactly matches domain or is a subdomain of it
 */
export function isHostOrSubdomain(
  host: string | null | undefined,
  domain: string,
): boolean {
  if (!host) return false;

  // Remove port if present
  const hostname = host.split(":")[0].toLowerCase();
  const targetDomain = domain.toLowerCase();

  // Exact match
  if (hostname === targetDomain) return true;

  // Subdomain match: must end with .domain to prevent "evildomain.com" from matching
  return hostname.endsWith(`.${targetDomain}`);
}

/**
 * Checks if an origin is a localhost URL
 * @param origin - The origin URL to check (e.g., "http://localhost:3000")
 * @returns true if the origin is a localhost URL
 */
export function isLocalhostOrigin(origin: string | null | undefined): boolean {
  if (!origin) return false;

  try {
    const url = new URL(origin);
    return isLocalhost(url.hostname);
  } catch {
    // Invalid URL, check if it's just a hostname
    return isLocalhost(origin);
  }
}

/**
 * Checks if an origin matches a specific domain or is a subdomain
 * @param origin - The origin URL to check
 * @param domain - The domain to match against
 * @returns true if origin's hostname matches or is subdomain of domain
 */
export function isOriginForDomain(
  origin: string | null | undefined,
  domain: string,
): boolean {
  if (!origin) return false;

  try {
    const url = new URL(origin);
    return isHostOrSubdomain(url.hostname, domain);
  } catch {
    // Invalid URL, check if it's just a hostname
    return isHostOrSubdomain(origin, domain);
  }
}

/**
 * Checks if a host is an approved Vercel deployment for bhenning.com
 * @param host - The hostname to check
 * @returns true if host is vercel.bhenning.com or a subdomain
 */
export function isVercelHost(host: string | null | undefined): boolean {
  return isHostOrSubdomain(host, "vercel.bhenning.com");
}

/**
 * Checks if a host is approved (localhost or Vercel)
 * @param host - The hostname to check
 * @returns true if host is approved for development/production
 */
export function isApprovedHost(host: string | null | undefined): boolean {
  return isLocalhost(host) || isVercelHost(host);
}
