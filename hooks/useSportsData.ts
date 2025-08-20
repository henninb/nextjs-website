import { useState, useEffect, useCallback } from "react";

interface SportsDataHook {
  data: any[] | null;
  loading: boolean;
  error: string | null;
  retry: () => void;
}

export function useSportsData(apiEndpoint: string): SportsDataHook {
  const [data, setData] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const res = await fetch(apiEndpoint, {
        method: "GET",
        headers: { Accept: "application/json" },
        signal: controller.signal,
        credentials: "include",
      });

      if (!res.ok) {
        let message = "Failed to fetch sports data";
        if (res.status === 500) {
          message =
            "Server error. The sports data service may be temporarily unavailable.";
        } else if (res.status === 404) {
          message = "Sports data not found for this season.";
        }
        try {
          const body = await res.json();
          if (body?.message) message = body.message;
        } catch {}
        throw new Error(message);
      }

      const data = await res.json();
      setData(data);
    } catch (err: any) {
      const isAbort = err?.name === "AbortError";
      const message = isAbort
        ? "Connection timeout. Please check your internet connection."
        : err?.message || "Failed to fetch sports data";
      setError(message);
      console.error("Error fetching sports data:", err);
      // Re-throw to keep behavioral parity with previous implementation
      throw new Error(`Failed to fetch sports data: ${message}`);
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  }, [apiEndpoint]);

  const retry = useCallback(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, retry };
}
