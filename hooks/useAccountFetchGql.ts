import { useQuery } from "@tanstack/react-query";
import { graphqlRequest } from "../utils/graphqlClient";
import Account from "../model/Account";
import { useAuth } from "../components/AuthProvider";

type AccountsQueryResult = {
  accounts: {
    accountId?: number;
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
  const { isAuthenticated, loading } = useAuth();

  console.log("[useAccountFetchGql] Hook state:", {
    isAuthenticated,
    loading,
    enabled: !loading && isAuthenticated,
  });

  return useQuery<Account[], Error>({
    queryKey: ["accountsGQL"],
    queryFn: async () => {
      console.log("[useAccountFetchGql] Starting GraphQL query");
      try {
        const data = await graphqlRequest<AccountsQueryResult>({
          query: ACCOUNTS_QUERY,
        });

        const uniqueAccountTypes = [
          ...new Set(data.accounts?.map((a) => a.accountType) || []),
        ];
        console.log("[useAccountFetchGql] Raw GraphQL response:", {
          data,
          accountsArray: data.accounts,
          accountsLength: data.accounts?.length,
          firstThreeAccounts: data.accounts?.slice(0, 3),
          allAccountTypes: data.accounts?.map((a) => a.accountType),
          uniqueTypes: uniqueAccountTypes,
        });

        console.log("[useAccountFetchGql] ACCOUNT TYPE ANALYSIS:");
        console.log("Unique account types found:", uniqueAccountTypes);
        uniqueAccountTypes.forEach((type) => {
          const count =
            data.accounts?.filter((a) => a.accountType === type).length || 0;
          console.log(`- Account type "${type}": ${count} accounts`);
        });

        const mapped: Account[] = (data.accounts || []).map((a) => {
          const mappedAccount = {
            accountId: a.accountId,
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
          };
          console.log("[useAccountFetchGql] Mapped account:", mappedAccount);
          return mappedAccount;
        });

        console.log("[useAccountFetchGql] Final mapped accounts:", {
          mappedLength: mapped.length,
          mapped,
        });

        return mapped;
      } catch (error) {
        console.error("[useAccountFetchGql] Query function error:", {
          error,
          message: error.message,
          stack: error.stack,
        });
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error) => {
      console.log("[useAccountFetchGql] Retry info:", {
        failureCount,
        error: error.message,
        willRetry: failureCount < 1,
      });
      return failureCount < 1;
    },
    enabled: !loading && isAuthenticated,
    onError: (error) => {
      console.error("[useAccountFetchGql] useQuery onError:", {
        error,
        message: error.message,
        stack: error.stack,
      });
    },
    onSuccess: (data) => {
      console.log("[useAccountFetchGql] useQuery onSuccess:", {
        dataLength: data?.length,
        data,
      });
    },
  });
}
