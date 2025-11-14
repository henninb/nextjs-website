import { useQuery } from "@tanstack/react-query";
import { createHookLogger } from "../utils/logger";

const log = createHookLogger("useSportsData");

/**
 * Result type for sports data hook
 */
interface SportsDataHook {
  data: any[] | null;
  loading: boolean;
  error: string | null;
  retry: () => void;
}

/**
 * Fetch sports data from API endpoint with timeout
 * Handles 404 and 500 errors with specific messaging
 *
 * @param apiEndpoint - API endpoint URL to fetch sports data from
 * @returns Sports data array
 */
async function fetchSportsData(apiEndpoint: string): Promise<any[]> {
  log.debug("Fetching sports data", { endpoint: apiEndpoint });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

  try {
    const res = await fetch(apiEndpoint, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      signal: controller.signal,
      credentials: "include",
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      let message = "Failed to fetch sports data";
      if (res.status === 500) {
        message =
          "Server error. The sports data service may be temporarily unavailable.";
      } else if (res.status === 404) {
        message = "Sports data not found for this season.";
      }

      // Try to get error message from response
      try {
        const body = await res.json();
        if (body?.message) message = body.message;
      } catch {
        // Ignore JSON parse errors
      }

      log.error("Fetch failed", { status: res.status, message });
      throw new Error(message);
    }

    const data = await res.json();
    log.debug("Fetched sports data", { count: data?.length || 0 });
    return data;
  } catch (err: any) {
    clearTimeout(timeoutId);

    const isAbort = err?.name === "AbortError";
    const message = isAbort
      ? "Connection timeout. Please check your internet connection."
      : err?.message || "Failed to fetch sports data";

    log.error("Fetch error", { error: message, isAbort });
    throw new Error(message);
  }
}

/**
 * Hook for fetching sports data from dynamic endpoints
 * Uses React Query for caching and automatic refetching
 * Provides retry functionality and error handling
 *
 * @param apiEndpoint - API endpoint URL (e.g., "/api/nfl", "/api/nba")
 * @returns Sports data, loading state, error message, and retry function
 *
 * @example
 * ```typescript
 * const { data, loading, error, retry } = useSportsData("/api/nfl");
 * ```
 */
export function useSportsData(apiEndpoint: string): SportsDataHook {
  const queryResult = useQuery({
    queryKey: ["sportsData", apiEndpoint],
    queryFn: () => fetchSportsData(apiEndpoint),
    staleTime: 15 * 60 * 1000, // 15 minutes (sports data changes infrequently)
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: 1, // Retry once on failure
    enabled: !!apiEndpoint, // Only fetch if endpoint is provided
  });

  if (queryResult.isError) {
    log.error("Query failed", queryResult.error);
  }

  if (queryResult.isSuccess && queryResult.data) {
    log.debug("Query successful", { count: queryResult.data.length });
  }

  return {
    data: queryResult.data ?? null,
    loading: queryResult.isLoading,
    error: queryResult.error?.message ?? null,
    retry: () => queryResult.refetch(),
  };
}
