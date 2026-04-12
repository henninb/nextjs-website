import Account from "../model/Account";
import { useAuthenticatedQuery } from "../utils/queryConfig";
import { createQueryFn } from "../utils/fetchUtils";
import { QueryKeys } from "../utils/cacheUtils";
import { createHookLogger } from "../utils/logger";

const log = createHookLogger("useAccountFetch");

/**
 * Fetch active accounts for the authenticated user
 * Uses centralized query configuration with automatic authentication gating
 */
const fetchAccountData = createQueryFn<Account[]>("/api/account/active", {
  method: "GET",
});

/**
 * Hook to fetch all active accounts
 * Automatically handles authentication, caching, and error states
 *
 * @returns React Query result with accounts data, loading, and error states
 *
 * @example
 * ```typescript
 * const { data: accounts, isLoading, error } = useAccountFetch();
 * ```
 */
export default function useAccountFetch() {
  const queryResult = useAuthenticatedQuery(
    QueryKeys.account(),
    fetchAccountData,
  );


  return queryResult;
}
