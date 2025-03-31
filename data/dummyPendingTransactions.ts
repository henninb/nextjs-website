import PendingTransaction from "../model/PendingTransaction";

export const dummyPendingTransactions: PendingTransaction[] = [
  {
    pendingTransactionId: 1,
    accountNameOwner: "test_brian",
    transactionDate: new Date(),
    description: "test_description1",
    amount: 5.01,
    reviewStatus: "string",
  },
  {
    pendingTransactionId: 1,
    accountNameOwner: "test_brian",
    transactionDate: new Date(),
    description: "test_description2",
    amount: 5.02,
    reviewStatus: "string",
  },
];
