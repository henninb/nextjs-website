import { graphqlRequest } from "../utils/graphqlClient";
import Account from "../model/Account";
import { useAuthenticatedQuery } from "../utils/queryConfig";
import { createHookLogger } from "../utils/logger";

const log = createHookLogger("useAccountFetchGql");

type AccountsQueryResult = {
  accounts: {
    accountId?: number;
    owner?: string | null;
    accountNameOwner: string;
    accountType: string;
    activeStatus: boolean;
    moniker: string;
    outstanding: number;
    future: number;
    cleared: number;
    dateClosed?: string | null;
    validationDate?: string | null;
    dateAdded?: string | null;
    dateUpdated?: string | null;
  }[];
};

const ACCOUNTS_QUERY = /* GraphQL */ `
  query Accounts {
    accounts {
      accountId
      owner
      accountNameOwner
      accountType
      activeStatus
      moniker
      outstanding
      future
      cleared
      dateClosed
      validationDate
      dateAdded
      dateUpdated
    }
  }
`;

export default function useAccountFetchGql() {
  const queryResult = useAuthenticatedQuery(
    ["accountsGQL"],
    async () => {
      log.debug("Starting GraphQL query");
      const data = await graphqlRequest<AccountsQueryResult>({
        query: ACCOUNTS_QUERY,
      });

      const uniqueAccountTypes = [
        ...new Set(data.accounts?.map((a) => a.accountType) || []),
      ];
      log.debug("Raw GraphQL response", {
        accountsLength: data.accounts?.length,
        uniqueTypes: uniqueAccountTypes,
      });

      log.debug("Account type analysis", {
        uniqueTypes: uniqueAccountTypes,
        typeCounts: uniqueAccountTypes.map((type) => ({
          type,
          count:
            data.accounts?.filter((a) => a.accountType === type).length || 0,
        })),
      });

      const mapped: Account[] = (data.accounts || []).map((a) => ({
        accountId: a.accountId,
        owner: a.owner ?? undefined,
        accountNameOwner: a.accountNameOwner,
        accountType: (a.accountType as any) ?? "undefined",
        activeStatus: !!a.activeStatus,
        moniker: a.moniker,
        outstanding: a.outstanding,
        future: a.future,
        cleared: a.cleared,
        dateClosed: a.dateClosed ? new Date(a.dateClosed) : undefined,
        validationDate: a.validationDate
          ? new Date(a.validationDate)
          : undefined,
        dateAdded: a.dateAdded ? new Date(a.dateAdded) : undefined,
        dateUpdated: a.dateUpdated ? new Date(a.dateUpdated) : undefined,
      }));

      log.debug("Final mapped accounts", {
        mappedLength: mapped.length,
      });

      return mapped;
    },
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: (failureCount, error) => {
        log.debug("Retry info", {
          failureCount,
          error: error.message,
          willRetry: failureCount < 1,
        });
        return failureCount < 1;
      },
    },
  );

  if (queryResult.isError) {
    log.error("Query failed", queryResult.error);
  }

  return queryResult;
}
