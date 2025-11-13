import {
  useQuery,
  useMutation,
  UseQueryOptions,
  UseMutationOptions,
  QueryKey,
  QueryFunction,
} from "@tanstack/react-query";
import { useAuth } from "../components/AuthProvider";

/**
 * Default configuration for all queries in the application
 * Centralized to ensure consistency across all hooks
 */
export const DEFAULT_QUERY_CONFIG = {
  staleTime: 5 * 60 * 1000, // 5 minutes - data remains fresh
  retry: 1, // Single retry on failure
  refetchOnWindowFocus: false, // Prevent unnecessary refetches
  refetchOnMount: false, // Use cached data on mount if fresh
  refetchOnReconnect: true, // Refetch when network reconnects
} as const;

/**
 * Default configuration for all mutations in the application
 */
export const DEFAULT_MUTATION_CONFIG = {
  retry: 1, // Single retry on failure
} as const;

/**
 * Creates a query that automatically gates on authentication status
 * This should be used for all protected endpoints that require authentication
 *
 * @param queryKey - Unique identifier for the query cache
 * @param queryFn - Async function that fetches the data (receives signal for cancellation)
 * @param options - Additional React Query options to override defaults
 * @returns React Query result object with data, loading states, and error
 *
 * @example
 * ```typescript
 * export default function useAccountFetch() {
 *   return useAuthenticatedQuery(
 *     ["account"],
 *     ({ signal }) => fetchAccountData(signal)
 *   );
 * }
 * ```
 */
export function useAuthenticatedQuery<TData = unknown, TError = Error>(
  queryKey: QueryKey,
  queryFn: QueryFunction<TData>,
  options?: Omit<UseQueryOptions<TData, TError>, "queryKey" | "queryFn">,
) {
  const { isAuthenticated, loading } = useAuth();

  return useQuery<TData, TError>({
    ...DEFAULT_QUERY_CONFIG,
    queryKey,
    queryFn,
    // Only enable query when:
    // 1. Auth loading is complete
    // 2. User is authenticated
    // 3. Additional enabled condition (if provided) is true
    enabled: !loading && isAuthenticated && (options?.enabled ?? true),
    ...options,
  });
}

/**
 * Creates a standard mutation with default configuration
 * Use this for all create, update, and delete operations
 *
 * @param mutationFn - Async function that performs the mutation
 * @param options - Additional React Query mutation options
 * @returns React Query mutation result with mutate, mutateAsync, and state
 *
 * @example
 * ```typescript
 * export default function useAccountInsert() {
 *   const queryClient = useQueryClient();
 *
 *   return useStandardMutation(
 *     (variables: { payload: Account }) => insertAccount(variables.payload),
 *     {
 *       mutationKey: ["insertAccount"],
 *       onSuccess: (response) => {
 *         // Update cache
 *       },
 *     }
 *   );
 * }
 * ```
 */
export function useStandardMutation<
  TData = unknown,
  TError = Error,
  TVariables = void,
  TContext = unknown,
>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: UseMutationOptions<TData, TError, TVariables, TContext>,
) {
  return useMutation<TData, TError, TVariables, TContext>({
    ...DEFAULT_MUTATION_CONFIG,
    mutationFn,
    ...options,
  });
}

/**
 * Creates a query for public endpoints (no authentication required)
 * Use this for endpoints that are accessible without login
 *
 * @param queryKey - Unique identifier for the query cache
 * @param queryFn - Async function that fetches the data
 * @param options - Additional React Query options
 * @returns React Query result object
 *
 * @example
 * ```typescript
 * export default function usePublicData() {
 *   return usePublicQuery(
 *     ["publicData"],
 *     ({ signal }) => fetchPublicData(signal)
 *   );
 * }
 * ```
 */
export function usePublicQuery<TData = unknown, TError = Error>(
  queryKey: QueryKey,
  queryFn: QueryFunction<TData>,
  options?: Omit<UseQueryOptions<TData, TError>, "queryKey" | "queryFn">,
) {
  return useQuery<TData, TError>({
    ...DEFAULT_QUERY_CONFIG,
    queryKey,
    queryFn,
    ...options,
  });
}
