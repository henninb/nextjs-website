import { graphqlRequest } from "../utils/graphqlClient";
import Transfer from "../model/Transfer";
import { useAuthenticatedQuery } from "../utils/queryConfig";
import { createHookLogger } from "../utils/logger";

const log = createHookLogger("useTransferFetchGql");

type TransfersQueryResult = {
  transfers: {
    transferId: number;
    owner?: string | null;
    sourceAccount: string;
    destinationAccount: string;
    transactionDate: string;
    amount: number;
    guidSource?: string | null;
    guidDestination?: string | null;
    activeStatus: boolean;
    dateAdded?: string | null;
    dateUpdated?: string | null;
  }[];
};

const TRANSFERS_QUERY = /* GraphQL */ `
  query Transfers {
    transfers {
      transferId
      owner
      sourceAccount
      destinationAccount
      transactionDate
      amount
      guidSource
      guidDestination
      activeStatus
      dateAdded
      dateUpdated
    }
  }
`;

export default function useTransferFetchGql() {
  const queryResult = useAuthenticatedQuery(["transferGQL"], async () => {
    log.debug("Starting GraphQL query");
    const data = await graphqlRequest<TransfersQueryResult>({
      query: TRANSFERS_QUERY,
    });
    const mapped: Transfer[] = (data.transfers || []).map((t) => ({
      transferId: t.transferId,
      owner: t.owner ?? undefined,
      sourceAccount: t.sourceAccount,
      destinationAccount: t.destinationAccount,
      transactionDate: new Date(t.transactionDate),
      amount: t.amount,
      guidSource: t.guidSource ?? undefined,
      guidDestination: t.guidDestination ?? undefined,
      activeStatus: !!t.activeStatus,
      dateAdded: t.dateAdded ? new Date(t.dateAdded) : undefined,
      dateUpdated: t.dateUpdated ? new Date(t.dateUpdated) : undefined,
    }));
    log.debug("Query successful", { count: mapped.length });
    return mapped;
  });

  if (queryResult.isError) {
    log.error("Query failed", queryResult.error);
  }

  return queryResult;
}
