import { graphqlRequest } from "../utils/graphqlClient";
import Payment from "../model/Payment";
import { usePublicQuery } from "../utils/queryConfig";
import { createHookLogger } from "../utils/logger";

const log = createHookLogger("usePaymentFetchGql");

type PaymentsQueryResult = {
  payments: {
    paymentId: number;
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

const PAYMENTS_QUERY = /* GraphQL */ `
  query Payments {
    payments {
      paymentId
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

export default function usePaymentFetchGql() {
  const queryResult = usePublicQuery(["paymentGQL"], async () => {
    log.debug("Starting GraphQL query");
    const data = await graphqlRequest<PaymentsQueryResult>({
      query: PAYMENTS_QUERY,
    });
    const mapped: Payment[] = (data.payments || []).map((p) => ({
      paymentId: p.paymentId,
      sourceAccount: p.sourceAccount,
      destinationAccount: p.destinationAccount,
      transactionDate: new Date(p.transactionDate),
      amount: p.amount,
      guidSource: p.guidSource ?? undefined,
      guidDestination: p.guidDestination ?? undefined,
      activeStatus: !!p.activeStatus,
      dateAdded: p.dateAdded ? new Date(p.dateAdded) : undefined,
      dateUpdated: p.dateUpdated ? new Date(p.dateUpdated) : undefined,
    }));
    log.debug("Query successful", { count: mapped.length });
    return mapped;
  });

  if (queryResult.isError) {
    log.error("Query failed", queryResult.error);
  }

  return queryResult;
}
