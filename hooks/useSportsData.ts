import { useState, useEffect, useCallback } from "react";
import axios from "axios";

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
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(apiEndpoint, {
        timeout: 10000, // 10 second timeout
        headers: {
          Accept: "application/json",
        },
      });
      setData(response.data);
    } catch (err) {
      let errorMessage = "Failed to fetch sports data";

      if (axios.isAxiosError(err)) {
        if (err.response?.status === 500) {
          errorMessage =
            "Server error. The sports data service may be temporarily unavailable.";
        } else if (err.response?.status === 404) {
          errorMessage = "Sports data not found for this season.";
        } else if (err.code === "ECONNRETRY" || err.code === "ETIMEDOUT") {
          errorMessage =
            "Connection timeout. Please check your internet connection.";
        } else if (err.response?.data?.message) {
          errorMessage = err.response.data.message;
        }
      }

      setError(errorMessage);
      console.error("Error fetching sports data:", err);
      throw new Error(`Failed to fetch sports data: ${errorMessage}`);
    } finally {
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
