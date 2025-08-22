import { useQuery } from "@tanstack/react-query";
import { graphqlRequest } from "../utils/graphqlClient";
import Transfer from "../model/Transfer";

type TransfersQueryResult = {
  transfers: {
    transferId: number;
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
  return useQuery<Transfer[], Error>({
    queryKey: ["transferGQL"],
    queryFn: async () => {
      const data = await graphqlRequest<TransfersQueryResult>({
        query: TRANSFERS_QUERY,
      });
      const mapped: Transfer[] = (data.transfers || []).map((t) => ({
        transferId: t.transferId,
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
      return mapped;
    },
  });
}
