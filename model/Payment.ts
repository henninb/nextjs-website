export default interface Payment {
  paymentId: number;
  accountNameOwner: string;
  sourceAccount: string;
  destinationAccount: string;
  transactionDate: Date;
  amount: number;
  activeStatus: boolean;
  dateAdded?: Date;
  dateUpdated?: Date;
}
