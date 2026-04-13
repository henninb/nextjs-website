/**
 * Secure UUID generation utility
 * Uses the Web Crypto API (crypto.randomUUID) which is cryptographically secure
 * and available in all modern browsers and Next.js edge/node runtimes.
 */

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Generate a cryptographically secure UUID v4.
 * Returned as a Promise so callers can await without changes.
 */
export async function generateSecureUUID(): Promise<string> {
  return crypto.randomUUID();
}

/**
 * Generate multiple UUIDs efficiently.
 */
export async function generateMultipleUUIDs(count: number): Promise<string[]> {
  if (count <= 0 || count > 100) {
    throw new Error("UUID count must be between 1 and 100");
  }
  return Array.from({ length: count }, () => crypto.randomUUID());
}

/**
 * Validate UUID format (v1–v5).
 */
export function isValidUUID(uuid: string): boolean {
  return UUID_REGEX.test(uuid);
}

export default { generateSecureUUID, generateMultipleUUIDs, isValidUUID };
