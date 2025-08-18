export default interface Payment {
  paymentId: number;
  sourceAccount: string;
  destinationAccount: string;
  guidSource?: string;
  guidDestination?: string;
  transactionDate: Date;
  amount: number;
  activeStatus: boolean;
  dateAdded?: Date;
  dateUpdated?: Date;
}
