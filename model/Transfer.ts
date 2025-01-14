export default interface Transfer {
  transferId: number;
  sourceAccount: string;
  destinationAccount: string;
  transactionDate: Date;
  amount: number;
  guidSource?: string;
  guidDestination?: string;
  activeStatus: boolean;
  dateAdded?: Date;
  dateUpdated?: Date;
}
