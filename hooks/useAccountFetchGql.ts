import { useQuery } from "@tanstack/react-query";
import { graphqlRequest } from "../utils/graphqlClient";
import Account from "../model/Account";

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
  return useQuery<Account[], Error>({
    queryKey: ["accountsGQL"],
    queryFn: async () => {
      const data = await graphqlRequest<AccountsQueryResult>({ query: ACCOUNTS_QUERY });
      const mapped: Account[] = (data.accounts || []).map((a) => ({
        accountId: a.accountId,
        accountNameOwner: a.accountNameOwner,
        accountType: (a.accountType as any) ?? "undefined",
        activeStatus: !!a.activeStatus,
        moniker: a.moniker,
        outstanding: a.outstanding,
        future: a.future,
        cleared: a.cleared,
        dateClosed: a.dateClosed ? new Date(a.dateClosed) : undefined,
        validationDate: a.validationDate ? new Date(a.validationDate) : undefined,
        dateAdded: a.dateAdded ? new Date(a.dateAdded) : undefined,
        dateUpdated: a.dateUpdated ? new Date(a.dateUpdated) : undefined,
      }));
      return mapped;
    },
  });
}

