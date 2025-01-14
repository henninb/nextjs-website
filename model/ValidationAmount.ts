import { TransactionState } from "./TransactionState";

export default interface ValidationAmount {
  validationId?: number;
  validationDate: Date;
  accountId?: number;
  amount: number;
  transactionState: TransactionState;
  activeStatus: boolean;
  dateAdded?: Date;
  dateUpdated?: Date;
}
