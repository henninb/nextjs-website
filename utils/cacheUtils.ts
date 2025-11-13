import { QueryClient } from "@tanstack/react-query";

/**
 * Cache update strategies for React Query
 * Provides reusable patterns for optimistic updates and cache invalidation
 */
export class CacheUpdateStrategies {
  /**
   * Optimistically add item to list cache
   * Use for: Insert operations
   *
   * @param queryClient - React Query client instance
   * @param queryKey - Cache key for the list
   * @param newItem - Item to add to the list
   * @param position - Where to add the item (start or end)
   *
   * @example
   * ```typescript
   * CacheUpdateStrategies.addToList(
   *   queryClient,
   *   ["account"],
   *   newAccount,
   *   "start"
   * );
   * ```
   */
  static addToList<T>(
    queryClient: QueryClient,
    queryKey: readonly unknown[],
    newItem: T,
    position: "start" | "end" = "start",
  ): void {
    const oldData = queryClient.getQueryData<T[]>(queryKey);

    if (oldData) {
      const newData =
        position === "start" ? [newItem, ...oldData] : [...oldData, newItem];
      queryClient.setQueryData(queryKey, newData);
    } else {
      // No existing data - create new array with single item
      queryClient.setQueryData(queryKey, [newItem]);
    }
  }

  /**
   * Optimistically update item in list cache
   * Use for: Update operations (same entity)
   *
   * @param queryClient - React Query client instance
   * @param queryKey - Cache key for the list
   * @param updatedItem - Updated item
   * @param idKey - Key used to identify items (e.g., "accountId")
   *
   * @example
   * ```typescript
   * CacheUpdateStrategies.updateInList(
   *   queryClient,
   *   ["account"],
   *   updatedAccount,
   *   "accountNameOwner"
   * );
   * ```
   */
  static updateInList<T extends { [key: string]: any }>(
    queryClient: QueryClient,
    queryKey: readonly unknown[],
    updatedItem: T,
    idKey: keyof T,
  ): void {
    const oldData = queryClient.getQueryData<T[]>(queryKey);

    if (oldData) {
      const newData = oldData.map((item) =>
        item[idKey] === updatedItem[idKey] ? updatedItem : item,
      );
      queryClient.setQueryData(queryKey, newData);
    } else {
      // No existing data - invalidate to trigger refetch
      queryClient.invalidateQueries({ queryKey });
    }
  }

  /**
   * Optimistically remove item from list cache
   * Use for: Delete operations
   *
   * @param queryClient - React Query client instance
   * @param queryKey - Cache key for the list
   * @param itemToRemove - Item to remove
   * @param idKey - Key used to identify items
   *
   * @example
   * ```typescript
   * CacheUpdateStrategies.removeFromList(
   *   queryClient,
   *   ["account"],
   *   accountToDelete,
   *   "accountNameOwner"
   * );
   * ```
   */
  static removeFromList<T extends { [key: string]: any }>(
    queryClient: QueryClient,
    queryKey: readonly unknown[],
    itemToRemove: T,
    idKey: keyof T,
  ): void {
    const oldData = queryClient.getQueryData<T[]>(queryKey);

    if (oldData) {
      const newData = oldData.filter(
        (item) => item[idKey] !== itemToRemove[idKey],
      );
      queryClient.setQueryData(queryKey, newData);
    }
  }

  /**
   * Invalidate related queries
   * Use for: Cross-entity updates, complex updates
   *
   * @param queryClient - React Query client instance
   * @param queryKeys - Array of query keys to invalidate
   *
   * @example
   * ```typescript
   * CacheUpdateStrategies.invalidateRelated(queryClient, [
   *   ["account"],
   *   ["totals", "chase_brian"],
   * ]);
   * ```
   */
  static invalidateRelated(
    queryClient: QueryClient,
    queryKeys: readonly (readonly unknown[])[],
  ): void {
    queryKeys.forEach((key) => {
      queryClient.invalidateQueries({ queryKey: key });
    });
  }

  /**
   * Update aggregate/totals cache
   * Use for: Financial totals after transaction changes
   *
   * @param queryClient - React Query client instance
   * @param queryKey - Cache key for totals
   * @param updateFn - Function to update totals (receives old totals)
   *
   * @example
   * ```typescript
   * CacheUpdateStrategies.updateTotals(
   *   queryClient,
   *   ["totals", "chase_brian"],
   *   (oldTotals) => ({
   *     ...oldTotals,
   *     totals: oldTotals.totals + amountDifference,
   *   })
   * );
   * ```
   */
  static updateTotals<T>(
    queryClient: QueryClient,
    queryKey: readonly unknown[],
    updateFn: (oldTotals: T) => T,
  ): void {
    const oldTotals = queryClient.getQueryData<T>(queryKey);

    if (oldTotals) {
      const newTotals = updateFn(oldTotals);
      queryClient.setQueryData(queryKey, newTotals);
    } else {
      // No cached data - invalidate to trigger refetch
      queryClient.invalidateQueries({ queryKey });
    }
  }

  /**
   * Clear all related caches
   * Use for: Logout, major data changes
   *
   * @param queryClient - React Query client instance
   * @param prefixes - Array of key prefixes to clear (e.g., ["account", "transaction"])
   *
   * @example
   * ```typescript
   * CacheUpdateStrategies.clearCaches(queryClient, ["account", "transaction"]);
   * ```
   */
  static clearCaches(queryClient: QueryClient, prefixes: string[]): void {
    prefixes.forEach((prefix) => {
      queryClient.removeQueries({ queryKey: [prefix] });
    });
  }
}

/**
 * Type-safe query key builders
 * Provides consistent cache keys across the application
 */
export const QueryKeys = {
  // Account keys
  account: () => ["account"] as const,
  accountGql: () => ["accountsGQL"] as const,

  // Category keys
  category: () => ["category"] as const,
  categoryGql: () => ["categoriesGQL"] as const,

  // Description keys
  description: () => ["description"] as const,
  descriptionGql: () => ["descriptionsGQL"] as const,

  // Parameter keys
  parameter: () => ["parameter"] as const,
  parameterGql: () => ["parametersGQL"] as const,

  // Payment keys
  payment: () => ["payment"] as const,
  paymentGql: () => ["paymentsGQL"] as const,
  paymentRequired: () => ["paymentRequired"] as const,

  // Transfer keys
  transfer: () => ["transfer"] as const,
  transferGql: () => ["transfersGQL"] as const,

  // Transaction keys
  transactionByAccount: (accountName: string) =>
    ["transaction", accountName] as const,
  transactionByCategory: (category: string) =>
    ["transaction", "category", category] as const,
  transactionByDescription: (description: string) =>
    ["transaction", "description", description] as const,

  // Pending transaction keys
  pendingTransaction: () => ["pendingTransaction"] as const,

  // Medical expense keys
  medicalExpense: () => ["medicalExpense"] as const,

  // Family member keys
  familyMember: () => ["familyMember"] as const,

  // Validation amount keys
  validationAmount: () => ["validationAmount"] as const,
  validationAmounts: () => ["validationAmounts"] as const,

  // Totals keys
  totals: (accountName: string) => ["totals", accountName] as const,
  totalsPerAccount: () => ["totalsPerAccount"] as const,

  // Spending trends
  spendingTrends: () => ["spendingTrends"] as const,

  // User keys
  user: () => ["user"] as const,
  me: () => ["me"] as const,
} as const;

/**
 * Helper to get account transaction key
 * Maintains backward compatibility with existing code
 */
export function getAccountKey(
  accountNameOwner: string,
): readonly [string, string] {
  return QueryKeys.transactionByAccount(accountNameOwner);
}

/**
 * Helper to get totals key
 * Maintains backward compatibility with existing code
 */
export function getTotalsKey(
  accountNameOwner: string,
): readonly [string, string] {
  return QueryKeys.totals(accountNameOwner);
}
