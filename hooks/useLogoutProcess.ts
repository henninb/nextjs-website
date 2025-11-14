import { useState } from "react";
import { useRouter } from "next/router";
import { fetchWithErrorHandling } from "../utils/fetchUtils";
import { createHookLogger } from "../utils/logger";

const log = createHookLogger("useLogoutProcess");

/**
 * Hook for user logout process
 * Handles logout API call with loading and error states
 * Does not use React Query as logout is a one-time action
 *
 * @returns Logout function, loading state, and error state
 *
 * @example
 * ```typescript
 * const { logoutNow, loading, error } = useLogoutProcess();
 * await logoutNow();
 * ```
 */
export default function useLogoutProcess() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const router = useRouter();

  const logoutNow = async () => {
    setLoading(true);
    setError(null);

    try {
      log.debug("Processing logout");

      await fetchWithErrorHandling("/api/logout", {
        method: "POST",
      });

      log.debug("Logout successful");
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Logout failed");
      log.error("Logout failed", error);
      setError(error);
    } finally {
      setLoading(false);
    }
  };

  return { logoutNow, loading, error };
}
