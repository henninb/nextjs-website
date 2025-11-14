import { useQuery } from "@tanstack/react-query";
import { QueryKeys } from "../utils/cacheUtils";
import { createHookLogger } from "../utils/logger";

const log = createHookLogger("useUser");

/**
 * Fetch current user from API
 * Returns null if unauthenticated (401/403)
 *
 * @returns Current user data or null
 */
export async function fetchUser(): Promise<any | null> {
  log.debug("Fetching current user");

  const res = await fetch("/api/me", {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  });

  // Handle unauthenticated requests gracefully
  if (res.status === 401 || res.status === 403) {
    log.debug("User not authenticated", { status: res.status });
    return null;
  }

  if (!res.ok) {
    const errorDetails = await res.json().catch(() => ({}));
    log.error("Fetch failed", { status: res.status, errorDetails });
    throw new Error(`HTTP error! status: ${res.status}`);
  }

  const user = await res.json();
  log.debug("Fetched current user", { username: user?.username });
  return user;
}

/**
 * Hook for fetching current user
 * Does not require authentication (returns null if not authenticated)
 *
 * @returns User data, loading state, and error
 *
 * @example
 * ```typescript
 * const { user, isLoading, isError } = useUser();
 * ```
 */
export function useUser() {
  const { data, error, isLoading } = useQuery<any | null, Error>({
    queryKey: QueryKeys.me(),
    queryFn: fetchUser,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: false, // Don't retry auth failures
  });

  if (error) {
    log.error("Query failed", error);
  }

  if (data) {
    log.debug("Query successful", { username: data?.username });
  }

  return {
    user: data,
    isLoading,
    isError: error,
  };
}
