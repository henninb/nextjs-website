import { useState, useEffect, useCallback } from "react";
import Account from "../model/Account";

interface AccountUsage {
  accountNameOwner: string;
  visitCount: number;
  lastVisited: Date;
}

const STORAGE_KEY = "financeApp_accountUsage";
const MAX_QUICK_LINKS = 6;

export default function useAccountUsageTracking() {
  const [accountUsage, setAccountUsage] = useState<AccountUsage[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved).map((item: any) => ({
          ...item,
          lastVisited: new Date(item.lastVisited),
        }));
        setAccountUsage(parsed);
      } catch (error) {
        console.warn("Failed to parse account usage data:", error);
        setAccountUsage([]);
      }
    }
  }, []);

  const saveToStorage = useCallback((usage: AccountUsage[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(usage));
    } catch (error) {
      console.warn("Failed to save account usage data:", error);
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
        } else {
          updated = [
            ...prev,
            {
              accountNameOwner,
              visitCount: 1,
              lastVisited: new Date(),
            },
          ];
        }

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
    getMostUsedAccounts,
    accountUsage,
  };
}
