import { useState, useEffect, useCallback } from "react";
import Account from "../model/Account";
import { createHookLogger } from "../utils/logger";

const log = createHookLogger("useAccountUsageTracking");

interface AccountUsage {
  accountNameOwner: string;
  visitCount: number;
  lastVisited: Date;
}

const STORAGE_KEY = "financeApp_accountUsage";
const MAX_QUICK_LINKS = 6;

/**
 * Hook for tracking account visit frequency using localStorage
 * Client-side only - no API calls
 * Used for "most used accounts" quick navigation feature
 *
 * @returns Functions to track visits, remove accounts, and get most used accounts
 *
 * @example
 * ```typescript
 * const { trackAccountVisit, getMostUsedAccounts } = useAccountUsageTracking();
 * trackAccountVisit("checking_alice");
 * const mostUsed = getMostUsedAccounts(allAccounts, 6);
 * ```
 */
export default function useAccountUsageTracking() {
  const [accountUsage, setAccountUsage] = useState<AccountUsage[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        interface StoredVisit {
          accountNameOwner: string;
          timestamp: number;
          lastVisited: string | number;
        }
        const parsed = JSON.parse(saved).map((item: StoredVisit) => ({
          ...item,
          lastVisited: new Date(item.lastVisited),
        }));
        setAccountUsage(parsed);
        log.debug("Loaded account usage from storage", {
          count: parsed.length,
        });
      } catch (error) {
        log.error("Failed to parse account usage data", error);
        setAccountUsage([]);
      }
    }
  }, []);

  const saveToStorage = useCallback((usage: AccountUsage[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(usage));
      log.debug("Saved account usage to storage", { count: usage.length });
    } catch (error) {
      log.error("Failed to save account usage data", error);
    }
  }, []);

  const trackAccountVisit = useCallback(
    (accountNameOwner: string) => {
      setAccountUsage((prev) => {
        const existingIndex = prev.findIndex(
          (item) => item.accountNameOwner === accountNameOwner,
        );
        let updated: AccountUsage[];

        if (existingIndex >= 0) {
          updated = [...prev];
          updated[existingIndex] = {
            ...updated[existingIndex],
            visitCount: updated[existingIndex].visitCount + 1,
            lastVisited: new Date(),
          };
          log.debug("Updated account visit count", {
            account: accountNameOwner,
            visitCount: updated[existingIndex].visitCount,
          });
        } else {
          updated = [
            ...prev,
            {
              accountNameOwner,
              visitCount: 1,
              lastVisited: new Date(),
            },
          ];
          log.debug("Tracked new account visit", { account: accountNameOwner });
        }

        saveToStorage(updated);
        return updated;
      });
    },
    [saveToStorage],
  );

  const removeAccount = useCallback(
    (accountNameOwner: string) => {
      setAccountUsage((prev) => {
        const updated = prev.filter(
          (item) => item.accountNameOwner !== accountNameOwner,
        );
        log.debug("Removed account from usage tracking", {
          account: accountNameOwner,
        });
        saveToStorage(updated);
        return updated;
      });
    },
    [saveToStorage],
  );

  const getMostUsedAccounts = useCallback(
    (allAccounts: Account[], limit: number = MAX_QUICK_LINKS): Account[] => {
      const sortedUsage = [...accountUsage]
        .sort((a, b) => {
          if (b.visitCount !== a.visitCount) {
            return b.visitCount - a.visitCount;
          }
          return b.lastVisited.getTime() - a.lastVisited.getTime();
        })
        .slice(0, limit);

      return sortedUsage
        .map((usage) =>
          allAccounts.find(
            (account) => account.accountNameOwner === usage.accountNameOwner,
          ),
        )
        .filter((account): account is Account => account !== undefined);
    },
    [accountUsage],
  );

  return {
    trackAccountVisit,
    removeAccount,
    getMostUsedAccounts,
    accountUsage,
  };
}
