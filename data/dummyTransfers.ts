// Transfers (normalized)
import Transfer from "../model/Transfer";

export const dummyTransfers: Transfer[] = [
  {
    transferId: 5001,
    sourceAccount: "test-abc-savings_brian", // accountId 11 in dummyAccounts
    destinationAccount: "test-dfg-savings_brian", // accountId 12 in dummyAccounts
    transactionDate: new Date("2024-10-15"),
    amount: 200.0,
    guidSource: "guid-5001",
    guidDestination: "guid-5001",
    activeStatus: true,
  },
  {
    transferId: 5002,
    sourceAccount: "test-dfg-savings_brian",
    destinationAccount: "test-abc-savings_brian",
    transactionDate: new Date("2024-10-16"),
    amount: 150.0,
    guidSource: "guid-5002",
    guidDestination: "guid-5002",
    activeStatus: true,
  },
];
