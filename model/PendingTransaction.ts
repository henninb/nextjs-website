export default interface PendingTransaction {
  pendingTransactionId?: number;
  owner?: string;
  accountNameOwner: string;
  transactionDate: Date;
  description: string;
  amount: number;
  reviewStatus: string;
}
