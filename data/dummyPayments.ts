// Payments (normalized)
import Payment from "../model/Payment";

export const dummyPayments: Payment[] = [
  {
    paymentId: 3001,
    accountNameOwner: "macys_brian",
    transactionDate: new Date("2024-10-01"),
    amount: 25.0,
    activeStatus: true,
  },
  {
    paymentId: 3002,
    accountNameOwner: "amex_brian",
    transactionDate: new Date("2024-10-02"),
    amount: 50.0,
    activeStatus: true,
  },
  {
    paymentId: 3003,
    accountNameOwner: "chase_brian",
    transactionDate: new Date("2024-10-03"),
    amount: 75.0,
    activeStatus: true,
  },
  {
    paymentId: 3004,
    accountNameOwner: "boa_brian",
    transactionDate: new Date("2024-10-04"),
    amount: 100.0,
    activeStatus: true,
  },
  {
    paymentId: 3005,
    accountNameOwner: "citibank_brian",
    transactionDate: new Date("2024-10-05"),
    amount: 125.0,
    activeStatus: true,
  },
];