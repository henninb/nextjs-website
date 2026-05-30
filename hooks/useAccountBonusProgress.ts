import BonusProgress from "../model/BonusProgress";
import { useAuthenticatedQuery } from "../utils/queryConfig";
import { QueryKeys } from "../utils/cacheUtils";
import { InputSanitizer } from "../utils/validation/sanitization";
import { createHookLogger } from "../utils/logger";

const log = createHookLogger("useAccountBonusProgress");

export const fetchAccountBonusProgress = async (
  accountNameOwner: string,
  startDate: string,
  targetAmount: number,
  bonusAmount: number,
  windowDays: number = 90,
): Promise<BonusProgress> => {
  const sanitizedAccount = InputSanitizer.sanitizeAccountName(accountNameOwner);
  const params = new URLSearchParams({
    startDate,
    targetAmount: String(targetAmount),
    bonusAmount: String(bonusAmount),
    windowDays: String(windowDays),
  });

  log.debug("Fetching bonus progress", { accountNameOwner: sanitizedAccount });

  const response = await fetch(
    `/api/transaction/account/bonus-progress/${encodeURIComponent(sanitizedAccount)}?${params}`,
    {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    },
  );

  if (!response.ok) {
    const errorDetails = await response.json().catch(() => ({}));
    throw new Error(
      `HTTP error! Status: ${response.status} Details: ${JSON.stringify(errorDetails)}`,
    );
  }

  return response.json();
};

export default function useAccountBonusProgress(
  accountNameOwner: string,
  startDate: string,
  targetAmount: number,
  bonusAmount: number,
  windowDays: number = 90,
) {
  return useAuthenticatedQuery(
    QueryKeys.bonusProgress(accountNameOwner),
    () =>
      fetchAccountBonusProgress(
        accountNameOwner,
        startDate,
        targetAmount,
        bonusAmount,
        windowDays,
      ),
    {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: 1,
      enabled: !!accountNameOwner && !!startDate && targetAmount > 0,
    },
  );
}
