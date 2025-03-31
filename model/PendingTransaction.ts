export default interface PendingTransaction {
  pendingTransactionId?: number;
  accountNameOwner: string;
  transactionDate: Date;
  description: string;
  amount: number;
  reviewStatus: string;
}
