export default interface Payment {
  paymentId: number;
  accountNameOwner: string;
  transactionDate: Date;
  amount: number;
  activeStatus: boolean;
  dateAdded?: Date;
  dateUpdated?: Date;
}
