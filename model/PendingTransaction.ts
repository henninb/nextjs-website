import { AccountType } from "./AccountType";
import { TransactionState } from "./TransactionState";
import { ReoccurringType } from "./ReoccurringType";
import ReceiptImage from "./ReceiptImage";
import { TransactionType } from "./TransactionType";

export default interface Transaction {
  pendingTransactionId?: number;
  accountNameOwner: string;
  transactionDate: Date;
  description: string;
  amount: number;
  reviewStatus: string;
}
