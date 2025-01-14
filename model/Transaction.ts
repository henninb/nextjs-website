import { AccountType } from "./AccountType";
import { TransactionState } from "./TransactionState";
import { ReoccurringType } from "./ReoccurringType";
import ReceiptImage from "./ReceiptImage";
import { TransactionType } from "./TransactionType";

export default interface Transaction {
  transactionId?: number;
  guid: string;
  accountId?: number;
  accountType: AccountType;
  accountNameOwner: string;
  transactionDate: Date;
  description: string;
  category: string;
  amount: number;
  transactionState: TransactionState;
  transactionType: TransactionType;
  activeStatus: boolean;
  reoccurringType: ReoccurringType;
  notes: string;
  receiptImage?: ReceiptImage;
  dueDate?: string;
}
